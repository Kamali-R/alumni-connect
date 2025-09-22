import mongoose from 'mongoose';

const mentorshipRequestSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumni',
    required: true
  },
  menteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumni',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Prevent duplicate pending requests
mentorshipRequestSchema.index(
  { mentorId: 1, menteeId: 1, status: 1 },
  { unique: true }
);

const MentorshipRequest = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
export default MentorshipRequest;
