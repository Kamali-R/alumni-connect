import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/stats', auth, getDashboardStats);

export default router;
