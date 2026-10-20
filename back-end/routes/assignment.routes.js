import { Router } from 'express';

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
} from '../controllers/assignment.controller.js';

import {
  authorizeRoles,
  isLoggedIn,
} from '../middlewares/auth.middleware.js';

import AppError from '../utils/AppError.js';

const router = Router();

const MANAGERS = ['ADMIN', 'TEACHER'];

// Authentication for all assignment routes
router.use(isLoggedIn);

// Direct file uploads are disabled.
// Assignments and submissions use Google Drive links.
const rejectDirectFileUploads = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return next(
      new AppError(
        'Direct file uploads are disabled. Please provide a Google Drive link instead.',
        400
      )
    );
  }

  return next();
};

// List and create assignments
router
  .route('/')
  .get(getAssignments)
  .post(
    rejectDirectFileUploads,
    authorizeRoles(...MANAGERS),
    createAssignment
  );

// Get, update and delete an assignment
router
  .route('/:id')
  .get(getAssignmentById)
  .put(
    rejectDirectFileUploads,
    authorizeRoles(...MANAGERS),
    updateAssignment
  )
  .delete(
    authorizeRoles(...MANAGERS),
    deleteAssignment
  );

// Student submission: text and/or Google Drive link
router.post(
  '/:id/submit',
  rejectDirectFileUploads,
  submitAssignment
);

// Resubmission requests
router.post(
  '/:id/request-resubmit',
  requestResubmit
);

// Current student's submission
router.get(
  '/:id/my-submission',
  getMySubmission
);

// Teacher/admin views submissions
router.get(
  '/:id/submissions',
  authorizeRoles(...MANAGERS),
  getSubmissions
);

// Grade a submission
router.put(
  '/submissions/:submissionId/grade',
  authorizeRoles(...MANAGERS),
  gradeSubmission
);

// Allow resubmission
router.put(
  '/submissions/:submissionId/allow-resubmit',
  allowResubmit
);

export default router;