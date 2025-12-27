import express from 'express';
import { 
  getSkillsOverview, 
  searchSkills,
  getDashboardStats,
  getAdminUsers,
  getAdminEvents,
  updateAdminUser,
  deleteAdminUser,
  createAdminUser
} from '../controllers/adminController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Test endpoint (no auth required)
router.get('/skills/test', (req, res) => {
  console.log('📋 Skills test endpoint hit');
  res.status(200).json({
    success: true,
    message: 'Skills API is working',
    timestamp: new Date().toISOString()
  });
});

// Dashboard stats
router.get('/dashboard/stats', auth, getDashboardStats);

// Users management
router.get('/users', auth, getAdminUsers);
router.post('/users', auth, createAdminUser);
router.put('/users/:id', auth, updateAdminUser);
router.delete('/users/:id', auth, deleteAdminUser);

// Events management
router.get('/events', auth, getAdminEvents);

// Get skills and technologies overview
router.get('/skills/overview', auth, getSkillsOverview);

// Search skills
router.get('/skills/search', auth, searchSkills);

export default router;
