import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { getReportsOverview } from '../controllers/reportController.js';

const router = express.Router();

// Reports & Analytics
router.get('/overview', auth, getReportsOverview);

export default router;