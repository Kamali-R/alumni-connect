import express from 'express';
import News from '../models/News.js';
import Achievement from '../models/Achievement.js';

const router = express.Router();

// Get all news
router.get('/news', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching news',
      error: error.message
    });
  }
});

// Get all achievements
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements',
      error: error.message
    });
  }
});

// Add new achievement
router.post('/achievements', async (req, res) => {
  try {
    const {
      name,
      initials,
      department,
      graduationYear,
      currentPosition,
      title,
      description,
      category
    } = req.body;

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

    const newAchievement = new Achievement({
      personType: 'alumni',
      name,
      initials,
      department,
      graduationYear,
      currentPosition,
      title,
      description,
      category,
      time: 'Just now',
      avatarColor: randomColor
    });

    const savedAchievement = await newAchievement.save();

    res.status(201).json({
      success: true,
      message: 'Achievement added successfully!',
      data: savedAchievement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding achievement',
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

    const newNews = new News({
      title,
      description,
      category,
      time,
      details
    });

    const savedNews = await newNews.save();

    res.status(201).json({
      success: true,
      message: 'News added successfully!',
      data: savedNews
    });
  } catch (error) {
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
    res.status(500).json({
      success: false,
      message: 'Error deleting news',
      error: error.message
    });
  }
});

export default router;