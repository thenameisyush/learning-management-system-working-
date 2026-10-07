import mongoose from 'mongoose';

import Course from '../models/course.model.js';
import AppError from '../utils/AppError.js';
import { hasCourseAccess } from '../utils/courseAccess.js';

/**
 * Replaces `authorizeSubscribers` on course-content routes.
 * Allows: admin, owning teacher, enrolled student, or (by default) an active
 * subscriber - a superset of the old rule, so nobody loses access.
 */
export const requireCourseAccess =
  (param = 'id') =>
  async (req, _res, next) => {
    try {
      const courseId = req.params[param];
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new AppError('Invalid course id', 400));
      }

      const course = await Course.findById(courseId).select('instructor');
      if (!course) return next(new AppError('Course not found', 404));

      if (!(await hasCourseAccess(req.user, course))) {
        return next(
          new AppError('You do not have access to this course. Please enroll or subscribe.', 403)
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
