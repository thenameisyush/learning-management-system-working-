import mongoose from 'mongoose';

import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import Course from '../models/course.model.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import AppError from '../utils/AppError.js';

import {
  hasCourseAccess,
  isCourseManager,
} from '../utils/courseAccess.js';

import { parseAnswerList } from '../utils/quizGrading.js';

import {
  finalizeAttempt,
  finalizeExpiredForQuiz,
  finalizeIfExpired,
  remainingSeconds,
  timingMode,
} from '../utils/quizAttempts.js';

import {
  PUBLISHED_FILTER,
  attemptLimit,
  effectiveStatus,
  toActiveQuiz,
  toAttemptSummary,
  toManagerQuiz,
  toQuizSummary,
  toReviewQuestion,
  toStudentQuizDetails,
} from '../utils/quizSerializers.js';

import {
  assertPublishable,
  isValidId,
  normalizeQuizInput,
  questionsEqual,
} from '../utils/quizValidation.js';


// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const assertId = (id, label) => {
  if (!isValidId(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
};


/**
 * Resolve the course belonging to a quiz.
 *
 * New quizzes have quiz.course.
 * Old/legacy quizzes may not have quiz.course, so we find them
 * through the lecture which contains quizId.
 */
const resolveQuizCourse = async (quiz) => {
  if (quiz.course) {
    return Course.findById(quiz.course)
      .select('title instructor');
  }

  return Course.findOne({
    'lectures.quizId': quiz._id,
  }).select('title instructor');
};


const loadQuiz = async (quizId) => {
  assertId(quizId, 'quiz id');

  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  const course = await resolveQuizCourse(quiz);

  return {
    quiz,
    course,
  };
};


/**
 * Admin or teacher who owns the course.
 *
 * Legacy/orphan quiz without a course:
 * only ADMIN is treated as manager.
 */
const isManagerOf = (user, course) => {
  return course
    ? isCourseManager(user, course)
    : user.role === 'ADMIN';
};


const requireManager = (user, course) => {
  if (!isManagerOf(user, course)) {
    throw new AppError(
      'You can only manage quizzes of your own courses',
      403
    );
  }
};


/**
 * Determines whether user can view quiz.
 *
 * Manager:
 *   Can view draft/published.
 *
 * Student:
 *   Quiz must be published.
 *   Student must have course access.
 */
const authorizeView = async (user, quiz, course) => {
  if (isManagerOf(user, course)) {
    return true;
  }

  if (effectiveStatus(quiz) !== 'PUBLISHED') {
    throw new AppError('Quiz not found', 404);
  }

  if (!course) {
    throw new AppError(
      'This quiz is not linked to a course',
      409,
      'QUIZ_COURSE_MISSING'
    );
  }

  if (!(await hasCourseAccess(user, course))) {
    throw new AppError(
      'You do not have access to this course',
      403
    );
  }

  return false;
};


/**
 * Load all attempts of one student for one quiz.
 *
 * Expired attempts are automatically finalized.
 */
const loadStudentAttempts = async (quiz, studentId) => {
  const attempts = await QuizAttempt.find({
    student: studentId,
    quiz: quiz._id,
  }).sort({
    attemptNumber: 1,
  });

  const output = [];

  for (const attempt of attempts) {
    output.push(
      (await finalizeIfExpired(attempt, quiz)) || attempt
    );
  }

  return output;
};


const activeInfo = (attempt, now = new Date()) => {
  if (!attempt) {
    return null;
  }

  return {
    _id: attempt._id,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt || null,
    remainingSeconds: remainingSeconds(
      attempt,
      now
    ),
  };
};


const attemptsInfo = (quiz, attempts) => {
  const limit = attemptLimit(quiz);

  const used = attempts.length;

  return {
    attemptsUsed: used,

    attemptsAllowed: limit,

    attemptsRemaining:
      limit === null
        ? null
        : Math.max(0, limit - used),

    activeAttempt: activeInfo(
      attempts.find(
        (attempt) =>
          attempt.status === 'IN_PROGRESS'
      )
    ),
  };
};


// ---------------------------------------------------------------------------
// CREATE QUIZ
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/quizzes
 *
 * ADMIN | owning TEACHER
 */
export const createQuiz = asyncHandler(
  async (req, res) => {

    const courseId =
      req.body.courseId ??
      req.body.course;

    assertId(
      courseId,
      'course id'
    );

    const course =
      await Course.findById(courseId);

    if (!course) {
      throw new AppError(
        'Course not found',
        404
      );
    }

    if (
      !isCourseManager(
        req.user,
        course
      )
    ) {
      throw new AppError(
        'You can only create quizzes for your own courses',
        403
      );
    }

    const data =
      normalizeQuizInput(
        req.body,
        null
      );

    const { lectureId } =
      req.body;

    if (lectureId) {

      assertId(
        lectureId,
        'lecture id'
      );

      if (
        !course.lectures.id(
          lectureId
        )
      ) {
        throw new AppError(
          'Lecture does not belong to this course',
          400
        );
      }
    }

    const quiz =
      new Quiz({
        ...data,

        course:
          course._id,

        createdBy:
          req.user.id,

        status:
          'DRAFT',
      });

    if (
      String(
        req.body.status
      ).toUpperCase() ===
      'PUBLISHED'
    ) {

      assertPublishable(
        quiz
      );

      quiz.status =
        'PUBLISHED';

      quiz.publishedAt =
        new Date();
    }

    await quiz.save();

    if (lectureId) {

      await Course.updateOne(
        {
          _id:
            course._id,

          'lectures._id':
            lectureId,
        },

        {
          $set: {
            'lectures.$.quizId':
              quiz._id,
          },
        }
      );
    }

    res.status(201).json({
      success: true,

      message:
        quiz.status ===
        'PUBLISHED'
          ? 'Quiz created and published'
          : 'Quiz saved as draft',

      quiz:
        toManagerQuiz(
          quiz
        ),
    });
  }
);


// ---------------------------------------------------------------------------
// GET ALL QUIZZES
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/quizzes
 */
export const getAllQuizzes = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const user = req.user;

  const conditions = [];

  let managed = [];
  let managedAll = false;

  if (courseId) {
    assertId(courseId, "course id");

    const course = await Course.findById(courseId)
      .select("title instructor");

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    if (isCourseManager(user, course)) {
      conditions.push({ course: course._id });

      managed = [course._id];
    } else if (await hasCourseAccess(user, course)) {
      conditions.push(
        { course: course._id },
        PUBLISHED_FILTER
      );
    } else {
      throw new AppError(
        "You do not have access to this course",
        403
      );
    }
  } else {
    managed = await listManagedCourseIds(user);

    const accessible =
      await listAccessibleCourseIds(user);

    if (managed === "ALL") {
      managedAll = true;
    } else {
      const or = [];

      if (managed.length) {
        or.push({
          course: {
            $in: managed,
          },
        });
      }

      if (accessible === "ALL") {
        or.push(PUBLISHED_FILTER);
      } else if (accessible.length) {
        or.push({
          $and: [
            {
              course: {
                $in: accessible,
              },
            },
            PUBLISHED_FILTER,
          ],
        });
      }

      if (!or.length) {
        return res.status(200).json({
          success: true,
          quizzes: [],
        });
      }

      conditions.push({
        $or: or,
      });
    }
  }

  const filter = conditions.length
    ? { $and: conditions }
    : {};

  const quizzes = await Quiz.find(filter)
    .select(
      "-questions.options -questions.correctOptionIndex -questions.text"
    )
    .sort({ createdAt: -1 })
    .limit(100);

  // Student attempt information
  const mine = await QuizAttempt.find({
    student: user.id,
    quiz: {
      $in: quizzes.map((q) => q._id),
    },
  }).select("quiz status");

  const perQuiz = new Map();

  for (const a of mine) {
    const key = String(a.quiz);

    const current =
      perQuiz.get(key) || {
        used: 0,
        active: false,
      };

    current.used += 1;

    if (a.status === "IN_PROGRESS") {
      current.active = true;
    }

    perQuiz.set(key, current);
  }

  res.status(200).json({
    success: true,

    quizzes: quizzes.map((q) => {
      const s =
        perQuiz.get(String(q._id)) || {
          used: 0,
          active: false,
        };

      const limit = attemptLimit(q);

      const canManage =
        managedAll ||
        (Array.isArray(managed) &&
          managed.some(
            (course) =>
              String(course) === String(q.course)
          ));

      return toQuizSummary(q, {
        attemptsUsed: s.used,

        attemptsRemaining:
          limit === null
            ? null
            : Math.max(
                0,
                limit - s.used
              ),

        hasActiveAttempt: s.active,

        canManage,
      });
    }),
  });
});

// ---------------------------------------------------------------------------
// GET QUIZ BY ID
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/quizzes/:id
 */
export const getQuizById =
  asyncHandler(
    async (req, res) => {

      const {
        quiz,
        course,
      } =
        await loadQuiz(
          req.params.id
        );

      const manager =
        await authorizeView(
          req.user,
          quiz,
          course
        );

      if (manager) {

        const attemptCount =
          await QuizAttempt.countDocuments(
            {
              quiz:
                quiz._id,
            }
          );

        return res
          .status(200)
          .json({
            success: true,

            quiz:
              toManagerQuiz(
                quiz,
                {
                  attemptCount,
                }
              ),
          });
      }

      const attempts =
        await loadStudentAttempts(
          quiz,
          req.user.id
        );

      res.status(200).json({
        success: true,

        quiz:
          toStudentQuizDetails(
            quiz,
            attemptsInfo(
              quiz,
              attempts
            )
          ),
      });
    }
  );


// ---------------------------------------------------------------------------
// UPDATE QUIZ
// ---------------------------------------------------------------------------

/**
 * PUT /api/v1/quizzes/:id
 */
export const updateQuiz =
  asyncHandler(
    async (req, res) => {

      const {
        quiz,
        course,
      } =
        await loadQuiz(
          req.params.id
        );

      requireManager(
        req.user,
        course
      );

      const moveTo =
        req.body.courseId ??
        req.body.course;

      if (
        moveTo &&
        String(moveTo) !==
          String(
            quiz.course ||
            course?._id
          )
      ) {

        throw new AppError(
          'A quiz cannot be moved to another course',
          400
        );
      }

      const data =
        normalizeQuizInput(
          req.body,
          quiz
        );

      if (data.questions) {

        const attemptCount =
          await QuizAttempt.countDocuments(
            {
              quiz:
                quiz._id,
            }
          );

        if (
          attemptCount > 0 &&
          !questionsEqual(
            quiz.questions,
            data.questions
          )
        ) {

          throw new AppError(
            'Questions cannot be changed because students have already attempted this quiz. Unpublish it and create a new quiz instead.',
            409,
            'QUIZ_HAS_ATTEMPTS'
          );
        }

        if (
          attemptCount > 0
        ) {
          delete data.questions;
        }
      }

      quiz.set(
        data
      );

      if (
        !quiz.course &&
        course
      ) {
        quiz.course =
          course._id;
      }

      if (
        effectiveStatus(
          quiz
        ) === 'PUBLISHED'
      ) {

        assertPublishable(
          quiz
        );
      }

      await quiz.save();

      res.status(200).json({
        success: true,

        message:
          'Quiz updated',

        quiz:
          toManagerQuiz(
            quiz
          ),
      });
    }
  );


// ---------------------------------------------------------------------------
// PUBLISH / UNPUBLISH
// ---------------------------------------------------------------------------

const setPublished =
  (publish) =>
    asyncHandler(
      async (req, res) => {

        const {
          quiz,
          course,
        } =
          await loadQuiz(
            req.params.id
          );

        requireManager(
          req.user,
          course
        );

        if (publish) {

          assertPublishable(
            quiz
          );

          quiz.status =
            'PUBLISHED';

          quiz.publishedAt =
            new Date();

        } else {

          quiz.status =
            'DRAFT';
        }

        if (
          !quiz.course &&
          course
        ) {

          quiz.course =
            course._id;
        }

        await quiz.save();

        res.status(200).json({
          success: true,

          message:
            publish
              ? 'Quiz published'
              : 'Quiz unpublished',

          quiz:
            toManagerQuiz(
              quiz
            ),
        });
      }
    );


export const publishQuiz =
  setPublished(true);

export const unpublishQuiz =
  setPublished(false);


// ---------------------------------------------------------------------------
// DELETE QUIZ
// ---------------------------------------------------------------------------

/**
 * DELETE /api/v1/quizzes/:id
 */
export const deleteQuiz =
  asyncHandler(
    async (req, res) => {

      const {
        quiz,
        course,
      } =
        await loadQuiz(
          req.params.id
        );

      requireManager(
        req.user,
        course
      );

      const attemptCount =
        await QuizAttempt.countDocuments(
          {
            quiz:
              quiz._id,
          }
        );

      if (
        attemptCount > 0 &&
        req.query.force !==
          'true'
      ) {

        throw new AppError(
          `This quiz has ${attemptCount} student attempt(s). Deleting it also deletes their results. Repeat with ?force=true to confirm.`,
          409,
          'QUIZ_HAS_ATTEMPTS'
        );
      }

      await QuizAttempt.deleteMany(
        {
          quiz:
            quiz._id,
        }
      );

      await Course.updateMany(
        {
          'lectures.quizId':
            quiz._id,
        },

        {
          $set: {
            'lectures.$[l].quizId':
              null,
          },
        },

        {
          arrayFilters: [
            {
              'l.quizId':
                quiz._id,
            },
          ],
        }
      );

      await quiz.deleteOne();

      res.status(200).json({
        success: true,

        message:
          'Quiz deleted',
      });
    }
  );


// ---------------------------------------------------------------------------
// START QUIZ
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/quizzes/:id/start
 *
 * Creates a new attempt or resumes an existing IN_PROGRESS attempt.
 */
export const startQuiz =
  asyncHandler(
    async (req, res) => {

      const {
        quiz,
        course,
      } =
        await loadQuiz(
          req.params.id
        );

      // --------------------------------------------------------
      // COURSE CHECK
      // --------------------------------------------------------

      if (!course) {

        throw new AppError(
          'This quiz is not linked to a course. Please recreate the quiz from a course.',
          409,
          'QUIZ_COURSE_MISSING'
        );
      }

      // --------------------------------------------------------
      // MANAGER CHECK
      // --------------------------------------------------------

      if (
        isManagerOf(
          req.user,
          course
        )
      ) {

        throw new AppError(
          'Teachers and admins can preview quizzes but not attempt them',
          403,
          'MANAGER_CANNOT_ATTEMPT'
        );
      }

      // --------------------------------------------------------
      // ACCESS CHECK
      // --------------------------------------------------------

      await authorizeView(
        req.user,
        quiz,
        course
      );

      // --------------------------------------------------------
      // QUESTIONS CHECK
      // --------------------------------------------------------

      if (
        !Array.isArray(
          quiz.questions
        ) ||
        quiz.questions.length === 0
      ) {

        throw new AppError(
          'This quiz has no questions yet',
          409,
          'QUIZ_HAS_NO_QUESTIONS'
        );
      }

      // --------------------------------------------------------
      // LOAD EXISTING ATTEMPTS
      // --------------------------------------------------------

      const attempts =
        await loadStudentAttempts(
          quiz,
          req.user.id
        );

      const now =
        new Date();

      // --------------------------------------------------------
      // RESPONSE HELPER
      // --------------------------------------------------------

      const respond =
        (
          attempt,
          resumed
        ) => {

          return res
            .status(
              resumed
                ? 200
                : 201
            )
            .json({

              success: true,

              message:
                resumed
                  ? 'Resuming your attempt'
                  : 'Quiz started',

              resumed,

              serverTime:
                now,

              attempt: {

                _id:
                  attempt._id,

                attemptNumber:
                  attempt.attemptNumber,

                startedAt:
                  attempt.startedAt,

                expiresAt:
                  attempt.expiresAt ||
                  null,

                remainingSeconds:
                  remainingSeconds(
                    attempt,
                    now
                  ),

                savedAnswers:
                  Array.isArray(
                    attempt.draftAnswers
                  )
                    ? attempt.draftAnswers.map(
                        (draft) => ({
                          questionId:
                            draft.question,

                          selectedAnswer:
                            draft.selectedAnswer,
                        })
                      )
                    : [],
              },

              // Student ko correct answers nahi bhejne.
              quiz:
                toActiveQuiz(
                  quiz
                ),
            });
        };

      // --------------------------------------------------------
      // RESUME EXISTING ATTEMPT
      // --------------------------------------------------------

      const running =
        attempts.find(
          (attempt) =>
            attempt.status ===
            'IN_PROGRESS'
        );

      if (running) {

        return respond(
          running,
          true
        );
      }

      // --------------------------------------------------------
      // ATTEMPT LIMIT
      // --------------------------------------------------------

      const limit =
        attemptLimit(
          quiz
        );

      if (
        limit !== null &&
        attempts.length >=
          limit
      ) {

        throw new AppError(
          limit === 1
            ? 'You have already attempted this quiz. Retries are not allowed.'
            : `You have used all ${limit} attempts for this quiz.`,

          403,

          'MAX_ATTEMPTS_REACHED'
        );
      }

      // --------------------------------------------------------
      // ATTEMPT NUMBER
      // --------------------------------------------------------

      const nextNumber =
        attempts.reduce(
          (
            maxNumber,
            attempt
          ) => {

            const number =
              Number(
                attempt.attemptNumber
              ) || 0;

            return Math.max(
              maxNumber,
              number
            );
          },

          0
        ) + 1;

      // --------------------------------------------------------
      // SERVER START TIME
      // --------------------------------------------------------

      const startedAt =
        now;

      const minutes =
        Number(
          quiz.durationMinutes
        ) || 0;

      const expiresAt =
        minutes > 0
          ? new Date(
              startedAt.getTime() +
                minutes *
                  60 *
                  1000
            )
          : null;

      // --------------------------------------------------------
      // CREATE ATTEMPT
      // --------------------------------------------------------

      try {

        const attempt =
          await QuizAttempt.create({

            student:
              req.user.id,

            quiz:
              quiz._id,

            course:
              course._id,

            attemptNumber:
              nextNumber,

            status:
              'IN_PROGRESS',

            startedAt,

            expiresAt,
          });

        return respond(
          attempt,
          false
        );

      } catch (err) {

        // ------------------------------------------------------
        // DUPLICATE ACTIVE ATTEMPT
        // ------------------------------------------------------

        if (
          err?.code ===
          11000
        ) {

          const winner =
            await QuizAttempt.findOne(
              {
                student:
                  req.user.id,

                quiz:
                  quiz._id,

                status:
                  'IN_PROGRESS',
              }
            );

          if (winner) {

            return respond(
              winner,
              true
            );
          }
        }

        console.error(
          '❌ START QUIZ DATABASE ERROR:',
          err
        );

        throw err;
      }
    }
  );


// ---------------------------------------------------------------------------
// LOAD OWN ATTEMPT
// ---------------------------------------------------------------------------

const loadOwnAttempt =
  async (
    req,
    quiz
  ) => {

    const {
      attemptId,
    } = req.body;

    if (
      !isValidId(
        attemptId
      )
    ) {

      throw new AppError(
        'attemptId is required',
        400
      );
    }

    const attempt =
      await QuizAttempt.findById(
        attemptId
      );

    if (
      !attempt ||
      String(
        attempt.student
      ) !==
        String(
          req.user.id
        ) ||
      String(
        attempt.quiz
      ) !==
        String(
          quiz._id
        )
    ) {

      throw new AppError(
        'Attempt not found',
        404
      );
    }

    return attempt;
  };


// ---------------------------------------------------------------------------
// SAVE PROGRESS
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/quizzes/:id/save-progress
 */
export const saveProgress =
  asyncHandler(
    async (req, res) => {

      const {
        quiz,
      } =
        await loadQuiz(
          req.params.id
        );

      const attempt =
        await loadOwnAttempt(
          req,
          quiz
        );

      if (
        attempt.status !==
        'IN_PROGRESS'
      ) {

        throw new AppError(
          'This attempt has already been submitted',
          409,
          'ALREADY_SUBMITTED'
        );
      }

      const now =
        new Date();

      if (
        timingMode(
          attempt,
          now
        ) !== 'ON_TIME'
      ) {

        throw new AppError(
          'Time is up for this attempt',
          409,
          'TIME_EXPIRED'
        );
      }

      const parsed =
        parseAnswerList(
          quiz,
          req.body.answers
        );

      const draftAnswers =
        [...parsed].map(
          (
            [
              question,
              selectedAnswer,
            ]
          ) => ({
            question,
            selectedAnswer,
          })
        );

      const saved =
        await QuizAttempt.findOneAndUpdate(
          {
            _id:
              attempt._id,

            status:
              'IN_PROGRESS',
          },

          {
            $set: {
              draftAnswers,
            },
          },

          {
            new: true,
          }
        );

      if (!saved) {

        throw new AppError(
          'This attempt has already been submitted',
          409,
          'ALREADY_SUBMITTED'
        );
      }

      res.status(200).json({
        success: true,

        savedAt:
          now,

        remainingSeconds:
          remainingSeconds(
            saved,
            now
          ),
      });
    }
  );


// ---------------------------------------------------------------------------
// SUBMIT QUIZ
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/quizzes/:id/submit
 */
export const submitQuiz =
  asyncHandler(
    async (req, res) => {

      const {
        quiz,
      } =
        await loadQuiz(
          req.params.id
        );

      const attempt =
        await loadOwnAttempt(
          req,
          quiz
        );

      if (
        attempt.status !==
        'IN_PROGRESS'
      ) {

        throw new AppError(
          'This attempt has already been submitted',
          409,
          'ALREADY_SUBMITTED'
        );
      }

      const now =
        new Date();

      const mode =
        timingMode(
          attempt,
          now
        );

      const answerMap =
        mode === 'EXPIRED'
          ? null
          : parseAnswerList(
              quiz,
              req.body.answers
            );

      const done =
        await finalizeAttempt({
          attempt,
          quiz,
          mode,
          answerMap,
          now,
        });

      if (!done) {

        throw new AppError(
          'This attempt has already been submitted',
          409,
          'ALREADY_SUBMITTED'
        );
      }

      const limit =
        attemptLimit(
          quiz
        );

      const used =
        await QuizAttempt.countDocuments(
          {
            student:
              req.user.id,

            quiz:
              quiz._id,
          }
        );

      const remaining =
        limit === null
          ? null
          : Math.max(
              0,
              limit - used
            );

      res.status(200).json({

        success: true,

        message:
          mode === 'ON_TIME'
            ? 'Quiz submitted'
            : 'Time was up - your quiz was submitted automatically',

        autoSubmitted:
          mode !== 'ON_TIME',

        answersSource:
          mode === 'EXPIRED'
            ? 'SAVED_PROGRESS'
            : 'SUBMITTED',

        attempt:
          toAttemptSummary(
            done
          ),

        reviewAvailable:
          quiz.allowReview !==
          false,

        attemptsRemaining:
          remaining,

        canRetry:
          Boolean(
            quiz.allowRetry
          ) &&
          (
            remaining === null ||
            remaining > 0
          ),
      });
    }
  );


// ---------------------------------------------------------------------------
// MY ATTEMPTS
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/quizzes/:id/my-attempts
 */
export const getMyAttempts =
  asyncHandler(
    async (req, res) => {

      const {
        quiz,
        course,
      } =
        await loadQuiz(
          req.params.id
        );

      await authorizeView(
        req.user,
        quiz,
        course
      );

      const attempts =
        await loadStudentAttempts(
          quiz,
          req.user.id
        );

      const finished =
        attempts.filter(
          (attempt) =>
            attempt.status !==
            'IN_PROGRESS'
        );

      res.status(200).json({

        success: true,

        ...attemptsInfo(
          quiz,
          attempts
        ),

        attempts:
          finished.map(
            toAttemptSummary
          ),
      });
    }
  );


// ---------------------------------------------------------------------------
// ALL ATTEMPTS - MANAGER
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/quizzes/:id/attempts
 */
export const getQuizAttempts =
  asyncHandler(
    async (req, res) => {

      const {
        quiz,
        course,
      } =
        await loadQuiz(
          req.params.id
        );

      requireManager(
        req.user,
        course
      );

      await finalizeExpiredForQuiz(
        quiz
      );

      const attempts =
        await QuizAttempt.find({
          quiz:
            quiz._id,

          status: {
            $ne:
              'IN_PROGRESS',
          },
        })
          .populate(
            'student',
            'fullName email'
          )
          .sort({
            submittedAt: -1,
          })
          .limit(200);

      res.status(200).json({

        success: true,

        attempts:
          attempts.map(
            (attempt) => ({

              ...toAttemptSummary(
                attempt
              ),

              student:
                attempt.student &&
                attempt.student._id
                  ? {
                      _id:
                        attempt.student._id,

                      fullName:
                        attempt.student.fullName,

                      email:
                        attempt.student.email,
                    }
                  : attempt.student,
            })
          ),
      });
    }
  );


// ---------------------------------------------------------------------------
// QUIZ STATS
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/quizzes/:id/stats
 */
export const getQuizStats =
  asyncHandler(
    async (req, res) => {

      const {
        quiz,
        course,
      } =
        await loadQuiz(
          req.params.id
        );

      requireManager(
        req.user,
        course
      );

      await finalizeExpiredForQuiz(
        quiz
      );

      const attempts =
        await QuizAttempt.find({
          quiz:
            quiz._id,

          status: {
            $ne:
              'IN_PROGRESS',
          },
        }).select(
          'student score percentage passed'
        );

      const n =
        attempts.length;

      const students =
        new Set(
          attempts.map(
            (attempt) =>
              String(
                attempt.student
              )
          )
        );

      const avg =
        n
          ? attempts.reduce(
              (
                sum,
                attempt
              ) =>
                sum +
                (
                  attempt.percentage ||
                  0
                ),
              0
            ) / n
          : 0;

      res.status(200).json({

        success: true,

        stats: {

          totalAttempts:
            n,

          uniqueStudents:
            students.size,

          averagePercentage:
            Math.round(
              avg * 100
            ) / 100,

          passRate:
            n
              ? Math.round(
                  (
                    attempts.filter(
                      (attempt) =>
                        attempt.passed
                    ).length /
                    n
                  ) *
                    10000
                ) / 100
              : 0,

          highestScore:
            n
              ? Math.max(
                  ...attempts.map(
                    (attempt) =>
                      attempt.score ||
                      0
                  )
                )
              : 0,
        },
      });
    }
  );


// ---------------------------------------------------------------------------
// GET ATTEMPT BY ID
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/attempts/:attemptId
 */
export const getAttemptById =
  asyncHandler(
    async (req, res) => {

      assertId(
        req.params.attemptId,
        'attempt id'
      );

      let attempt =
        await QuizAttempt.findById(
          req.params.attemptId
        );

      if (!attempt) {

        throw new AppError(
          'Attempt not found',
          404
        );
      }

      const course =
        await Course.findById(
          attempt.course
        ).select(
          'title instructor'
        );

      const isOwner =
        String(
          attempt.student
        ) ===
        String(
          req.user.id
        );

      const manager =
        isManagerOf(
          req.user,
          course
        );

      if (
        !isOwner &&
        !manager
      ) {

        throw new AppError(
          'Attempt not found',
          404
        );
      }

      const quiz =
        await Quiz.findById(
          attempt.quiz
        );

      if (
        attempt.status ===
          'IN_PROGRESS' &&
        quiz
      ) {

        attempt =
          (
            await finalizeIfExpired(
              attempt,
              quiz
            )
          ) ||
          attempt;
      }

      if (
        attempt.status ===
        'IN_PROGRESS'
      ) {

        throw new AppError(
          'This attempt is still in progress',
          409,
          'ATTEMPT_IN_PROGRESS'
        );
      }

      const summary =
        toAttemptSummary(
          attempt
        );

      const quizInfo =
        quiz
          ? {
              _id:
                quiz._id,

              title:
                quiz.title,

              totalMarks:
                quiz.totalMarks,

              passingMarks:
                quiz.passingMarks ||
                0,
            }
          : null;

      // Student review disabled
      if (
        !quiz ||
        (
          !manager &&
          quiz.allowReview ===
            false
        )
      ) {

        return res
          .status(200)
          .json({

            success: true,

            reviewAvailable:
              false,

            attempt:
              summary,

            quiz:
              quizInfo,
          });
      }

      const answerById =
        new Map(
          (
            attempt.answers ||
            []
          ).map(
            (answer) => [
              String(
                answer.question
              ),
              answer,
            ]
          )
        );

      res.status(200).json({

        success: true,

        reviewAvailable:
          true,

        attempt:
          summary,

        quiz:
          quizInfo,

        questions:
          quiz.questions.map(
            (question) =>
              toReviewQuestion(
                question,
                answerById.get(
                  String(
                    question._id
                  )
                )
              )
          ),
      });
    }
  );