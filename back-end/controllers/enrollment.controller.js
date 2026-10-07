import mongoose from 'mongoose';

import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import { isCourseManager } from '../utils/courseAccess.js';

const loadManagedCourse = async (courseId, user) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError('Invalid course id', 400);
  }
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (!isCourseManager(user, course)) {
    throw new AppError('You can only manage enrollments of your own courses', 403);
  }
  return course;
};

/** POST /api/v1/enrollments  { courseId, email }  (ADMIN | owning TEACHER) */
export const enrollStudent = asyncHandler(async (req, res, next) => {
  const { courseId, email } = req.body;
  if (!courseId || !email) {
    return next(new AppError('courseId and student email are required', 400));
  }

  const course = await loadManagedCourse(courseId, req.user);

  const student = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!student) return next(new AppError('No user found with that email', 404));
  if (student.role !== 'USER') {
    return next(new AppError('Only student accounts can be enrolled', 400));
  }

  const existing = await Enrollment.findOne({ user: student._id, course: course._id });
  if (existing?.status === 'active') {
    return next(new AppError('Student is already enrolled in this course', 409));
  }

  const enrollment = existing
    ? Object.assign(existing, { status: 'active', enrolledBy: req.user.id })
    : new Enrollment({ user: student._id, course: course._id, enrolledBy: req.user.id });
  await enrollment.save();

  res.status(201).json({
    success: true,
    message: 'Student enrolled successfully',
    enrollment,
  });
});

/** GET /api/v1/enrollments/course/:courseId  (ADMIN | owning TEACHER) */
export const listCourseEnrollments = asyncHandler(async (req, res) => {
  const course = await loadManagedCourse(req.params.courseId, req.user);

  const enrollments = await Enrollment.find({ course: course._id, status: 'active' })
    .populate('user', 'fullName email avatar.secure_url')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, enrollments });
});

/** DELETE /api/v1/enrollments/:id  (ADMIN | owning TEACHER) */
export const removeEnrollment = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid enrollment id', 400));
  }
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) return next(new AppError('Enrollment not found', 404));

  await loadManagedCourse(enrollment.course, req.user);
  await enrollment.deleteOne();

  res.status(200).json({ success: true, message: 'Enrollment removed' });
});

/** GET /api/v1/enrollments/mine  (any logged-in user) */
export const myEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user.id, status: 'active' })
    .populate('course', '-lectures')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, enrollments });
});
