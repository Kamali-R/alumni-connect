import express from 'express';
import {
  createStory,
  getStories,
  getStoryById,
  toggleLike,
  getUserStories,
  updateStory,
  deleteStory
} from '../controllers/successStoryController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// FIXED: Add auth middleware to GET routes so we can check user's like status
router.get('/stories', auth, getStories);           // ✅ Added auth
router.get('/stories/:id', auth, getStoryById);     // ✅ Added auth

// Protected routes
router.post('/stories', auth, createStory);
router.post('/stories/:storyId/like', auth, toggleLike);
router.get('/user/stories', auth, getUserStories);
router.put('/stories/:id', auth, updateStory);
router.delete('/stories/:id', auth, deleteStory);

export default router;