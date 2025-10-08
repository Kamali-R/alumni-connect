import Student from '../models/Student.js';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

export const uploadFiles = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]);

// Create or update student profile
export const saveStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Creating/Updating student profile for user:', userId);
    
    // Parse JSON strings from FormData
    const profileData = {};
    
    // Handle JSON fields
    const jsonFields = [
      'personalInfo', 'academicInfo', 'professionalInfo', 
      'skills', 'interests', 'careerGoals'
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
    if (!profileData.personalInfo || !profileData.academicInfo) {
      return res.status(400).json({
        message: 'Missing required profile information',
        missing: {
          personalInfo: !profileData.personalInfo,
          academicInfo: !profileData.academicInfo
        }
      });
    }
    
    // Find existing student profile or create new one
    let studentProfile = await Student.findOne({ userId });
    
    if (studentProfile) {
      console.log('Updating existing student profile');
      // Update existing profile
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined) {
          studentProfile[key] = profileData[key];
        }
      });
      studentProfile.status = 'complete';
      studentProfile.updatedAt = new Date();
      await studentProfile.save();
    } else {
      console.log('Creating new student profile');
      // Create new profile
      studentProfile = new Student({
        userId,
        ...profileData,
        status: 'complete'
      });
      await studentProfile.save();
    }
    
    // Update User model
    const updateData = {
      profileCompleted: true,
      studentProfile: studentProfile._id
    };
    
    // Update user name if provided
    if (profileData.personalInfo && profileData.personalInfo.fullName) {
      updateData.name = profileData.personalInfo.fullName;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');
    
    console.log('✅ Student profile saved and user updated');
    
    res.status(200).json({
      message: 'Student profile saved successfully',
      user: {
        ...updatedUser.toObject(),
        registrationComplete: true
      },
      student: studentProfile
    });
    
  } catch (error) {
    console.error('Save student profile error:', error);
    res.status(500).json({ 
      message: 'Server error during profile save',
      error: error.message 
    });
  }
};

// Get student profile
export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching student profile for user:', userId);
    
    // Find student profile
    const studentProfile = await Student.findOne({ userId }).lean();
    
    if (!studentProfile) {
      console.log('Student profile not found for user:', userId);
      return res.status(404).json({ 
        message: 'Student profile not found',
        profileCompleted: false
      });
    }
    
    console.log('Student profile found and returned');
    
    // Return the complete profile data
    res.status(200).json({
      ...studentProfile,
      profileCompleted: true
    });
    
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ 
      message: 'Server error during profile fetch',
      error: error.message 
    });
  }
};

// Update student profile
export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Updating student profile for user:', userId);
    
    // Parse JSON strings from FormData
    const profileData = {};
    
    const jsonFields = [
      'personalInfo', 'academicInfo', 'professionalInfo', 
      'skills', 'interests', 'careerGoals'
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
    
    // Find and update student profile
    const studentProfile = await Student.findOneAndUpdate(
      { userId },
      {
        ...profileData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    // Update user name if changed
    if (profileData.personalInfo && profileData.personalInfo.fullName) {
      await User.findByIdAndUpdate(userId, {
        name: profileData.personalInfo.fullName
      });
    }
    
    console.log('Student profile updated successfully');
    
    res.status(200).json({
      message: 'Profile updated successfully',
      student: studentProfile
    });
    
  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({ 
      message: 'Server error during profile update',
      error: error.message 
    });
  }
};