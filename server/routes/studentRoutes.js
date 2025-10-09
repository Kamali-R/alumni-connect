import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { 
  saveStudentProfile, 
  getStudentProfile, 
  updateStudentProfile,
  uploadFiles 
} from '../controllers/studentController.js';
import Student from '../models/Student.js'; // ADD THIS IMPORT

const router = express.Router();

// Student profile routes
router.post('/profile', auth, uploadFiles, saveStudentProfile);
router.get('/profile', auth, getStudentProfile);
router.put('/profile', auth, uploadFiles, updateStudentProfile);

// Get student profile by user ID (for public viewing)
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Fetching student profile for user ID:', userId);
    
    // Find student profile by userId with user details
    const studentProfile = await Student.findOne({ userId })
      .populate('userId', 'name email graduationYear role')
      .lean();

    if (!studentProfile) {
      console.log('Student profile not found for user:', userId);
      return res.status(404).json({ 
        message: 'Student profile not found'
      });
    }
    
    // Return complete student profile data
    const publicProfile = {
      id: studentProfile.userId._id,
      name: studentProfile.personalInfo.fullName || studentProfile.userId.name,
      email: studentProfile.personalInfo.personalEmail || studentProfile.userId.email,
      graduationYear: studentProfile.academicInfo.graduationYear,
      role: studentProfile.userId.role,
      
      // Personal Information
      personalInfo: studentProfile.personalInfo,
      
      // Academic Information
      academicInfo: studentProfile.academicInfo,
      
      // Professional Information
      professionalInfo: studentProfile.professionalInfo,
      
      // Skills & Interests
      skills: studentProfile.skills,
      interests: studentProfile.interests,
      
      // Career Goals
      careerGoals: studentProfile.careerGoals,
      
      // File URLs
      profileImage: studentProfile.profileImage,
      profileImageUrl: studentProfile.profileImage ? 
        `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${studentProfile.profileImage}` : 
        null,
      
      resumeUrl: studentProfile.resumeFile ? 
        `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${studentProfile.resumeFile}` : 
        null
    };
    
    console.log('Student profile found and returned');
    
    res.status(200).json(publicProfile);
    
  } catch (error) {
    console.error('Get student profile by ID error:', error);
    res.status(500).json({ 
      message: 'Server error during profile fetch',
      error: error.message 
    });
  }
});

export default router;