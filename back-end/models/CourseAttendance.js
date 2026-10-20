import mongoose from "mongoose";

const courseAttendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

courseAttendanceSchema.index(
  { user: 1, course: 1, date: 1 },
  { unique: true }
);

export default mongoose.models.CourseAttendance ||
  mongoose.model("CourseAttendance", courseAttendanceSchema);