import mongoose from 'mongoose';

const MentorshipRequestSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate requests from same student to same mentor
MentorshipRequestSchema.index({ mentor: 1, student: 1 }, { unique: true });

export default mongoose.model('MentorshipRequest', MentorshipRequestSchema);
