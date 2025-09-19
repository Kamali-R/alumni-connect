import express from 'express';
import { 
  saveAlumniProfile, 
  getAlumniProfile, 
  updateAlumniProfile, 
  getAllAlumni,
  uploadFiles 
} from '../controllers/alumniController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Create/Save alumni profile (with file uploads)
router.post('/alumni/profile', auth, uploadFiles, saveAlumniProfile);

// Get current user's alumni profile
router.get('/alumni/profile', auth, getAlumniProfile);

// Update alumni profile (with file uploads)
router.put('/alumni/profile', auth, uploadFiles, updateAlumniProfile);

// Get all alumni (for networking/search)
router.get('/alumni/all', auth, getAllAlumni);

export default router;