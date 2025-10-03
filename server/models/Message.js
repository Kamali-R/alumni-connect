import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'call'],
    default: 'text'
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  fileMimeType: {
    type: String
  },
  // Reply functionality
  replyTo: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    message: {
      type: String
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    senderName: {
      type: String
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'call']
    }
  },
  // Call-specific fields
  callType: {
    type: String,
    enum: ['voice', 'video', null],
    default: null
  },
  callStatus: {
    type: String,
    enum: ['initiated', 'connected', 'missed', 'declined', 'ended', null],
    default: null
  },
  callDuration: {
    type: Number // in seconds
  },
  callRoomId: {
    type: String
  },
  // Message status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Security audit fields
  isSecure: {
    type: Boolean,
    default: true
  },
  securityFlags: [{
    type: String,
    enum: ['encrypted', 'verified', 'scanned']
  }]
}, {
  timestamps: true
});

// Indexes for better performance
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ 'securityFlags': 1 });
messageSchema.index({ 'replyTo.messageId': 1 });
messageSchema.index({ isDeleted: 1 });
messageSchema.index({ callRoomId: 1 });

// Virtual for formatted call duration
messageSchema.virtual('formattedDuration').get(function() {
  if (!this.callDuration) return null;
  const minutes = Math.floor(this.callDuration / 60);
  const seconds = this.callDuration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Static method to save call messages
// In message.js - Fix the static method
messageSchema.statics.saveCallMessage = async function(callData) {
  try {
    const messageTexts = {
      voice: {
        initiated: 'Voice call started',
        connected: 'Voice call connected',
        missed: 'Voice call missed',
        declined: 'Voice call declined',
        ended: 'Voice call ended'
      },
      video: {
        initiated: 'Video call started',
        connected: 'Video call connected',
        missed: 'Video call missed',
        declined: 'Video call declined',
        ended: 'Video call ended'
      }
    };

    const message = new this({
      conversationId: callData.conversationId,
      senderId: callData.senderId,
      receiverId: callData.receiverId,
      message: messageTexts[callData.callType][callData.callStatus],
      messageType: 'call',
      callType: callData.callType,
      callStatus: callData.callStatus,
      callDuration: callData.callDuration || 0,
      callRoomId: callData.callRoomId,
      isDelivered: true,
      securityFlags: ['verified']
    });

    const savedMessage = await message.save();
    
    // Update conversation last message
    const Conversation = mongoose.model('Conversation');
    const conversation = await Conversation.findById(callData.conversationId);
    if (conversation) {
      conversation.lastMessage = messageTexts[callData.callType][callData.callStatus];
      conversation.lastMessageAt = new Date();
      
      // Increment unread count for receiver
      const currentUnread = conversation.unreadCount.get(callData.receiverId.toString()) || 0;
      conversation.unreadCount.set(callData.receiverId.toString(), currentUnread + 1);
      
      await conversation.save();
    }

    return savedMessage;
  } catch (error) {
    console.error('❌ Save call message error:', error);
    throw error;
  }
};

// Method to soft delete message
messageSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Query helper to exclude deleted messages
messageSchema.query.excludeDeleted = function() {
  return this.where({ isDeleted: false });
};

export default mongoose.model('Message', messageSchema);