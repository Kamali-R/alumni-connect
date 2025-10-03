import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security validation function
const validateFileUpload = (file, maxSize = 10 * 1024 * 1024) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const allowedTypes = [...allowedImageTypes, ...allowedFileTypes];
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('File type not allowed');
  }
  
  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum allowed: ${maxSize / 1024 / 1024}MB`);
  }
  
  return true;
};

// Get or create conversation
export const getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.params;

    console.log('💬 Getting/Creating conversation:', { currentUserId, otherUserId });

    // Validate user IDs
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Check if users are connected
    const connection = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, recipientId: otherUserId, status: 'accepted' },
        { requesterId: otherUserId, recipientId: currentUserId, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: 'You can only message connected alumni'
      });
    }

    let conversation = await Conversation.findOrCreateConversation(currentUserId, otherUserId);
    console.log('✅ Conversation found/created:', conversation._id);

    // Populate participant details
    await conversation.populate('participants', 'name email role profileImage graduationYear');
    
    // Get the other user's alumni profile for additional data
    const otherUser = conversation.participants.find(
      p => p._id.toString() !== currentUserId.toString()
    );
    
    let alumniProfile = null;
    if (otherUser) {
      alumniProfile = await Alumni.findOne({ userId: otherUser._id })
        .select('profileImage personalInfo academicInfo careerStatus careerDetails')
        .lean();
    }

    // Format the response with proper user data
    const formattedConversation = {
      _id: conversation._id,
      participants: conversation.participants.map(participant => {
        const isOtherUser = participant._id.toString() === otherUserId.toString();
        const profile = isOtherUser ? alumniProfile : null;
        
        return {
          _id: participant._id,
          name: participant.name,
          email: participant.email,
          role: participant.role,
          profileImageUrl: profile?.profileImage 
            ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${profile.profileImage}`
            : null,
          graduationYear: participant.graduationYear,
          currentPosition: profile?.careerStatus === 'working' 
            ? profile.careerDetails?.jobTitle
            : profile?.careerStatus === 'entrepreneur'
            ? `Entrepreneur - ${profile.careerDetails?.startupName}`
            : profile?.careerStatus === 'studies'
            ? `Student - ${profile.careerDetails?.courseArea}`
            : 'Alumni',
          isOnline: Math.random() > 0.3 // Replace with real online status logic
        };
      }),
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: conversation.unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };

    res.status(200).json({
      success: true,
      conversation: formattedConversation
    });

  } catch (error) {
    console.error('❌ Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting conversation',
      error: error.message
    });
  }
};

// Enhanced send message with file support and reply functionality
export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { receiverId, message, messageType = 'text', replyTo } = req.body;

    console.log('📤 Sending message:', { currentUserId, receiverId, messageType, replyTo });

    if (!receiverId || (!message && !req.file)) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message or file are required'
      });
    }

    // Security: Prevent self-messaging
    if (currentUserId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Check if users are connected
    const connection = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, recipientId: receiverId, status: 'accepted' },
        { requesterId: receiverId, recipientId: currentUserId, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: 'You can only message connected alumni'
      });
    }

    // Get or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [currentUserId, receiverId],
        unreadCount: new Map([
          [currentUserId.toString(), 0],
          [receiverId.toString(), 0]
        ])
      });
      await conversation.save();
    }

    // Handle file upload
    let fileData = {};
    if (req.file) {
      validateFileUpload(req.file);
      
      const fileExtension = path.extname(req.file.originalname);
      const safeFileName = `file_${Date.now()}_${Math.random().toString(36).substring(2)}${fileExtension}`;
      const filePath = path.join(__dirname, '../uploads', safeFileName);
      
      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Move file to uploads directory
      fs.renameSync(req.file.path, filePath);
      
      fileData = {
        fileUrl: `/uploads/${safeFileName}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileMimeType: req.file.mimetype
      };
    }

    // Get reply message data if replying
    let replyData = {};
    if (replyTo) {
      const repliedMessage = await Message.findById(replyTo)
        .populate('senderId', 'name')
        .lean();
      
      if (repliedMessage) {
        replyData = {
          replyTo: {
            messageId: repliedMessage._id,
            message: repliedMessage.message,
            senderId: repliedMessage.senderId,
            senderName: repliedMessage.senderId?.name || 'User',
            messageType: repliedMessage.messageType
          }
        };
        
        console.log('🔁 Reply data:', replyData);
      }
    }

    // Create message
    const newMessage = new Message({
      conversationId: conversation._id,
      senderId: currentUserId,
      receiverId: receiverId,
      message: message ? message.trim() : '',
      messageType: req.file ? (req.file.mimetype.startsWith('image/') ? 'image' : 'file') : messageType,
      ...fileData,
      ...replyData,
      securityFlags: ['verified'] // Basic security flag
    });

    await newMessage.save();

    // Populate the message for response
    await newMessage.populate('senderId', 'name email');
    if (replyData.replyTo) {
      await newMessage.populate('replyTo.messageId');
    }

    // Update conversation
    let lastMessageText = '';
    if (req.file) {
      lastMessageText = `Sent a ${req.file.mimetype.startsWith('image/') ? 'image' : 'file'}: ${req.file.originalname}`;
    } else if (message) {
      lastMessageText = message.length > 100 ? message.substring(0, 100) + '...' : message;
    } else {
      lastMessageText = 'Sent a message';
    }
    
    conversation.lastMessage = lastMessageText;
    conversation.lastMessageAt = new Date();
    
    // Increment unread count for receiver
    const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    
    await conversation.save();

    // Populate the response message with all necessary data
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name email')
      .populate({
        path: 'replyTo.messageId',
        select: 'message messageType',
        populate: {
          path: 'senderId',
          select: 'name'
        }
      })
      .lean();

    // Format the reply data for the response
    let formattedReply = null;
    if (populatedMessage.replyTo && populatedMessage.replyTo.messageId) {
      formattedReply = {
        _id: populatedMessage.replyTo.messageId._id,
        message: populatedMessage.replyTo.messageId.message,
        senderName: populatedMessage.replyTo.messageId.senderId?.name || 'User',
        messageType: populatedMessage.replyTo.messageId.messageType
      };
    }

    const responseMessage = {
      ...populatedMessage,
      replyTo: formattedReply,
      senderName: populatedMessage.senderId.name
    };

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      message: responseMessage
    });

  } catch (error) {
    console.error('❌ Send message error:', error);
    
    // Clean up uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error sending message',
      error: error.message
    });
  }
};

// Get connected alumni for messaging - FIXED VERSION
export const getConnectedAlumni = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    console.log('🤝 Getting connected alumni for user:', currentUserId);

    // Get accepted connections
    const connections = await Connection.find({
      $or: [
        { requesterId: currentUserId, status: 'accepted' },
        { recipientId: currentUserId, status: 'accepted' }
      ]
    })
    .populate('requesterId', 'name email role graduationYear')
    .populate('recipientId', 'name email role graduationYear')
    .sort({ updatedAt: -1 })
    .lean();

    console.log(`📊 Found ${connections.length} accepted connections`);

    if (connections.length === 0) {
      return res.status(200).json({
        success: true,
        connections: [],
        message: 'No connected alumni found'
      });
    }

    // Get conversation data for each connection
    const connectedAlumni = await Promise.all(
      connections.map(async (connection) => {
        try {
          const otherUser = 
            connection.requesterId._id.toString() === currentUserId.toString()
              ? connection.recipientId
              : connection.requesterId;

          // Get alumni profile
          const alumniProfile = await Alumni.findOne({ userId: otherUser._id })
            .select('profileImage personalInfo academicInfo careerStatus careerDetails skills interests')
            .lean();

          // Get conversation between users
          const conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, otherUser._id] }
          });

          // Get last message details - FIXED: Get actual last message from messages collection
          let lastMessage = 'Start a conversation...';
          let lastMessageAt = connection.updatedAt;
          let unreadCount = 0;
          
          if (conversation) {
            // Get the actual last message from messages collection
            const lastMessageDoc = await Message.findOne({ 
              conversationId: conversation._id 
            })
            .sort({ createdAt: -1 })
            .limit(1)
            .populate('senderId', 'name')
            .lean();
            
            if (lastMessageDoc) {
              if (lastMessageDoc.messageType === 'image') {
                lastMessage = '🖼️ Image';
              } else if (lastMessageDoc.messageType === 'file') {
                lastMessage = '📄 File';
              } else if (lastMessageDoc.messageType === 'call') {
                lastMessage = '📞 Call';
              } else {
                lastMessage = lastMessageDoc.message || 'Start a conversation...';
              }
              lastMessageAt = lastMessageDoc.createdAt;
            } else {
              lastMessage = conversation.lastMessage || 'Start a conversation...';
              lastMessageAt = conversation.lastMessageAt;
            }
            
            unreadCount = conversation.unreadCount?.get(currentUserId.toString()) || 0;
          }

          // Build user profile data
          const profileImageUrl = alumniProfile?.profileImage 
            ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${alumniProfile.profileImage}`
            : null;

          // Get current position
          let currentPosition = 'Alumni';
          if (alumniProfile?.careerStatus === 'working' && alumniProfile.careerDetails?.jobTitle) {
            currentPosition = alumniProfile.careerDetails.jobTitle;
          } else if (alumniProfile?.careerStatus === 'entrepreneur' && alumniProfile.careerDetails?.startupName) {
            currentPosition = `Entrepreneur - ${alumniProfile.careerDetails.startupName}`;
          } else if (alumniProfile?.careerStatus === 'studies' && alumniProfile.careerDetails?.courseArea) {
            currentPosition = `Student - ${alumniProfile.careerDetails.courseArea}`;
          }

          return {
            connectionId: connection._id,
            conversationId: conversation?._id,
            otherUser: {
              id: otherUser._id,
              name: otherUser.name,
              email: otherUser.email,
              role: otherUser.role,
              graduationYear: alumniProfile?.academicInfo?.graduationYear || otherUser.graduationYear,
              profileImageUrl,
              currentPosition,
              isOnline: Math.random() > 0.3 // Simulate online status
            },
            lastMessage: lastMessage,
            lastMessageAt: lastMessageAt,
            unreadCount: unreadCount,
            connectedSince: connection.updatedAt || connection.respondedAt,
            alumniProfile: alumniProfile ? {
              skills: alumniProfile.skills || [],
              interests: alumniProfile.interests || [],
              careerStatus: alumniProfile.careerStatus,
              company: alumniProfile.careerDetails?.companyName
            } : null
          };
        } catch (error) {
          console.error(`❌ Error processing connection ${connection._id}:`, error);
          return null;
        }
      })
    );

    // Filter out any null results from failed processing
    const validConnections = connectedAlumni.filter(conn => conn !== null);

    console.log(`✅ Successfully processed ${validConnections.length} connected alumni`);

    res.status(200).json({
      success: true,
      connections: validConnections,
      total: validConnections.length
    });

  } catch (error) {
    console.error('❌ Get connected alumni error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting connected alumni',
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
};

// Get conversation messages with reply population
export const getConversationMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    console.log('📥 Getting conversation messages:', { currentUserId, otherUserId });

    // Check if users are connected
    const connection = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, recipientId: otherUserId, status: 'accepted' },
        { requesterId: otherUserId, recipientId: currentUserId, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: 'You can only view messages with connected alumni'
      });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] }
    });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        messages: [],
        conversation: null
      });
    }

    // Get messages with pagination and populate replies
    const messages = await Message.find({ 
      conversationId: conversation._id,
      isDeleted: false // Only get non-deleted messages
    })
    .populate('senderId', 'name email')
    .populate({
      path: 'replyTo.messageId',
      select: 'message messageType',
      populate: {
        path: 'senderId',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) * 1)
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId: conversation._id,
        receiverId: currentUserId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Reset unread count for current user
    conversation.unreadCount.set(currentUserId.toString(), 0);
    await conversation.save();

    // Process messages to include reply data
    const processedMessages = messages.map(msg => {
      const messageObj = { 
        ...msg,
        senderName: msg.senderId?.name || 'User'
      };
      
      // If this message is a reply, include the replied message data
      if (msg.replyTo && msg.replyTo.messageId) {
        messageObj.replyTo = {
          _id: msg.replyTo.messageId._id,
          message: msg.replyTo.messageId.message,
          senderName: msg.replyTo.messageId.senderId?.name || 'User',
          messageType: msg.replyTo.messageId.messageType
        };
      }
      
      return messageObj;
    });

    res.status(200).json({
      success: true,
      messages: processedMessages.reverse(), // Return in chronological order
      conversation,
      hasMore: messages.length === parseInt(limit)
    });

  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting messages',
      error: error.message
    });
  }
};

// Get user's conversations list
export const getUserConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    console.log('💬 Getting user conversations:', currentUserId);

    const conversations = await Conversation.find({
      participants: currentUserId
    })
    .populate({
      path: 'participants',
      select: 'name email role',
      match: { _id: { $ne: currentUserId } }
    })
    .sort({ lastMessageAt: -1 })
    .lean();

    // Enhanced conversation data with user profile info
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUser = conversation.participants.find(
          participant => participant._id.toString() !== currentUserId.toString()
        );

        if (!otherUser) return null;

        // Get alumni profile for better data
        const alumniProfile = await Alumni.findOne({ userId: otherUser._id })
          .select('profileImage personalInfo academicInfo careerStatus careerDetails')
          .lean();

        // Get profile image URL
        const profileImageUrl = alumniProfile?.profileImage 
          ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${alumniProfile.profileImage}`
          : null;

        // Get graduation year
        const graduationYear = alumniProfile?.academicInfo?.graduationYear || null;

        // Get current position
        const currentPosition = alumniProfile?.careerStatus === 'working' 
          ? alumniProfile.careerDetails?.jobTitle
          : alumniProfile?.careerStatus === 'entrepreneur'
          ? `Entrepreneur - ${alumniProfile.careerDetails?.startupName}`
          : alumniProfile?.careerStatus === 'studies'
          ? `Student - ${alumniProfile.careerDetails?.courseArea}`
          : 'Alumni';

        return {
          id: conversation._id,
          otherUser: {
            id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            role: otherUser.role,
            profileImageUrl,
            graduationYear,
            currentPosition,
            isOnline: Math.random() > 0.3 // Simulate online status - replace with real logic
          },
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: conversation.unreadCount?.get(currentUserId.toString()) || 0,
          updatedAt: conversation.updatedAt
        };
      })
    );

    // Filter out any null conversations
    const validConversations = enhancedConversations.filter(conv => conv !== null);

    res.status(200).json({
      success: true,
      conversations: validConversations
    });

  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting conversations',
      error: error.message
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.params;

    console.log('👀 Marking messages as read:', { currentUserId, conversationId });

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation || !conversation.participants.includes(currentUserId)) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId: conversationId,
        receiverId: currentUserId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Reset unread count
    conversation.unreadCount.set(currentUserId.toString(), 0);
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('❌ Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking messages as read',
      error: error.message
    });
  }
};

// Get call history for a conversation
export const getCallHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.id;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const callMessages = await Message.find({
      conversationId,
      messageType: 'call',
      isDeleted: false
    })
    .populate('senderId', 'name')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      calls: callMessages
    });

  } catch (error) {
    console.error('❌ Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching call history',
      error: error.message
    });
  }
};

// Delete message (soft delete)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    console.log('🗑️ Deleting message:', { messageId, currentUserId });

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Allow deletion if user is sender or receiver
    if (message.senderId.toString() !== currentUserId.toString() && 
        message.receiverId.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    // Soft delete - mark as deleted
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = currentUserId;
    await message.save();

    // Update conversation last message if this was the last message
    const conversation = await Conversation.findById(message.conversationId);
    if (conversation && conversation.lastMessage === message.message) {
      // Find the most recent non-deleted message
      const lastNonDeletedMessage = await Message.findOne({
        conversationId: message.conversationId,
        isDeleted: false
      })
      .sort({ createdAt: -1 })
      .select('message createdAt')
      .lean();

      if (lastNonDeletedMessage) {
        conversation.lastMessage = lastNonDeletedMessage.message;
        conversation.lastMessageAt = lastNonDeletedMessage.createdAt;
      } else {
        conversation.lastMessage = 'Start a conversation...';
        conversation.lastMessageAt = new Date();
      }
      
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting message',
      error: error.message
    });
  }
};

// Create call message
export const createCallMessage = async (callData) => {
  try {
    const messageTexts = {
      voice: {
        initiated: 'Voice call started',
        connected: 'Voice call connected',
        missed: 'Voice call missed',
        declined: 'Voice call declined',
        ended: 'Voice call ended'
      },
      video: {
        initiated: 'Video call started',
        connected: 'Video call connected',
        missed: 'Video call missed',
        declined: 'Video call declined',
        ended: 'Video call ended'
      }
    };

    const message = new Message({
      conversationId: callData.conversationId,
      senderId: callData.senderId,
      receiverId: callData.receiverId,
      message: messageTexts[callData.callType][callData.callStatus],
      messageType: 'call',
      callType: callData.callType,
      callStatus: callData.callStatus,
      callDuration: callData.callDuration,
      callRoomId: callData.callRoomId,
      securityFlags: ['verified']
    });

    await message.save();

    // Update conversation
    const conversation = await Conversation.findById(callData.conversationId);
    if (conversation) {
      conversation.lastMessage = messageTexts[callData.callType][callData.callStatus];
      conversation.lastMessageAt = new Date();
      
      // Increment unread count for receiver
      const currentUnread = conversation.unreadCount.get(callData.receiverId.toString()) || 0;
      conversation.unreadCount.set(callData.receiverId.toString(), currentUnread + 1);
      
      await conversation.save();
    }

    return message;
  } catch (error) {
    console.error('❌ Create call message error:', error);
    throw error;
  }
};