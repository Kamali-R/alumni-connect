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
app.use('/api', networkingRoutes);
app.use('/api', successStoryRoutes);


app.delete('/api/debug/fix-connections-completely', async (req, res) => {
  try {
    const Connection = mongoose.model('Connection');
    
    console.log('🛠️ Starting complete connections fix...');
    
    // 1. Delete ALL connections
    const deleteResult = await Connection.deleteMany({});
    console.log('✅ Deleted all connections:', deleteResult.deletedCount);
    
    // 2. Drop ALL indexes from connections collection
    const db = mongoose.connection.db;
    const collection = db.collection('connections');
    
    try {
      const indexes = await collection.indexes();
      console.log('📋 Current indexes:', indexes.map(idx => idx.name));
      
      // Drop all indexes except _id_
      for (const index of indexes) {
        if (index.name !== '_id_') {
          try {
            await collection.dropIndex(index.name);
            console.log('✅ Dropped index:', index.name);
          } catch (e) {
            console.log('ℹ️ Could not drop index', index.name, ':', e.message);
          }
        }
      }
    } catch (e) {
      console.log('ℹ️ Error handling indexes:', e.message);
    }
    
    // 3. Create ONE clean, proper index
    await collection.createIndex(
      { requesterId: 1, recipientId: 1 }, 
      { 
        unique: true, 
        name: 'unique_connection_pair'
      }
    );
    console.log('✅ Created clean unique index');
    
    // 4. Test creating a valid connection
    const User = mongoose.model('User');
    const users = await User.find({ role: 'alumni' }).limit(2);
    
    if (users.length >= 2) {
      const testConnection = new Connection({
        requesterId: users[0]._id,
        recipientId: users[1]._id,
        status: 'pending',
        requestedAt: new Date()
      });
      
      await testConnection.save();
      console.log('✅ Test connection created successfully');
      
      // Clean up test connection
      await Connection.findByIdAndDelete(testConnection._id);
      console.log('✅ Test connection cleaned up');
    }
    
    // 5. Verify the fix
    const finalStats = await collection.stats();
    const finalIndexes = await collection.indexes();
    
    res.json({
      message: 'Connections completely fixed!',
      actions: {
        deletedConnections: deleteResult.deletedCount,
        createdIndexes: finalIndexes.map(idx => idx.name),
        collectionSize: finalStats.size,
        testSuccessful: users.length >= 2
      },
      nextSteps: [
        'Now replace your Connection model with the fixed version',
        'Update your networking controller',
        'Restart the server',
        'Test connection functionality'
      ]
    });
    
  } catch (error) {
    console.error('❌ Fix error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});
// Networking routes
app.get('/api/debug/check-connections-state', async (req, res) => {
  try {
    const Connection = mongoose.model('Connection');
    const User = mongoose.model('User');
    
    console.log('🔍 Checking connections state...');
    
    // Get ALL connections with details
    const allConnections = await Connection.find({})
      .populate('requesterId', 'name email')
      .populate('recipientId', 'name email')
      .lean();
    
    // Get basic collection info (compatible method)
    const db = mongoose.connection.db;
    const collection = db.collection('connections');
    
    // Count documents using compatible method
    const totalCount = await collection.countDocuments();
    
    // Get indexes
    const indexes = await collection.indexes();
    
    // Check for any users in the database
    const totalUsers = await User.countDocuments({ role: 'alumni' });
    const sampleUsers = await User.find({ role: 'alumni' }).limit(3).select('name email');
    
    console.log('📊 Connection analysis:', {
      totalConnections: allConnections.length,
      totalCountFromCollection: totalCount,
      totalAlumniUsers: totalUsers
    });
    
    res.json({
      // Basic counts
      totalConnections: allConnections.length,
      totalCountFromCollection: totalCount,
      totalAlumniUsers: totalUsers,
      
      // Index information
      indexes: indexes.map(index => index.name),
      
      // Sample users available for testing
      sampleUsers: sampleUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email
      })),
      
      // Detailed connection analysis
      connections: allConnections.map(conn => {
        const hasRequester = conn.requesterId && mongoose.Types.ObjectId.isValid(conn.requesterId);
        const hasRecipient = conn.recipientId && mongoose.Types.ObjectId.isValid(conn.recipientId);
        
        return {
          id: conn._id,
          requesterId: conn.requesterId,
          recipientId: conn.recipientId,
          requesterName: conn.requesterId?.name || 'null/missing',
          recipientName: conn.recipientId?.name || 'null/missing', 
          status: conn.status,
          requestedAt: conn.requestedAt,
          hasNullValues: !hasRequester || !hasRecipient,
          isValid: hasRequester && hasRecipient,
          // Detailed validation
          requesterValid: hasRequester,
          recipientValid: hasRecipient,
          canBeUsed: hasRequester && hasRecipient && conn.requesterId.toString() !== conn.recipientId.toString()
        };
      }),
      
      // Summary statistics
      summary: {
        validConnections: allConnections.filter(conn => 
          conn.requesterId && conn.recipientId &&
          mongoose.Types.ObjectId.isValid(conn.requesterId) &&
          mongoose.Types.ObjectId.isValid(conn.recipientId)
        ).length,
        
        corruptedConnections: allConnections.filter(conn => 
          !conn.requesterId || !conn.recipientId ||
          !mongoose.Types.ObjectId.isValid(conn.requesterId) ||
          !mongoose.Types.ObjectId.isValid(conn.recipientId)
        ).length,
        
        pendingConnections: allConnections.filter(conn => conn.status === 'pending').length,
        acceptedConnections: allConnections.filter(conn => conn.status === 'accepted').length,
        declinedConnections: allConnections.filter(conn => conn.status === 'declined').length
      }
    });
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    res.status(500).json({ 
      error: error.message,
      hint: 'Check if Connection model is properly defined'
    });
  }
});

app.post('/api/debug/test-connection-creation', async (req, res) => {
  try {
    const Connection = mongoose.model('Connection');
    const User = mongoose.model('User');
    
    // Get two alumni users to test with
    const users = await User.find({ role: 'alumni' }).limit(2);
    
    if (users.length < 2) {
      return res.status(400).json({ 
        message: 'Need at least 2 alumni users for testing',
        availableUsers: users.length
      });
    }
    
    const [user1, user2] = users;
    
    console.log('Testing connection between:', {
      user1: user1.name,
      user2: user2.name
    });
    
    // Try to create a connection
    const testConnection = new Connection({
      requesterId: user1._id,
      recipientId: user2._id,
      status: 'pending'
    });
    
    // Validate first
    try {
      await testConnection.validate();
      console.log('✅ Validation passed');
    } catch (validationError) {
      return res.status(400).json({
        message: 'Validation failed',
        error: validationError.message
      });
    }
    
    // Try to save
    await testConnection.save();
    console.log('✅ Connection saved successfully');
    
    // Clean up the test connection
    await Connection.findByIdAndDelete(testConnection._id);
    
    res.json({
      success: true,
      message: 'Connection creation test passed!',
      testUsers: {
        requester: user1.name,
        recipient: user2.name
      }
    });
    
  } catch (error) {
    console.error('Test connection error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error (connection already exists)',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Connection creation test failed',
      error: error.message,
      code: error.code
    });
  }
});

app.delete('/api/debug/reset-all-connections', async (req, res) => {
  try {
    const Connection = mongoose.model('Connection');
    
    // Delete ALL connections (nuclear option)
    const deleteResult = await Connection.deleteMany({});
    
    // Drop all indexes and recreate simple one
    const db = mongoose.connection.db;
    
    try {
      await db.collection('connections').dropIndexes();
      console.log('✅ Dropped all indexes');
    } catch (e) {
      console.log('ℹ️ Could not drop indexes:', e.message);
    }
    
    // Create simple unique index
    await db.collection('connections').createIndex(
      { requesterId: 1, recipientId: 1 }, 
      { unique: true, name: 'unique_connection_pair' }
    );
    
    res.json({
      message: 'All connections reset successfully',
      deletedCount: deleteResult.deletedCount
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/simple-connection-test', async (req, res) => {
  try {
    const Connection = mongoose.model('Connection');
    
    // Just try to count connections - most basic test
    const count = await Connection.countDocuments();
    
    // Try to find one connection
    const sampleConnection = await Connection.findOne({});
    
    res.json({
      success: true,
      totalConnections: count,
      sampleConnection: sampleConnection ? {
        id: sampleConnection._id,
        requesterId: sampleConnection.requesterId,
        recipientId: sampleConnection.recipientId,
        status: sampleConnection.status
      } : null,
      message: `Found ${count} connections in database`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Connection model might not be properly defined'
    });
  }
});
app.delete('/api/debug/cleanup-corrupted-connections', async (req, res) => {
  try {
    const Connection = mongoose.model('Connection');
    
    console.log('🧹 Starting simple cleanup of corrupted connections...');
    
    // SIMPLE: Delete any connection with null values
    const deleteResult = await Connection.deleteMany({
      $or: [
        { requesterId: null },
        { recipientId: null }
      ]
    });
    
    console.log('✅ Cleanup completed. Deleted:', deleteResult.deletedCount, 'corrupted connections');
    
    // Don't recreate indexes here - let your Connection model handle it
    console.log('✅ Indexes will be handled by Connection model');
    
    res.json({
      message: 'Cleanup completed successfully',
      deletedCount: deleteResult.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
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
// Add this to server.js - CORRUPTED DATA CLEANUP
// Add this cleanup route to your EXISTING server.js file

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
// Enhanced index creation function
const createConnectionIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    console.log('🔄 Creating database indexes...');
    
    // Clean up any problematic indexes first
    const existingIndexes = await db.collection('connections').getIndexes();
    const indexesToDrop = ['fromUser_1_toUser_1', 'requesterId_1_recipientId_1'];
    
    for (const indexName of indexesToDrop) {
      if (existingIndexes[indexName]) {
        try {
          await db.collection('connections').dropIndex(indexName);
          console.log(`✅ Dropped index: ${indexName}`);
        } catch (e) {
          console.log(`ℹ️ Could not drop index ${indexName}:`, e.message);
        }
      }
    }
    
    // Create new, proper indexes
    await db.collection('connections').createIndex(
      { requesterId: 1, recipientId: 1 }, 
      { 
        unique: true, 
        name: 'unique_connection_pair',
        partialFilterExpression: {
          requesterId: { $exists: true, $ne: null, $type: 'objectId' },
          recipientId: { $exists: true, $ne: null, $type: 'objectId' },
          status: { $in: ['pending', 'accepted'] }
        }
      }
    );
    
    await db.collection('connections').createIndex(
      { recipientId: 1, status: 1 }, 
      { name: 'pending_requests_index' }
    );
    
    await db.collection('connections').createIndex(
      { requesterId: 1, status: 1 }, 
      { name: 'sent_requests_index' }
    );
    
    await db.collection('connections').createIndex(
      { status: 1, requestedAt: -1 }, 
      { name: 'status_timestamp_index' }
    );
    
    console.log('✅ All connection indexes created successfully');
    
  } catch (error) {
    console.log('ℹ️ Index creation note:', error.message);
  }
};

// Call after mongoose connection
mongoose.connection.once('open', () => {
  createConnectionIndexes();
});