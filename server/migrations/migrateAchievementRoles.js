import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Achievement from '../models/Achievement.js';

dotenv.config();

async function migrateAchievementRoles() {
  try {
    console.log('🔄 Starting achievement roles migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni-connect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find all achievements without role or with undefined role
    const achievementsWithoutRole = await Achievement.find({
      $or: [
        { 'userProfile.role': { $exists: false } },
        { 'userProfile.role': null },
        { 'userProfile.role': undefined }
      ]
    });
    
    console.log(`📊 Found ${achievementsWithoutRole.length} achievements without role`);
    
    if (achievementsWithoutRole.length === 0) {
      console.log('✅ All achievements already have roles!');
      await mongoose.connection.close();
      return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
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
          { new: true, runValidators: false } // Skip validators to avoid issues
        );
        
        console.log(`✅ Updated: ${achievement.userProfile?.name || 'Unknown'} → ${role}`);
        updatedCount++;
        
      } catch (err) {
        console.error(`❌ Error updating achievement ${achievement._id}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total: ${updatedCount + errorCount}`);
    
    await mongoose.connection.close();
    console.log('✅ Migration completed and connection closed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateAchievementRoles();
