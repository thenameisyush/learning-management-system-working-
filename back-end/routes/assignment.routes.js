import { Router } from "express";
import multer from "multer";
import path from "path";

import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  getMySubmission,
  requestResubmit,
  allowResubmit,
  getSubmissions,
  gradeSubmission,
  submitAssignment,
  updateAssignment,
  streamAssignmentAttachment,
} from "../controllers/assignment.controller.js";

import {
  authorizeRoles,
  isLoggedIn,
} from "../middlewares/auth.middleware.js";

import AppError from "../utils/AppError.js";

const router = Router();

const MANAGERS = ["ADMIN", "TEACHER"];

// Authentication for every assignment route
router.use(isLoggedIn);

/* -------------------------------------------------------------------------- */
/* File Upload                                                                */
/* -------------------------------------------------------------------------- */

const upload = multer({
  dest: "uploads/",

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Unsupported executable files
    if (ext === ".exe") {
      return cb(new AppError("Unsupported file type", 400));
    }

    cb(null, true);
  },
});

/* -------------------------------------------------------------------------- */
/* Assignment Management                                                      */
/* -------------------------------------------------------------------------- */

// List assignments
// GET /api/v1/assignments
// GET /api/v1/assignments?courseId=...
router
  .route("/")
  .get(getAssignments)
  .post(
    authorizeRoles(...MANAGERS),
    upload.array("attachments", 5),
    createAssignment
  );

/* -------------------------------------------------------------------------- */
/* Assignment Attachment                                                     */
/* -------------------------------------------------------------------------- */

// GET /api/v1/assignments/:id/attachments/:fileId
router.get(
  "/:id/attachments/:fileId",
  streamAssignmentAttachment
);

/* -------------------------------------------------------------------------- */
/* Update / Delete Assignment                                                 */
/* -------------------------------------------------------------------------- */

router
  .route("/:id")
  .get(getAssignmentById)
  .put(
    authorizeRoles(...MANAGERS),
    upload.array("attachments", 5),
    updateAssignment
  )
  .delete(
    authorizeRoles(...MANAGERS),
    deleteAssignment
  );

/* -------------------------------------------------------------------------- */
/* Student Submission                                                         */
/* -------------------------------------------------------------------------- */

// Student submits text + Google Drive link
router.post(
  "/:id/submit",
  upload.array("files", 3),
  submitAssignment
);

// Student requests resubmission
router.post(
  "/:id/request-resubmit",
  requestResubmit
);

// Student's own submission
router.get(
  "/:id/my-submission",
  getMySubmission
);

/* -------------------------------------------------------------------------- */
/* Teacher / Admin Submissions                                                */
/* -------------------------------------------------------------------------- */

// View all student submissions
router.get(
  "/:id/submissions",
  authorizeRoles(...MANAGERS),
  getSubmissions
);

// Grade submission
router.put(
  "/submissions/:submissionId/grade",
  authorizeRoles(...MANAGERS),
  gradeSubmission
);

// Allow resubmission
router.put(
  "/submissions/:submissionId/allow-resubmit",
  allowResubmit
);

export default router;