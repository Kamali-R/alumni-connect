import session from 'express-session';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import express from 'express';
// Load routes
import alumniRoutes from './routes/alumniRoutes.js';
import authRoutes from './routes/authRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import networkingRoutes from './routes/networkingRoutes.js';
import successStoryRoutes from './routes/successStoryRoutes.js';
import discussionRoutes from './routes/discussionRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import newsAndAchievementsRoutes from './routes/NewsAndAchievementsRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';
import User from './models/User.js';
import auth from './middleware/authMiddleware.js';

// Load Google OAuth config
import './config/googleAuth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORS Configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Session Configuration
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000  
    }
  })
);

// ✅ Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: '✅ Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// ✅ Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// ✅ API Routes - CORRECTED ORDER
app.use('/', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api', contactRoutes);
app.use('/api', alumniRoutes);
app.use('/api', jobRoutes);
app.use('/api', networkingRoutes);
app.use('/api', successStoryRoutes);
app.use('/api', discussionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', newsAndAchievementsRoutes);
app.use('/api/messages', messageRoutes);

// ========== DEBUG ROUTES ==========

// Debug route to check all messages in database
app.get('/api/debug/all-messages', auth, async (req, res) => {
  try {
    const Message = mongoose.model('Message');
    const messages = await Message.find({})
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    res.json({
      totalMessages: messages.length,
      messages: messages.map(msg => ({
        _id: msg._id,
        message: msg.message,
        messageType: msg.messageType,
        callType: msg.callType,
        callStatus: msg.callStatus,
        callDuration: msg.callDuration,
        sender: msg.senderId?.name,
        receiver: msg.receiverId?.name,
        createdAt: msg.createdAt,
        conversationId: msg.conversationId
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug route to check database collections
app.get('/api/debug/database-status', auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const collectionStats = {};
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      collectionStats[collectionName] = {
        count: count,
        size: collection.size
      };
    }
    
    res.json({
      database: mongoose.connection.name,
      collections: collectionStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset conversations collection (development only)
app.delete('/api/debug/reset-conversations', async (req, res) => {
  try {
    const Conversation = mongoose.model('Conversation');
    const Message = mongoose.model('Message');
    
    console.log('🔄 Resetting conversations and messages...');
    
    const convResult = await Conversation.deleteMany({});
    const msgResult = await Message.deleteMany({});
    
    console.log('✅ Deleted conversations:', convResult.deletedCount);
    console.log('✅ Deleted messages:', msgResult.deletedCount);
    
    res.json({
      message: 'Database reset successfully',
      conversationsDeleted: convResult.deletedCount,
      messagesDeleted: msgResult.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Reset error:', error);
    res.status(500).json({ 
      error: error.message
    });
  }
});

// ✅ Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Alumni Portal API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/login, /register, /auth/google',
      alumni: '/api/alumni/*',
      networking: '/api/connection-request, /api/alumni-directory',
      messages: '/api/messages/*',
      health: '/api/test',
      debug: '/api/debug/*'
    }
  });
});

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    requestedPath: req.originalUrl,
    method: req.method
  });
});

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// After MongoDB connection
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB Connected');
  
  // Verify models are registered
  const models = mongoose.modelNames();
  console.log('📊 Registered models:', models);
});

// Enable MongoDB debug for messages collection
mongoose.set('debug', function(collectionName, method, query, doc) {
  if (collectionName === 'messages' || collectionName === 'conversations') {
    console.log('🗂️ MongoDB Operation:', {
      collection: collectionName,
      method: method,
      query: query,
      doc: doc
    });
  }
});

// Create HTTP server
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io connection handling with WebRTC support
const connectedUsers = new Map();
const activeCalls = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    socket.userId = payload.id;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id, 'User ID:', socket.userId);

  if (socket.userId) {
    connectedUsers.set(socket.userId.toString(), {
      socketId: socket.id,
      userId: socket.userId,
      connectedAt: new Date()
    });
    
    socket.broadcast.emit('userOnline', { userId: socket.userId });
  }

  // DEBUG: Log all socket events
  const originalEmit = socket.emit;
  socket.emit = function(event, data) {
    console.log(`📤 [SOCKET EMIT] ${event}:`, typeof data === 'object' ? JSON.stringify(data).substring(0, 200) + '...' : data);
    return originalEmit.apply(this, arguments);
  };

  const originalOn = socket.on;
  socket.on = function(event, callback) {
    return originalOn.call(this, event, function(data) {
      console.log(`📥 [SOCKET RECEIVED] ${event}:`, typeof data === 'object' ? JSON.stringify(data).substring(0, 200) + '...' : data);
      try {
        return callback.apply(this, arguments);
      } catch (error) {
        console.error(`❌ Socket handler error for ${event}:`, error);
      }
    });
  };

  // Join user's personal room
  socket.on('joinUserRoom', () => {
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
      console.log(`👤 User ${socket.userId} joined their room`);
    }
  });

  // Join conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`💬 User ${socket.userId} joined conversation ${conversationId}`);
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      console.log('📤 Sending message via socket:', data);
      const { conversationId, message } = data;
      
      // Broadcast to other users in the conversation
      socket.to(`conversation_${conversationId}`).emit('newMessage', message);
      
      // Send delivery confirmation
      socket.to(`conversation_${conversationId}`).emit('messageDelivered', {
        messageId: message._id,
        conversationId
      });
    } catch (error) {
      console.error('❌ Socket send message error:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('typing', {
      userId: socket.userId,
      isTyping: data.isTyping
    });
  });

  // Handle read receipts
  socket.on('markAsRead', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('messageRead', {
      conversationId: data.conversationId,
      userId: socket.userId
    });
  });

  // Handle message deletion
  socket.on('deleteMessage', (data) => {
    console.log('🗑️ Message deletion requested:', data);
    socket.to(`conversation_${data.conversationId}`).emit('messageDeleted', {
      messageId: data.messageId,
      conversationId: data.conversationId
    });
  });

  // ========== WEBRTC CALL HANDLERS ==========

  // Voice call initiation - FIXED VERSION
  socket.on('initiateVoiceCall', async (data) => {
    console.log('📞 Voice call initiated:', data);
    
    try {
      const User = mongoose.model('User');
      const Message = mongoose.model('Message');
      
      const caller = await User.findById(socket.userId).select('name');
      const callerName = caller?.name || 'Unknown User';
      
      console.log('💾 Attempting to save voice call message to database...');
      
      // Save call initiation message
      const savedMessage = await Message.saveCallMessage({
        conversationId: data.conversationId,
        senderId: socket.userId,
        receiverId: data.toUserId,
        callType: 'voice',
        callStatus: 'initiated',
        callRoomId: data.callRoomId,
        callDuration: 0
      });
      
      console.log('✅ Voice call message saved to DB:', savedMessage._id);
      
      // Track active call
      activeCalls.set(data.callRoomId, {
        roomId: data.callRoomId,
        callerId: socket.userId,
        receiverId: data.toUserId,
        callType: 'voice',
        conversationId: data.conversationId,
        status: 'ringing',
        createdAt: new Date(),
        messageId: savedMessage._id
      });
      
      // Notify recipient
      socket.to(`user_${data.toUserId}`).emit('incomingVoiceCall', {
        fromUserId: socket.userId,
        callerName: callerName,
        callRoomId: data.callRoomId,
        conversationId: data.conversationId,
        type: 'voice'
      });
      
      console.log(`📞 Voice call initiated in room: ${data.callRoomId}`);
      
    } catch (error) {
      console.error('❌ Error handling voice call:', error);
      socket.emit('callError', { error: 'Failed to initiate call: ' + error.message });
    }
  });

  // Video call initiation - FIXED VERSION
  socket.on('initiateVideoCall', async (data) => {
    console.log('📹 Video call initiated:', data);
    
    try {
      const User = mongoose.model('User');
      const Message = mongoose.model('Message');
      
      const caller = await User.findById(socket.userId).select('name');
      const callerName = caller?.name || 'Unknown User';
      
      console.log('💾 Attempting to save video call message to database...');
      
      // Save call initiation message
      const savedMessage = await Message.saveCallMessage({
        conversationId: data.conversationId,
        senderId: socket.userId,
        receiverId: data.toUserId,
        callType: 'video',
        callStatus: 'initiated',
        callRoomId: data.callRoomId,
        callDuration: 0
      });
      
      console.log('✅ Video call message saved to DB:', savedMessage._id);
      
      // Track active call
      activeCalls.set(data.callRoomId, {
        roomId: data.callRoomId,
        callerId: socket.userId,
        receiverId: data.toUserId,
        callType: 'video',
        conversationId: data.conversationId,
        status: 'ringing',
        createdAt: new Date(),
        messageId: savedMessage._id
      });
      
      // Notify recipient
      socket.to(`user_${data.toUserId}`).emit('incomingVideoCall', {
        fromUserId: socket.userId,
        callerName: callerName,
        callRoomId: data.callRoomId,
        conversationId: data.conversationId,
        type: 'video'
      });
      
      console.log(`📹 Video call initiated in room: ${data.callRoomId}`);
      
    } catch (error) {
      console.error('❌ Error handling video call:', error);
      socket.emit('callError', { error: 'Failed to initiate call: ' + error.message });
    }
  });

  // Call acceptance - FIXED VERSION
  socket.on('callAccepted', async (data) => {
    console.log('✅ Call accepted:', data);
    
    try {
      const Message = mongoose.model('Message');
      const call = activeCalls.get(data.callRoomId);
      
      if (call) {
        call.status = 'connected';
        call.connectedAt = new Date();
        activeCalls.set(data.callRoomId, call);
        
        console.log('💾 Saving call accepted message...');
        
        // Save call acceptance message
        await Message.saveCallMessage({
          conversationId: data.conversationId,
          senderId: socket.userId,
          receiverId: call.callerId,
          callType: data.callType,
          callStatus: 'connected',
          callRoomId: data.callRoomId,
          callDuration: 0
        });
        
        // Notify caller
        socket.to(`user_${call.callerId}`).emit('callAccepted', {
          callRoomId: data.callRoomId,
          callType: data.callType,
          conversationId: data.conversationId,
          fromUserId: socket.userId
        });
        
        console.log(`✅ Call connected in room: ${data.callRoomId}`);
      }
    } catch (error) {
      console.error('❌ Error handling call acceptance:', error);
      socket.emit('callError', { error: 'Failed to accept call: ' + error.message });
    }
  });

  // Call rejection - FIXED VERSION
  socket.on('callRejected', async (data) => {
    console.log('❌ Call rejected:', data);
    
    try {
      const Message = mongoose.model('Message');
      const call = activeCalls.get(data.callRoomId);
      
      if (call) {
        console.log('💾 Saving call rejected message...');
        
        // Save call rejection message
        await Message.saveCallMessage({
          conversationId: data.conversationId,
          senderId: socket.userId,
          receiverId: call.callerId,
          callType: data.callType,
          callStatus: 'declined',
          callRoomId: data.callRoomId,
          callDuration: 0
        });
        
        // Notify caller
        socket.to(`user_${call.callerId}`).emit('callRejected', {
          callRoomId: data.callRoomId,
          callType: data.callType
        });
        
        // Remove from active calls
        activeCalls.delete(data.callRoomId);
        
        console.log(`❌ Call rejected in room: ${data.callRoomId}`);
      }
    } catch (error) {
      console.error('❌ Error handling call rejection:', error);
    }
  });

  // Call end - FIXED VERSION
  socket.on('endCall', async (data) => {
    console.log('📞 Call ended:', data);
    
    try {
      const Message = mongoose.model('Message');
      const call = activeCalls.get(data.callRoomId);
      
      if (call) {
        const duration = data.duration || 
          (call.connectedAt ? Math.round((new Date() - call.connectedAt) / 1000) : 0);
        
        console.log('💾 Saving call ended message...');
        
        // Save call end message
        await Message.saveCallMessage({
          conversationId: data.conversationId,
          senderId: socket.userId,
          receiverId: call.receiverId,
          callType: data.callType,
          callStatus: 'ended',
          callDuration: duration,
          callRoomId: data.callRoomId
        });
        
        // Notify other participant
        const otherUserId = socket.userId === call.callerId ? call.receiverId : call.callerId;
        socket.to(`user_${otherUserId}`).emit('callEnded', {
          callRoomId: data.callRoomId,
          duration: duration,
          callType: data.callType
        });
        
        // Remove from active calls
        activeCalls.delete(data.callRoomId);
        
        console.log(`📞 Call ended in room: ${data.callRoomId}, duration: ${duration}s`);
      }
    } catch (error) {
      console.error('❌ Error handling call end:', error);
    }
  });

  // WebRTC Signaling: Offer
  socket.on('webrtc-offer', (data) => {
    console.log('📡 WebRTC offer received');
    socket.to(`user_${data.toUserId}`).emit('webrtc-offer', {
      callRoomId: data.callRoomId,
      offer: data.offer,
      fromUserId: socket.userId
    });
  });

  // WebRTC Signaling: Answer
  socket.on('webrtc-answer', (data) => {
    console.log('📡 WebRTC answer received');
    socket.to(`user_${data.toUserId}`).emit('webrtc-answer', {
      callRoomId: data.callRoomId,
      answer: data.answer,
      fromUserId: socket.userId
    });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('ice-candidate', (data) => {
    socket.to(`user_${data.toUserId}`).emit('ice-candidate', {
      callRoomId: data.callRoomId,
      candidate: data.candidate,
      fromUserId: socket.userId
    });
  });

  // Call ringing notification
  socket.on('callRinging', (data) => {
    console.log('🔔 Call ringing:', data);
    socket.to(`user_${data.toUserId}`).emit('callRinging', {
      callRoomId: data.callRoomId,
      fromUserId: socket.userId
    });
  });

  // Handle disconnect - clean up active calls
  socket.on('disconnect', (reason) => {
    console.log('🔌 User disconnected:', socket.id, 'Reason:', reason);
    
    // End any active calls this user was part of
    for (const [roomId, call] of activeCalls.entries()) {
      if (call.callerId === socket.userId || call.receiverId === socket.userId) {
        console.log(`📞 Ending call ${roomId} due to user disconnect`);
        
        // Notify other participant
        const otherUserId = call.callerId === socket.userId ? call.receiverId : call.callerId;
        socket.to(`user_${otherUserId}`).emit('callEnded', {
          callRoomId: roomId,
          reason: 'User disconnected',
          callType: call.callType
        });
        
        // Remove from active calls
        activeCalls.delete(roomId);
      }
    }
    
    if (socket.userId) {
      connectedUsers.delete(socket.userId.toString());
      socket.broadcast.emit('userOffline', { userId: socket.userId });
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📡 API Test: http://localhost:${PORT}/api/test`);
  console.log(`🐛 Debug Routes: http://localhost:${PORT}/api/debug/all-messages`);
  console.log(`📞 WebRTC Support: Enabled`);
  console.log(`🔧 Active Call Tracking: Enabled`);
});