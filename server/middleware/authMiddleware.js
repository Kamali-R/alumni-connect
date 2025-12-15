// middleware/authMiddleware.js - FIXED VERSION
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ No Authorization header found');
      return res.status(401).json({ 
        message: 'No token provided. Access denied.',
        code: 'NO_TOKEN'
      });
    }

    // Extract token from "Bearer TOKEN"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Invalid token format');
      return res.status(401).json({ 
        message: 'Invalid token format. Access denied.',
        code: 'INVALID_TOKEN'
      });
    }

    // DEVELOPMENT ONLY: Allow special admin bypass token
    if (token === 'admin-local-token' && process.env.NODE_ENV !== 'production') {
      console.log('⚠️ Using development admin bypass token');
      req.user = {
        id: 'admin-dev',
        email: 'admin@ac.com',
        name: 'Admin',
        role: 'admin',
        profileCompleted: true
      };
      console.log('✅ Admin user (dev mode) authenticated');
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.email);

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('❌ User not found in database:', decoded.id);
        return res.status(401).json({ 
          message: 'User not found. Token invalid.',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is verified
      if (!user.isVerified) {
        console.log('❌ User not verified:', user.email);
        return res.status(401).json({ 
          message: 'User account not verified.',
          code: 'NOT_VERIFIED'
        });
      }

      // Attach user to request
      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        profileCompleted: user.profileCompleted
      };

      console.log('✅ User authenticated:', { 
        id: req.user.id, 
        email: req.user.email, 
        role: req.user.role 
      });
      
      next();

    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token. Please log in again.',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({ 
          message: 'Token verification failed.',
          code: 'VERIFICATION_FAILED'
        });
      }
    }

  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error during authentication',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

export default auth;