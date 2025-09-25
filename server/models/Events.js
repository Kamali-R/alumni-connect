import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['networking', 'reunion', 'gala', 'workshop', 'social', 'fundraiser', 'other']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    required: [true, 'Event time is required']
  },
  location: {
    type: String,
    required: [true, 'Event location is required']
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  rsvpInfo: {
    type: String,
    default: ''
  },
  attendance: {
    type: Number,
    default: 0
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for better query performance
eventSchema.index({ type: 1, date: 1, location: 1 });
eventSchema.pre('save', function(next) {
  this.attendance = this.attendees.length;
  next();
});


export default mongoose.model('Event', eventSchema);