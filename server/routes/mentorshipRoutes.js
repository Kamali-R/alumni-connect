import express from 'express';
import auth from '../middleware/authMiddleware.js';
import {
  getMentors,
  becomeMentor,
  requestMentor,
  requestMentorship,
  getRequests,
  getMentorshipRequests,
  respondToRequest,
  acceptMentorship,
  declineMentorship,
  getMyMentorships,
  getMentorProfile
} from '../controllers/mentorshipController.js';

const router = express.Router();

// Public - list mentors
router.get('/mentors', getMentors);

// Protected - create/update mentor profile
router.post('/mentors', auth, becomeMentor);
router.post('/become', auth, becomeMentor);

// Protected - get mentor profile
router.get('/profile', auth, getMentorProfile);

// Protected - request a mentor
router.post('/mentors/:mentorId/request', auth, requestMentor);
router.post('/request', auth, requestMentorship);

// Protected - get incoming/outgoing requests
router.get('/requests', auth, getRequests);
router.get('/requests/all', auth, getMentorshipRequests);

// Protected - respond to a request (accept/decline)
router.patch('/requests/:requestId', auth, respondToRequest);
router.post('/requests/:requestId/accept', auth, acceptMentorship);
router.post('/requests/:requestId/decline', auth, declineMentorship);

// Protected - my mentorships (as mentor and mentee)
router.get('/my', auth, getMyMentorships);

export default router;
