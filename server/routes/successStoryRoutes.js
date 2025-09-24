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

// Public routes
router.get('/stories', getStories);
router.get('/stories/:id', getStoryById);

// Protected routes
router.post('/stories', auth, createStory);
router.post('/stories/:storyId/like', auth, toggleLike);
router.get('/user/stories', auth, getUserStories);
router.put('/stories/:id', auth, updateStory);
router.delete('/stories/:id', auth, deleteStory);

export default router;