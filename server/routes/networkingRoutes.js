// routes/networkingRoutes.js
import express from 'express';
import {
  getAlumniDirectory,
  sendConnectionRequest,
  getConnectionRequests,
  getMyConnections,
  acceptConnection,
  declineConnection
} from '../controllers/networkingController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// ----------------- CONNECTION FLOW ------------------

// Send a new connection request
// Frontend should pass: { recipientId }
router.post('/connection-request', auth, sendConnectionRequest);

// Get all alumni for networking/search
router.get('/alumni-directory', auth, getAlumniDirectory);

// Get all pending requests received by current user
router.get('/connection-requests', auth, getConnectionRequests);

// Get all accepted connections of current user
router.get('/my-connections', auth, getMyConnections);

// Accept a connection request
// Frontend should pass: { connectionId }
router.post('/accept-connection', auth, acceptConnection);

// Decline a connection request
// Frontend should pass: { connectionId }
router.post('/decline-connection', auth, declineConnection);

export default router;