import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.role}!`,
    user: req.user
  });
});

export default router;
