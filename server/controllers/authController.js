import User from '../models/User.js';
import Otp from '../models/otp.js';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Alumni from '../models/Alumni.js';

// Check if user exists (for frontend validation only)
export const checkUser = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const existingUser = await User.findOne({ email });
    res.status(200).json({ exists: !!existingUser });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// STEP 1: Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { name, email, password, role, purpose } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    if (purpose === 'register') {
      if (!name || !password || !role) {
        return res.status(400).json({ message: 'All fields are required for registration' });
      }
      
      // Check if user already exists
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
    } else if (purpose === 'reset') {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }
    
    // Generate and send OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email });
    
    // Save new OTP
    const otp = new Otp({ email, otp: otpCode });
    await otp.save();
    
    // Send email
    await sendEmail(email, 'Your OTP Code', `Your OTP is: ${otpCode}`);
    
    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP sending' });
  }
};

// STEP 2: Verify OTP and Create User (but not Alumni profile yet)
// In your authController.js, update the verifyOtp function to ensure student registration works
export const verifyOtp = async (req, res) => {
  try {
    const { name, email, password, role, otp, purpose } = req.body;
    
    // Verify OTP
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    if (purpose === 'register') {
      // Double-check if user exists (race condition protection)
      const existing = await User.findOne({ email });
      if (existing) {
        await Otp.deleteMany({ email });
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      
      // Hash password and create user
      const hashedPwd = await bcrypt.hash(password, 10);
      const newUser = new User({ 
        name, 
        email, 
        password: hashedPwd, 
        role,
        isVerified: true,
        profileCompleted: false // Always false for new registrations
      });
      
      await newUser.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: newUser._id, 
          role: newUser.role,
          profileCompleted: newUser.profileCompleted,
          email: newUser.email,
          name: newUser.name
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Clean up OTP
      await Otp.deleteMany({ email });
      
      return res.status(200).json({ 
        message: 'Registration successful. Please complete your profile.',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          profileCompleted: newUser.profileCompleted
        }
      });
    }
    
    if (purpose === 'reset') {
      // Mark OTP as verified for password reset
      await Otp.updateOne({ email, otp }, { verified: true });
      res.status(200).json({ message: 'OTP verified successfully' });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// Login function
// Updated login function in authController.js
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists in Users table
    const user = await User.findOne({ email });
    console.log('Login attempt for email:', email, 'found User:', !!user);
    if (!user) {
      // Fallback: older accounts may exist in the Alumni collection
      const legacyAlumni = await Alumni.findOne({ email }).select('+password');
      console.log('Legacy alumni found:', !!legacyAlumni);
      if (legacyAlumni) {
        // Verify password against alumni record
        let isMatchAlumni = false;
        try {
          isMatchAlumni = legacyAlumni.matchPassword ? await legacyAlumni.matchPassword(password) : await bcrypt.compare(password, legacyAlumni.password);
        } catch (err) {
          console.error('Error comparing legacy alumni password:', err);
        }
        console.log('Legacy alumni password match:', isMatchAlumni);
        if (!isMatchAlumni) {
          // Log truncated hash for debugging (do not log full hashes in production)
          console.warn('Legacy alumni password did not match for', email);
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Upsert a User document for this alumni so rest of the app expects a User
        let newUser = await User.findOne({ email });
        if (!newUser) {
          newUser = await User.findOneAndUpdate(
            { email },
            {
              $setOnInsert: {
                name: legacyAlumni.name || legacyAlumni.personalInfo?.fullName || 'Alumni',
                email: legacyAlumni.email,
                password: legacyAlumni.password,
                role: 'alumni',
                isVerified: true,
                profileCompleted: true,
                alumniProfile: legacyAlumni._id,
                authProvider: 'local'
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }

        // Treat this newUser as the authenticated user
        // Update lastLogin
        newUser.lastLogin = new Date();
        await newUser.save();

        // Create token for newUser and return
        const token = jwt.sign(
          {
            id: newUser._id,
            role: newUser.role,
            profileCompleted: newUser.profileCompleted,
            email: newUser.email,
            name: newUser.name
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          message: 'Login successful',
          token,
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            profileCompleted: newUser.profileCompleted
          }
        });
      }

      return res.status(404).json({ message: 'User not found. Please sign up first.' });
    }
    
    // For password-based login, verify password
    if (user.authProvider === 'local') {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }
    
    // PROFILE COMPLETION CHECK - FIXED VERSION
    let isProfileComplete = false;
    
    if (user.role === 'student') {
      // For students, check if they have a student profile
      const studentProfile = await Student.findOne({ userId: user._id });
      isProfileComplete = !!studentProfile && studentProfile.status === 'complete';
      console.log('🎓 Student profile check:', { exists: !!studentProfile, status: studentProfile?.status, isProfileComplete });
    } else {
      // For alumni, check if they have an alumni profile
      const hasAlumniProfile = await Alumni.exists({ userId: user._id });
      isProfileComplete = user.profileCompleted && hasAlumniProfile;
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        profileCompleted: isProfileComplete,
        email: user.email,
        name: user.name,
        registrationComplete: isProfileComplete
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: isProfileComplete,
        registrationComplete: isProfileComplete,
        graduationYear: user.graduationYear
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
// Password reset functions
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
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// In your login function
export const Login = async (req, res) => {
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
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    
    const otp = new Otp({ email, otp: otpCode, verified: false });
    await otp.save();
    
    await sendEmail(email, 'Reset your password', `Your OTP is: ${otpCode}`);
    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
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
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};