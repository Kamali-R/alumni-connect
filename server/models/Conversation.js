import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Non-unique index for better query performance
conversationSchema.index({ participants: 1 });

// Method to find or create conversation
conversationSchema.statics.findOrCreateConversation = async function(userId1, userId2) {
  if (!userId1 || !userId2) {
    throw new Error('Both user IDs are required');
  }

  // First try to find existing conversation
  let conversation = await this.findOne({
    participants: { $all: [userId1, userId2] }
  });

  if (!conversation) {
    // Create new conversation
    conversation = new this({
      participants: [userId1, userId2],
      unreadCount: new Map([
        [userId1.toString(), 0],
        [userId2.toString(), 0]
      ])
    });
    await conversation.save();
  }

  return conversation;
};

export default mongoose.model('Conversation', conversationSchema);