import mongoose from 'mongoose';

const MentorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  position: { type: String, default: '' },
  company: { type: String, default: '' },
  bio: { type: String, default: '' },
  expertise: [{ type: String }],
  availability: { type: String, default: '' },
  industry: { type: String, default: '' },
  location: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Ensure a user has at most one mentor profile
MentorSchema.index({ user: 1 }, { unique: true });

export default mongoose.model('Mentor', MentorSchema);
