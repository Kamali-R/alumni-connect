import express from 'express';
import Alumni from '../models/Alumni.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: Create or update an alumni profile
router.post('/alumni', authenticateToken, async (req, res) => {
    try {
        const data = req.body;
        // Validate required fields
        if (!data.studentId || !data.terms) {
            return res.status(400).json({ error: 'Student ID and agreement to terms are required' });
        }
        
        // Check if alumni profile already exists
        let alumni = await Alumni.findOne({ userId: req.user.id });
        if (alumni) {
            // Update existing profile
            alumni = await Alumni.findOneAndUpdate(
                { userId: req.user.id },
                data,
                { new: true, runValidators: true }
            );
            return res.json({ message: 'Profile updated successfully', alumni });
        }
        
        // Create new profile
        alumni = new Alumni({
            userId: req.user.id,
            ...data
        });
        await alumni.save();
        res.status(201).json({ message: 'Profile created successfully', alumni });
    } catch (error) {
        console.error('Error in /alumni POST:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route: Get a single alumni profile by userId
router.get('/alumni/:userId', authenticateToken, async (req, res) => {
    try {
        const alumni = await Alumni.findOne({ userId: req.params.userId });
        if (!alumni) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(alumni);
    } catch (error) {
        console.error('Error in /alumni/:userId GET:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route: Get all alumni profiles
router.get('/alumni', authenticateToken, async (req, res) => {
    try {
        const alumni = await Alumni.find();
        res.json(alumni);
    } catch (error) {
        console.error('Error in /alumni GET:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;