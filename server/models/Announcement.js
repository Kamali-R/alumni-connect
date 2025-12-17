import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Announcements', 'Academic', 'Events', 'General'],
    default: 'General'
  },
  audience: {
    type: String,
    enum: ['All Users', 'Alumni Only', 'Students Only'],
    default: 'All Users'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Announcement', announcementSchema);
