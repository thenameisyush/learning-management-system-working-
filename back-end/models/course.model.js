import { model, Schema } from 'mongoose';

const lectureSchema = new Schema({
  title: String,

  description: String,

  lecture: {
    public_id: {
      type: String,
      required: false,
    },
    secure_url: {
      type: String,
      required: false,
    },
  },

  // 🔥🔥🔥 MOST IMPORTANT FIX
  quizId: {
    type: Schema.Types.ObjectId,
    ref: "Quiz",
    default: null,
  },
});

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      minlength: [8, 'Title must be atleast 8 characters'],
      maxlength: [50, 'Title cannot be more than 50 characters'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be atleast 20 characters long'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
    },

    // 🔥 UPDATED LECTURES STRUCTURE
    lectures: [lectureSchema],

    thumbnail: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },

    numberOfLectures: {
      type: Number,
      default: 0,
    },

    numberOfVideos: {
  type: Number,
  default: 0,
},

    createdBy: {
      type: String,
      required: [true, 'Course instructor name is required'],
    },
    instructor: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: true,
},
  },
  {
    timestamps: true,
  }
);

const Course = model('Course', courseSchema);

export default Course;