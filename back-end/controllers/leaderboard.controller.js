import mongoose from "mongoose";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import {
  hasCourseAccess,
  isCourseManager,
} from "../utils/courseAccess.js";
import {
  computeCourseLeaderboard,
  findEntry,
} from "../utils/leaderboard.js";

const TOP_N = 10;

const toRow = (entry, student) => ({
  rank: entry.rank,

  student: student
    ? {
        _id: student._id,
        fullName: student.fullName,
      }
    : {
        _id: entry.student,
        fullName: "Unknown student",
      },

  points: entry.points,
  accuracy: entry.accuracy,
  quizCount: entry.quizCount,
});

export const getCourseLeaderboard = asyncHandler(
  async (req, res, next) => {
    const { courseId } = req.params;

    // ---------------------------------------------------------
    // Validate course ID
    // ---------------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return next(
        new AppError("Invalid course id", 400)
      );
    }

    // ---------------------------------------------------------
    // Find course
    // ---------------------------------------------------------
    const course = await Course.findById(courseId).select(
      "title instructor"
    );

    if (!course) {
      return next(
        new AppError("Course not found", 404)
      );
    }

    // ---------------------------------------------------------
    // Check course access
    //
    // Manager:
    //    ADMIN / course teacher
    //
    // Student:
    //    Must have access to the course
    // ---------------------------------------------------------
    const manager = isCourseManager(
      req.user,
      course
    );

    if (
      !manager &&
      !(await hasCourseAccess(req.user, course))
    ) {
      return next(
        new AppError(
          "You do not have access to this course",
          403
        )
      );
    }

    // ---------------------------------------------------------
    // Calculate complete leaderboard
    // ---------------------------------------------------------
    const ranked =
      await computeCourseLeaderboard(courseId);

    // ---------------------------------------------------------
    // Only top 10 are displayed
    // ---------------------------------------------------------
    const top = ranked.slice(0, TOP_N);

    // ---------------------------------------------------------
    // Find current student's position
    //
    // Managers don't need a personal rank.
    // ---------------------------------------------------------
    const myEntry = manager
      ? null
      : findEntry(
          ranked,
          req.user.id
        );

    // ---------------------------------------------------------
    // We need student names for:
    // - Top 10
    // - Current student's position
    // ---------------------------------------------------------
    const studentIds = top.map(
      (entry) => entry.student
    );

    if (
      myEntry &&
      !studentIds.some(
        (id) =>
          String(id) ===
          String(myEntry.student)
      )
    ) {
      studentIds.push(myEntry.student);
    }

    // ---------------------------------------------------------
    // Fetch student names
    // ---------------------------------------------------------
    const students = await User.find({
      _id: {
        $in: studentIds,
      },
    }).select("fullName");

    const byId = new Map(
      students.map((student) => [
        String(student._id),
        student,
      ])
    );

    // ---------------------------------------------------------
    // Response
    // ---------------------------------------------------------
    res.status(200).json({
      success: true,

      totalParticipants:
        ranked.length,

      top10: top.map((entry) =>
        toRow(
          entry,
          byId.get(
            String(entry.student)
          )
        )
      ),

      me: myEntry
        ? toRow(
            myEntry,
            byId.get(
              String(myEntry.student)
            )
          )
        : null,
    });
  }
);