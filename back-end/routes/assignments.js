// back-end/routes/assignments.js

import express from "express";
import multer from "multer";

import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getMySubmission,
  getSubmissions,
  gradeSubmission,
  requestResubmit,
  allowResubmit,
} from "../controllers/assignment.controller.js";

import {
  isLoggedIn,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();


// ---------------------------------------------------------
// MULTER
// ---------------------------------------------------------

const upload = multer({
  dest: "uploads/",
});

const MANAGERS = ["ADMIN", "TEACHER"];


// ---------------------------------------------------------
// ASSIGNMENTS
// ---------------------------------------------------------

// GET /api/v1/assignments
// Students can view accessible assignments.
// Admin/Teacher can view their managed assignments.
router.get(
  "/",
  isLoggedIn,
  getAssignments
);


// POST /api/v1/assignments
// ADMIN + TEACHER
// Controller checks whether teacher owns the course.
router.post(
  "/",
  isLoggedIn,
  authorizeRoles(...MANAGERS),
  upload.array("attachments", 5),
  createAssignment
);


// GET /api/v1/assignments/:id
router.get(
  "/:id",
  isLoggedIn,
  getAssignmentById
);


// PUT /api/v1/assignments/:id
// ADMIN + owning TEACHER
router.put(
  "/:id",
  isLoggedIn,
  authorizeRoles(...MANAGERS),
  upload.array("attachments", 5),
  updateAssignment
);


// DELETE /api/v1/assignments/:id
// ADMIN + owning TEACHER
router.delete(
  "/:id",
  isLoggedIn,
  authorizeRoles(...MANAGERS),
  deleteAssignment
);


// ---------------------------------------------------------
// STUDENT SUBMISSION
// ---------------------------------------------------------

// POST /api/v1/assignments/:id/submit
// Student only.
// Controller additionally blocks TEACHER/ADMIN.
router.post(
  "/:id/submit",
  isLoggedIn,
  upload.array("files", 3),
  submitAssignment
);


// GET /api/v1/assignments/:id/my-submission
router.get(
  "/:id/my-submission",
  isLoggedIn,
  getMySubmission
);


// ---------------------------------------------------------
// TEACHER / ADMIN SUBMISSIONS
// ---------------------------------------------------------

// GET /api/v1/assignments/:id/submissions
// ADMIN + owning TEACHER
router.get(
  "/:id/submissions",
  isLoggedIn,
  authorizeRoles(...MANAGERS),
  getSubmissions
);


// POST /api/v1/assignments/submissions/:submissionId/grade
// ADMIN + owning TEACHER
router.post(
  "/submissions/:submissionId/grade",
  isLoggedIn,
  authorizeRoles(...MANAGERS),
  gradeSubmission
);


// POST /api/v1/assignments/:id/request-resubmit
router.post(
  "/:id/request-resubmit",
  isLoggedIn,
  requestResubmit
);


// POST /api/v1/assignments/:id/allow-resubmit
router.post(
  "/:id/allow-resubmit",
  isLoggedIn,
  authorizeRoles(...MANAGERS),
  allowResubmit
);


export default router;