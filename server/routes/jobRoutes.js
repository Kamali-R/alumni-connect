// routes/jobRoutes.js - Updated version
import express from 'express';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Get jobs posted by current user
router.get('/my-jobs', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id })
      .populate('postedBy', 'name email')
      .populate('applications.studentId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ message: 'Server error during my jobs fetch' });
  }
});

// Get student's applied jobs - ADD THIS ROUTE
router.get('/applied-jobs', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const applications = await Application.find({ studentId })
      .populate('jobId')
      .sort({ appliedAt: -1 });
    
    res.status(200).json(applications);
  } catch (error) {
    console.error('Get applied jobs error:', error);
    res.status(500).json({ message: 'Server error during applied jobs fetch' });
  }
});

// Apply to a job
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const studentId = req.user.id;
    const { coverLetter } = req.body;
    
    console.log('Applying to job:', { jobId, studentId });
    
    // Check if job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.status !== 'Open') {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }
    
    // Check if student has already applied
    const existingApplication = await Application.findOne({
      jobId,
      studentId
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }
    
    // Create application
    const application = new Application({
      jobId,
      studentId,
      coverLetter: coverLetter || ''
    });
    
    await application.save();
    
    // Also add to job's applications array
    job.applications.push({
      studentId,
      appliedAt: new Date(),
      status: 'Applied',
      coverLetter: coverLetter || ''
    });
    
    await job.save();
    
    // Populate job details for response
    await application.populate('jobId');
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
    
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ message: 'Server error during job application' });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email')
      .populate('applications.studentId', 'name email');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.status(200).json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error during job fetch' });
  }
});

// Get all jobs (for viewing) - UPDATED
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, location, experience, role, company, search } = req.query;
    
    let filter = { status: 'Open' };
    
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (experience) filter.experience = experience;
    if (role) filter.role = role;
    if (company) filter.company = { $regex: company, $options: 'i' };
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
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

// Create a new job
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      experience,
      salary,
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
      salary: salary || '',
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
router.patch('/:id/status', auth, async (req, res) => {
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

export default router;