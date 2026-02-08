import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['student', 'teacher', 'hod'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['present', 'absent'],
      default: 'absent',
    },
    markedBy: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Marked by is required'],
      // Can be ObjectId (for HOD/Teacher) or String 'admin' (for admin)
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['BCA', 'BCom', 'BA'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance entries
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;


