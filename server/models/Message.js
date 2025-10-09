import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String },
  messageType: { type: String, enum: ['text', 'image', 'file', 'call'], default: 'text' },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  fileMimeType: String,
  callType: { type: String, enum: ['voice', 'video'] },
  callStatus: { type: String, enum: ['initiated', 'connected', 'missed', 'declined', 'ended'] },
  callDuration: Number,
  callRoomId: String,
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    message: String,
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: String,
    messageType: String
  },
  isRead: { type: Boolean, default: false },
  isDelivered: { type: Boolean, default: false },
  readAt: Date,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  securityFlags: [String]
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });

messageSchema.statics.saveCallMessage = async function(callData) {
  const messageTexts = {
    voice: { initiated: 'Voice call started', connected: 'Voice call connected', missed: 'Voice call missed', declined: 'Voice call declined', ended: 'Voice call ended' },
    video: { initiated: 'Video call started', connected: 'Video call connected', missed: 'Video call missed', declined: 'Video call declined', ended: 'Video call ended' }
  };

  const message = new this({
    conversationId: callData.conversationId,
    senderId: callData.senderId,
    receiverId: callData.receiverId,
    message: messageTexts[callData.callType][callData.callStatus],
    messageType: 'call',
    callType: callData.callType,
    callStatus: callData.callStatus,
    callDuration: callData.callDuration,
    callRoomId: callData.callRoomId,
    securityFlags: ['verified']
  });

  return message.save();
};

export default mongoose.model('Message', messageSchema);
