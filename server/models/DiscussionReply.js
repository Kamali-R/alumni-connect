// models/DiscussionReply.js
import mongoose from 'mongoose';

const discussionReplySchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Reply content is required'],
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  discussion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    required: true
  },
  parentReply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiscussionReply',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isSolution: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
discussionReplySchema.index({ discussion: 1, createdAt: 1 });
discussionReplySchema.index({ author: 1 });
discussionReplySchema.index({ parentReply: 1 });

// Virtual for like count
discussionReplySchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Method to check if user liked the reply
discussionReplySchema.methods.isLikedByUser = function(userId) {
  return this.likes.includes(userId);
};

discussionReplySchema.set('toJSON', { virtuals: true });

export default mongoose.model('DiscussionReply', discussionReplySchema);