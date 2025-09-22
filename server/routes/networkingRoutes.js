// routes/networkingRoutes.js
import express from 'express';
import {
  getAlumniDirectory,
  sendConnectionRequest,
  getConnectionRequests,
  getMyConnections,
  acceptConnection,
  declineConnection,
  cancelConnectionRequest
} from '../controllers/networkingController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.get('/alumni-directory', auth, getAlumniDirectory);
router.post('/connection-request', auth, sendConnectionRequest);
router.get('/connection-requests', auth, getConnectionRequests);
router.get('/my-connections', auth, getMyConnections);
router.post('/accept-connection', auth, acceptConnection);
router.post('/decline-connection', auth, declineConnection);
router.post('/cancel-connection', auth, cancelConnectionRequest);

export default router;