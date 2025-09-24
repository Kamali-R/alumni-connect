// models/Connection.js - FIXED VERSION
import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester ID is required'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v) && v.toString() !== this.recipientId?.toString();
      },
      message: 'Invalid requester ID or cannot connect to yourself'
    }
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Invalid recipient ID'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save validation to prevent null values
connectionSchema.pre('save', function(next) {
  if (!this.requesterId || !this.recipientId) {
    return next(new Error('Both requesterId and recipientId are required'));
  }
  
  if (this.requesterId.toString() === this.recipientId.toString()) {
    return next(new Error('Cannot connect to yourself'));
  }
  
  next();
});

// Static method to find connection between two users
connectionSchema.statics.findConnection = function(userId1, userId2) {
  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(userId1) || !mongoose.Types.ObjectId.isValid(userId2)) {
    throw new Error('Invalid user ID');
  }
  
  return this.findOne({
    $or: [
      { requesterId: userId1, recipientId: userId2 },
      { requesterId: userId2, recipientId: userId1 }
    ]
  });
};

// Create compound index with proper filtering
connectionSchema.index({ requesterId: 1, recipientId: 1 }, { 
  unique: true,
  name: 'unique_connection_pair',
  partialFilterExpression: {
    requesterId: { $exists: true, $type: 'objectId' },
    recipientId: { $exists: true, $type: 'objectId' }
  }
});

// Additional indexes for better performance
connectionSchema.index({ recipientId: 1, status: 1 });
connectionSchema.index({ requesterId: 1, status: 1 });
connectionSchema.index({ status: 1, requestedAt: -1 });

export default mongoose.model('Connection', connectionSchema);