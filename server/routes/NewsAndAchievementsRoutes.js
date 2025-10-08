// ===================================
// FILE 1: NewsAndAchievementsRoutes.js (COMPLETE WORKING VERSION)
// ===================================

import express from 'express';
import mongoose from 'mongoose';
import Achievement from '../models/Achievement.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('⚠️ No token provided, using anonymous access');
      req.user = { id: `anonymous-${req.ip}` };
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log('⚠️ Invalid token, using anonymous access');
        req.user = { id: `anonymous-${req.ip}` };
        return next();
      }
      
      console.log('✅ User authenticated:', user.id);
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('❌ Auth error:', error);
    req.user = { id: `anonymous-${req.ip}` };
    next();
  }
};

// GET all achievements
router.get('/achievements', async (req, res) => {
  try {
    console.log('📋 Fetching all achievements...');
    
    const achievements = await Achievement.find()
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`✅ Found ${achievements.length} achievements`);
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('❌ Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements',
      error: error.message
    });
  }
});

// POST new achievement (THE KEY FIX)
router.post('/achievements', authenticateToken, async (req, res) => {
  try {
    console.log('\n=== NEW ACHIEVEMENT REQUEST ===');
    console.log('📝 User:', req.user?.id);
    console.log('📝 Body:', JSON.stringify(req.body, null, 2));
    console.log('📝 MongoDB Status:', mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌');
    
    const { title, description, achievementDate, category, userProfile } = req.body;

    // Validate required fields
    if (!title || !description || !achievementDate || !userProfile) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, achievementDate, userProfile'
      });
    }

    // Validate userProfile structure
    const requiredProfileFields = ['name', 'initials', 'department', 'graduationYear', 'currentPosition'];
    const missingFields = requiredProfileFields.filter(field => !userProfile[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing profile fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing profile fields: ${missingFields.join(', ')}`
      });
    }

    // Random avatar color
    const avatarColors = [
      "from-blue-500 to-purple-500",
      "from-green-500 to-teal-500",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-blue-500"
    ];

    // Create achievement object
    const achievementData = {
      userId: req.user?.id || new mongoose.Types.ObjectId(),
      userProfile: {
        name: userProfile.name.trim(),
        initials: userProfile.initials.trim(),
        department: userProfile.department.trim(),
        graduationYear: userProfile.graduationYear.toString().trim(),
        currentPosition: userProfile.currentPosition.trim()
      },
      title: title.trim(),
      description: description.trim(),
      achievementDate: new Date(achievementDate),
      category: category || 'academic',
      avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      congratulations: {
        count: 0,
        users: []
      }
    };

    console.log('💾 Creating achievement document...');
    const newAchievement = new Achievement(achievementData);
    
    console.log('💾 Saving to MongoDB...');
    const savedAchievement = await newAchievement.save();
    
    console.log('✅ Achievement saved successfully!');
    console.log('✅ Achievement ID:', savedAchievement._id);
    
    // Verify it was actually saved
    const verifyAchievement = await Achievement.findById(savedAchievement._id);
    console.log('✅ Verified in database:', !!verifyAchievement);
    console.log('=== END ACHIEVEMENT REQUEST ===\n');

    res.status(201).json({
      success: true,
      message: 'Achievement created successfully!',
      data: savedAchievement
    });
  } catch (error) {
    console.error('❌ Error creating achievement:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error creating achievement',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST congratulate achievement
router.post('/achievements/:id/congratulate', authenticateToken, async (req, res) => {
  try {
    const achievementId = req.params.id;
    const userId = req.user?.id || `anonymous-${req.ip}`;

    console.log(`👏 Congratulating achievement ${achievementId} by user ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(achievementId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid achievement ID'
      });
    }

    const achievement = await Achievement.findById(achievementId);
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Initialize if needed
    if (!achievement.congratulations) {
      achievement.congratulations = { count: 0, users: [] };
    }

    // Check if already congratulated
    const alreadyCongratulated = achievement.congratulations.users.some(
      user => user.userId.toString() === userId.toString()
    );
    
    if (alreadyCongratulated) {
      return res.status(400).json({
        success: false,
        message: 'You have already congratulated this achievement'
      });
    }

    // Add congratulation
    achievement.congratulations.users.push({
      userId: userId,
      timestamp: new Date()
    });
    achievement.congratulations.count += 1;

    await achievement.save();
    console.log('✅ Congratulation added successfully');

    res.json({
      success: true,
      message: 'Congratulations added!',
      data: {
        congratulationsCount: achievement.congratulations.count,
        userCongratulated: true
      }
    });
  } catch (error) {
    console.error('❌ Error adding congratulations:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding congratulations',
      error: error.message
    });
  }
});

// PUT update achievement
// In your existing NewsAndAchievementsRoutes.js, ensure you have:

// PUT update achievement
router.put('/achievements/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, achievementDate, category } = req.body;
    const achievementId = req.params.id;

    console.log(`🔄 Updating achievement ${achievementId}`);

    // Find the achievement first to check ownership
    const achievement = await Achievement.findById(achievementId);
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Check if user owns this achievement
    if (achievement.userId.toString() !== req.user?.id && 
        !achievement.userId.toString().includes('anonymous')) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own achievements'
      });
    }

    // Update fields
    if (title) achievement.title = title.trim();
    if (description) achievement.description = description.trim();
    if (achievementDate) achievement.achievementDate = new Date(achievementDate);
    if (category) achievement.category = category;

    achievement.updatedAt = new Date();

    const updated = await achievement.save();
    console.log('✅ Achievement updated:', updated._id);

    res.json({
      success: true,
      message: 'Achievement updated successfully!',
      data: updated
    });
  } catch (error) {
    console.error('❌ Error updating achievement:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating achievement',
      error: error.message
    });
  }
});

// DELETE achievement
router.delete('/achievements/:id', authenticateToken, async (req, res) => {
  try {
    const achievementId = req.params.id;
    
    console.log(`🗑️ Deleting achievement ${achievementId}`);

    // Find the achievement first to check ownership
    const achievement = await Achievement.findById(achievementId);
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Check if user owns this achievement
    if (achievement.userId.toString() !== req.user?.id && 
        !achievement.userId.toString().includes('anonymous')) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own achievements'
      });
    }

    await Achievement.findByIdAndDelete(achievementId);
    console.log('✅ Achievement deleted:', achievementId);

    res.json({
      success: true,
      message: 'Achievement deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting achievement',
      error: error.message
    });
  }
});

export default router;


// ===================================
// FILE 2: Key Frontend Fixes for NewsAndAchievements.jsx
// ===================================

// REPLACE your loadUserProfile function with this:
const loadUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // Try cached profile first
    const cachedProfile = localStorage.getItem('userProfile');
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        setUserProfile(parsed);
        console.log('📦 Using cached profile:', parsed);
      } catch (e) {
        console.error('Error parsing cached profile:', e);
      }
    }
    
    if (!token) {
      console.warn('⚠️ No authentication token found');
      setUserProfile(getFallbackProfile());
      return;
    }

    console.log('🔍 Fetching fresh profile from API...');
    
    const response = await fetch('http://localhost:5000/api/alumni/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ Profile API returned ${response.status}`);
      setUserProfile(getFallbackProfile());
      return;
    }

    const data = await response.json();
    console.log('✅ Raw profile response:', data);
    
    // Extract profile from response
    let profileData = data.success && data.data ? data.data : 
                     data.alumni ? data.alumni :
                     data.user ? data.user :
                     data;
    
    if (!profileData || typeof profileData !== 'object') {
      console.warn('⚠️ Invalid profile data structure');
      setUserProfile(getFallbackProfile());
      return;
    }
    
    // Map all possible field locations
    const userProfileData = {
      name: profileData.personalInfo?.fullName || 
            profileData.fullName ||
            profileData.name || 
            "Alumni Member",
      initials: getInitials(
        profileData.personalInfo?.fullName || 
        profileData.fullName || 
        profileData.name || 
        "Alumni Member"
      ),
      department: profileData.academicInfo?.branch || 
                 profileData.department || 
                 profileData.branch ||
                 profileData.academicInfo?.degree ||
                 profileData.degree ||
                 "General",
      graduationYear: String(
        profileData.academicInfo?.graduationYear || 
        profileData.graduationYear || 
        profileData.yearOfPassing ||
        profileData.academicInfo?.yearOfPassing ||
        "2024"
      ),
      currentPosition: getCurrentPosition(
        profileData.careerStatus, 
        profileData.careerDetails,
        profileData.currentPosition
      )
    };
    
    console.log('✅ Processed profile:', userProfileData);
    setUserProfile(userProfileData);
    localStorage.setItem('userProfile', JSON.stringify(userProfileData));
    
    if (profileData._id) {
      setCurrentUserId(profileData._id);
    }
    
  } catch (error) {
    console.error('❌ Error loading user profile:', error);
    setUserProfile(getFallbackProfile());
  }
};

// REPLACE your handleSubmitAchievement function with this:
const handleSubmitAchievement = async (e) => {
  e.preventDefault();
  
  console.log('\n=== SUBMITTING ACHIEVEMENT ===');
  console.log('1. User Profile:', userProfile);
  console.log('2. Form Data:', newAchievement);
  
  if (!userProfile) {
    setError('❌ Please complete your profile first');
    setTimeout(() => setError(null), 3000);
    return;
  }

  // Validate all fields
  if (!newAchievement.title.trim()) {
    setError('❌ Please enter a title');
    setTimeout(() => setError(null), 3000);
    return;
  }

  if (!newAchievement.description.trim()) {
    setError('❌ Please enter a description');
    setTimeout(() => setError(null), 3000);
    return;
  }

  if (!newAchievement.achievementDate) {
    setError('❌ Please select an achievement date');
    setTimeout(() => setError(null), 3000);
    return;
  }

  try {
    const achievementData = {
      title: newAchievement.title,
      description: newAchievement.description,
      achievementDate: newAchievement.achievementDate,
      category: newAchievement.category,
      userProfile: {
        name: userProfile.name,
        initials: userProfile.initials,
        department: userProfile.department,
        graduationYear: userProfile.graduationYear,
        currentPosition: userProfile.currentPosition
      }
    };

    console.log('3. Sending to API:', achievementData);

    const response = await achievementsAPI.create(achievementData);
    
    console.log('4. API Response:', response.data);
    
    if (response.data.success) {
      console.log('✅ SUCCESS! Achievement ID:', response.data.data._id);
      
      // Add to list
      const newAchievementData = {
        ...response.data.data,
        congratulations: { count: 0, users: [] },
        userCongratulated: false
      };
      
      setAchievements([newAchievementData, ...achievements]);
      handleCloseAchievementModal();
      setSuccessMessage("🎉 Achievement shared successfully! 🏆");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('❌ Response:', error.response?.data);
    
    const errorMsg = error.response?.data?.message || 'Failed to add achievement';
    setError(`❌ ${errorMsg}`);
    setTimeout(() => setError(null), 5000);
  }
  
  console.log('=== END SUBMISSION ===\n');
};