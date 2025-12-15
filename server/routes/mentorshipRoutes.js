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
