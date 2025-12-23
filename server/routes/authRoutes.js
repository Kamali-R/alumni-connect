import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import express from 'express';
import {
  sendOtp,
  verifyOtp,
  login,
  verifyResetOtp,
  resetPassword,
  forgotPassword,
  checkUser
} from '../controllers/authController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// User existence check (for frontend validation)
router.get('/api/check-user', checkUser);

// Registration & Login Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

// Google OAuth Routes
router.get('/auth/google', (req, res, next) => {
  console.log('Initiating Google OAuth flow');
  next();
}, passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get('/auth/google/callback', (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        console.error('Google callback error:', err);
        return res.redirect(`${frontendUrl}/login?error=auth_failed`);
      }

      // If signup is needed, redirect to Register with prefilled params
      if (!user && info && info.needsSignup) {
        const tempToken = jwt.sign(
          {
            provider: 'google',
            email: info.email,
            name: info.name,
            googleId: info.googleId
          },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
        const url = `${frontendUrl}/Register?error=not_found&from=google&email=${encodeURIComponent(info.email)}&name=${encodeURIComponent(info.name)}&token=${encodeURIComponent(tempToken)}`;
        console.log('Redirecting unregistered Google user to signup:', url);
        return res.redirect(url);
      }

      if (!user) {
        console.error('No user from Google authentication and no signup info.');
        return res.redirect(`${frontendUrl}/login?error=authentication_failed`);
      }

      // Existing user: issue app token
      const tokenPayload = {
        id: user._id,
        email: user.email,
        role: user.role || 'alumni',
        name: user.name,
        profileCompleted: user.profileCompleted || false
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
      const redirectUrl = `${frontendUrl}/auth/google/callback?token=${token}&success=true`;
      console.log('Redirecting existing Google user to:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (e) {
      console.error('Google callback handler exception:', e);
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  })(req, res, next);
});

// Protected route to get user data
router.get('/user', auth, async (req, res) => {
  try {
    console.log('Fetching user data for ID:', req.user.id);
    
    const user = await User.findById(req.user.id)
      .populate('alumniProfile')
      .select('-password -__v');
    
    if (!user) {
      console.error('User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User data retrieved:', { 
      email: user.email, 
      role: user.role, 
      profileCompleted: user.profileCompleted 
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Check profile completion status
router.get('/check-profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('profileCompleted role');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      profileCompleted: user.profileCompleted,
      role: user.role
    });
  } catch (error) {
    console.error('Profile check error:', error);
    res.status(500).json({ message: 'Error checking profile status' });
  }
});

export default router;