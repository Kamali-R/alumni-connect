import express from 'express';
import {
  createAnnouncement,
  getAllAnnouncements,
  getStudentAnnouncements,
  getAlumniAnnouncements,
  getAnnouncementsByCategory,
  deleteAnnouncement
} from '../controllers/announcementController.js';

const router = express.Router();

// Admin routes
router.post('/create', createAnnouncement);
router.get('/all', getAllAnnouncements);
router.delete('/:id', deleteAnnouncement);

// Student routes
router.get('/student/announcements', getStudentAnnouncements);

// Alumni routes
router.get('/alumni/announcements', getAlumniAnnouncements);

// Public routes
router.get('/by-category', getAnnouncementsByCategory);

export default router;
