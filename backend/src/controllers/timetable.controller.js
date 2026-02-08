import TimeTable from '../models/TimeTable.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Create/Update Timetable
 * @route   POST /api/timetable
 * @access  Private (HOD, Admin)
 */
export const createTimetable = asyncHandler(async (req, res) => {
  const { day, subject, timeSlot, role } = req.body;

  if (!day || !subject || !timeSlot || !role) {
    return res.status(400).json({
      success: false,
      message: 'Day, subject, timeSlot, and role are required',
    });
  }

  // Determine department value - use provided department or user's department
  const departmentValue = req.userRole === 'admin' && req.body.department 
    ? req.body.department 
    : req.userDepartment;

  // Validate department for non-admin users
  if (req.userRole !== 'admin' && departmentValue === 'all') {
    return res.status(400).json({
      success: false,
      message: 'Department must be specified for non-admin users',
    });
  }

  // Determine createdBy value - ObjectId for HOD, string 'admin' for admin
  const createdByValue = req.userRole === 'admin' ? 'admin' : req.userId;

  // Check if entry already exists
  const existingEntry = await TimeTable.findOne({
    department: departmentValue,
    role,
    day,
    timeSlot,
  });

  if (existingEntry) {
    // Update existing entry
    existingEntry.subject = subject;
    existingEntry.createdBy = createdByValue;
    await existingEntry.save();

    // Format createdBy in response
    const timetableObj = existingEntry.toObject();
    if (timetableObj.createdBy === 'admin') {
      timetableObj.createdBy = { _id: 'admin', fullName: 'Admin' };
    } else {
      const createdByUser = await User.findById(timetableObj.createdBy).select('fullName');
      timetableObj.createdBy = createdByUser
        ? { _id: createdByUser._id, fullName: createdByUser.fullName }
        : timetableObj.createdBy;
    }

    return res.status(200).json({
      success: true,
      message: 'Timetable updated successfully',
      timetable: timetableObj,
    });
  }

  // Create new entry
  const timetable = await TimeTable.create({
    department: departmentValue,
    role,
    day,
    subject,
    timeSlot,
    createdBy: createdByValue,
  });

  // Format createdBy in response
  const timetableObj = timetable.toObject();
  if (timetableObj.createdBy === 'admin') {
    timetableObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(timetableObj.createdBy).select('fullName');
    timetableObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : timetableObj.createdBy;
  }

  res.status(201).json({
    success: true,
    message: 'Timetable created successfully',
    timetable: timetableObj,
  });
});

/**
 * @desc    Get Timetable
 * @route   GET /api/timetable
 * @access  Private
 */
export const getTimetable = asyncHandler(async (req, res) => {
  const { role, department, day } = req.query;

  const query = {};

  // Filter by department
  if (department) {
    query.department = department;
  } else if (req.userRole !== 'admin') {
    query.department = req.userDepartment;
  }

  // Filter by role
  if (role) {
    query.role = role;
  } else {
    // Default to user's role
    query.role = req.userRole;
  }

  // Filter by day
  if (day) {
    query.day = day;
  }

  const timetable = await TimeTable.find(query)
    .sort({ day: 1, timeSlot: 1 });

  // Manually populate createdBy only if it's an ObjectId (not 'admin')
  const timetableWithCreatedBy = await Promise.all(
    timetable.map(async (record) => {
      const timetableObj = record.toObject();
      if (timetableObj.createdBy && timetableObj.createdBy !== 'admin') {
        const createdByUser = await User.findById(timetableObj.createdBy).select('fullName');
        timetableObj.createdBy = createdByUser
          ? { _id: createdByUser._id, fullName: createdByUser.fullName }
          : timetableObj.createdBy;
      } else if (timetableObj.createdBy === 'admin') {
        timetableObj.createdBy = { _id: 'admin', fullName: 'Admin' };
      }
      return timetableObj;
    })
  );

  res.status(200).json({
    success: true,
    count: timetableWithCreatedBy.length,
    timetable: timetableWithCreatedBy,
  });
});

/**
 * @desc    Delete Timetable Entry
 * @route   DELETE /api/timetable/:id
 * @access  Private (HOD, Admin)
 */
export const deleteTimetableEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const timetable = await TimeTable.findById(id);

  if (!timetable) {
    return res.status(404).json({
      success: false,
      message: 'Timetable entry not found',
    });
  }

  // Check permissions
  if (req.userRole !== 'admin' && timetable.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete timetable entries for your department',
    });
  }

  await TimeTable.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Timetable entry deleted successfully',
  });
});


