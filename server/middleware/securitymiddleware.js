import rateLimit from 'express-rate-limit';

// Rate limiting for messages
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 messages per minute
  message: {
    success: false,
    message: 'Too many messages sent, please try again later.'
  }
});

// Rate limiting for calls
export const callLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 call attempts per minute
  message: {
    success: false,
    message: 'Too many call attempts, please try again later.'
  }
});

// File upload security validation
export const validateFile = (req, res, next) => {
  if (!req.file) return next();
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'File type not allowed'
    });
  }
  
  if (req.file.size > 10 * 1024 * 1024) { // 10MB
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum 10MB allowed.'
    });
  }
  
  next();
};