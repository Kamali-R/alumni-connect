import mongoose from 'mongoose';

const mentorshipSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  menteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  mentorDetails: {
    expertise: [String],
    availability: String,
    description: String,
    industry: String,
    experience: String,
    companySize: String,
    location: String
  },
  requestMessage: String,
  startDate: Date,
  endDate: Date,
  goals: [String],
  sessions: [{
    date: Date,
    duration: Number,
    notes: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
mentorshipSchema.index({ mentorId: 1, status: 1 });
mentorshipSchema.index({ menteeId: 1, status: 1 });
mentorshipSchema.index({ status: 1 });

export default mongoose.model('Mentorship', mentorshipSchema);