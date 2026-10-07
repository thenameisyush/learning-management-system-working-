/**
 * Calculate leaderboard for one course.
 *
 * Rules:
 * - Only SUBMITTED / AUTO_SUBMITTED attempts count.
 * - If a student attempts the same quiz multiple times,
 *   only the best score is counted.
 * - Students are ranked by:
 *      1. Total points
 *      2. Accuracy
 *      3. Less time taken
 *
 * Returns:
 * [
 *   {
 *     student,
 *     points,
 *     accuracy,
 *     quizCount,
 *     timeTaken,
 *     rank
 *   }
 * ]
 */


import mongoose from "mongoose";
import QuizAttempt from "../models/QuizAttempt.js"; 



export const computeCourseLeaderboard = async (courseId) => {
    const courseObjectId = new mongoose.Types.ObjectId(courseId);
  const rows = await QuizAttempt.aggregate([
    // ---------------------------------------------------------
    // 1. Only finished attempts from this course
    // ---------------------------------------------------------
    {
      $match: {
        course: courseObjectId,
        status: {
          $in: ["SUBMITTED", "AUTO_SUBMITTED"],
        },
      },
    },

    // ---------------------------------------------------------
    // 2. Best attempt for the same student + same quiz
    //
    // Because attempts are sorted by score first, $first
    // gives us the highest scoring attempt.
    // If scores are equal, earlier submission wins.
    // ---------------------------------------------------------
    {
      $sort: {
        student: 1,
        quiz: 1,
        score: -1,
        submittedAt: 1,
      },
    },

    {
      $group: {
        _id: {
          student: "$student",
          quiz: "$quiz",
        },
        score: { $first: "$score" },
        maxScore: { $first: "$maxScore" },
        correctAnswers: { $first: "$correctAnswers" },
        totalQuestions: { $first: "$totalQuestions" },
        timeTaken: { $first: "$timeTaken" },
      },
    },

    // ---------------------------------------------------------
    // 3. Combine all quizzes for each student
    // ---------------------------------------------------------
    {
      $group: {
        _id: "$_id.student",

        points: {
          $sum: {
            $ifNull: ["$score", 0],
          },
        },

        maxPoints: {
          $sum: {
            $ifNull: ["$maxScore", 0],
          },
        },

        correctAnswers: {
          $sum: {
            $ifNull: ["$correctAnswers", 0],
          },
        },

        totalQuestions: {
          $sum: {
            $ifNull: ["$totalQuestions", 0],
          },
        },

        timeTaken: {
          $sum: {
            $ifNull: ["$timeTaken", 0],
          },
        },

        quizCount: {
          $sum: 1,
        },
      },
    },

    // ---------------------------------------------------------
    // 4. Calculate accuracy
    // ---------------------------------------------------------
    {
      $addFields: {
        accuracy: {
          $cond: [
            { $gt: ["$totalQuestions", 0] },
            {
              $multiply: [
                {
                  $divide: [
                    "$correctAnswers",
                    "$totalQuestions",
                  ],
                },
                100,
              ],
            },
            0,
          ],
        },
      },
    },

    // ---------------------------------------------------------
    // 5. Sort students
    //
    // Highest points first
    // Then highest accuracy
    // Then lowest time
    // ---------------------------------------------------------
    {
      $sort: {
        points: -1,
        accuracy: -1,
        timeTaken: 1,
      },
    },

    // ---------------------------------------------------------
    // 6. Convert MongoDB document to leaderboard row
    // ---------------------------------------------------------
    {
      $project: {
        _id: 0,
        student: "$_id",
        points: 1,
        accuracy: {
          $round: ["$accuracy", 2],
        },
        quizCount: 1,
        timeTaken: 1,
      },
    },
  ]);

  // -----------------------------------------------------------
  // 7. Add rank
  // -----------------------------------------------------------
  return rows.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

/**
 * Find one student's leaderboard entry.
 */
export const findEntry = (ranked, studentId) => {
  return (
    ranked.find(
      (entry) =>
        String(entry.student) === String(studentId)
    ) || null
  );
};