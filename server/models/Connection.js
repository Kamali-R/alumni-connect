import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester ID is required']
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  // Track roles for filtering
  requesterRole: {
    type: String,
    enum: ['student', 'alumni'],
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['student', 'alumni'],
    required: true
  }
}, {
  timestamps: true
});

// Prevent duplicate connections
connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

// Static method to find connection between two users
connectionSchema.statics.findConnection = async function(userId1, userId2) {
  return this.findOne({
    $or: [
      { requesterId: userId1, recipientId: userId2 },
      { requesterId: userId2, recipientId: userId1 }
    ]
  });
};

// Method to check if connection exists
connectionSchema.statics.connectionExists = async function(userId1, userId2) {
  const connection = await this.findConnection(userId1, userId2);
  return !!connection;
};

export default mongoose.model('Connection', connectionSchema);