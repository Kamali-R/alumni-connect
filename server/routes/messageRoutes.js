import express from 'express';
const router = express.Router();

import { getMessages, sendMessage, markAsRead } from '../controllers/messageController.js';
import auth from '../middleware/authMiddleware.js';

router.get('/:mentorshipId', auth, getMessages);
router.post('/', auth, sendMessage);
router.put('/:messageId/read', auth, markAsRead);

export default router;
