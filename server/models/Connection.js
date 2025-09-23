import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  },
  message: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Ensure unique connections
connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

// Add index for better query performance
connectionSchema.index({ requesterId: 1, status: 1 });
connectionSchema.index({ recipientId: 1, status: 1 });

// Virtual for checking if connection is active
connectionSchema.virtual('isActive').get(function() {
  return this.status === 'accepted';
});

// Method to check if user can interact with connection
connectionSchema.methods.canRespond = function(userId) {
  return this.recipientId.toString() === userId.toString() && this.status === 'pending';
};

connectionSchema.methods.canCancel = function(userId) {
  return this.requesterId.toString() === userId.toString() && this.status === 'pending';
};

export default mongoose.model('Connection', connectionSchema);