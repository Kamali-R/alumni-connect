import mongoose from 'mongoose';

const AlumniSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  // ... other fields with proper validation
  status: { type: String, enum: ['draft', 'complete'], default: 'draft' }
}, { timestamps: true });

// Add index for better query performance
AlumniSchema.index({ userId: 1 });
AlumniSchema.index({ email: 1 });

export default mongoose.model('Alumni', AlumniSchema);