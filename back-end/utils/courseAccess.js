import Course from '../models/course.model.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/user.model.js';

/**
 * Today the platform sells ONE Razorpay subscription that unlocks every course.
 * Keep that behaviour by default. To move to strictly per-course access later,
 * set SUBSCRIPTION_GRANTS_ALL_COURSES=false in .env - nothing else changes.
 */
const subscriptionGrantsAll = () =>
  process.env.SUBSCRIPTION_GRANTS_ALL_COURSES !== 'false';

/**
 * Admin, or the teacher who owns the course.
 * Can create/edit/delete content.
 */
export const isCourseManager = (user, course) => {
  if (!user || !course) return false;

  if (user.role === 'ADMIN') {
    return true;
  }

  return (
    user.role === 'TEACHER' &&
    Boolean(course.instructor) &&
    String(course.instructor) === String(user.id)
  );
};

/**
 * Can this user VIEW the course content (notes, quizzes, ...)?
 */
export const hasCourseAccess = async (user, course) => {
  if (!user || !course) return false;

  if (isCourseManager(user, course)) {
    return true;
  }

  const enrolled = await Enrollment.exists({
    user: user.id,
    course: course._id,
    status: 'active',
  });

  if (enrolled) {
    return true;
  }

  if (subscriptionGrantsAll()) {
    const dbUser = await User.findById(user.id).select('subscription');

    return dbUser?.subscription?.status === 'active';
  }

  return false;
};

/**
 * Which courses can this user open?
 *
 * Returns:
 * - 'ALL' for admin or active subscriber
 * - array of course IDs otherwise
 */
export const listAccessibleCourseIds = async (user) => {
  if (!user) return [];

  if (user.role === 'ADMIN') {
    return 'ALL';
  }

  if (subscriptionGrantsAll()) {
    const dbUser = await User.findById(user.id).select('subscription');

    if (dbUser?.subscription?.status === 'active') {
      return 'ALL';
    }
  }

  const ids = new Set();

  // Teachers can access their own courses.
  if (user.role === 'TEACHER') {
    const owned = await Course.find({
      instructor: user.id,
    }).select('_id');

    owned.forEach((course) => {
      ids.add(String(course._id));
    });
  }

  // Students can access enrolled courses.
  const enrollments = await Enrollment.find({
    user: user.id,
    status: 'active',
  }).select('course');

  enrollments.forEach((enrollment) => {
    if (enrollment.course) {
      ids.add(String(enrollment.course));
    }
  });

  return [...ids];
};

/**
 * Course IDs this user may MANAGE.
 *
 * Returns:
 * - 'ALL' for admins
 * - owned course IDs for teachers
 * - [] for everyone else
 */
export const listManagedCourseIds = async (user) => {
  if (!user) return [];

  if (user.role === 'ADMIN') {
    return 'ALL';
  }

  if (user.role !== 'TEACHER') {
    return [];
  }

  const owned = await Course.find({
    instructor: user.id,
  }).select('_id');

  return owned.map((course) => String(course._id));
};