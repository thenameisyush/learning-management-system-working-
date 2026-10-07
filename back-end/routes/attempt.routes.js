import { Router } from 'express';

import { getAttemptById } from '../controllers/quiz.controller.js';
import { isLoggedIn } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(isLoggedIn);

// Owner, or admin / owning teacher of the attempt's course (checked in the controller)
router.get('/:attemptId', getAttemptById);

export default router;
