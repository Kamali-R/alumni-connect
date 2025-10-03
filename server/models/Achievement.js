import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userProfile: {
    name: {
      type: String,
      required: true
    },
    initials: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true
    },
    graduationYear: {
      type: String,
      required: true
    },
    currentPosition: {
      type: String,
      required: true
    }
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  achievementDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['academic', 'research', 'competition', 'career', 'entrepreneurship', 'social', 'sports', 'arts', 'innovation'],
    default: 'academic'
  },
  time: {
    type: String,
    default: 'Just now'
  },
  avatarColor: {
    type: String,
    default: 'from-blue-500 to-purple-500'
  },
  company: String,
  level: String,
  deal: String,
  publication: String,
  recognition: String,
  congratulations: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      userId: {
        type: String,
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
    default: Date.now
  }
});

achievementSchema.index({ userId: 1, createdAt: -1 });
achievementSchema.index({ 'congratulations.users.userId': 1 });

export default mongoose.model('Achievement', achievementSchema);