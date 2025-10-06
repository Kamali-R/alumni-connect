import Job from '../models/Job.js';

// Get all jobs
export const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const jobs = await Job.find({ status: 'Open' })
      .populate('postedBy', 'name email')
      .sort({ datePosted: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Job.countDocuments({ status: 'Open' });
    
    res.status(200).json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({ message: 'Server error during jobs fetch' });
  }
};

// Get jobs posted by current user
export const getMyJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const jobs = await Job.find({ postedBy: userId })
      .sort({ datePosted: -1 });
    
    res.status(200).json({ jobs });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ message: 'Server error during jobs fetch' });
  }
};

// Create new job
export const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobData = {
      ...req.body,
      postedBy: userId
    };
    
    const newJob = new Job(jobData);
    await newJob.save();
    
    res.status(201).json({
      message: 'Job posted successfully',
      job: newJob
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error during job creation' });
  }
};

// Update job status to closed
export const closeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the user is the owner of this job
    if (job.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to close this job' });
    }
    
    job.status = 'Closed';
    await job.save();
    
    res.status(200).json({
      message: 'Job opportunity closed successfully',
      job
    });
  } catch (error) {
    console.error('Close job error:', error);
    res.status(500).json({ message: 'Server error during job closure' });
  }
};

// Delete job completely
export const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the user is the owner of this job
    if (job.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }
    
    await Job.findByIdAndDelete(jobId);
    
    res.status(200).json({
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error during job deletion' });
  }
};