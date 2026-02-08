import express from 'express';
import {
  markAttendance,
  getAttendance,
  getAttendanceStats,
} from '../controllers/attendance.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(statusMiddleware);

// Mark attendance (Teacher, HOD, Admin)
router.post('/', roleMiddleware('teacher', 'hod', 'admin'), markAttendance);

// Get attendance (all roles)
router.get('/', getAttendance);
router.get('/stats', getAttendanceStats);

export default router;


