import express from 'express';
import auth from '../middleware/authMiddleware.js';
import {
  getMentors,
  becomeMentor,
  requestMentor,
  getRequests,
  respondToRequest,
  getMyMentorships
} from '../controllers/mentorshipController.js';

const router = express.Router();

// Public - list mentors
router.get('/mentors', getMentors);

// Protected - create/update mentor profile
router.post('/mentors', auth, becomeMentor);

// Protected - request a mentor
router.post('/mentors/:mentorId/request', auth, requestMentor);

// Protected - get incoming/outgoing requests
router.get('/requests', auth, getRequests);

// Protected - respond to a request (accept/decline)
router.patch('/requests/:requestId', auth, respondToRequest);

// Protected - my mentorships (as mentor and mentee)
router.get('/my', auth, getMyMentorships);

export default router;
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
import auth from '../middleware/authMiddleware.js';

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
