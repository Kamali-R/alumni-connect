import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const alumniSchema = new mongoose.Schema({
  // Basic profile
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  graduationYear: String,
  currentPosition: String,
  company: String,
  companySize: String,
  skills: [String],
  industry: String,
  experience: String,
  location: String,
  availability: String,
  description: String,

  // Mentorship flags
  isMentor: {
    type: Boolean,
    default: false
  },
  mentorshipAvailability: String,
  expertise: [String],

  // Mentorship program relationships
  mentorProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorProfile'
  },
  sentRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorshipRequest'
  }],
  receivedRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorshipRequest'
  }],
  mentorshipsAsMentor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorshipRequest'
  }],
  mentorshipsAsMentee: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorshipRequest'
  }]
}, {
  timestamps: true
});

// 🔒 Password hashing
alumniSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 Password comparison
alumniSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Alumni = mongoose.model('Alumni', alumniSchema);
export default Alumni;
