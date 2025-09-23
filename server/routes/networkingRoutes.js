import express from 'express';
import {
  getAlumniDirectory,
  sendConnectionRequest,
  getConnectionRequests,
  getMyConnections,
  acceptConnection,
  declineConnection,
  cancelConnectionRequest,
  removeConnection
} from '../controllers/networkingController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Make sure this route matches what frontend is calling
router.post('/connection-request', auth, sendConnectionRequest);
router.get('/alumni-directory', auth, getAlumniDirectory);
router.get('/connection-requests', auth, getConnectionRequests);
router.get('/my-connections', auth, getMyConnections);
router.post('/accept-connection', auth, acceptConnection);
router.post('/decline-connection', auth, declineConnection);
router.post('/cancel-connection', auth, cancelConnectionRequest);
router.post('/remove-connection', auth, removeConnection);

export default router;