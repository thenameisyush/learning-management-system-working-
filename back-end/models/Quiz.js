import mongoose from "mongoose";

const { Schema } = mongoose;

export const QUESTION_TYPES = ["MCQ", "TRUE_FALSE"];
export const QUIZ_STATUSES = ["DRAFT", "PUBLISHED"];

/**
 * Questions keep the ORIGINAL field names (text / options / correctOptionIndex /
 * marks) so existing quizzes keep working unchanged.
 *
 *  - MCQ:        options = 2..6 strings, correctOptionIndex = index of the right one
 *  - TRUE_FALSE: options = ["True", "False"], correctOptionIndex = 0 (True) or 1 (False)
 *
 * The API exposes a friendlier `correctAnswer` (index for MCQ, boolean for
 * TRUE_FALSE) - see utils/quizGrading.js. New question types plug in there.
 */
const questionSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },

  type: {
    type: String,
    enum: QUESTION_TYPES,
    default: "MCQ", // legacy questions have no type -> MCQ
  },

  options: [
    {
      type: String,
      required: true,
    },
  ],

  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
  },

  marks: {
    type: Number,
    default: 1,
    min: 0,
  },
});

const quizSchema = new Schema(
  {
    title: String,
    description: String,
    instructions: { type: String, default: "" },

    questions: [questionSchema],

    // 0 / missing = untimed. (Name kept from the original schema.)
    durationMinutes: { type: Number, min: 0 },

    // Always recomputed from the questions (never trusted from the client)
    totalMarks: Number,
    passingMarks: { type: Number, default: 0, min: 0 },

    /**
     * DRAFT | PUBLISHED. Deliberately NO default: quizzes created before this
     * field existed have no status and fall back to the legacy `isPublished`
     * flag (see utils/quizSerializers.js -> effectiveStatus), so nothing
     * disappears before the optional migration is run.
     */
    status: { type: String, enum: QUIZ_STATUSES },
    publishedAt: Date,
    isPublished: Boolean, // legacy flag, kept in sync with `status`

    // Retry rules. allowRetry=false -> exactly one attempt.
    // allowRetry=true -> maxAttempts attempts (0 = unlimited, must be explicit).
    allowRetry: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1, min: 0 },

    // Students may open the question-by-question review after submitting
    allowReview: { type: Boolean, default: true },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      index: true,
    },
  },
  { timestamps: true }
);

// Keep derived / legacy fields consistent no matter who saves the quiz
quizSchema.pre("validate", function (next) {
  this.totalMarks = (this.questions || []).reduce(
    (sum, q) => sum + (Number(q.marks) || 0),
    0
  );
  if (this.status) this.isPublished = this.status === "PUBLISHED";
  next();
});

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
