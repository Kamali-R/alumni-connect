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

// Static method to save call messages - FIXED VERSION
messageSchema.statics.saveCallMessage = async function(callData) {
  try {
    console.log('💾 saveCallMessage called with:', callData);
    
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

    const messageText = messageTexts[callData.callType]?.[callData.callStatus] || 'Call activity';
    
    console.log('📝 Creating message with text:', messageText);

    const message = new this({
      conversationId: callData.conversationId,
      senderId: callData.senderId,
      receiverId: callData.receiverId,
      message: messageText,
      messageType: 'call',
      callType: callData.callType,
      callStatus: callData.callStatus,
      callDuration: callData.callDuration || 0,
      callRoomId: callData.callRoomId,
      isDelivered: true,
      securityFlags: ['verified']
    });

    console.log('💾 Saving message to database...');
    const savedMessage = await message.save();
    console.log('✅ Message saved successfully:', savedMessage._id);
    
    // Update conversation
    const Conversation = mongoose.model('Conversation');
    const conversation = await Conversation.findById(callData.conversationId);
    
    if (conversation) {
      console.log('💬 Updating conversation:', conversation._id);
      conversation.lastMessage = messageText;
      conversation.lastMessageAt = new Date();
      
      // Increment unread count for receiver
      const receiverIdStr = callData.receiverId.toString();
      const currentUnread = conversation.unreadCount.get(receiverIdStr) || 0;
      conversation.unreadCount.set(receiverIdStr, currentUnread + 1);
      
      await conversation.save();
      console.log('✅ Conversation updated successfully');
    } else {
      console.log('⚠️ Conversation not found:', callData.conversationId);
    }

    return savedMessage;
  } catch (error) {
    console.error('❌ saveCallMessage error:', error);
    console.error('❌ Error details:', {
      conversationId: callData.conversationId,
      senderId: callData.senderId,
      receiverId: callData.receiverId,
      callType: callData.callType,
      callStatus: callData.callStatus
    });
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