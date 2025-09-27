import express from 'express';
import {
  createDiscussion,
  getDiscussions,
  getDiscussionById,
  toggleDiscussionLike,
  addReply,
  toggleReplyLike,
  getUserDiscussions,
  updateDiscussion,
  deleteDiscussion
} from '../controllers/discussionController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (require auth to see user-specific data like like status)
router.get('/discussions', auth, getDiscussions);
router.get('/discussions/:id', auth, getDiscussionById);

// Protected routes
router.post('/discussions', auth, createDiscussion);
router.post('/discussions/:discussionId/like', auth, toggleDiscussionLike);
router.post('/discussions/:discussionId/replies', auth, addReply);
router.post('/replies/:replyId/like', auth, toggleReplyLike);
router.get('/user/discussions', auth, getUserDiscussions);
router.put('/discussions/:id', auth, updateDiscussion);
router.delete('/discussions/:id', auth, deleteDiscussion);

export default router;