import express from 'express';
import mongoose from 'mongoose'; // ADDED: Import mongoose
import News from '../models/News.js';
import Achievement from '../models/Achievement.js';

const router = express.Router();

// FIXED: Single GET achievements route with proper structure
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({ createdAt: -1 });
    
    // If user is authenticated, include whether they congratulated each achievement
    const userId = req.user?.id || req.ip;
    const achievementsWithUserStatus = achievements.map(achievement => {
      const achievementObj = achievement.toObject();
      
      const userIdentifier = userId?.toString();
      achievementObj.userCongratulated = achievement.congratulations?.users?.some(user => 
        user.userId === userIdentifier
      ) || false;
      
      return achievementObj;
    });

    res.json({
      success: true,
      data: achievementsWithUserStatus
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements',
      error: error.message
    });
  }
});

// Get all news
router.get('/news', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching news',
      error: error.message
    });
  }
});

// FIXED: Add new achievement with proper validation
router.post('/achievements', async (req, res) => {
  try {
    const {
      title,
      description,
      achievementDate,
      category,
      userProfile
    } = req.body;

    // Validate required fields
    if (!title || !description || !achievementDate || !userProfile) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, achievement date, and user profile are required'
      });
    }

    // Validate userProfile has required fields
    if (!userProfile.name || !userProfile.initials || !userProfile.department || 
        !userProfile.graduationYear || !userProfile.currentPosition) {
      return res.status(400).json({
        success: false,
        message: 'Complete user profile information is required'
      });
    }

    // Avatar color options
    const avatarColors = [
      "from-blue-500 to-purple-500",
      "from-green-500 to-teal-500",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-blue-500",
      "from-teal-500 to-green-500",
      "from-pink-500 to-rose-500",
      "from-cyan-500 to-blue-500"
    ];

    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    // Calculate time ago
    const getTimeAgo = (date) => {
      const now = new Date();
      const diff = now - new Date(date);
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    };

    const newAchievement = new Achievement({
      userId: req.user?.id || new mongoose.Types.ObjectId(),
      userProfile: {
        name: userProfile.name.trim(),
        initials: userProfile.initials.trim(),
        department: userProfile.department.trim(),
        graduationYear: userProfile.graduationYear.toString(),
        currentPosition: userProfile.currentPosition.trim()
      },
      title: title.trim(),
      description: description.trim(),
      achievementDate: new Date(achievementDate),
      category: category || 'academic',
      time: getTimeAgo(new Date()),
      avatarColor: randomColor,
      congratulations: {
        count: 0,
        users: []
      }
    });

    const savedAchievement = await newAchievement.save();

    res.status(201).json({
      success: true,
      message: 'Achievement added successfully!',
      data: savedAchievement
    });
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(400).json({
      success: false,
      message: 'Error adding achievement',
      error: error.message
    });
  }
});

// Congratulate achievement
router.post('/achievements/:id/congratulate', async (req, res) => {
  try {
    const achievementId = req.params.id;
    const userId = req.user?.id || req.ip;

    const achievement = await Achievement.findById(achievementId);
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Initialize congratulations object if it doesn't exist
    if (!achievement.congratulations) {
      achievement.congratulations = {
        count: 0,
        users: []
      };
    }

    // Check if user already congratulated
    const userIdentifier = userId.toString();
    const alreadyCongratulated = achievement.congratulations.users.some(user => 
      user.userId === userIdentifier
    );
    
    if (alreadyCongratulated) {
      return res.status(400).json({
        success: false,
        message: 'You have already congratulated this achievement'
      });
    }

    // Add user to congratulations list and increment count
    achievement.congratulations.users.push({
      userId: userIdentifier,
      timestamp: new Date()
    });
    achievement.congratulations.count += 1;

    await achievement.save();

    res.json({
      success: true,
      message: 'Congratulations added!',
      data: {
        congratulationsCount: achievement.congratulations.count,
        userCongratulated: true
      }
    });
  } catch (error) {
    console.error('Error adding congratulations:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding congratulations',
      error: error.message
    });
  }
});

// Get congratulations status for a specific achievement
router.get('/achievements/:id/congratulations', async (req, res) => {
  try {
    const achievementId = req.params.id;
    const userId = req.user?.id || req.ip;

    const achievement = await Achievement.findById(achievementId);
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    const userIdentifier = userId.toString();
    const userCongratulated = achievement.congratulations?.users?.some(user => 
      user.userId === userIdentifier
    ) || false;

    res.json({
      success: true,
      data: {
        congratulationsCount: achievement.congratulations?.count || 0,
        userCongratulated
      }
    });
  } catch (error) {
    console.error('Error fetching congratulations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching congratulations',
      error: error.message
    });
  }
});

// Add new news item
router.post('/news', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      time,
      details
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const newNews = new News({
      title: title.trim(),
      description: description.trim(),
      category: category || 'general',
      time: time || 'Just now',
      details: details || {}
    });

    const savedNews = await newNews.save();

    res.status(201).json({
      success: true,
      message: 'News added successfully!',
      data: savedNews
    });
  } catch (error) {
    console.error('Error adding news:', error);
    res.status(400).json({
      success: false,
      message: 'Error adding news',
      error: error.message
    });
  }
});

// Delete achievement
router.delete('/achievements/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndDelete(req.params.id);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    res.json({
      success: true,
      message: 'Achievement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting achievement',
      error: error.message
    });
  }
});

// Delete news
router.delete('/news/:id', async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.json({
      success: true,
      message: 'News deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting news',
      error: error.message
    });
  }
});

export default router;