import mongoose from 'mongoose';

const mentorProfileSchema = new mongoose.Schema({
  alumniId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumni',
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  expertise: [{
    type: String,
    required: true
  }],
  mentorshipStyle: String,
  previousMentoringExperience: String,
  menteePreferences: {
    industry: [String],
    experienceLevel: [String]
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('MentorProfile', mentorProfileSchema);
