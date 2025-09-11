import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import {
  sendOtp,
  verifyOtp,
  login,
  verifyResetOtp,
  resetPassword,
  forgotPassword // ✅ Import the dedicated forgot password function
} from '../controllers/authController.js';

const router = express.Router();

// ✅ Registration & Login Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);

// ✅ FIXED: Password Reset Routes
router.post('/forgot-password', forgotPassword); // Use dedicated function
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

// ✅ Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: 'http://localhost:3000/signup'
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.redirect(`http://localhost:3000/dashboard?token=${token}`);
  }
);

export default router;