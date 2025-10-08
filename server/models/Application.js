// models/Application.js
import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Applied', 'Under Review', 'Rejected', 'Accepted'],
    default: 'Applied'
  },
  coverLetter: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure a student can only apply once to a job
ApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('Application', ApplicationSchema);