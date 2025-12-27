import express from 'express';
import { getSecurityOverview } from '../controllers/securityController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.get('/overview', authMiddleware, getSecurityOverview);

export default router;