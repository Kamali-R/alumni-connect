 import User from '../models/User.js';
import Otp from '../models/otp.js';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
import Alumni from '../models/Alumni.js';

// STEP 1: Send OTP
export const sendOtp = async (req, res) => {
  const { name, email, password, role, purpose } = req.body;
  if (!email)
    return res.status(400).json({ message: 'Email is required' });
  if (purpose === 'register') {
    if (!name || !password || !role)
      return res.status(400).json({ message: 'All fields are required for registration' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });
  } else if (purpose === 'reset') {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
  }
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await Otp.deleteMany({ email });
  const otp = new Otp({ email, otp: otpCode });
  await otp.save();
  await sendEmail(email, 'Your OTP Code', `Your OTP is: ${otpCode}`);
  res.status(200).json({ message: 'OTP sent to your email' });
};

// Updated verifyOtp function
export const verifyOtp = async (req, res) => {
  const { name, email, password, role, otp, purpose } = req.body;
  const otpRecord = await Otp.findOne({ email, otp });
  
  if (!otpRecord) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  
  if (purpose === 'register') {
    // Check if user already exists again (just in case)
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPwd = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPwd, 
      role,
      isVerified: true,
      profileCompleted: false // Set to false initially for new registrations
    });
    
    await newUser.save();
    
    // Generate token after successful registration
    const token = jwt.sign(
      { 
        id: newUser._id, 
        role: newUser.role,
        profileCompleted: newUser.profileCompleted
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    
    // Delete OTP record
    await Otp.deleteMany({ email });
    
    return res.status(200).json({ 
      message: 'OTP verified successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profileCompleted: newUser.profileCompleted // This will be false for new registrations
      }
    });
  }
};
// Complete profile function
export const completeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = req.body;
    
    console.log('Completing profile for user:', userId);
    
    // Check if alumni profile already exists
    let alumniProfile = await Alumni.findOne({ userId });
    
    if (alumniProfile) {
      // Update existing alumni profile
      alumniProfile = await Alumni.findOneAndUpdate(
        { userId },
        { ...userData, status: 'complete' },
        { new: true, runValidators: true }
      );
    } else {
      // Create new alumni profile
      alumniProfile = new Alumni({
        userId,
        ...userData,
        status: 'complete'
      });
      await alumniProfile.save();
    }
    
    // Update User document to mark profileCompleted = true and link alumni profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        profileCompleted: true, // This is the key fix
        alumniProfile: alumniProfile._id,
        // Update user name if provided in profile
        ...(userData.firstName && userData.lastName && {
          name: `${userData.firstName} ${userData.lastName}`
        })
      },
      { new: true }
    ).select('-password');
    
    console.log('Profile completion successful for user:', userId);
    
    res.status(200).json({
      message: 'Alumni profile saved successfully',
      user: updatedUser,
      alumni: alumniProfile
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ message: 'Server error during profile completion' });
  }
};

// Other functions remain the same...
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    await Otp.updateOne({ email, otp }, { verified: true });
    
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// In your login function
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Check if user exists
   const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // 3. Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        profileCompleted: user.profileCompleted // Include this in the token
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    
    // 4. Return token and user info
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted // Make sure this is included
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error:' + err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email }); // Remove old OTPs
    const otp = new Otp({ email, otp: otpCode, verified: false });
    await otp.save();
    await sendEmail(email, 'Reset your password', `Your OTP is: ${otpCode}`);
    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    const otpRecord = await Otp.findOne({ email, verified: true });
    if (!otpRecord) {
      return res.status(400).json({ 
        message: 'Please verify your OTP first' 
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const hashedPwd = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPwd });
    
    await Otp.deleteMany({ email });
    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
}; 