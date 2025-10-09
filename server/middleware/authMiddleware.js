import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Simple authentication middleware that accepts 'Bearer <token>' or raw token header
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'No token provided. Access denied.', code: 'NO_TOKEN' });

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token || token === 'null' || token === 'undefined') return res.status(401).json({ message: 'Invalid token format. Access denied.', code: 'INVALID_TOKEN' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ message: 'User not found. Token invalid.', code: 'USER_NOT_FOUND' });
      if (!user.isVerified) return res.status(401).json({ message: 'User account not verified.', code: 'NOT_VERIFIED' });

      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        profileCompleted: user.profileCompleted
      };

      return next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired. Please log in again.', code: 'TOKEN_EXPIRED' });
      if (jwtError.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token. Please log in again.', code: 'INVALID_TOKEN' });
      return res.status(401).json({ message: 'Token verification failed.', code: 'VERIFICATION_FAILED' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error during authentication', code: 'AUTH_SERVER_ERROR' });
  }
};

export default auth;
