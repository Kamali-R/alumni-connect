import mongoose from 'mongoose';

const mentorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  expertise: [{
    category: {
      type: String,
      required: true
    },
    skills: [{
      type: String
    }]
  }],
  availability: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Weekends', 'Flexible'],
    default: 'Flexible'
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
    enum: ['1-3 years', '3-5 years', '5-10 years', '10+ years'],
    required: true
  },
  companySize: {
    type: String,
    enum: ['Startup (<50)', 'Small (50-200)', 'Medium (200-1000)', 'Large (1000+)']
  },
  location: {
    type: String,
    required: true
  },
  mentorshipStyle: {
    type: String,
    enum: ['Structured', 'Casual', 'Project-based', 'Career Guidance'],
    default: 'Casual'
  },
  preferredCommunication: [{
    type: String,
    enum: ['Video Call', 'Phone Call', 'Chat', 'Email', 'In-person']
  }],
  languages: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0
  },
  totalMentees: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema);

export default MentorProfile;
