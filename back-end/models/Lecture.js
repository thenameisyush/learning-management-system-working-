import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  title: String,
  description: String,

  lecture: {
    public_id: String,
    secure_url: String,
  },

  // 🔥 ADD THIS
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    default: null,
  },
});

export default mongoose.model("Lecture", lectureSchema);