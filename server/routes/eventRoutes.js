import express from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleAttendance,
  getUserEvents,
  getPendingEvents,
  getRejectedEvents,
  approveEvent,
  rejectEvent
} from '../controllers/eventController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Optional auth middleware - allows both authenticated and unauthenticated access
const optionalAuth = async (req, res, next) => {
  // Check if authorization header exists
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (!token) {
    // No token provided, continue without user info
    req.user = null;
    return next();
  }

  // If token exists, verify it
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    // Invalid token, continue without user info
    req.user = null;
    next();
  }
};

// Public routes with optional authentication
router.route('/')
  .get(optionalAuth, getEvents) // Can work with or without auth
  .post(auth, createEvent); // Requires auth

// Add the my-events route BEFORE the :id routes
router.route('/my-events')
  .get(auth, getUserEvents); // Requires auth

// Admin routes - pending events management
router.route('/admin/pending')
  .get(auth, getPendingEvents); // Requires auth (admin check in middleware)

router.route('/admin/rejected')
  .get(auth, getRejectedEvents); // Requires auth (admin check in middleware)

router.route('/:id/approve')
  .patch(auth, approveEvent); // Requires auth (admin check in middleware)

router.route('/:id/reject')
  .patch(auth, rejectEvent); // Requires auth (admin check in middleware)

router.route('/:id')
  .get(optionalAuth, getEvent) // Can work with or without auth
  .put(auth, updateEvent) // Requires auth
  .delete(auth, deleteEvent); // Requires auth

router.route('/:id/attendance')
  .put(auth, toggleAttendance); // Requires auth

export default router;