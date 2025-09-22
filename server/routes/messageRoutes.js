import express from 'express';
const router = express.Router();

import { getMessages, sendMessage, markAsRead } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/:mentorshipId', protect, getMessages);
router.post('/', protect, sendMessage);
router.put('/:messageId/read', protect, markAsRead);

export default router;
