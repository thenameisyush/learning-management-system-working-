
import mongoose from "mongoose";

import Attendance from "../models/attendance.model.js";
import CourseAttendance from "../models/CourseAttendance.js";
import Course from "../models/course.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";

import {
  hasCourseAccess,
  isCourseManager,
} from "../utils/courseAccess.js";

// Get the authenticated user's ID regardless of which property
// the authentication middleware uses.
const getUserId = (user) => {
  const id = user?._id ?? user?.id ?? user?.userId;

  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    throw new AppError(
      "User ID missing from authentication. Check auth middleware.",
      401
    );
  }

  return id;
};

// Current date in India Standard Time.
const getTodayIST = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

// Validate and load course.
const loadAttendanceCourse = async (courseId) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError("Invalid course ID", 400);
  }

  const course = await Course.findById(courseId);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  return course;
};

// POST /api/v1/attendance/course/:courseId/mark
export const markCourseAttendance = asyncHandler(
  async (req, res) => {
    const course = await loadAttendanceCourse(
      req.params.courseId
    );

    const user = req.user;

    // Admin visits must never create attendance.
    if (user?.role === "ADMIN") {
      return res.status(200).json({
        success: true,
        message: "Admin attendance is not recorded",
      });
    }

    const userId = getUserId(user);

    const manager = isCourseManager(user, course);
    const allowed =
      manager || (await hasCourseAccess(user, course));

    if (!allowed) {
      throw new AppError(
        "You do not have access to this course",
        403
      );
    }

    const date = getTodayIST();

    try {
      await CourseAttendance.findOneAndUpdate(
        {
          user: userId,
          course: course._id,
          date,
        },
        {
          $setOnInsert: {
            user: userId,
            course: course._id,
            date,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {
      // Allow simultaneous requests for the same daily record.
      if (error.code !== 11000) {
        throw error;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Course attendance recorded or already marked",
      date,
    });
  }
);

// GET /api/v1/attendance/course/:courseId
// Query parameters: type, date, search
export const getCourseAttendance = asyncHandler(
  async (req, res) => {
    const course = await loadAttendanceCourse(
      req.params.courseId
    );

    const user = req.user;
    const userId = getUserId(user);

    const type = req.query.type || "students";
    const date = req.query.date;
    const search = String(req.query.search || "").trim();

    const manager = isCourseManager(user, course);
    const allowed =
      manager || (await hasCourseAccess(user, course));

    if (!allowed) {
      throw new AppError(
        "You do not have access to this course",
        403
      );
    }

    // Validate the date and ensure it is a real calendar date.
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new AppError(
          "Invalid attendance date. Use YYYY-MM-DD.",
          400
        );
      }

      const parsed = new Date(`${date}T00:00:00.000Z`);

      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date
      ) {
        throw new AppError("Invalid attendance date", 400);
      }
    }

    const filter = {
      course: course._id,
    };

    const isAdmin = user.role === "ADMIN";
    const isTeacher = user.role === "TEACHER";

    if (isAdmin || isTeacher) {
      // A teacher may only manage their assigned course.
      if (!manager) {
        throw new AppError(
          "You can only view attendance for your assigned course",
          403
        );
      }

      if (type === "teacher") {
        if (search) {
          throw new AppError(
            "Student search is only available in Student Attendance",
            400
          );
        }

        if (!course.instructor) {
          return res.status(200).json({
            success: true,
            data: [],
          });
        }

        filter.user = course.instructor;
      } else if (type !== "students") {
        throw new AppError("Invalid attendance type", 400);
      }
    } else {
      // Students can only view their own course attendance.
      if (type !== "mine" && type !== "students") {
        throw new AppError("Invalid attendance type", 400);
      }

      if (search) {
        throw new AppError(
          "Student search is only available to course managers",
          403
        );
      }

      filter.user = userId;
    }

    // A student-name search returns the student's full history
    // for this course. Without search, apply the date filter.
    if (date && !search) {
      filter.date = date;
    }

    let records = await CourseAttendance.find(filter)
      .populate("user", "fullName email role")
      .sort({ date: -1 });

    // Student Attendance tab must not include teacher/admin records.
    if (manager && type === "students") {
      records = records.filter(
        (record) => record.user?.role === "USER"
      );

      if (search) {
        const query = search.toLocaleLowerCase();

        records = records.filter((record) => {
          const name = record.user?.fullName || "";
          const email = record.user?.email || "";

          return (
            name.toLocaleLowerCase().includes(query) ||
            email.toLocaleLowerCase().includes(query)
          );
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: records,
    });
  }
);

// POST /api/v1/attendance/mark
// Existing login-based attendance is preserved.


export const markAttendance = asyncHandler(async (req, res) => {
  const userId = getUserId(req.user);
  const date = getTodayIST();

  const existing = await Attendance.findOne({
    user: userId,
    date: date,
  }).select("_id");

  if (existing) {
    return res.status(200).json({
      success: true,
      marked: false,
      message: "Attendance already marked today",
    });
  }

  try {
    await Attendance.create({
      user: userId,
      date: date,
    });

    return res.status(201).json({
      success: true,
      marked: true,
      message: "Attendance marked successfully",
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(200).json({
        success: true,
        marked: false,
        message: "Attendance already marked today",
      });
    }

    throw error;
  }
});



// GET /api/v1/attendance/all
// Existing My Attendance endpoint is preserved.
export const getAllAttendance = asyncHandler(
  async (req, res) => {
    const userId = getUserId(req.user);

    const ownOnly =
      req.query.mine === "1" || req.user.role !== "ADMIN";

    const filter = ownOnly ? { user: userId } : {};

    const records = await Attendance.find(filter)
      .populate("user", "fullName email")
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      data: records,
    });
  }
);
