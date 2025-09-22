import express from 'express';
import Job from '../models/Job.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all jobs (for viewing)
router.get('/jobs', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, location, experience, role, company } = req.query;
    
    let filter = { status: 'Open' };
    
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (experience) filter.experience = experience;
    if (role) filter.role = role;
    if (company) filter.company = { $regex: company, $options: 'i' };
    
    const jobs = await Job.find(filter)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Job.countDocuments(filter);
    
    res.status(200).json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error during jobs fetch' });
  }
});

// Get jobs posted by current user
router.get('/jobs/my-jobs', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id })
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ message: 'Server error during my jobs fetch' });
  }
});

// Create a new job
router.post('/jobs', auth, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      experience,
      referralCode,
      description,
      applyLink
    } = req.body;
    
    // Basic validation
    if (!title || !company || !location || !type || !experience || !description || !applyLink) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }
    
    if (description.length < 50) {
      return res.status(400).json({ message: 'Job description must be at least 50 characters' });
    }
    
    // Determine job role from title
    let jobRole = 'Other';
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('senior') && (titleLower.includes('software') || titleLower.includes('engineer'))) {
      jobRole = 'Senior Software Engineer';
    } else if (titleLower.includes('senior') && titleLower.includes('product manager')) {
      jobRole = 'Senior Product Manager';
    } else if (titleLower.includes('frontend') || titleLower.includes('front-end')) {
      jobRole = 'Frontend Developer';
    } else if (titleLower.includes('backend') || titleLower.includes('back-end')) {
      jobRole = 'Backend Developer';
    } else if (titleLower.includes('full stack') || titleLower.includes('fullstack')) {
      jobRole = 'Full Stack Developer';
    } else if (titleLower.includes('devops')) {
      jobRole = 'DevOps Engineer';
    } else if (titleLower.includes('software') || titleLower.includes('engineer')) {
      jobRole = 'Software Engineer';
    } else if (titleLower.includes('data scientist')) {
      jobRole = 'Data Scientist';
    } else if (titleLower.includes('data analyst')) {
      jobRole = 'Data Analyst';
    } else if (titleLower.includes('product manager')) {
      jobRole = 'Product Manager';
    } else if (titleLower.includes('ux')) {
      jobRole = 'UX Designer';
    } else if (titleLower.includes('ui')) {
      jobRole = 'UI Designer';
    } else if (titleLower.includes('marketing')) {
      jobRole = 'Marketing Manager';
    } else if (titleLower.includes('business analyst')) {
      jobRole = 'Business Analyst';
    }
    
    // Create new job
    const newJob = new Job({
      title,
      company,
      location,
      type,
      experience,
      role: jobRole,
      description,
      applyLink,
      referralCode: referralCode || '',
      postedBy: req.user.id
    });
    
    await newJob.save();
    
    // Populate the postedBy field before returning
    await newJob.populate('postedBy', 'name email');
    
    res.status(201).json({
      message: 'Job posted successfully',
      job: newJob
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error during job creation' });
  }
});

// Update job status (close job)
router.patch('/jobs/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const jobId = req.params.id;
    
    if (!['Open', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const job = await Job.findOne({ _id: jobId, postedBy: req.user.id });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }
    
    job.status = status;
    await job.save();
    
    res.status(200).json({
      message: `Job ${status.toLowerCase()} successfully`,
      job
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ message: 'Server error during job status update' });
  }
});

// Get job by ID
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.status(200).json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error during job fetch' });
  }
});

// Delete job (optional)
router.delete('/jobs/:id', auth, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user.id });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }
    
    await Job.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error during job deletion' });
  }
});

export default router;