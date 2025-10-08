import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getOrCreateConversation,
  sendMessage,
  getConversationMessages,
  getUserConversations,
  markMessagesAsRead,
  getConnectedAlumni,
  getCallHistory,
  deleteMessage,
  createCallMessage
} from '../controllers/messageController.js';
import auth from '../middleware/authMiddleware.js';
import Message from '../models/Message.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + fileExtension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get connected alumni for messaging
router.get('/connections/accepted', auth, getConnectedAlumni);

// Get user's conversations list
router.get('/conversations', auth, getUserConversations);

// Get or create conversation with specific user
router.get('/conversations/:otherUserId', auth, getOrCreateConversation);

// Get conversation messages
router.get('/conversations/:otherUserId/messages', auth, getConversationMessages);

// Send message with file upload support
router.post('/messages/send', auth, upload.single('file'), sendMessage);

// Mark messages as read
router.put('/conversations/:conversationId/read', auth, markMessagesAsRead);

// Get call history
router.get('/conversations/:conversationId/calls', auth, getCallHistory);

// Delete message route
router.delete('/messages/:messageId', auth, deleteMessage);

// Create call message (for internal use via sockets)
router.post('/call-message', auth, async (req, res) => {
  try {
    const callData = req.body;
    const message = await createCallMessage(callData);
    
    res.status(201).json({
      success: true,
      message: 'Call message created successfully',
      data: message
    });
  } catch (error) {
    console.error('Create call message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating call message',
      error: error.message
    });
  }
});

export default router;