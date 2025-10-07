import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { 
  saveStudentProfile, 
  getStudentProfile, 
  updateStudentProfile,
  uploadFiles 
} from '../controllers/studentController.js';

const router = express.Router();

// Student profile routes
router.post('/profile', auth, uploadFiles, saveStudentProfile);
router.get('/profile', auth, getStudentProfile);
router.put('/profile', auth, uploadFiles, updateStudentProfile);

export default router;