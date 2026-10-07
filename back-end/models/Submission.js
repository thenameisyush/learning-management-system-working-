import mongoose from 'mongoose';

const { Schema } = mongoose;

const SubmissionSchema = new Schema(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },

    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    // Student's Google Drive submission link.
    // Actual assignment file is NOT stored in Cloudinary.
    driveLink: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },

    text: {
      type: String,
      trim: true,
      default: '',
      maxlength: 5000,
    },
        driveLink: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },

    // Resubmission workflow
    resubmitRequested: {
      type: Boolean,
      default: false,
    },

    resubmitRequestedAt: {
      type: Date,
      default: null,
    },

    resubmitAllowed: {
      type: Boolean,
      default: false,
    },

    resubmitAllowedAt: {
      type: Date,
      default: null,
    },


    submittedAt: {
      type: Date,
      required: true,
    },

    // Fixed at submit time.
    late: {
      type: Boolean,
      default: false,
    },

    marks: {
      type: Number,
      min: 0,
      default: null,
    },

    feedback: {
      type: String,
      trim: true,
      default: '',
      maxlength: 3000,
    },

    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    gradedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// One submission per student per assignment.
SubmissionSchema.index(
  { assignment: 1, student: 1 },
  { unique: true }
);

SubmissionSchema.index({
  course: 1,
  student: 1,
});


export default mongoose.models.Submission ||
  mongoose.model('Submission', SubmissionSchema);