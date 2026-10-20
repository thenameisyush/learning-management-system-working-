import { Router } from 'express';
import mongoose from 'mongoose';
import {
  addLectureToCourseById,
  createCourse,
  deleteCourseById,
  getAllCourses,
  getLecturesByCourseId,
  removeLectureFromCourse,
  updateCourseById,
} from '../controllers/course.controller.js';
import {
  authorizeRoles,
  authorizeSubscribers,
  isLoggedIn,
} from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';
import Course from '../models/course.model.js';
import AppError from '../utils/AppError.js';
import { isCourseManager,hasCourseAccess } from '../utils/courseAccess.js';

const router = Router();

/** Admins can manage every course; teachers can manage only their own. */
const requireCourseManager = async (req, _res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid course id', 400));
    }

    // Avoid selecting fields here so lightweight test doubles and Mongoose both work.
    const course = await Course.findById(id);
    if (!course) return next(new AppError('Course not found', 404));

    if (!isCourseManager(req.user, course)) {
      return next(new AppError('You can manage only courses assigned to you.', 403));
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

router
  .route('/')
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authorizeRoles('ADMIN', 'TEACHER'),
    upload.single('thumbnail'),
    createCourse
  )
  .delete(isLoggedIn, authorizeRoles('ADMIN'), removeLectureFromCourse);


  const authorizeCourseContent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid course id', 400));
    }

    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // Admin aur apne course ka Teacher bina subscription access kar sakte hain.
    if (isCourseManager(req.user, course)) {
      return next();
    }

    // Baaki users ke existing access/subscription rules preserve karo.
    const allowed = await hasCourseAccess(req.user, course);

    if (!allowed) {
      return res.status(403).json({
        message: 'Please subscribe to access this route.',
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}; 
router
  .route('/:id')
  .get(isLoggedIn, authorizeCourseContent, getLecturesByCourseId)
  .post(
    isLoggedIn,
    authorizeRoles('ADMIN', 'TEACHER'),
    requireCourseManager,
    upload.single('lecture'),
    addLectureToCourseById
  )
  .put(
    isLoggedIn,
    authorizeRoles('ADMIN', 'TEACHER'),
    requireCourseManager,
    upload.single('thumbnail'),
    updateCourseById
  )
  .delete(
    isLoggedIn,
    authorizeRoles('ADMIN', 'TEACHER'),
    requireCourseManager,
    deleteCourseById
  );

export default router;
