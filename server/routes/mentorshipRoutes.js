import express from 'express';
const router = express.Router();

import {
  sendRequest,
  getRequests,
  updateRequest,
  getMentorships
} from '../controllers/mentorshipController.js';
import  auth from '../middleware/authMiddleware.js';

router.post('/request', auth, sendRequest);
router.get('/requests', auth, getRequests);
router.put('/requests/:id', auth, updateRequest);
router.get('/mentorships', auth , getMentorships);

export default router;
