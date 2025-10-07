import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false // ✅ Track if OTP has been verified
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Expires in 5 minutes
  },
});

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;