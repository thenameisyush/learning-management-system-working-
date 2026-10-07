import { Router } from 'express';

import {
  enrollStudent,
  listCourseEnrollments,
  myEnrollments,
  removeEnrollment,
} from '../controllers/enrollment.controller.js';
import { authorizeRoles, isLoggedIn } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(isLoggedIn);

router.get('/mine', myEnrollments);
router.post('/', authorizeRoles('ADMIN', 'TEACHER'), enrollStudent);
router.get('/course/:courseId', authorizeRoles('ADMIN', 'TEACHER'), listCourseEnrollments);
router.delete('/:id', authorizeRoles('ADMIN', 'TEACHER'), removeEnrollment);

export default router;
