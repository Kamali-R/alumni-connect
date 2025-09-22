import express from 'express';
const router = express.Router();

import {
  sendRequest,
  getRequests,
  updateRequest,
  getMentorships
} from '../controllers/mentorshipController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/request', protect, sendRequest);
router.get('/requests', protect, getRequests);
router.put('/requests/:id', protect, updateRequest);
router.get('/mentorships', protect, getMentorships);

export default router;
