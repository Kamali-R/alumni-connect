// Updated Achievement Model with better validation
import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and string for anonymous users
    required: true,
    index: true
  },
  userProfile: {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },
    initials: {
      type: String,
      required: [true, 'User initials are required'],
      trim: true,
      maxlength: 2
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    graduationYear: {
      type: String,
      required: [true, 'Graduation year is required'],
      trim: true
    },
    currentPosition: {
      type: String,
      required: [true, 'Current position is required'],
      trim: true
    },
    role: {
      type: String,
      enum: ['student', 'alumni', 'admin'],
      default: 'alumni',
      trim: true
    }
  },
  title: {
    type: String,
    required: [true, 'Achievement title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Achievement description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  achievementDate: {
    type: Date,
    required: [true, 'Achievement date is required'],
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Achievement date cannot be in the future'
    }
  },
  category: {
    type: String,
    enum: {
      values: ['academic', 'research', 'competition', 'career', 'entrepreneurship', 'social', 'sports', 'arts', 'innovation'],
      message: '{VALUE} is not a valid category'
    },
    default: 'academic'
  },
  avatarColor: {
    type: String,
    default: 'from-blue-500 to-purple-500'
  },
  company: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    trim: true
  },
  deal: {
    type: String,
    trim: true
  },
  publication: {
    type: String,
    trim: true
  },
  recognition: {
    type: String,
    trim: true
  },
  congratulations: {
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    users: [{
      userId: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Virtual for calculating time ago
achievementSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / (86400000 * 7));
  const months = Math.floor(diff / (86400000 * 30));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  return `${months} month${months !== 1 ? 's' : ''} ago`;
});

// Ensure virtual fields are serialized
achievementSchema.set('toJSON', { virtuals: true });
achievementSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
achievementSchema.index({ userId: 1, createdAt: -1 });
achievementSchema.index({ category: 1 });
achievementSchema.index({ 'congratulations.users.userId': 1 });

// Pre-save middleware for logging
achievementSchema.pre('save', function(next) {
  console.log('💾 Saving achievement:', this.title);
  next();
});

// Post-save middleware for confirmation
achievementSchema.post('save', function(doc) {
  console.log('✅ Achievement saved with ID:', doc._id);
});

export default mongoose.model('Achievement', achievementSchema);