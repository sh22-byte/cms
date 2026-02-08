import express from 'express';
import {
  createTimetable,
  getTimetable,
  deleteTimetableEntry,
} from '../controllers/timetable.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(statusMiddleware);

// Create/Update timetable (HOD, Admin)
router.post('/', roleMiddleware('hod', 'admin'), createTimetable);

// Get timetable (all roles)
router.get('/', getTimetable);

// Delete timetable entry (HOD, Admin)
router.delete('/:id', roleMiddleware('hod', 'admin'), deleteTimetableEntry);

export default router;


