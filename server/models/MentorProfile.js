import mongoose from 'mongoose';

const mentorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expertise: [{
    category: String,
    skills: [String]
  }],
  availability: {
    type: String,
    enum: ['1-2 hours/month', '3-4 hours/month', '5+ hours/month'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    enum: ['3-5 years', '5-10 years', '10-15 years', '15+ years'],
    required: true
  },
  companySize: {
    type: String,
    enum: ['Startup (1-50)', 'Medium (51-500)', 'Large (500+)'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  mentorshipStyle: {
    type: String,
    enum: ['Structured', 'Casual', 'Goal-oriented', 'Flexible']
  },
  preferredCommunication: [{
    type: String,
    enum: ['Video Call', 'Phone Call', 'Chat', 'Email']
  }],
  languages: [String],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

export default mongoose.model('MentorProfile', mentorProfileSchema);