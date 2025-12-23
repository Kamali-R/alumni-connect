import express from 'express';
import { getSkillsOverview, searchSkills, getEventsForAdmin } from '../controllers/adminController.js';
import auth from '../middleware/authMiddleware.js';
import Achievement from '../models/Achievement.js';

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

// Get skills and technologies overview
router.get('/skills/overview', auth, getSkillsOverview);

// Search skills
router.get('/skills/search', auth, searchSkills);

// Migrate achievement roles (populate missing role fields)
router.post('/migrate-achievement-roles', auth, async (req, res) => {
  try {
    console.log('🔄 Starting achievement roles migration...');
    
    // Find all achievements without role or with undefined role
    const achievementsWithoutRole = await Achievement.find({
      $or: [
        { 'userProfile.role': { $exists: false } },
        { 'userProfile.role': null },
        { 'userProfile.role': undefined }
      ]
    });
    
    console.log(`📊 Found ${achievementsWithoutRole.length} achievements without role`);
    
    let updatedCount = 0;
    let errorCount = 0;
    const updates = [];
    
    // Update each achievement
    for (const achievement of achievementsWithoutRole) {
      try {
        // Determine role based on profile data
        let role = 'alumni'; // Default to alumni
        
        if (achievement.userProfile) {
          const currentPosition = (achievement.userProfile.currentPosition || '').toLowerCase();
          const graduationYear = parseInt(achievement.userProfile.graduationYear) || 0;
          const currentYear = new Date().getFullYear();
          
          // If position mentions "student" or graduation year is in future, mark as student
          if (currentPosition.includes('student') || graduationYear > currentYear) {
            role = 'student';
          }
        }
        
        // Update the achievement
        await Achievement.findByIdAndUpdate(
          achievement._id,
          { $set: { 'userProfile.role': role } },
          { new: true, runValidators: false }
        );
        
        updates.push({
          name: achievement.userProfile?.name || 'Unknown',
          role: role
        });
        updatedCount++;
        
      } catch (err) {
        console.error(`❌ Error updating achievement:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`✅ Migration completed: ${updatedCount} updated, ${errorCount} errors`);
    
    res.json({
      success: true,
      message: `Migration completed: ${updatedCount} achievements updated, ${errorCount} errors`,
      data: {
        updated: updatedCount,
        errors: errorCount,
        details: updates
      }
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// Get all events categorized for admin dashboard
router.get('/events', auth, getEventsForAdmin);

export default router;
