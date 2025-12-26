import mongoose from 'mongoose';

const mentorshipSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  menteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'declined', 'cancelled'],
    default: 'pending'
  },
  mentorDetails: {
    expertise: [{
      category: String,
      skills: [String]
    }],
    availability: String,
    description: String,
    industry: String,
    experience: String,
    companySize: String,
    location: String
  },
  requestMessage: {
    type: String,
    default: ''
  },
  goals: [{
    type: String
  }],
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  sessions: [{
    date: Date,
    duration: Number, // in minutes
    notes: String,
    topics: [String]
  }],
  feedback: {
    mentorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    menteeRating: {
      type: Number,
      min: 1,
      max: 5
    },
    mentorFeedback: String,
    menteeFeedback: String
  }
}, { timestamps: true });

// Index for efficient queries
mentorshipSchema.index({ mentorId: 1, menteeId: 1 });
mentorshipSchema.index({ status: 1 });

const Mentorship = mongoose.model('Mentorship', mentorshipSchema);

export default Mentorship;
