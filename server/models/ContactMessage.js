import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  message: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('ContactMessage', contactMessageSchema);
