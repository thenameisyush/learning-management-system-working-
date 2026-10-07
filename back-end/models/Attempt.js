import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // 🔥 FIX (no more 500 error)
    },

    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    answers: [Number],

    score: Number,
    totalMarks: Number,
    percentage: Number,
    timeTaken: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Attempt", attemptSchema);