// controllers/alumniController.js
import Alumni from '../models/Alumni.js';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profileImage') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile picture'), false);
    }
  } else if (file.fieldname === 'resume') {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed for resume'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for handling file uploads
export const uploadFiles = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]);

// Create or update alumni profile
export const saveAlumniProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Creating/Updating alumni profile for user:', userId);
    
    // Parse JSON strings from FormData
    const profileData = {};
    
    // Handle JSON fields
    const jsonFields = [
      'personalInfo', 'academicInfo', 'careerDetails', 'otherInfo',
      'experiences', 'skills', 'interests', 'achievements', 'awards', 'recognitions'
    ];
    
    jsonFields.forEach(field => {
      if (req.body[field]) {
        try {
          profileData[field] = JSON.parse(req.body[field]);
        } catch (error) {
          console.error(`Error parsing ${field}:`, error);
          profileData[field] = req.body[field];
        }
      }
    });
    
    // Handle simple string fields
    if (req.body.careerStatus) {
      profileData.careerStatus = req.body.careerStatus;
    }
    
    // Handle file uploads
    if (req.files) {
      if (req.files.profileImage) {
        profileData.profileImage = req.files.profileImage[0].filename;
        profileData.profileImageUrl = `/uploads/${req.files.profileImage[0].filename}`;
      }
      if (req.files.resume) {
        profileData.resumeFileName = req.files.resume[0].originalname;
        profileData.resumeFile = req.files.resume[0].filename;
        profileData.resumeUrl = `/uploads/${req.files.resume[0].filename}`;
      }
    }
    
    // Validation
    if (!profileData.personalInfo || !profileData.academicInfo || !profileData.careerStatus) {
      return res.status(400).json({
        message: 'Missing required profile information',
        missing: {
          personalInfo: !profileData.personalInfo,
          academicInfo: !profileData.academicInfo,
          careerStatus: !profileData.careerStatus
        }
      });
    }
    
    // Find existing alumni profile or create new one
    let alumniProfile = await Alumni.findOne({ userId });
    
    if (alumniProfile) {
      console.log('Updating existing alumni profile');
      // Update existing profile
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined) {
          alumniProfile[key] = profileData[key];
        }
      });
      alumniProfile.status = 'complete';
      alumniProfile.updatedAt = new Date();
      await alumniProfile.save();
    } else {
      console.log('Creating new alumni profile');
      // Create new profile
      alumniProfile = new Alumni({
        userId,
        ...profileData,
        status: 'complete'
      });
      await alumniProfile.save();
    }
    
    // Update User model
    const updateData = {
      profileCompleted: true,
      alumniProfile: alumniProfile._id
    };
    
    // Update user name if provided in personal info
    if (profileData.personalInfo && profileData.personalInfo.fullName) {
      updateData.name = profileData.personalInfo.fullName;
    }
    
    // Update graduation year if provided
    if (profileData.academicInfo && profileData.academicInfo.graduationYear) {
      updateData.graduationYear = profileData.academicInfo.graduationYear;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');
    
    console.log('Alumni profile saved successfully');
    
    res.status(200).json({
      message: 'Alumni profile saved successfully',
      user: updatedUser,
      alumni: alumniProfile
    });
    
  } catch (error) {
    console.error('Save alumni profile error:', error);
    res.status(500).json({ 
      message: 'Server error during profile save',
      error: error.message 
    });
  }
};

// Get alumni profile
export const getAlumniProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching alumni profile for user:', userId);
    
    // Find alumni profile
    const alumniProfile = await Alumni.findOne({ userId }).lean();
    
    if (!alumniProfile) {
      console.log('Alumni profile not found for user:', userId);
      return res.status(404).json({ 
        message: 'Alumni profile not found',
        profileCompleted: false
      });
    }
    
    console.log('Alumni profile found and returned');
    
    // Return the complete profile data
    res.status(200).json({
      ...alumniProfile,
      profileCompleted: true
    });
    
  } catch (error) {
    console.error('Get alumni profile error:', error);
    res.status(500).json({ 
      message: 'Server error during profile fetch',
      error: error.message 
    });
  }
};

// Update alumni profile (for editing)
export const updateAlumniProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Updating alumni profile for user:', userId);
    
    // Parse JSON strings from FormData (same logic as create)
    const profileData = {};
    
    const jsonFields = [
      'personalInfo', 'academicInfo', 'careerDetails', 'otherInfo',
      'experiences', 'skills', 'interests', 'achievements', 'awards', 'recognitions'
    ];
    
    jsonFields.forEach(field => {
      if (req.body[field]) {
        try {
          profileData[field] = JSON.parse(req.body[field]);
        } catch (error) {
          console.error(`Error parsing ${field}:`, error);
          profileData[field] = req.body[field];
        }
      }
    });
    
    if (req.body.careerStatus) {
      profileData.careerStatus = req.body.careerStatus;
    }
    
    // Handle file uploads
    if (req.files) {
      if (req.files.profileImage) {
        profileData.profileImage = req.files.profileImage[0].filename;
      }
      if (req.files.resume) {
        profileData.resumeFileName = req.files.resume[0].originalname;
        profileData.resumeFile = req.files.resume[0].filename;
      }
    }
    
    // Find and update alumni profile
    const alumniProfile = await Alumni.findOneAndUpdate(
      { userId },
      {
        ...profileData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!alumniProfile) {
      return res.status(404).json({ message: 'Alumni profile not found' });
    }
    
    // Update user name if changed
    if (profileData.personalInfo && profileData.personalInfo.fullName) {
      await User.findByIdAndUpdate(userId, {
        name: profileData.personalInfo.fullName
      });
    }
    
    console.log('Alumni profile updated successfully');
    
    res.status(200).json({
      message: 'Profile updated successfully',
      alumni: alumniProfile
    });
    
  } catch (error) {
    console.error('Update alumni profile error:', error);
    res.status(500).json({ 
      message: 'Server error during profile update',
      error: error.message 
    });
  }
};

// Get all alumni (for networking/search)
export const getAllAlumni = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', graduationYear = '', branch = '' } = req.query;
    
    // Build search query
    let searchQuery = { status: 'complete' };
    
    if (search) {
      searchQuery.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { 'academicInfo.branch': { $regex: search, $options: 'i' } },
        { 'careerDetails.companyName': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (graduationYear) {
      searchQuery['academicInfo.graduationYear'] = parseInt(graduationYear);
    }
    
    if (branch) {
      searchQuery['academicInfo.branch'] = { $regex: branch, $options: 'i' };
    }
    
    // Execute query with pagination
    const alumni = await Alumni.find(searchQuery)
      .select('-userId -__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Alumni.countDocuments(searchQuery);
    
    res.status(200).json({
      alumni,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Get all alumni error:', error);
    res.status(500).json({ 
      message: 'Server error during alumni fetch',
      error: error.message 
    });
  }
};

// Get alumni profile by user ID (for public viewing)
// controllers/alumniController.js - Updated getAlumniProfileById
export const getAlumniProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Fetching alumni profile for user ID:', userId);
    
    // Find alumni profile by userId with user details
    const alumniProfile = await Alumni.findOne({ userId })
      .populate('userId', 'name email graduationYear role')
      .lean();

    if (!alumniProfile) {
      console.log('Alumni profile not found for user:', userId);
      return res.status(404).json({ 
        message: 'Alumni profile not found'
      });
    }
    
    // Return complete alumni profile data
    const publicProfile = {
      id: alumniProfile.userId._id,
      name: alumniProfile.personalInfo.fullName || alumniProfile.userId.name,
      email: alumniProfile.personalInfo.personalEmail || alumniProfile.userId.email,
      graduationYear: alumniProfile.academicInfo.graduationYear,
      role: alumniProfile.userId.role,
      
      // Personal Information
      personalInfo: alumniProfile.personalInfo,
      
      // Academic Information
      academicInfo: alumniProfile.academicInfo,
      
      // Career Information
      careerStatus: alumniProfile.careerStatus,
      careerDetails: alumniProfile.careerDetails,
      
      // Professional Details
      experiences: alumniProfile.experiences,
      skills: alumniProfile.skills,
      interests: alumniProfile.interests,
      
      // Achievements
      achievements: alumniProfile.achievements,
      awards: alumniProfile.awards,
      recognitions: alumniProfile.recognitions,
      
      // Other Information
      otherInfo: alumniProfile.otherInfo,
      
      // File URLs
      profileImage: alumniProfile.profileImage,
      profileImageUrl: alumniProfile.profileImage ? 
        `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${alumniProfile.profileImage}` : 
        null,
      
      resumeUrl: alumniProfile.resumeFile ? 
        `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${alumniProfile.resumeFile}` : 
        null
    };
    
    console.log('Alumni profile found and returned');
    
    res.status(200).json(publicProfile);
    
  } catch (error) {
    console.error('Get alumni profile by ID error:', error);
    res.status(500).json({ 
      message: 'Server error during profile fetch',
      error: error.message 
    });
  }
};