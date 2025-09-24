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

// ✅ Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}

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