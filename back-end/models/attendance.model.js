import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // yeh User collection se linked hai
    required: true,
  },
  date: {
    type: String, // aap date ko String ya Date dono kar sakte ho, yeh aapka choice hai
    required: true,
  },
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
