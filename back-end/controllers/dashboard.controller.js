import asyncHandler from "../middlewares/asyncHandler.middleware.js";

import Assignment from "../models/Assignment.js";
import Attendance from "../models/attendance.model.js";
import Course from "../models/course.model.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.model.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Submission from "../models/Submission.js";
import User from "../models/user.model.js";

import {
  listAccessibleCourseIds,
  listManagedCourseIds,
} from "../utils/courseAccess.js";

import {
  computeCourseLeaderboard,
  findEntry,
} from "../utils/leaderboard.js";

import {
  PUBLISHED_FILTER,
  attemptLimit,
} from "../utils/quizSerializers.js";

const FINISHED = ["SUBMITTED", "AUTO_SUBMITTED"];

const MAX_COURSES = 12;
const MAX_PENDING = 20;
const MAX_QUIZZES = 6;
const MAX_RESULTS = 5;
const MAX_BOARDS = 5;

const MAX_ACTIVITY = 15;
const MAX_SUBMISSION_QUEUE = 20;
const RECENT_WINDOW_DAYS = 30;

const S = (value) => String(value);

const unique = (arr) => [...new Set(arr)];

const byDueDate = (a, b) => {
  if (!a.dueDate && !b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;

  return new Date(a.dueDate) - new Date(b.dueDate);
};

const daysAgo = (n) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000);

function round1(n) {
  return Math.round((Number(n) + Number.EPSILON) * 10) / 10;
};

// ============================================================
// STUDENT DASHBOARD
// ============================================================

export const getStudentDashboard = asyncHandler(
  async (req, res) => {
    const userId = req.user.id;
    const now = new Date();

    const [
      me,
      enrollments,
      allAttempts,
      allSubmissions,
      attendance,
      accessible,
    ] = await Promise.all([
      User.findById(userId)
        .select("fullName")
        .lean(),

      Enrollment.find({
        user: userId,
        status: "active",
      })
        .select("course")
        .sort({ createdAt: -1 })
        .lean(),

      QuizAttempt.find({
        student: userId,
      })
        .select(
          "course quiz status score maxScore percentage passed submittedAt expiresAt"
        )
        .sort({ submittedAt: -1 })
        .lean(),

      Submission.find({
        student: userId,
      })
        .select("assignment course")
        .lean(),

      Attendance.find({
        user: userId,
      })
        .select("date")
        .lean(),

      listAccessibleCourseIds(req.user),
    ]);

    // --------------------------------------------------------
    // Student ke courses
    // --------------------------------------------------------

    const enrolledIds = enrollments.map((e) =>
      S(e.course)
    );

    const activityIds = unique([
      ...allAttempts.map((a) => S(a.course)),
      ...allSubmissions.map((s) => S(s.course)),
    ]);

    const myIds = unique([
      ...enrolledIds,
      ...(accessible === "ALL" ? activityIds : []),
    ]).slice(0, MAX_COURSES);

    const mine = new Set(myIds);

    const attempts = allAttempts.filter((a) =>
      mine.has(S(a.course))
    );

    const submissions = allSubmissions.filter((s) =>
      mine.has(S(s.course))
    );

    const [courseDocs, quizzes, assignments] =
      myIds.length
        ? await Promise.all([
            Course.find({
              _id: { $in: myIds },
            })
              .select("-lectures")
              .lean(),

            Quiz.find({
              $and: [
                {
                  course: {
                    $in: myIds,
                  },
                },
                PUBLISHED_FILTER,
              ],
            })
              .select(
                "title course durationMinutes totalMarks allowRetry maxAttempts questions._id"
              )
              .lean(),

            Assignment.find({
              course: {
                $in: myIds,
              },
            })
              .select(
                "title course dueDate totalMarks allowLateSubmission"
              )
              .lean(),
          ])
        : [[], [], []];

    const courseById = new Map(
      courseDocs.map((course) => [
        S(course._id),
        course,
      ])
    );

    const courseRef = (id) => ({
      _id: id,
      title:
        courseById.get(S(id))?.title ||
        "Course",
    });

    const orderedCourses = myIds
      .map((id) => courseById.get(id))
      .filter(Boolean);

    // --------------------------------------------------------
    // Course Progress
    // --------------------------------------------------------

    const finishedQuizKeys = new Set(
      attempts
        .filter((a) =>
          FINISHED.includes(a.status)
        )
        .map(
          (a) =>
            `${S(a.course)}:${S(a.quiz)}`
        )
    );

    const submittedAssignmentIds =
      new Set(
        submissions.map((s) =>
          S(s.assignment)
        )
      );

    const courses = orderedCourses.map(
      (course) => {
        const id = S(course._id);

        const courseQuizzes =
          quizzes.filter(
            (q) => S(q.course) === id
          );

        const courseAssignments =
          assignments.filter(
            (a) => S(a.course) === id
          );

        const done =
          courseQuizzes.filter((q) =>
            finishedQuizKeys.has(
              `${id}:${S(q._id)}`
            )
          ).length +
          courseAssignments.filter((a) =>
            submittedAssignmentIds.has(
              S(a._id)
            )
          ).length;

        const total =
          courseQuizzes.length +
          courseAssignments.length;

        return {
          course,

          progress: {
            done,
            total,
            percent:
              total > 0
                ? Math.round(
                    (done / total) * 100
                  )
                : null,
          },
        };
      }
    );

    // --------------------------------------------------------
    // Pending Assignments
    // --------------------------------------------------------

    const pendingAll = assignments
      .filter(
        (a) =>
          !submittedAssignmentIds.has(
            S(a._id)
          )
      )
      .map((a) => {
        const overdue =
          Boolean(a.dueDate) &&
          new Date(a.dueDate) < now;

        return {
          _id: a._id,
          title: a.title,
          course: courseRef(a.course),
          dueDate: a.dueDate || null,
          totalMarks: a.totalMarks,

          overdue,

          canSubmit: !(
            overdue &&
            a.allowLateSubmission === false
          ),
        };
      })
      .sort(byDueDate);

    // --------------------------------------------------------
    // Available Quizzes
    // --------------------------------------------------------

    const perQuiz = new Map();

    for (const attempt of attempts) {
      const key = S(attempt.quiz);

      const current =
        perQuiz.get(key) || {
          used: 0,
          active: false,
        };

      current.used += 1;

      if (
        attempt.status === "IN_PROGRESS" &&
        (!attempt.expiresAt ||
          new Date(attempt.expiresAt) >= now)
      ) {
        current.active = true;
      }

      perQuiz.set(key, current);
    }

    const availableAll = quizzes
      .filter(
        (q) =>
          (q.questions || []).length > 0
      )
      .map((quiz) => {
        const state =
          perQuiz.get(S(quiz._id)) || {
            used: 0,
            active: false,
          };

        const limit = attemptLimit(quiz);

        return {
          _id: quiz._id,
          title: quiz.title,
          course: courseRef(quiz.course),
          totalMarks: quiz.totalMarks,

          durationMinutes:
            quiz.durationMinutes || 0,

          attemptsRemaining:
            limit === null
              ? null
              : Math.max(
                  0,
                  limit - state.used
                ),

          hasActiveAttempt:
            state.active,
        };
      })
      .filter(
        (quiz) =>
          quiz.hasActiveAttempt ||
          quiz.attemptsRemaining === null ||
          quiz.attemptsRemaining > 0
      );

    // --------------------------------------------------------
    // Recent Quiz Results
    // --------------------------------------------------------

    const finished = attempts.filter((a) =>
      FINISHED.includes(a.status)
    );

    const recent = finished.slice(
      0,
      MAX_RESULTS
    );

    const titleDocs = recent.length
      ? await Quiz.find({
          _id: {
            $in: recent.map(
              (a) => a.quiz
            ),
          },
        })
          .select("title")
          .lean()
      : [];

    const quizTitle = new Map(
      titleDocs.map((q) => [
        S(q._id),
        q.title,
      ])
    );

    const recentResults = recent.map(
      (attempt) => ({
        attemptId: attempt._id,

        quiz: {
          _id: attempt.quiz,
          title:
            quizTitle.get(
              S(attempt.quiz)
            ) || "Quiz",
        },

        course: courseRef(
          attempt.course
        ),

        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        passed: attempt.passed,
        submittedAt: attempt.submittedAt,
      })
    );

    // --------------------------------------------------------
    // Attendance
    // --------------------------------------------------------

    const today =
      now.toLocaleDateString("en-CA");

    const dates = attendance
      .map((record) => record.date)
      .sort();

    const attendanceSummary = {
      totalDays: dates.length,

      thisMonth: dates.filter((date) =>
        date.startsWith(
          today.slice(0, 7)
        )
      ).length,

      lastMarked: dates.length
        ? dates[dates.length - 1]
        : null,
    };

    // --------------------------------------------------------
    // Leaderboard
    // --------------------------------------------------------

    const boardCourseIds = unique(
      finished.map((a) => S(a.course))
    ).slice(0, MAX_BOARDS);

    const boards = await Promise.all(
      boardCourseIds.map(
        async (courseId) => {
          const ranked =
            await computeCourseLeaderboard(
              courseId
            );

          const entry = findEntry(
            ranked,
            userId
          );

          return entry
            ? {
                course:
                  courseRef(courseId),

                rank: entry.rank,

                totalParticipants:
                  ranked.length,

                points: entry.points,
              }
            : null;
        }
      )
    );

    // --------------------------------------------------------
    // Final Student Response
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      student: {
        fullName:
          me?.fullName || "",
      },

      stats: {
        courses: courses.length,
        pendingAssignments:
          pendingAll.length,
        availableQuizzes:
          availableAll.length,
        completedQuizzes:
          finished.length,
      },

      courses,

      pendingAssignments:
        pendingAll.slice(
          0,
          MAX_PENDING
        ),

      availableQuizzes:
        availableAll.slice(
          0,
          MAX_QUIZZES
        ),

      recentResults,

      attendance:
        attendanceSummary,

      leaderboard:
        boards.filter(Boolean),
    });
  }
);

// ============================================================
// TEACHER DASHBOARD
// ============================================================

export const getTeacherDashboard =
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // --------------------------------------------------------
    // Teacher ke sirf apne courses
    // --------------------------------------------------------

    const managed =
      await listManagedCourseIds(
        req.user
      );

    const myIds =
      managed === "ALL"
        ? []
        : managed;

    const teacher =
      await User.findById(userId)
        .select("fullName")
        .lean();

    // --------------------------------------------------------
    // Teacher ke paas course nahi
    // --------------------------------------------------------

    if (!myIds.length) {
      return res.status(200).json({
        success: true,

        teacher: {
          fullName:
            teacher?.fullName || "",
        },

        stats: {
          courses: 0,
          students: 0,
          pendingSubmissions: 0,
          quizzes: 0,
        },

        courses: [],
        submissionQueue: [],
        quizPerformance: [],
        recentActivity: [],

        attendance: {
          totalDays: 0,
          thisMonth: 0,
          lastMarked: null,
        },
      });
    }

    // --------------------------------------------------------
    // Teacher related data
    // --------------------------------------------------------

    const [
      courseDocs,
      enrollments,
      quizzes,
      assignments,
      attempts,
      submissions,
      attendance,
    ] = await Promise.all([
      Course.find({
        _id: { $in: myIds },
      })
        .select("-lectures")
        .lean(),

      // IMPORTANT:
      // user + student dono select kiye hain
      Enrollment.find({
        course: { $in: myIds },
        status: "active",
      })
        .select("course user student createdAt")
        .lean(),

      Quiz.find({
        course: { $in: myIds },
      })
        .select(
          "title course status isPublished durationMinutes totalMarks questions createdAt"
        )
        .sort({ createdAt: -1 })
        .lean(),

      Assignment.find({
        course: { $in: myIds },
      })
        .select(
          "title course dueDate totalMarks allowLateSubmission createdAt"
        )
        .sort({ createdAt: -1 })
        .lean(),

      QuizAttempt.find({
        course: { $in: myIds },
        status: {
          $in: FINISHED,
        },
      })
        .select(
          "course quiz student score maxScore percentage passed submittedAt"
        )
        .sort({ submittedAt: -1 })
        .lean(),

      Submission.find({
        course: { $in: myIds },
      })
        .populate(
          "student",
          "fullName email"
        )
        .select(
          "assignment course student submittedAt late marks createdAt"
        )
        .sort({
          submittedAt: -1,
          createdAt: -1,
        })
        .lean(),

      Attendance.find({
        user: userId,
      })
        .select("date")
        .sort({ date: -1 })
        .lean(),
    ]);

    const courseById = new Map(
      courseDocs.map((course) => [
        S(course._id),
        course,
      ])
    );

    const courseRef = (id) => ({
      _id: id,
      title:
        courseById.get(S(id))?.title ||
        "Course",
    });

    // --------------------------------------------------------
    // Student count
    // --------------------------------------------------------

    const studentIdSet = new Set();

    for (const enrollment of enrollments) {
      const studentId =
        enrollment.user ||
        enrollment.student;

      if (studentId) {
        studentIdSet.add(
          S(studentId)
        );
      }
    }

    // --------------------------------------------------------
    // Course statistics
    // --------------------------------------------------------

    const enrollCount = new Map();

    for (const enrollment of enrollments) {
      const key = S(
        enrollment.course
      );

      enrollCount.set(
        key,
        (enrollCount.get(key) || 0) + 1
      );
    }

    // --------------------------------------------------------
    // Quiz performance per course
    // --------------------------------------------------------

    const perfByCourse = new Map();

    for (const attempt of attempts) {
      const key = S(attempt.course);

      const acc =
        perfByCourse.get(key) || {
          sumPct: 0,
          count: 0,
          passed: 0,
        };

      acc.sumPct += Number(
        attempt.percentage || 0
      );

      acc.count += 1;

      if (attempt.passed === true) {
        acc.passed += 1;
      }

      perfByCourse.set(
        key,
        acc
      );
    }

    // --------------------------------------------------------
    // Course data
    // --------------------------------------------------------

    const courses = courseDocs.map(
      (course) => {
        const id = S(course._id);

        const perf =
          perfByCourse.get(id);

        return {
          course,

          enrolledCount:
            enrollCount.get(id) || 0,

          quizCount:
            quizzes.filter(
              (quiz) =>
                S(quiz.course) === id
            ).length,

          assignmentCount:
            assignments.filter(
              (assignment) =>
                S(assignment.course) ===
                id
            ).length,

          averageQuizPercentage: perf
            ? round1(
                perf.sumPct /
                  perf.count
              )
            : null,

          passRate: perf
            ? round1(
                (perf.passed /
                  perf.count) *
                  100
              )
            : null,
        };
      }
    );

    // --------------------------------------------------------
    // Submission Queue
    // --------------------------------------------------------

    const assignmentById =
      new Map(
        assignments.map(
          (assignment) => [
            S(assignment._id),
            assignment,
          ]
        )
      );

    const pendingSubmissions =
      submissions.filter(
        (submission) =>
          submission.marks === null ||
          submission.marks === undefined
      );

    const submissionQueue =
      pendingSubmissions
        .map((submission) => {
          const assignment =
            assignmentById.get(
              S(
                submission.assignment
              )
            );

          return {
            _id: submission._id,

            assignment: {
              _id:
                submission.assignment,

              title:
                assignment?.title ||
                "Assignment",
            },

            course: courseRef(
              submission.course
            ),

            student:
              submission.student
                ? {
                    _id:
                      submission
                        .student
                        ._id,

                    fullName:
                      submission
                        .student
                        .fullName,

                    email:
                      submission
                        .student
                        .email,
                  }
                : {
                    fullName:
                      "Unknown student",
                  },

            submittedAt:
              submission.submittedAt ||
              submission.createdAt,

            late: Boolean(
              submission.late
            ),
          };
        })
        .slice(
          0,
          MAX_SUBMISSION_QUEUE
        );

    // --------------------------------------------------------
    // Quiz Performance
    // --------------------------------------------------------

    const attemptsByQuiz =
      new Map();

    for (const attempt of attempts) {
      const key = S(attempt.quiz);

      const acc =
        attemptsByQuiz.get(key) || {
          sumPct: 0,
          count: 0,
          passed: 0,
        };

      acc.sumPct += Number(
        attempt.percentage || 0
      );

      acc.count += 1;

      if (attempt.passed === true) {
        acc.passed += 1;
      }

      attemptsByQuiz.set(
        key,
        acc
      );
    }

    const quizPerformance =
      quizzes
        .filter((quiz) =>
          attemptsByQuiz.has(
            S(quiz._id)
          )
        )
        .map((quiz) => {
          const acc =
            attemptsByQuiz.get(
              S(quiz._id)
            );

          return {
            _id: quiz._id,
            title: quiz.title,

            course: courseRef(
              quiz.course
            ),

            attempts: acc.count,

            averagePercentage:
              round1(
                acc.sumPct /
                  acc.count
              ),

            passRate:
              round1(
                (acc.passed /
                  acc.count) *
                  100
              ),
          };
        })
        .sort(
          (a, b) =>
            b.attempts -
            a.attempts
        );

    // --------------------------------------------------------
    // Recent Activity
    // --------------------------------------------------------

    const activity = [
      ...submissions.map(
        (submission) => ({
          type: "SUBMISSION",

          at:
            submission.submittedAt ||
            submission.createdAt,

          text: `${
            submission.student
              ?.fullName ||
            "A student"
          } submitted "${
            assignmentById.get(
              S(
                submission.assignment
              )
            )?.title ||
            "an assignment"
          }"`,

          course: courseRef(
            submission.course
          ),
        })
      ),

      ...attempts
        .slice(0, MAX_ACTIVITY)
        .map((attempt) => ({
          type: "QUIZ_ATTEMPT",

          at: attempt.submittedAt,

          text: `A student scored ${
            attempt.percentage || 0
          }% on a quiz`,

          course: courseRef(
            attempt.course
          ),
        })),

      ...enrollments.map(
        (enrollment) => ({
          type: "ENROLLMENT",

          at:
            enrollment.createdAt,

          text:
            "A new student enrolled",

          course: courseRef(
            enrollment.course
          ),
        })
      ),
    ]
      .filter((item) => item.at)
      .sort(
        (a, b) =>
          new Date(b.at) -
          new Date(a.at)
      )
      .slice(0, MAX_ACTIVITY);

    // --------------------------------------------------------
    // Teacher Attendance
    // --------------------------------------------------------

    const today =
      new Date().toLocaleDateString(
        "en-CA"
      );

    const dates = attendance
      .map((item) => item.date)
      .sort();

    const attendanceSummary = {
      totalDays: dates.length,

      thisMonth:
        dates.filter((date) =>
          date.startsWith(
            today.slice(0, 7)
          )
        ).length,

      lastMarked: dates.length
        ? dates[dates.length - 1]
        : null,
    };

    // --------------------------------------------------------
    // Final Teacher Response
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      teacher: {
        fullName:
          teacher?.fullName || "",
      },

      stats: {
        courses: courses.length,

        students:
          studentIdSet.size,

        pendingSubmissions:
          pendingSubmissions.length,

        quizzes: quizzes.length,
      },

      courses,

      submissionQueue,

      quizPerformance,

      recentActivity: activity,

      attendance:
        attendanceSummary,
    });
  });

// ============================================================
// ADMIN DASHBOARD
// ============================================================

export const getAdminDashboard =
  asyncHandler(async (req, res) => {
    const since = daysAgo(
      RECENT_WINDOW_DAYS
    );

    const [
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalCourses,
      totalEnrollments,
      totalQuizzes,
      publishedQuizzes,
      totalAssignments,
      totalAttempts30d,
      totalSubmissions30d,
      totalAttendanceRecords,
      attendanceToday,
      activeSubscribers,
      totalPayments,
      payments30d,
      recentCourses,
      recentEnrollments,
      recentSubmissions,
      recentAttempts,
    ] = await Promise.all([
      User.countDocuments({
        role: "USER",
      }),

      User.countDocuments({
        role: "TEACHER",
      }),

      User.countDocuments({
        role: "ADMIN",
      }),

      Course.countDocuments({}),

      Enrollment.countDocuments({
        status: "active",
      }),

      Quiz.countDocuments({}),

      Quiz.countDocuments(
        PUBLISHED_FILTER
      ),

      Assignment.countDocuments({}),

      QuizAttempt.countDocuments({
        status: {
          $in: FINISHED,
        },
        submittedAt: {
          $gte: since,
        },
      }),

      Submission.countDocuments({
        submittedAt: {
          $gte: since,
        },
      }),

      Attendance.countDocuments({}),

      Attendance.countDocuments({
        date:
          new Date().toLocaleDateString(
            "en-CA"
          ),
      }),

      User.countDocuments({
        "subscription.status":
          "active",
      }),

      Payment.countDocuments({}),

      Payment.countDocuments({
        createdAt: {
          $gte: since,
        },
      }),

      Course.find({})
        .select("title createdAt")
        .sort({ createdAt: -1 })
        .limit(MAX_ACTIVITY)
        .lean(),

      Enrollment.find({
        status: "active",
      })
        .select(
          "course createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(MAX_ACTIVITY)
        .populate(
          "course",
          "title"
        )
        .lean(),

      Submission.find({})
        .select(
          "assignment submittedAt student"
        )
        .sort({
          submittedAt: -1,
        })
        .limit(MAX_ACTIVITY)
        .populate(
          "student",
          "fullName"
        )
        .populate(
          "assignment",
          "title"
        )
        .lean(),

      QuizAttempt.find({
        status: {
          $in: FINISHED,
        },
      })
        .select(
          "quiz submittedAt percentage"
        )
        .sort({
          submittedAt: -1,
        })
        .limit(MAX_ACTIVITY)
        .populate(
          "quiz",
          "title"
        )
        .lean(),
    ]);

    // --------------------------------------------------------
    // Admin Activity
    // --------------------------------------------------------

    const activity = [
      ...recentCourses.map(
        (course) => ({
          type: "COURSE_CREATED",

          at: course.createdAt,

          text: `Course "${course.title}" was created`,
        })
      ),

      ...recentEnrollments.map(
        (enrollment) => ({
          type: "ENROLLMENT",

          at:
            enrollment.createdAt,

          text: `A student enrolled in "${
            enrollment.course
              ?.title ||
            "a course"
          }"`,
        })
      ),

      ...recentSubmissions.map(
        (submission) => ({
          type: "SUBMISSION",

          at:
            submission.submittedAt,

          text: `${
            submission.student
              ?.fullName ||
            "A student"
          } submitted "${
            submission.assignment
              ?.title ||
            "an assignment"
          }"`,
        })
      ),

      ...recentAttempts.map(
        (attempt) => ({
          type: "QUIZ_ATTEMPT",

          at:
            attempt.submittedAt,

          text: `A quiz attempt on "${
            attempt.quiz?.title ||
            "a quiz"
          }" scored ${
            attempt.percentage || 0
          }%`,
        })
      ),
    ]
      .filter((item) => item.at)
      .sort(
        (a, b) =>
          new Date(b.at) -
          new Date(a.at)
      )
      .slice(0, MAX_ACTIVITY);

    // --------------------------------------------------------
    // Final Admin Response
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      users: {
        students:
          totalStudents,

        teachers:
          totalTeachers,

        admins:
          totalAdmins,

        total:
          totalStudents +
          totalTeachers +
          totalAdmins,
      },

      courses: {
        total: totalCourses,
        totalEnrollments:
          totalEnrollments,
      },

      quizzes: {
        total: totalQuizzes,
        published:
          publishedQuizzes,

        attemptsLast30Days:
          totalAttempts30d,
      },

      assignments: {
        total:
          totalAssignments,

        submissionsLast30Days:
          totalSubmissions30d,
      },

      attendance: {
        totalRecords:
          totalAttendanceRecords,

        markedToday:
          attendanceToday,
      },

      payments: {
        activeSubscribers:
          activeSubscribers,

        verifiedPayments:
          totalPayments,

        verifiedPaymentsLast30Days:
          payments30d,
      },

      recentActivity:
        activity,
    });
  });