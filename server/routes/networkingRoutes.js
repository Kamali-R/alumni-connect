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
// Add this temporary route to your networkingRoutes.js
router.get('/debug-alumni', auth, async (req, res) => {
  try {
    const allAlumni = await Alumni.find({})
      .populate('userId', 'name email')
      .lean();

    console.log('📋 ALL ALUMNI RECORDS IN DATABASE:');
    allAlumni.forEach((alumni, index) => {
      console.log(`\n${index + 1}. Alumni Record:`);
      console.log('   ID:', alumni._id);
      console.log('   User ID:', alumni.userId?._id || 'NO USER ID');
      console.log('   Name:', alumni.personalInfo?.fullName);
      console.log('   Status:', alumni.status);
      console.log('   Has userId:', !!alumni.userId);
      console.log('   User Name:', alumni.userId?.name);
      console.log('---');
    });

    res.json({
      totalAlumni: allAlumni.length,
      alumni: allAlumni.map(a => ({
        id: a._id,
        userId: a.userId?._id,
        name: a.personalInfo?.fullName,
        status: a.status,
        hasUserId: !!a.userId,
        userEmail: a.userId?.email
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// All routes require authentication
router.get('/alumni-directory', auth, getAlumniDirectory);
router.post('/connection-request', auth, sendConnectionRequest);
router.get('/connection-requests', auth, getConnectionRequests);
router.get('/my-connections', auth, getMyConnections);
router.post('/accept-connection', auth, acceptConnection);
router.post('/decline-connection', auth, declineConnection);
router.post('/cancel-connection', auth, cancelConnectionRequest);

export default router;