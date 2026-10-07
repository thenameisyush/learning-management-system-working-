import { Router } from 'express';

import {
  createQuiz,
  deleteQuiz,
  getAllQuizzes,
  getMyAttempts,
  getQuizAttempts,
  getQuizById,
  getQuizStats,
  publishQuiz,
  saveProgress,
  startQuiz,
  submitQuiz,
  unpublishQuiz,
  updateQuiz,
} from '../controllers/quiz.controller.js';
import { authorizeRoles, isLoggedIn } from '../middlewares/auth.middleware.js';

const router = Router();

// EVERY quiz route needs a logged-in user. Fine-grained rules (course access,
// ownership, draft visibility) are enforced in the controller.
router.use(isLoggedIn);

const MANAGERS = ['ADMIN', 'TEACHER'];

router
  .route('/')
  .get(getAllQuizzes)
  .post(authorizeRoles(...MANAGERS), createQuiz);

// Taking a quiz
router.post('/:id/start', startQuiz);
router.post('/:id/save-progress', saveProgress);
router.post('/:id/submit', submitQuiz);
router.get('/:id/my-attempts', getMyAttempts);

// The old endpoint trusted a score computed in the browser. It is gone.
router.post('/:id/attempt', (_req, res) =>
  res.status(410).json({
    success: false,
    message: 'This endpoint was removed. Use POST /quizzes/:id/start and POST /quizzes/:id/submit.',
  })
);

// Managing a quiz (admin / owning teacher - checked in the controller)
router.get('/:id/attempts', authorizeRoles(...MANAGERS), getQuizAttempts);
router.get('/:id/stats', authorizeRoles(...MANAGERS), getQuizStats);
router.post('/:id/publish', authorizeRoles(...MANAGERS), publishQuiz);
router.post('/:id/unpublish', authorizeRoles(...MANAGERS), unpublishQuiz);

router
  .route('/:id')
  .get(getQuizById)
  .put(authorizeRoles(...MANAGERS), updateQuiz)
  .delete(authorizeRoles(...MANAGERS), deleteQuiz);

export default router;
