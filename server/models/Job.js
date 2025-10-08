// models/Job.js - Updated version
import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true
  },
  salary: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Internship']
  },
  experience: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 50
  },
  applyLink: {
    type: String,
    required: true
  },
  referralCode: {
    type: String,
    default: ''
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open'
  },
  datePosted: {
    type: Date,
    default: Date.now
  },
  // New fields for applications
  applications: [{
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
  }]
}, {
  timestamps: true
});

// Index for better query performance
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ 'applications.studentId': 1 });

export default mongoose.model('Job', JobSchema);