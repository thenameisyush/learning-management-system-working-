import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A student's access to one course.
 * Kept separate from the Razorpay subscription so per-course access
 * (manual, free, or paid later) can coexist with the platform subscription.
 */
const enrollmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'pending', 'revoked'],
      default: 'active',
    },
    enrolledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One enrollment per student per course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.models.Enrollment ||
  mongoose.model('Enrollment', enrollmentSchema);
