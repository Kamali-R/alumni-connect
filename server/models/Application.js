// server/models/Application.js
import mongoose from 'mongoose';

/**
 * Unified Application schema used for both Event applications and Job applications.
 * Backwards compatible fields are kept (student/event) while newer job-related fields
 * (jobId/studentId, status, coverLetter) are also supported. Some simple helpers
 * keep the two naming styles in sync when documents are saved/loaded.
 */

const ApplicationSchema = new mongoose.Schema({
  // Event-style fields (legacy)
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },

  // Job-style fields (newer)
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Common metadata
  studentName: { type: String, default: '' },
  studentEmail: { type: String, default: '' },
  message: { type: String, default: '' }, // used for event application message
  coverLetter: { type: String, default: '' }, // used for job applications

  // Status & timestamps
  appliedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Applied', 'Under Review', 'Rejected', 'Accepted'],
    default: 'Applied'
  }
}, {
  timestamps: true
});

// Keep legacy and new fields in sync before save
ApplicationSchema.pre('save', function(next) {
  // If studentId exists but student is missing, copy
  if (!this.student && this.studentId) this.student = this.studentId;
  if (!this.studentId && this.student) this.studentId = this.student;

  // If jobId exists but event is missing, leave event undefined (they are different concepts)
  // If event exists but jobId is missing, leave jobId undefined.

  // Ensure appliedAt is set when created
  if (!this.appliedAt) this.appliedAt = this.createdAt || new Date();
  next();
});

// Useful indexes: prevent duplicate applications for the same student -> event OR job
ApplicationSchema.index({ event: 1, student: 1 }, { unique: true, partialFilterExpression: { event: { $exists: true }, student: { $exists: true } } });
ApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true, partialFilterExpression: { jobId: { $exists: true }, studentId: { $exists: true } } });

export default mongoose.model('Application', ApplicationSchema);
