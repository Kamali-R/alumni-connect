import express from 'express';
import auth from '../middleware/authMiddleware.js';
import {
  becomeMentor,
  getMentors,
  requestMentorship,
  getMentorshipRequests,
  acceptMentorship,
  declineMentorship,
  getMyMentorships,
  getMentorProfile
} from '../controllers/mentorshipController.js';

const router = express.Router();

// Mentor routes
router.post('/become', auth, becomeMentor);
router.get('/mentors', auth, getMentors);
router.get('/profile', auth, getMentorProfile);

// Mentorship request routes
router.post('/request', auth, requestMentorship);
router.get('/requests', auth, getMentorshipRequests);
router.post('/requests/:requestId/accept', auth, acceptMentorship);
router.post('/requests/:requestId/decline', auth, declineMentorship);

// User mentorships
router.get('/my', auth, getMyMentorships);

export default router;
