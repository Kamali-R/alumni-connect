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
        return mongoose.Types.ObjectId.isValid(v) && v.toString() !== this.requesterId?.toString();
      },
      message: 'Invalid recipient ID or cannot connect to yourself'
    }
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
  }
}, {
  timestamps: true
});

// Enhanced pre-save validation
connectionSchema.pre('save', function(next) {
  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(this.requesterId) || 
      !mongoose.Types.ObjectId.isValid(this.recipientId)) {
    return next(new Error('Invalid user ID format'));
  }
  
  // Convert to string for comparison
  const requesterStr = this.requesterId.toString();
  const recipientStr = this.recipientId.toString();
  
  // Prevent self-connection
  if (requesterStr === recipientStr) {
    return next(new Error('Cannot send connection request to yourself'));
  }
  
  // Ensure requesterId is always first in alphabetical order for consistent indexing
  if (requesterStr > recipientStr) {
    // Swap to maintain consistent order
    [this.requesterId, this.recipientId] = [this.recipientId, this.requesterId];
  }
  
  next();
});

// Static method to find connection between two users
connectionSchema.statics.findConnection = async function(userId1, userId2) {
  if (!mongoose.Types.ObjectId.isValid(userId1) || !mongoose.Types.ObjectId.isValid(userId2)) {
    throw new Error('Invalid user ID');
  }
  
  // Convert to strings for consistent ordering
  const id1 = userId1.toString();
  const id2 = userId2.toString();
  
  // Always query with consistent order
  const [firstId, secondId] = id1 < id2 ? [id1, id2] : [id2, id1];
  
  return this.findOne({
    requesterId: firstId,
    recipientId: secondId
  });
};

// Method to check if connection exists
connectionSchema.statics.connectionExists = async function(userId1, userId2) {
  const connection = await this.findConnection(userId1, userId2);
  return !!connection;
};

// Create compound index with strict filtering
connectionSchema.index({ requesterId: 1, recipientId: 1 }, { 
  unique: true,
  name: 'unique_connection_pair',
  partialFilterExpression: {
    requesterId: { $exists: true, $ne: null, $type: 'objectId' },
    recipientId: { $exists: true, $ne: null, $type: 'objectId' },
    status: { $in: ['pending', 'accepted'] }
  }
});

// Additional indexes for better performance
connectionSchema.index({ recipientId: 1, status: 1 });
connectionSchema.index({ requesterId: 1, status: 1 });
connectionSchema.index({ status: 1 });
connectionSchema.index({ requestedAt: -1 });

// Virtual for populated data
connectionSchema.virtual('requester', {
  ref: 'User',
  localField: 'requesterId',
  foreignField: '_id',
  justOne: true
});

connectionSchema.virtual('recipient', {
  ref: 'User',
  localField: 'recipientId',
  foreignField: '_id',
  justOne: true
});

connectionSchema.set('toJSON', { virtuals: true });
connectionSchema.set('toObject', { virtuals: true });

export default mongoose.model('Connection', connectionSchema);