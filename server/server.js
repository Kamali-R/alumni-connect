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
// Load Google OAuth config
import './config/googleAuth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import jobRoutes from './routes/jobRoutes.js';
import networkingRoutes from './routes/networkingRoutes.js';
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000  } // ✅ Use true only in HTTPS
  })
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Add TEST ENDPOINT here - BEFORE API routes
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

// ✅ API Routes
app.use('/', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api', contactRoutes);
app.use('/api', alumniRoutes);
app.use('/api', jobRoutes);
app.use('/api', networkingRoutes);

// ✅ Root Route
app.get('/', (req, res) => {
  res.send('API is running...');
});
// Add this temporary route to your server for debugging
app.get('/api/debug/alumni', async (req, res) => {
  try {
    const Alumni = require('./models/Alumni');
    const allAlumni = await Alumni.find({})
      .populate('userId')
      .lean();
    
    console.log('Total alumni in database:', allAlumni.length);
    
    res.json({
      total: allAlumni.length,
      alumni: allAlumni.map(a => ({
        id: a._id,
        userId: a.userId?._id,
        name: a.personalInfo?.fullName,
        status: a.status,
        hasPersonalInfo: !!a.personalInfo,
        hasAcademicInfo: !!a.academicInfo
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ✅ Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
  });