import mongoose from "mongoose";

const { Schema } = mongoose;

export const ATTEMPT_STATUSES = ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED"];

// One graded answer. `selectedAnswer` is a number (option index) for MCQ and a
// boolean for TRUE_FALSE, so it is Mixed. null = unanswered.
const gradedAnswerSchema = new Schema(
  {
    question: { type: Schema.Types.ObjectId, required: true },
    selectedAnswer: { type: Schema.Types.Mixed, default: null },
    isCorrect: { type: Boolean, default: false },
    marksObtained: { type: Number, default: 0 },
  },
  { _id: false }
);

// Progress saved while the attempt is running (refresh recovery + late-submit fallback)
const draftAnswerSchema = new Schema(
  {
    question: { type: Schema.Types.ObjectId, required: true },
    selectedAnswer: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const quizAttemptSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    // Denormalised on purpose: the course leaderboard aggregates by course + student
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },

    attemptNumber: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ATTEMPT_STATUSES, default: "IN_PROGRESS" },

    // Server clock. `expiresAt` is fixed at start so later edits to the quiz
    // duration can't move the deadline of a running attempt. null = untimed.
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, default: null },
    submittedAt: Date,
    timeTaken: Number, // seconds

    draftAnswers: { type: [draftAnswerSchema], default: undefined },
    answers: { type: [gradedAnswerSchema], default: undefined },

    score: Number,
    maxScore: Number,
    correctAnswers: Number,
    wrongAnswers: Number,
    unanswered: Number,
    totalQuestions: Number,
    percentage: Number,
    passed: Boolean,
  },
  { timestamps: true }
);

// Attempt numbers are unique per student + quiz (guards concurrent starts)
quizAttemptSchema.index({ student: 1, quiz: 1, attemptNumber: 1 }, { unique: true });

// At most ONE running attempt per student + quiz
quizAttemptSchema.index(
  { student: 1, quiz: 1 },
  { unique: true, partialFilterExpression: { status: "IN_PROGRESS" }, name: "one_active_attempt" }
);

// Leaderboard (Phase 10): aggregate by course + student over finished attempts
quizAttemptSchema.index({ course: 1, student: 1, status: 1 });
quizAttemptSchema.index({ quiz: 1, status: 1 });

export default mongoose.models.QuizAttempt ||
  mongoose.model("QuizAttempt", quizAttemptSchema);
