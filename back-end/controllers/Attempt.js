import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  },
  { timestamps: true }
);

export default mongoose.model("Attempt", attemptSchema);