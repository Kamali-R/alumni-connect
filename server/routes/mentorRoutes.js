import express from 'express';
const router = express.Router();

import { getMentors, becomeMentor, getMentorProfile } from '../controllers/mentorController.js';
import auth from '../middleware/authMiddleware.js';

router.get('/', getMentors);
router.post('/become-mentor', auth, becomeMentor);
router.get('/profile', auth, getMentorProfile);

export default router;
