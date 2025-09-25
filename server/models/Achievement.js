import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  personType: {
    type: String,
    enum: ['alumni', 'student'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  initials: {
    type: String,
    required: true,
    maxlength: 3
  },
  department: {
    type: String,
    required: true
  },
  graduationYear: {
    type: String
  },
  currentPosition: {
    type: String
  },
  currentYear: {
    type: String
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['academic', 'research', 'competition', 'career', 'entrepreneurship', 'social', 'sports', 'arts', 'innovation'],
    default: 'academic'
  },
  time: {
    type: String,
    required: true
  },
  company: String,
  level: String,
  deal: String,
  publication: String,
  recognition: String,
  scope: String,
  status: String,
  avatarColor: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Achievement', achievementSchema);