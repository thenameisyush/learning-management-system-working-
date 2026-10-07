import mongoose from "mongoose";

import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import Course from "../models/course.model.js";
import Note from "../models/Note.js";
import AppError from "../utils/AppError.js";
import {
  hasCourseAccess,
  isCourseManager,
} from "../utils/courseAccess.js";

const assertObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
};

const isValidDriveUrl = (url) => {
  if (!url) return false;

  try {
    const parsed = new URL(url);

    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "drive.google.com" ||
        parsed.hostname === "docs.google.com")
    );
  } catch {
    return false;
  }
};

const loadCourse = async (courseId) => {
  assertObjectId(courseId, "course id");

  const course = await Course.findById(courseId);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  return course;
};

const toClientNote = (note) => {
  const n =
    typeof note?.toObject === "function"
      ? note.toObject()
      : note;

  return {
    _id: n._id,
    title: n.title,
    description: n.description,
    course: n.course,
    uploadedBy: n.uploadedBy,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    driveUrl: n.driveUrl,
  };
};

/**
 * POST /api/v1/notes
 */
export const createNote = asyncHandler(
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        courseId,
        driveUrl,
      } = req.body;

      if (!title?.trim() || !courseId || !driveUrl?.trim()) {
        throw new AppError(
          "Title, course and Google Drive link are required",
          400
        );
      }

      if (!isValidDriveUrl(driveUrl.trim())) {
        throw new AppError(
          "Please provide a valid Google Drive link",
          400
        );
      }

      const course = await loadCourse(courseId);

      if (!isCourseManager(req.user, course)) {
        throw new AppError(
          "You can only add notes to your own courses",
          403
        );
      }

      const note = await Note.create({
        title: title.trim(),
        description: description?.trim() || "",
        course: courseId,
        uploadedBy: req.user._id,
        driveUrl: driveUrl.trim(),
      });

      return res.status(201).json({
        success: true,
        message: "Note created successfully",
        note: toClientNote(note),
      });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/v1/notes?courseId=...
 */
export const getNotes = asyncHandler(
  async (req, res, next) => {
    const course = await loadCourse(
      req.query.courseId
    );

    if (
      !(await hasCourseAccess(req.user, course))
    ) {
      return next(
        new AppError(
          "You do not have access to this course",
          403
        )
      );
    }

    const notes = await Note.find({
      course: course._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      notes: notes.map(toClientNote),
      canManage: isCourseManager(
        req.user,
        course
      ),
    });
  }
);

/**
 * GET /api/v1/notes/:id
 */
export const getNoteById = asyncHandler(
  async (req, res, next) => {
    assertObjectId(req.params.id, "note id");

    const note = await Note.findById(
      req.params.id
    );

    if (!note) {
      return next(
        new AppError("Note not found", 404)
      );
    }

    const course = await loadCourse(note.course);

    if (
      !(await hasCourseAccess(req.user, course))
    ) {
      return next(
        new AppError(
          "You do not have access to this course",
          403
        )
      );
    }

    return res.status(200).json({
      success: true,
      note: toClientNote(note),
      canManage: isCourseManager(
        req.user,
        course
      ),
    });
  }
);

/**
 * PUT /api/v1/notes/:id
 */
export const updateNote = asyncHandler(
  async (req, res, next) => {
    assertObjectId(req.params.id, "note id");

    const note = await Note.findById(
      req.params.id
    );

    if (!note) {
      return next(
        new AppError("Note not found", 404)
      );
    }

    const course = await loadCourse(note.course);

    if (!isCourseManager(req.user, course)) {
      return next(
        new AppError(
          "You can only edit notes of your own courses",
          403
        )
      );
    }

    const {
      title,
      description,
      driveUrl,
    } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return next(
          new AppError(
            "Title cannot be empty",
            400
          )
        );
      }

      note.title = title.trim();
    }

    if (description !== undefined) {
      note.description = description.trim();
    }

    if (driveUrl !== undefined) {
      if (!driveUrl.trim()) {
        return next(
          new AppError(
            "Google Drive link cannot be empty",
            400
          )
        );
      }

      if (!isValidDriveUrl(driveUrl.trim())) {
        return next(
          new AppError(
            "Please provide a valid Google Drive link",
            400
          )
        );
      }

      note.driveUrl = driveUrl.trim();
    }

    await note.save();

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      note: toClientNote(note),
    });
  }
);

/**
 * DELETE /api/v1/notes/:id
 */
export const deleteNote = asyncHandler(
  async (req, res, next) => {
    assertObjectId(req.params.id, "note id");

    const note = await Note.findById(
      req.params.id
    );

    if (!note) {
      return next(
        new AppError("Note not found", 404)
      );
    }

    const course = await loadCourse(note.course);

    if (!isCourseManager(req.user, course)) {
      return next(
        new AppError(
          "You can only delete notes of your own courses",
          403
        )
      );
    }

    await note.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  }
);