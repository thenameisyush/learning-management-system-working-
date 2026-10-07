import mongoose from "mongoose";

const { Schema } = mongoose;

const AssignmentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    instructions: {
      type: String,
      default: "",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    totalMarks: {
      type: Number,
      default: 100,
    },

    allowLateSubmission: {
      type: Boolean,
      default: true,
    },

    // Teacher/Admin ka assignment material
    // Google Drive par stored hoga.
    driveLink: {
      type: String,
      default: "",
      trim: true,
    },
    attachments: [
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    originalName: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
    public_id: {
  type: String,
  default: "",
},
  },
],

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Assignment ||
  mongoose.model("Assignment", AssignmentSchema);