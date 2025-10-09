import express from 'express';
import { createApplication, getMyApplications } from '../controllers/applicationController.js';
import auth from '../middleware/authMiddleware.js';

import { deleteApplication } from '../controllers/applicationController.js';

const router = express.Router();

// Create application (student applies to event)
router.route('/').post(auth, createApplication);

// Get current student's applications
router.route('/my-applications').get(auth, getMyApplications);

// Cancel an application
router.route('/:eventId').delete(auth, deleteApplication);

export default router;
