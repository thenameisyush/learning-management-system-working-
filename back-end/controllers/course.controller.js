import fs from 'fs/promises';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';

import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import Course from '../models/course.model.js';
import AppError from '../utils/AppError.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A lecture "has video" only when a Cloudinary URL is stored (video is optional). */
const lectureHasVideo = (lecture) => Boolean(lecture?.lecture?.secure_url);

/** Remove ONLY the temp file multer created for this request (never wipe the folder). */
const removeTempFile = async (file) => {
  if (!file?.path) return;
  try {
    await fs.rm(file.path, { force: true });
  } catch (err) {
    console.error('Temp file cleanup failed:', err.message);
  }
};

const assertValidObjectId = (id, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
};

const parsePrice = (value) => {
  if (value === undefined || value === null || value === '') return undefined;

  const n = Number(value);

  if (Number.isNaN(n) || n < 0) {
    throw new AppError('Price must be a non-negative number', 400);
  }

  return n;
};

const uploadThumbnail = async (file) => {
  try {
    return await cloudinary.v2.uploader.upload(file.path, {
      folder: 'lms',
    });
  } catch (error) {
    console.error('Cloudinary thumbnail upload failed:', error);

    throw new AppError(
      'Thumbnail upload failed, please try again',
      400
    );
  } finally {
    await removeTempFile(file);
  }
};

const syncLectureCounters = (course) => {
  course.numberOfLectures = course.lectures.length;

  course.numberOfVideos =
    course.lectures.filter(lectureHasVideo).length;
};

/**
 * @ALL_COURSES
 */
export const getAllCourses = asyncHandler(async (_req, res) => {
  const courses = await Course.find({}).select('-lectures');

  res.status(200).json({
    success: true,
    message: 'All courses',
    courses,
  });
});

/**
 * @CREATE_COURSE
 * Video is NOT part of course creation.
 * Videos are added later as lectures.
 * A lecture may also exist without a video.
 */
export const createCourse = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    category,
    createdBy,
    duration,
  } = req.body;

 

  if (!title || !description || !category || !createdBy) {
    await removeTempFile(req.file);

    return next(
      new AppError(
        'Title, description, category and instructor are required',
        400
      )
    );
  }

  let price;

  try {
    price = parsePrice(req.body.price);
  } catch (err) {
    await removeTempFile(req.file);
    return next(err);
  }

  let thumbnail;

  if (req.file) {
    const result = await uploadThumbnail(req.file);

    thumbnail = {
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  }

  const course = await Course.create({
    title,
    description,
    category,
    createdBy,
    duration,
    ...(price !== undefined && { price }),
    ...(thumbnail && { thumbnail }),
    instructor:
  req.user?.role === "ADMIN" && req.body?.instructorId
    ? req.body.instructorId
    : req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    course,
  });
});

/**
 * @GET_LECTURES_BY_COURSE_ID
 */
export const getLecturesByCourseId = asyncHandler(
  async (req, res, next) => {
    const { id } = req.params;

    assertValidObjectId(id, 'course id');

    const course = await Course.findById(id).populate({
      path: 'lectures.quizId',
      model: 'Quiz',
      select: 'title durationMinutes totalMarks isPublished',
    });

    if (!course) {
      return next(
        new AppError(
          'Invalid course id or course not found.',
          404
        )
      );
    }

    const lectures = course.lectures.map((lecture) => ({
      ...lecture.toObject(),
      hasVideo: lectureHasVideo(lecture),
    }));

    res.status(200).json({
      success: true,
      message: 'Course lectures fetched successfully',
      lectures,
      course: {
        _id: course._id,
        title: course.title,
        numberOfLectures: course.lectures.length,
        numberOfVideos: lectures.filter(
          (lecture) => lecture.hasVideo
        ).length,
      },
    });
  }
);

/**
 * @ADD_LECTURE
 * Video file is OPTIONAL.
 */
export const addLectureToCourseById = asyncHandler(
  async (req, res, next) => {
    const { title, description } = req.body;
    const { id } = req.params;

    if (!title || !description) {
      await removeTempFile(req.file);

      return next(
        new AppError(
          'Title and Description are required',
          400
        )
      );
    }

    assertValidObjectId(id, 'course id');

    const course = await Course.findById(id);

    if (!course) {
      await removeTempFile(req.file);

      return next(
        new AppError(
          'Invalid course id or course not found.',
          404
        )
      );
    }

    let lectureData;

    if (req.file) {
      if (!req.file.mimetype?.startsWith('video/')) {
        await removeTempFile(req.file);

        return next(
          new AppError(
            'Lecture file must be a video',
            400
          )
        );
      }

      try {
        const result =
          await cloudinary.v2.uploader.upload(
            req.file.path,
            {
              folder: 'lms',
              chunk_size: 50000000,
              resource_type: 'video',
            }
          );

        lectureData = {
          public_id: result.public_id,
          secure_url: result.secure_url,
        };
      } catch (error) {
        console.error(
          'Cloudinary video upload failed:',
          error
        );

        return next(
          new AppError(
            'Video upload failed, please try again',
            400
          )
        );
      } finally {
        await removeTempFile(req.file);
      }
    }

    course.lectures.push({
      title,
      description,
      ...(lectureData && {
        lecture: lectureData,
      }),
      quizId: null,
    });

    syncLectureCounters(course);

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course lecture added successfully',
      course,
    });
  }
);

/**
 * @REMOVE_LECTURE
 */
export const removeLectureFromCourse = asyncHandler(
  async (req, res, next) => {
    const { courseId, lectureId } = req.query;

    if (!courseId || !lectureId) {
      return next(
        new AppError(
          'Course ID and Lecture ID are required',
          400
        )
      );
    }

    assertValidObjectId(courseId, 'course id');
    assertValidObjectId(lectureId, 'lecture id');

    const course = await Course.findById(courseId);

    if (!course) {
      return next(
        new AppError(
          'Invalid ID or Course does not exist.',
          404
        )
      );
    }

    const lectureIndex =
      course.lectures.findIndex(
        (lecture) =>
          lecture._id.toString() ===
          lectureId.toString()
      );

    if (lectureIndex === -1) {
      return next(
        new AppError(
          'Lecture does not exist.',
          404
        )
      );
    }

    const publicId =
      course.lectures[lectureIndex]
        .lecture?.public_id;

    if (publicId) {
      try {
        await cloudinary.v2.uploader.destroy(
          publicId,
          {
            resource_type: 'video',
          }
        );
      } catch (error) {
        console.error(
          'Cloudinary video delete failed:',
          publicId,
          error
        );
      }
    }

    course.lectures.splice(
      lectureIndex,
      1
    );

    syncLectureCounters(course);

    await course.save();

    res.status(200).json({
      success: true,
      message:
        'Course lecture removed successfully',
    });
  }
);

/**
 * @UPDATE_COURSE
 */
export const updateCourseById = asyncHandler(
  async (req, res, next) => {
    const { id } = req.params;

    assertValidObjectId(id, 'course id');

    const course =
      await Course.findById(id);

    if (!course) {
      await removeTempFile(req.file);

      return next(
        new AppError(
          'Invalid course id or course not found.',
          404
        )
      );
    }

    for (const field of [
      'title',
      'description',
      'category',
      'createdBy',
      'duration',
    ]) {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    }

    try {
      const price =
        parsePrice(req.body.price);

      if (price !== undefined) {
        course.price = price;
      }
    } catch (err) {
      await removeTempFile(req.file);
      return next(err);
    }

    if (req.file) {
      const result =
        await uploadThumbnail(req.file);

      const oldPublicId =
        course.thumbnail?.public_id;

      course.thumbnail = {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };

      if (oldPublicId) {
        cloudinary.v2.uploader
          .destroy(oldPublicId)
          .catch((e) =>
            console.error(
              'Old thumbnail delete failed:',
              e
            )
          );
      }
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  }
);

/**
 * @DELETE_COURSE
 */
export const deleteCourseById = asyncHandler(
  async (req, res, next) => {
    const { id } = req.params;

    assertValidObjectId(id, 'course id');

    const course =
      await Course.findById(id);

    if (!course) {
      return next(
        new AppError(
          'Course with given id does not exist.',
          404
        )
      );
    }

    const cleanups = [];

    if (course.thumbnail?.public_id) {
      cleanups.push(
        cloudinary.v2.uploader.destroy(
          course.thumbnail.public_id
        )
      );
    }

    for (const lecture of course.lectures) {
      if (lecture.lecture?.public_id) {
        cleanups.push(
          cloudinary.v2.uploader.destroy(
            lecture.lecture.public_id,
            {
              resource_type: 'video',
            }
          )
        );
      }
    }

    const outcomes =
      await Promise.allSettled(cleanups);

    outcomes
      .filter(
        (outcome) =>
          outcome.status === 'rejected'
      )
      .forEach((outcome) =>
        console.error(
          'Cloudinary cleanup failed:',
          outcome.reason
        )
      );

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  }
);