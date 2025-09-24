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

// Load Google OAuth config
import './config/googleAuth.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000  // 24 hours
    }
  })
);

// ✅ Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// ✅ Health Check Endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: '✅ Backend is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ API Routes - CORRECTED ORDER
app.use('/', authRoutes);                    // Auth routes (login, register, etc.)
app.use('/api', protectedRoutes);           // General protected routes
app.use('/api', contactRoutes);             // Contact routes
app.use('/api', alumniRoutes);              // Alumni profile routes
app.use('/api', jobRoutes);                 // Job routes
app.use('/api', networkingRoutes);          // Networking routes

// ✅ Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Alumni Portal API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/login, /register, /auth/google',
      alumni: '/api/alumni/*',
      networking: '/api/connection-request, /api/alumni-directory',
      health: '/api/test'
    }
  });
});

// ✅ Debug Route for Connection Issues
app.get('/api/debug/connections', async (req, res) => {
  try {
    const Connection = mongoose.model('Connection');
    const totalConnections = await Connection.countDocuments();
    const pendingConnections = await Connection.countDocuments({ status: 'pending' });
    const acceptedConnections = await Connection.countDocuments({ status: 'accepted' });
    
    res.json({
      totalConnections,
      pendingConnections,
      acceptedConnections,
      message: 'Connection debug info'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ 404 Handler - FIXED: Remove the problematic * route
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

// Debug script to test connection functionality
// Add this to your backend temporarily to test connections

// Add this route to your server.js or create a separate debug route file
app.get('/api/debug/test-connection-flow', async (req, res) => {
  try {
    const Connection = mongoose.model('Connection');
    const User = mongoose.model('User');
    const Alumni = mongoose.model('Alumni');
    
    // Get all users with alumni profiles
    const users = await User.find({ role: 'alumni' })
      .select('name email')
      .limit(5);
    
    const usersWithProfiles = [];
    for (const user of users) {
      const alumniProfile = await Alumni.findOne({ userId: user._id });
      if (alumniProfile) {
        usersWithProfiles.push({
          id: user._id,
          name: user.name,
          email: user.email,
          hasProfile: !!alumniProfile
        });
      }
    }
    
    // Get all connections
    const allConnections = await Connection.find({})
      .populate('requesterId', 'name email')
      .populate('recipientId', 'name email')
      .lean();
    
    const connectionStats = {
      total: allConnections.length,
      pending: allConnections.filter(c => c.status === 'pending').length,
      accepted: allConnections.filter(c => c.status === 'accepted').length,
      declined: allConnections.filter(c => c.status === 'declined').length
    };
    
    res.json({
      message: 'Debug info for connection functionality',
      usersWithProfiles,
      connectionStats,
      recentConnections: allConnections.slice(0, 10).map(conn => ({
        id: conn._id,
        requester: conn.requesterId?.name || 'Unknown',
        recipient: conn.recipientId?.name || 'Unknown',
        status: conn.status,
        requestedAt: conn.requestedAt
      })),
      endpoints: {
        directory: 'GET /api/alumni-directory',
        sendRequest: 'POST /api/connection-request { recipientId }',
        viewRequests: 'GET /api/connection-requests',
        acceptRequest: 'POST /api/accept-connection { connectionId }',
        declineRequest: 'POST /api/decline-connection { connectionId }',
        cancelRequest: 'POST /api/cancel-connection { connectionId }'
      }
    });
    
  } catch (error) {
    console.error('Debug script error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Test endpoint for creating sample connections (for development only)
app.post('/api/debug/create-test-connection', async (req, res) => {
  try {
    const { requesterId, recipientId } = req.body;
    
    if (!requesterId || !recipientId) {
      return res.status(400).json({ message: 'Both requesterId and recipientId required' });
    }
    
    const Connection = mongoose.model('Connection');
    
    const connection = new Connection({
      requesterId,
      recipientId,
      status: 'pending',
      requestedAt: new Date()
    });
    
    await connection.save();
    
    const populated = await Connection.findById(connection._id)
      .populate('requesterId', 'name email')
      .populate('recipientId', 'name email');
    
    res.json({
      message: 'Test connection created',
      connection: populated
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Connection already exists' });
    }
    
    res.status(500).json({ 
      message: 'Error creating test connection',
      error: error.message 
    });
  }
});

// Clear all connections (for development/testing only - REMOVE IN PRODUCTION)
app.delete('/api/debug/clear-connections', async (req, res) => {
  try {
    const Connection = mongoose.model('Connection');
    const result = await Connection.deleteMany({});
    
    res.json({
      message: 'All connections cleared',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Error clearing connections',
      error: error.message 
    });
  }
});

// ✅ Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}
// Add to server.js - Data validation middleware
app.use('/api/connection-request', (req, res, next) => {
  if (req.method === 'POST') {
    const { recipientId } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ 
        success: false,
        message: 'Recipient ID is required' 
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid recipient ID format' 
      });
    }
  }
  next();
});
// Add this temporary cleanup route to server.js
app.delete('/api/debug/cleanup-corrupted-connections', async (req, res) => {
  try {
    const Connection = mongoose.model('Connection');
    
    // Find and delete connections with null values
    const result = await Connection.deleteMany({
      $or: [
        { requesterId: null },
        { recipientId: null },
        { requesterId: { $exists: false } },
        { recipientId: { $exists: false } }
      ]
    });
    
    console.log('🧹 Cleanup result:', result);
    
    // Also drop and recreate the index
    const db = mongoose.connection.db;
    try {
      await db.collection('connections').dropIndex('fromUser_1_toUser_1');
    } catch (e) {
      console.log('Index might not exist, continuing...');
    }
    
    // Recreate the proper index
    await db.collection('connections').createIndex(
      { requesterId: 1, recipientId: 1 }, 
      { 
        unique: true, 
        name: 'unique_connection_pair',
        partialFilterExpression: {
          requesterId: { $exists: true, $ne: null },
          recipientId: { $exists: true, $ne: null }
        }
      }
    );
    
    res.json({
      message: 'Cleanup completed successfully',
      deletedCount: result.deletedCount,
      indexes: await db.collection('connections').getIndexes()
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB Connected');
    
    // Create indexes after connection is established
    const createIndexes = async () => {
      try {
        const db = mongoose.connection.db;
        
        // Create indexes for Connection model
        await db.collection('connections').createIndex(
          { "requesterId": 1, "recipientId": 1 }, 
          { unique: true, sparse: true }
        );
        await db.collection('connections').createIndex({ "requesterId": 1, "status": 1 });
        await db.collection('connections').createIndex({ "recipientId": 1, "status": 1 });
        await db.collection('connections').createIndex({ "status": 1, "requestedAt": -1 });
        
        // Create indexes for Alumni model
        await db.collection('alumnis').createIndex({ "userId": 1 }, { unique: true });
        await db.collection('alumnis').createIndex({ "personalInfo.personalEmail": 1 });
        await db.collection('alumnis').createIndex({ "academicInfo.collegeEmail": 1 });
        await db.collection('alumnis').createIndex({ "status": 1 });
        
        // Create indexes for User model
        await db.collection('users').createIndex({ "email": 1 }, { unique: true });
        
        console.log('✅ Database indexes created successfully');
      } catch (error) {
        console.log('ℹ️ Some indexes may already exist:', error.message);
      }
    };
    
    createIndexes();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`📡 API Test: http://localhost:${PORT}/api/test`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

  // Add this function to your server.js after mongoose connection
const createConnectionIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Drop existing problematic indexes first
    try {
      await db.collection('connections').dropIndex('unique_connection');
    } catch (e) {
      console.log('Index might not exist, continuing...');
    }
    
    // Create new indexes
    await db.collection('connections').createIndex(
      { requesterId: 1, recipientId: 1 }, 
      { unique: true, name: 'unique_connection_pair' }
    );
    
    await db.collection('connections').createIndex(
      { recipientId: 1, status: 1 }, 
      { name: 'pending_requests_index' }
    );
    
    await db.collection('connections').createIndex(
      { requesterId: 1, status: 1 }, 
      { name: 'sent_requests_index' }
    );
    
    console.log('✅ Connection indexes created successfully');
  } catch (error) {
    console.log('ℹ️ Index creation note:', error.message);
  }
};

// Call this after mongoose connection
mongoose.connection.once('open', () => {
  createConnectionIndexes();
});