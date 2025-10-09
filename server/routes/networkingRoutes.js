import express from 'express';
import {
  getAlumniDirectory,
  getStudentDirectory,
  sendConnectionRequest,
  getConnectionRequests,
  getMyConnections,
  acceptConnection,
  declineConnection,
  cancelConnectionRequest
} from '../controllers/networkingController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// ----------------- CONNECTION FLOW ------------------

// Send a new connection request
router.post('/connection-request', auth, sendConnectionRequest);

// Get all alumni for networking/search
router.get('/alumni-directory', auth, getAlumniDirectory);

// Get all students for networking/search
router.get('/student-directory', auth, getStudentDirectory);

// Get all pending requests received by current user
router.get('/connection-requests', auth, getConnectionRequests);

// Get all accepted connections of current user
router.get('/my-connections', auth, getMyConnections);

// Accept a connection request
router.post('/accept-connection', auth, acceptConnection);

// Decline a connection request
router.post('/decline-connection', auth, declineConnection);

// Cancel a connection request
router.post('/cancel-connection', auth, cancelConnectionRequest);

export default router;