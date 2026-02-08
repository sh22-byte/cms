import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Mark Attendance
 * @route   POST /api/attendance
 * @access  Private (Teacher, HOD, Admin)
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { userId, date, status } = req.body;

  if (!userId || !date || !status) {
    return res.status(400).json({
      success: false,
      message: 'User ID, date, and status are required',
    });
  }

  if (!['present', 'absent'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be either "present" or "absent"',
    });
  }

  // Get user to get their role and department
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Check permissions
  if (req.userRole !== 'admin' && req.userDepartment !== user.department) {
    return res.status(403).json({
      success: false,
      message: 'You can only mark attendance for users in your department',
    });
  }

  // Check if attendance already marked for this date
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const existingAttendance = await Attendance.findOne({
    userId,
    date: attendanceDate,
  });

  // Determine markedBy value - ObjectId for HOD/Teacher, string 'admin' for admin
  const markedByValue = req.userRole === 'admin' ? 'admin' : req.userId;

  if (existingAttendance) {
    // Update existing attendance
    existingAttendance.status = status;
    existingAttendance.markedBy = markedByValue;
    await existingAttendance.save();

    // Format markedBy in response
    const attendanceObj = existingAttendance.toObject();
    if (attendanceObj.markedBy === 'admin') {
      attendanceObj.markedBy = { _id: 'admin', fullName: 'Admin' };
    } else {
      const markedByUser = await User.findById(attendanceObj.markedBy).select('fullName');
      attendanceObj.markedBy = markedByUser
        ? { _id: markedByUser._id, fullName: markedByUser.fullName }
        : attendanceObj.markedBy;
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      attendance: attendanceObj,
    });
  }

  // Create new attendance
  const attendance = await Attendance.create({
    userId,
    role: user.role,
    date: attendanceDate,
    status,
    markedBy: markedByValue,
    department: user.department,
  });

  // Format markedBy in response
  const attendanceObj = attendance.toObject();
  if (attendanceObj.markedBy === 'admin') {
    attendanceObj.markedBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const markedByUser = await User.findById(attendanceObj.markedBy).select('fullName');
    attendanceObj.markedBy = markedByUser
      ? { _id: markedByUser._id, fullName: markedByUser.fullName }
      : attendanceObj.markedBy;
  }

  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully',
    attendance: attendanceObj,
  });
});

/**
 * @desc    Get Attendance
 * @route   GET /api/attendance
 * @access  Private
 */
export const getAttendance = asyncHandler(async (req, res) => {
  const { userId, startDate, endDate, role, department } = req.query;

  const query = {};

  // Students can only see their own attendance
  if (req.userRole === 'student') {
    query.userId = req.userId;
  } else if (userId) {
    query.userId = userId;
  }

  // Filter by role
  if (role) {
    query.role = role;
  }

  // Filter by department
  if (department) {
    query.department = department;
  } else if (req.userRole !== 'admin') {
    query.department = req.userDepartment;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate);
    }
  }

  const attendance = await Attendance.find(query)
    .populate('userId', 'fullName email')
    .sort({ date: -1 });

  // Manually populate markedBy only if it's an ObjectId (not 'admin')
  const attendanceWithMarkedBy = await Promise.all(
    attendance.map(async (record) => {
      const attendanceObj = record.toObject();
      if (attendanceObj.markedBy && attendanceObj.markedBy !== 'admin') {
        const markedByUser = await User.findById(attendanceObj.markedBy).select('fullName');
        attendanceObj.markedBy = markedByUser
          ? { _id: markedByUser._id, fullName: markedByUser.fullName }
          : attendanceObj.markedBy;
      } else if (attendanceObj.markedBy === 'admin') {
        attendanceObj.markedBy = { _id: 'admin', fullName: 'Admin' };
      }
      return attendanceObj;
    })
  );

  res.status(200).json({
    success: true,
    count: attendanceWithMarkedBy.length,
    attendance: attendanceWithMarkedBy,
  });
});

/**
 * @desc    Get Attendance Statistics
 * @route   GET /api/attendance/stats
 * @access  Private
 */
export const getAttendanceStats = asyncHandler(async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  let targetUserId = userId;
  if (req.userRole === 'student') {
    targetUserId = req.userId;
  }

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }

  const dateQuery = {};
  if (startDate) dateQuery.$gte = new Date(startDate);
  if (endDate) dateQuery.$lte = new Date(endDate);

  const attendance = await Attendance.find({
    userId: targetUserId,
    ...(Object.keys(dateQuery).length > 0 && { date: dateQuery }),
  });

  const total = attendance.length;
  const present = attendance.filter((a) => a.status === 'present').length;
  const absent = attendance.filter((a) => a.status === 'absent').length;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

  res.status(200).json({
    success: true,
    stats: {
      total,
      present,
      absent,
      percentage: parseFloat(percentage),
    },
  });
});


