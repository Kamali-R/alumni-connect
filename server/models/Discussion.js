// models/Discussion.js
import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Discussion title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Discussion content is required'],
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: {
      values: ['career', 'industry', 'networking', 'education', 'technology', 'general'],
      message: 'Invalid discussion category'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
discussionSchema.index({ author: 1, createdAt: -1 });
discussionSchema.index({ category: 1, createdAt: -1 });
discussionSchema.index({ isPinned: -1, createdAt: -1 });
discussionSchema.index({ likes: -1 });

// Virtual for reply count
discussionSchema.virtual('replyCount', {
  ref: 'DiscussionReply',
  localField: '_id',
  foreignField: 'discussion',
  count: true
});

// Virtual for like count
discussionSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Method to check if user liked the discussion
discussionSchema.methods.isLikedByUser = function(userId) {
  return this.likes.includes(userId);
};

discussionSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Discussion', discussionSchema);