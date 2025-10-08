import mongoose from 'mongoose';

const successStorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Story title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Story content is required'],
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
      values: ['career', 'entrepreneurship', 'education', 'innovation', 'leadership', 'social-impact'],
      message: 'Invalid story category'
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
  isPublished: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
successStorySchema.index({ author: 1, createdAt: -1 });
successStorySchema.index({ category: 1, createdAt: -1 });
successStorySchema.index({ featured: 1, createdAt: -1 });
successStorySchema.index({ likes: -1 });

// Virtual for like count
successStorySchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Method to check if user liked the story
successStorySchema.methods.isLikedByUser = function(userId) {
  return this.likes.includes(userId);
};

export default mongoose.model('SuccessStory', successStorySchema);