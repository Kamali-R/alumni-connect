import express from 'express';
const router = express.Router();

import { getMentors, becomeMentor, getMentorProfile } from '../controllers/mentorController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/', getMentors);
router.post('/become-mentor', protect, becomeMentor);
router.get('/profile', protect, getMentorProfile);

export default router;
