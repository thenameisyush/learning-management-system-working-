import mongoose from 'mongoose';

import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import Assignment from '../models/Assignment.js';
import Course from '../models/course.model.js';
import Submission from '../models/Submission.js';
import AppError from '../utils/AppError.js';
import { normalizeAssignmentInput, validateGradeInput } from '../utils/assignmentValidation.js';
import {
  hasCourseAccess,
  isCourseManager,
  listAccessibleCourseIds,
  listManagedCourseIds,
} from '../utils/courseAccess.js';


// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const assertId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(`Invalid ${label}`, 400);
};

const loadAssignment = async (id) => {
  assertId(id, 'assignment id');
  const assignment = await Assignment.findById(id);
  if (!assignment) throw new AppError('Assignment not found', 404);
  const course = assignment.course ? await Course.findById(assignment.course).select('title instructor') : null;
  return { assignment, course };
};

/** Admin, or the teacher who owns the assignment's course. Orphan (no course): admin only. */
const isManagerOf = (user, course) => (course ? isCourseManager(user, course) : user.role === 'ADMIN');

const requireManager = (user, course) => {
  if (!isManagerOf(user, course)) {
    throw new AppError('You can only manage assignments of your own courses', 403);
  }
};

/** 404 (not 403) for a student without course access, so an id can't be probed. Returns true if manager. */
const authorizeView = async (user, assignment, course) => {
  if (isManagerOf(user, course)) return true;
  if (!course || !(await hasCourseAccess(user, course))) throw new AppError('Assignment not found', 404);
  return false;
};

const parseIdList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    return String(value).split(',').map((s) => s.trim()).filter(Boolean);
  }
};

const toClientAssignment = (a, extra = {}) => ({
  _id: a._id,
  title: a.title,
  description: a.description || "",
  instructions: a.instructions || "",
  course: a.course || null,
  dueDate: a.dueDate || null,
  totalMarks: a.totalMarks,
  allowLateSubmission: a.allowLateSubmission !== false,

  // Teacher/Admin ka Google Drive assignment link
  driveLink: a.driveLink || "",
  attachments: Array.isArray(a.attachments)
  ? a.attachments
  : [],

  createdAt: a.createdAt,
  updatedAt: a.updatedAt,

  canManage: false,

  ...extra,
});

/** PENDING (no submission) | SUBMITTED | LATE | GRADED - computed, never stored redundantly. */
const submissionStatus = (submission) => {
  if (!submission) return 'PENDING';
  if (submission.marks !== null && submission.marks !== undefined) return 'GRADED';
  return submission.late ? 'LATE' : 'SUBMITTED';
};

const toClientSubmission = (s) => ({
  _id: s._id,
  status: submissionStatus(s),
  late: Boolean(s.late),
  submittedAt: s.submittedAt,
  text: s.text || '',
  driveLink: s.driveLink || '',
  resubmitRequested: Boolean(s.resubmitRequested),
resubmitRequestedAt: s.resubmitRequestedAt || null,
resubmitAllowed: Boolean(s.resubmitAllowed),
resubmitAllowedAt: s.resubmitAllowedAt || null,
  marks: s.marks ?? null,
  feedback: s.feedback || '',
  gradedAt: s.gradedAt || null,
});

// ---------------------------------------------------------------------------
// ASSIGNMENT MANAGEMENT
// ---------------------------------------------------------------------------

/** POST /api/v1/assignments   (ADMIN | owning TEACHER) */
export const createAssignment = asyncHandler(
  async (req, res, next) => {
    try {
      const courseId =
        req.body.courseId ??
        req.body.course;

      assertId(courseId, "course id");

      const course = await Course.findById(courseId);

      if (!course) {
        throw new AppError(
          "Course not found",
          404
        );
      }

      if (!isCourseManager(req.user, course)) {
        throw new AppError(
          "You can only create assignments for your own courses",
          403
        );
      }

      const data = normalizeAssignmentInput(
        req.body,
        null
      );

      const driveLink =
        typeof req.body.driveLink === "string"
          ? req.body.driveLink.trim()
          : "";

      // if (!driveLink) {
      //   throw new AppError(
      //     "Google Drive assignment link is required",
      //     400
      //   );
      // }

      if (driveLink) {
  let parsedUrl;

  try {
    parsedUrl = new URL(driveLink);
  } catch {
    throw new AppError(
      "Please provide a valid Google Drive link",
      400
    );
  }

  const allowedHosts = [
    "drive.google.com",
    "docs.google.com",
  ];

  if (
    parsedUrl.protocol !== "https:" ||
    !allowedHosts.includes(
      parsedUrl.hostname.toLowerCase()
    )
  ) {
    throw new AppError(
      "Please provide a valid Google Drive link",
      400
    );
  }
}

    const assignment = await Assignment.create({
  ...data,
  course: course._id,
  createdBy: req.user.id || req.user.id || req.user._id,
  driveLink,
});

      return res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        assignment: toClientAssignment(
          assignment,
          {
            canManage: true,
          }
        ),
      });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/v1/assignments[?courseId=]
 * Managers: every assignment of the courses they manage. Everyone else:
 * assignments of courses they can access. courseId narrows to one course.
 */
export const getAssignments = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const user = req.user;

  let filter;
  let course = null;

  // ---------------------------------------------------------
  // COURSE-WISE ASSIGNMENTS
  // ---------------------------------------------------------
  if (courseId) {
    assertId(courseId, "course id");

    course = await Course.findById(courseId).select(
      "title instructor"
    );

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const isManager = isCourseManager(user, course);
    const hasAccess = await hasCourseAccess(user, course);

    console.log("ASSIGNMENT DEBUG:", {
  userId: String(user.id),
  userRole: user.role,
  courseId: String(course._id),
  instructorId: String(course.instructor),
  isManager,
  hasAccess,
});

    if (!isManager && !hasAccess) {
      throw new AppError(
        "You do not have access to this course",
        403
      );
    }

    filter = {
      course: course._id,
    };
  }

  // ---------------------------------------------------------
  // ALL ACCESSIBLE ASSIGNMENTS
  // ---------------------------------------------------------
  else {
    const managed = await listManagedCourseIds(user);
    const accessible = await listAccessibleCourseIds(user);

    const ids = new Set();

    if (managed !== "ALL") {
      managed.forEach((id) => ids.add(String(id)));
    }

    if (accessible !== "ALL") {
      accessible.forEach((id) => ids.add(String(id)));
    }

    // ADMIN
    if (managed === "ALL" || accessible === "ALL") {
      filter = {};
    }

    // USER / TEACHER
    else {
      if (ids.size === 0) {
        return res.status(200).json({
          success: true,
          assignments: [],
          canManage: false,
        });
      }

      filter = {
        course: {
          $in: [...ids],
        },
      };
    }
  }

  // ---------------------------------------------------------
  // FETCH ASSIGNMENTS
  // ---------------------------------------------------------
  const assignments = await Assignment.find(filter)
    .sort({
      dueDate: 1,
      createdAt: -1,
    })
    .limit(200);

  // ---------------------------------------------------------
  // GET CURRENT USER SUBMISSIONS
  // ---------------------------------------------------------
  const assignmentIds = assignments.map(
    (assignment) => assignment._id
  );

  const submissions = await Submission.find({
    student: user._id,
    assignment: {
      $in: assignmentIds,
    },
  });

  const submissionMap = new Map();

  for (const submission of submissions) {
    submissionMap.set(
      String(submission.assignment),
      submission
    );
  }

  // ---------------------------------------------------------
  // COURSE CACHE
  // ---------------------------------------------------------
  const courseCache = new Map();

  // ---------------------------------------------------------
  // BUILD RESPONSE
  // ---------------------------------------------------------
  const rows = [];

  for (const assignment of assignments) {
    let assignmentCourse = null;

    if (assignment.course) {
      const key = String(assignment.course);

      if (!courseCache.has(key)) {
        const foundCourse = await Course.findById(
          assignment.course
        ).select("title instructor");

        courseCache.set(key, foundCourse);
      }

      assignmentCourse = courseCache.get(key);
    }

    const manager = isManagerOf(
      user,
      assignmentCourse
    );

    const mySubmission = submissionMap.get(
      String(assignment._id)
    );

    rows.push(
      toClientAssignment(assignment, {
        canManage: manager,

        myStatus: manager
          ? undefined
          : submissionStatus(mySubmission),

        myMarks: manager
          ? undefined
          : mySubmission?.marks ?? null,
      })
    );
  }

  // ---------------------------------------------------------
  // RESPONSE
  // ---------------------------------------------------------
  return res.status(200).json({
    success: true,

    assignments: rows,

    // IMPORTANT:
    // Course Content -> AssignmentsPanel
    // isi field se + New Assignment button show karega
    canManage: course
      ? isCourseManager(user, course)
      : false,
  });
});

/** GET /api/v1/assignments/:id */
export const getAssignmentById = asyncHandler(async (req, res) => {
  const { assignment, course } = await loadAssignment(req.params.id);
  const manager = await authorizeView(req.user, assignment, course);

  if (manager) {
    const submissions = await Submission.find({ assignment: assignment._id });
    const counts = { total: submissions.length, submitted: 0, late: 0, graded: 0 };
    submissions.forEach((s) => {
      const status = submissionStatus(s);
      if (status === 'GRADED') counts.graded += 1;
      else if (status === 'LATE') counts.late += 1;
      else counts.submitted += 1;
    });
    return res.status(200).json({ success: true, assignment: toClientAssignment(assignment, { canManage: true, submissionCounts: counts }) });
  }

  const mySubmission = await Submission.findOne({ assignment: assignment._id, student: req.user.id });
  res.status(200).json({
    success: true,
    assignment: toClientAssignment(assignment, { canManage: false }),
    mySubmission: mySubmission ? toClientSubmission(mySubmission) : { status: 'PENDING' },
  });
});

/** PUT /api/v1/assignments/:id */
export const updateAssignment = asyncHandler(
  async (req, res, next) => {
    try {
      const {
        assignment,
        course,
      } = await loadAssignment(
        req.params.id
      );

      requireManager(
        req.user,
        course
      );

      const data =
        normalizeAssignmentInput(
          req.body,
          assignment
        );

      const driveLink =
        typeof req.body.driveLink === "string"
          ? req.body.driveLink.trim()
          : assignment.driveLink || "";

      // if (!driveLink) {
      //   throw new AppError(
      //     "Google Drive assignment link is required",
      //     400
      //   );
      // }

      if (driveLink) {
  let parsedUrl;

  try {
    parsedUrl = new URL(driveLink);
  } catch {
    throw new AppError(
      "Please provide a valid Google Drive link",
      400
    );
  }

  const allowedHosts = [
    "drive.google.com",
    "docs.google.com",
  ];

  if (
    parsedUrl.protocol !== "https:" ||
    !allowedHosts.includes(
      parsedUrl.hostname.toLowerCase()
    )
  ) {
    throw new AppError(
      "Please provide a valid Google Drive link",
      400
    );
  }
}

      assignment.set({
        ...data,
        driveLink,
      });

      await assignment.save();

      return res.status(200).json({
        success: true,
        message: "Assignment updated",
        assignment: toClientAssignment(
          assignment,
          {
            canManage: true,
          }
        ),
      });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /api/v1/assignments/:id[?force=true] */
export const deleteAssignment = asyncHandler(async (req, res) => {
  const { assignment, course } = await loadAssignment(req.params.id);
  requireManager(req.user, course);

  const submissionCount = await Submission.countDocuments({ assignment: assignment._id });
  if (submissionCount > 0 && req.query.force !== 'true') {
    throw new AppError(
      `This assignment has ${submissionCount} student submission(s). Deleting it also deletes their work. Repeat with ?force=true to confirm.`,
      409,
      'ASSIGNMENT_HAS_SUBMISSIONS'
    );
  }

  const submissions = await Submission.find({ assignment: assignment._id });
  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();

  res.status(200).json({ success: true, message: 'Assignment deleted' });
});

/** GET /api/v1/assignments/:id/attachments/:fileId[?download=1] */
/**
 * GET /api/v1/assignments/:id/attachments/:fileId[?download=1]
 */
export const streamAssignmentAttachment = asyncHandler(
  async (req, res, next) => {
    const { assignment, course } = await loadAssignment(req.params.id);

    await authorizeView(req.user, assignment, course);

    const file = assignment.attachments.find(
      (f) => String(f._id) === req.params.fileId
    );

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    await streamStoredFile(res, file, {
      download: req.query.download === "1",
    });
  }
);

// ---------------------------------------------------------------------------
// SUBMISSIONS
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/assignments/:id/submit
 * Creates the student's submission, or - if it exists and is not yet graded -
 * replaces it (files, text, submittedAt, late are all recomputed).
 */

export const requestResubmit = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  // Teacher/Admin cannot request resubmission
  if (isCourseManager(req.user, assignment.course)) {
    throw new AppError("Teachers and admins cannot request resubmission", 403);
  }
const course = assignment.course
  ? await Course.findById(assignment.course).select("title instructor")
  : null;

if (!course || !(await hasCourseAccess(req.user, course))) {
  throw new AppError("You do not have access to this assignment", 403);
}


  const submission = await Submission.findOne({
    assignment: assignment._id,
    student: req.user.id || req.user.id || req.user._id,
  });

  if (!submission) {
    throw new AppError("You have not submitted this assignment yet", 404);
  }

  // Already graded submissions cannot be resubmitted
  if (submission.gradedAt || submission.marks !== null) {
    throw new AppError("A graded submission cannot be resubmitted", 400);
  }

  // Already approved
  if (submission.resubmitAllowed) {
    throw new AppError("Resubmission is already allowed", 400);
  }

  // Request already sent
  if (submission.resubmitRequested) {
    throw new AppError("Resubmission request is already pending", 400);
  }

  submission.resubmitRequested = true;
  submission.resubmitRequestedAt = new Date();

  await submission.save();

  res.status(200).json({
    success: true,
    message: "Resubmission request sent to teacher",
    submission: toClientSubmission(submission),
  });
});

export const allowResubmit = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);

  if (!submission) {
    throw new AppError("Submission not found", 404);
  }

  const assignment = await Assignment.findById(submission.assignment);

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  // Only teacher/admin can approve
  if (!isCourseManager(req.user, assignment.course)) {
    throw new AppError(
      "Only the teacher or admin can allow resubmission",
      403
    );
  }

  // Already graded
  if (submission.gradedAt || submission.marks !== null) {
    throw new AppError("A graded submission cannot be resubmitted", 400);
  }

  if (!submission.resubmitRequested) {
    throw new AppError(
      "Student has not requested a resubmission",
      400
    );
  }

  submission.resubmitRequested = false;
  submission.resubmitAllowed = true;
  submission.resubmitAllowedAt = new Date();

  await submission.save();

  res.status(200).json({
    success: true,
    message: "Resubmission allowed successfully",
    submission: toClientSubmission(submission),
  });
});

export const submitAssignment = asyncHandler(async (req, res, next) => {
  try {
    const { assignment, course } = await loadAssignment(req.params.id);

    if (isManagerOf(req.user, course)) {
      throw new AppError(
        'Teachers and admins cannot submit assignments',
        403
      );
    }

    await authorizeView(req.user, assignment, course);

    const now = new Date();

    const late =
      Boolean(assignment.dueDate) &&
      now > new Date(assignment.dueDate);

    if (late && assignment.allowLateSubmission === false) {
      throw new AppError(
        'The due date for this assignment has passed and late submissions are not allowed',
        403,
        'PAST_DUE'
      );
    }

    const text =
      typeof req.body?.text === 'string'
        ? req.body.text.trim()
        : '';

    const driveLink =
      typeof req.body?.driveLink === 'string'
        ? req.body.driveLink.trim()
        : '';

    if (!text && !driveLink) {
      throw new AppError(
        'Add some text or provide a Google Drive link before submitting',
        400
      );
    }

    if (driveLink) {
      let parsedUrl;

      try {
        parsedUrl = new URL(driveLink);
      } catch {
        throw new AppError(
          'Please provide a valid Google Drive link',
          400
        );
      }

      const allowedHosts = [
        'drive.google.com',
        'docs.google.com',
      ];

      if (
        parsedUrl.protocol !== 'https:' ||
        !allowedHosts.includes(parsedUrl.hostname.toLowerCase())
      ) {
        throw new AppError(
          'Please provide a valid Google Drive link',
          400
        );
      }
    }

    const existing = await Submission.findOne({
  assignment: assignment._id,
  student: req.user.id,
});

   if (
  existing &&
  existing.marks !== null &&
  existing.marks !== undefined
) {
  throw new AppError(
    "This assignment has already been graded and can no longer be resubmitted",
    409,
    "ALREADY_GRADED"
  );
}

let submission;

try {
  if (existing) {
    // Existing submission can only be replaced
    // after teacher/admin approval.
    if (existing.marks != null && !existing.resubmitAllowed) {
  throw new AppError(
    "Resubmission has not been approved by the teacher yet",
    403,
    "RESUBMIT_NOT_ALLOWED"
  );
}

    existing.set({
      text,
      driveLink,
      submittedAt: now,
      late,

      // Consume the approval after resubmission
      resubmitAllowed: false,
      resubmitRequested: false,
    });

    submission = await existing.save();
  } else {
    // First-time submission
    submission = await Submission.create({
      assignment: assignment._id,
      student: req.user.id || req.user._id,
      course: assignment.course || course?._id,
      text,
      driveLink,
      submittedAt: now,
      late,
    });
  }
} catch (err) {
  if (err?.code === 11000) {
    throw new AppError(
      "This assignment has already been graded and can no longer be resubmitted",
      409,
      "ALREADY_GRADED"
    );
  }

  throw err;
}

    res.status(200).json({
      success: true,
      message: late ? 'Submitted late' : 'Assignment submitted',
      submission: toClientSubmission(submission),
    });
  } catch (err) {
    return next(err);
  }
});

/** GET /api/v1/assignments/:id/my-submission */
export const getMySubmission = asyncHandler(async (req, res) => {
  const { assignment, course } = await loadAssignment(req.params.id);
  await authorizeView(req.user, assignment, course);

  const submission = await Submission.findOne({
  assignment: assignment._id,
  student: req.user.id});
  res.status(200).json({ success: true, submission: submission ? toClientSubmission(submission) : { status: 'PENDING' } });
});

/** GET /api/v1/assignments/:id/submissions   (ADMIN | owning TEACHER) */
export const getSubmissions = asyncHandler(async (req, res) => {
  const { assignment, course } = await loadAssignment(req.params.id);
  requireManager(req.user, course);

  const submissions = await Submission.find({ assignment: assignment._id })
    .populate('student', 'fullName email')
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    submissions: submissions.map((s) => ({
      ...toClientSubmission(s),
      student: s.student && s.student._id ? { _id: s.student._id, fullName: s.student.fullName, email: s.student.email } : s.student,
    })),
  });
});

/** PUT /api/v1/assignments/submissions/:submissionId/grade   (ADMIN | owning TEACHER) */
export const gradeSubmission = asyncHandler(async (req, res, next) => {
  assertId(req.params.submissionId, 'submission id');
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) return next(new AppError('Submission not found', 404));

  const { assignment, course } = await loadAssignment(submission.assignment);
  requireManager(req.user, course);

  const { marks, feedback } = validateGradeInput(req.body, assignment.totalMarks);
  submission.set({ marks, feedback, gradedBy: req.user.id, gradedAt: new Date() });
  await submission.save();

  res.status(200).json({ success: true, message: 'Submission graded', submission: toClientSubmission(submission) });
});


