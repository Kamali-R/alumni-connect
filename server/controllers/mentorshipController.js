import Mentor from '../models/Mentor.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';
import MentorProfile from '../models/MentorProfile.js';
import Mentorship from '../models/Mentorship.js';
import { getIo } from '../utils/socket.js';

// GET /api/mentorship/mentors (simple version)
export const getSimpleMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find().populate('user', 'name email');
    res.status(200).json({ success: true, count: mentors.length, data: mentors });
  } catch (err) {
    console.error('Get mentors error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/mentorship/mentors - create or update mentor profile (simple version for backward compatibility)
export const createSimpleMentorProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Auth required' });

    const { name, position, company, bio, expertise = [], availability = '', industry = '', location = '' } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const existing = await Mentor.findOne({ user: userId });
    if (existing) {
      existing.name = name;
      existing.position = position;
      existing.company = company;
      existing.bio = bio;
      existing.expertise = expertise;
      existing.availability = availability;
      existing.industry = industry;
      existing.location = location;
      await existing.save();
      return res.status(200).json({ success: true, data: existing });
    }

    const mentor = await Mentor.create({
      user: userId,
      name,
      position,
      company,
      bio,
      expertise,
      availability,
      industry,
      location
    });

    res.status(201).json({ success: true, data: mentor });
  } catch (err) {
    console.error('Become mentor error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/mentorship/mentors/:mentorId/request
export const requestMentor = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ success: false, message: 'Auth required' });

    const mentorId = req.params.mentorId;
    const { message = '' } = req.body;

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    // Prevent duplicate request (index also enforces uniqueness)
    const existing = await MentorshipRequest.findOne({ mentor: mentorId, student: studentId });
    if (existing) return res.status(400).json({ success: false, message: 'You have already requested this mentor' });

    const reqDoc = await MentorshipRequest.create({ mentor: mentorId, student: studentId, message });

    // Optionally populate
    const populated = await reqDoc.populate([{ path: 'mentor' }, { path: 'student', select: 'name email' }]);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Request mentor error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate request' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/mentorship/requests
export const getRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Auth required' });

    // Find mentor profile for this user (if any)
    const mentorProfile = await Mentor.findOne({ user: userId });

    let incoming = [];
    let outgoing = [];

    if (mentorProfile) {
      incoming = await MentorshipRequest.find({ mentor: mentorProfile._id }).populate('student', 'name email').sort({ createdAt: -1 });
    }

    outgoing = await MentorshipRequest.find({ student: userId }).populate('mentor').sort({ createdAt: -1 });

    res.status(200).json({ success: true, incoming, outgoing });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/mentorship/requests/:requestId  { action: 'accept'|'decline' }
export const respondToRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Auth required' });

    const { action } = req.body;
    const requestId = req.params.requestId;

    const reqDoc = await MentorshipRequest.findById(requestId).populate('mentor');
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });

    // Only mentor owner can respond
    const mentorOwnerId = reqDoc.mentor.user?.toString();
    if (mentorOwnerId !== userId) return res.status(403).json({ success: false, message: 'Not authorized' });

    if (action === 'accept') {
      reqDoc.status = 'accepted';
      await reqDoc.save();
      return res.status(200).json({ success: true, data: reqDoc });
    } else if (action === 'decline') {
      reqDoc.status = 'declined';
      await reqDoc.save();
      return res.status(200).json({ success: true, data: reqDoc });
    }

    res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (err) {
    console.error('Respond request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/mentorship/my (simple version)
export const getSimpleMyMentorships = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Auth required' });

    const mentorProfile = await Mentor.findOne({ user: userId });

    const asMentor = mentorProfile
      ? await MentorshipRequest.find({ mentor: mentorProfile._id, status: 'accepted' }).populate('student', 'name email')
      : [];

    const asMentee = await MentorshipRequest.find({ student: userId, status: 'accepted' }).populate('mentor');

    res.status(200).json({ success: true, asMentor, asMentee });
  } catch (err) {
    console.error('Get my mentorships error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper to build a frontend-friendly mentor object
const buildMentorDto = (mentor, user = {}, alumni = {}) => {
  const name = alumni.personalInfo?.fullName || user.name || 'Unknown';
  const initials = (name)
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return {
    id: mentor._id,
    userId: user._id,
    name,
    initials,
    position: alumni.careerDetails?.jobTitle || 'Professional',
    company: alumni.careerDetails?.companyName || 'Not specified',
    graduationYear: alumni.academicInfo?.graduationYear ? `Class of ${alumni.academicInfo.graduationYear}` : 'Alumni',
    expertise: (mentor.expertise || []).flatMap(exp => [exp.category, ...(exp.skills || [])]).filter(Boolean),
    description: mentor.description,
    industry: mentor.industry,
    experience: mentor.experience,
    companySize: mentor.companySize,
    location: mentor.location,
    availability: mentor.availability,
    rating: mentor.rating,
    color: `from-${getColor(mentor.industry)}-500 to-${getColor(mentor.industry)}-600`
  };
};

// Become a mentor
export const becomeMentor = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      expertise,
      availability,
      description,
      industry,
      experience,
      companySize,
      location,
      mentorshipStyle,
      preferredCommunication,
      languages
    } = req.body;

    // Check if user already has a mentor profile
    const existingProfile = await MentorProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'You are already a mentor'
      });
    }

    // Get user and alumni data to populate mentor profile
    const user = await User.findById(userId);
    const alumniProfile = await Alumni.findOne({ userId });

    if (!alumniProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your alumni profile first'
      });
    }

    // Create mentor profile
    const mentorProfile = new MentorProfile({
      userId,
      expertise: Array.isArray(expertise) ? expertise.map(exp => ({
        category: exp.category || exp,
        skills: exp.skills || []
      })) : [],
      availability,
      description,
      industry,
      experience,
      companySize,
      location,
      mentorshipStyle,
      preferredCommunication: preferredCommunication || ['Video Call', 'Chat'],
      languages: languages || ['English']
    });

    await mentorProfile.save();

    // Update user role to include mentor
    user.role = user.role.includes('mentor') ? user.role : [...user.role, 'mentor'];
    await user.save();

    // Emit updated mentor list so frontend can refresh
    try { await emitMentorsUpdate(); } catch (e) { console.warn('emitMentorsUpdate failed', e); }
    try { await emitMyMentorships(userId); } catch (e) { console.warn('emitMyMentorships failed', e); }

    res.status(201).json({
      success: true,
      message: 'You are now a mentor! Your profile will be visible to students seeking mentorship.',
      data: mentorProfile
    });

  } catch (error) {
    console.error('Become mentor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during mentor application',
      error: error.message
    });
  }
};

// Get all active mentors
export const getMentors = async (req, res) => {
  try {
    const {
      search = '',
      industry = '',
      experience = '',
      graduationYear = '',
      companySize = '',
      location = '',
      availability = '',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter query
    let filter = { isActive: true };
    
    if (industry && industry !== 'All Industries') {
      filter.industry = industry;
    }
    
    if (experience && experience !== 'Experience Level') {
      filter.experience = experience;
    }
    
    if (companySize && companySize !== 'Company Size') {
      filter.companySize = companySize;
    }
    
    if (location && location !== 'Location') {
      filter.location = location;
    }
    
    if (availability && availability !== 'Availability') {
      filter.availability = availability;
    }

    // Search across multiple fields using aggregation
    let searchFilter = {};
    if (search.trim()) {
      searchFilter = {
        $or: [
          { 'user.name': { $regex: search.trim(), $options: 'i' } },
          { 'alumni.personalInfo.fullName': { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
          { industry: { $regex: search.trim(), $options: 'i' } },
          { 'expertise.category': { $regex: search.trim(), $options: 'i' } },
          { 'expertise.skills': { $regex: search.trim(), $options: 'i' } }
        ]
      };
    }

    // Graduation year filter
    let graduationFilter = {};
    if (graduationYear && graduationYear !== 'Graduation Year') {
      let yearRange = {};
      switch (graduationYear) {
        case '2020-2024':
          yearRange = { $gte: 2020, $lte: 2024 };
          break;
        case '2015-2019':
          yearRange = { $gte: 2015, $lte: 2019 };
          break;
        case '2010-2014':
          yearRange = { $gte: 2010, $lte: 2014 };
          break;
        case '2005-2009':
          yearRange = { $gte: 2005, $lte: 2009 };
          break;
        case 'Before 2005':
          yearRange = { $lt: 2005 };
          break;
      }
      graduationFilter = { 'alumni.academicInfo.graduationYear': yearRange };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregation pipeline to get mentors with user and alumni data
    const aggregationPipeline = [
      {
        $match: filter
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'alumnis',
          localField: 'userId',
          foreignField: 'userId',
          as: 'alumni'
        }
      },
      {
        $unwind: {
          path: '$alumni',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          $and: [
            searchFilter,
            graduationFilter
          ]
        }
      },
      {
        $project: {
          _id: 1,
          'user._id': 1,
          'user.name': 1,
          'alumni.personalInfo.fullName': 1,
          'alumni.academicInfo.graduationYear': 1,
          'alumni.careerDetails.companyName': 1,
          'alumni.careerDetails.jobTitle': 1,
          expertise: 1,
          availability: 1,
          description: 1,
          industry: 1,
          experience: 1,
          companySize: 1,
          location: 1,
          rating: 1,
          mentorshipStyle: 1,
          createdAt: 1
        }
      },
      {
        $sort: { 'rating.average': -1, createdAt: -1 }
      },
      {
        $facet: {
          mentors: [
            { $skip: skip },
            { $limit: parseInt(limit) }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const result = await MentorProfile.aggregate(aggregationPipeline);
    
    const mentors = result[0]?.mentors || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    // Transform data for frontend
    const transformedMentors = mentors.map(mentor => {
      const alumni = mentor.alumni || {};
      const user = mentor.user || {};
      
      return {
        id: mentor._id,
        userId: user._id,
        name: alumni.personalInfo?.fullName || user.name || 'Unknown',
        initials: (alumni.personalInfo?.fullName || user.name || 'UU')
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        position: alumni.careerDetails?.jobTitle || 'Professional',
        company: alumni.careerDetails?.companyName || 'Not specified',
        graduationYear: alumni.academicInfo?.graduationYear ? 
          `Class of ${alumni.academicInfo.graduationYear}` : 'Alumni',
        expertise: mentor.expertise.flatMap(exp => 
          [exp.category, ...exp.skills]
        ).filter(skill => skill),
        description: mentor.description,
        industry: mentor.industry,
        experience: mentor.experience,
        companySize: mentor.companySize,
        location: mentor.location,
        availability: mentor.availability,
        rating: mentor.rating,
        color: `from-${getColor(mentor.industry)}-500 to-${getColor(mentor.industry)}-600`
      };
    });

    res.json({
      success: true,
      data: transformedMentors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalMentors: total,
        hasMore: skip + mentors.length < total
      }
    });

  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching mentors',
      error: error.message
    });
  }
};

// Helper function to get color based on industry
function getColor(industry) {
  const colorMap = {
    'Technology': 'blue',
    'Finance': 'green',
    'Healthcare': 'teal',
    'Marketing': 'pink',
    'Consulting': 'purple',
    'Education': 'yellow',
    'Engineering': 'indigo'
  };
  return colorMap[industry] || 'gray';
}

// Request mentorship
export const requestMentorship = async (req, res) => {
  try {
    const menteeId = req.user.id;
    const { mentorId, message, goals } = req.body;

    // Check if mentor exists and is active
    const mentorProfile = await MentorProfile.findOne({ 
      _id: mentorId, 
      isActive: true 
    });
    
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found or not active'
      });
    }

    // Check for existing pending or active mentorship
    const existingMentorship = await Mentorship.findOne({
      mentorId: mentorProfile.userId,
      menteeId,
      status: { $in: ['pending', 'active'] }
    });

    if (existingMentorship) {
      return res.status(400).json({
        success: false,
        message: existingMentorship.status === 'pending' 
          ? 'Mentorship request already pending' 
          : 'Mentorship already active'
      });
    }

    // Create mentorship request
    const mentorship = new Mentorship({
      mentorId: mentorProfile.userId,
      menteeId,
      status: 'pending',
      mentorDetails: {
        expertise: mentorProfile.expertise,
        availability: mentorProfile.availability,
        description: mentorProfile.description,
        industry: mentorProfile.industry,
        experience: mentorProfile.experience,
        companySize: mentorProfile.companySize,
        location: mentorProfile.location
      },
      requestMessage: message,
      goals: goals || []
    });

    await mentorship.save();

    // Populate the saved mentorship for response
    await mentorship.populate('mentorId', 'name email');
    await mentorship.populate('menteeId', 'name email');

    // Emit updates: notify mentor(s) and broadcast requests
    try {
      const mentorUserId = mentorProfile.userId?.toString();
      const io = getIo();
      // Emit new single request to the mentor's user room
      const transformedSingle = {
        id: mentorship._id,
        name: mentorship.menteeId?.name || 'Unknown',
        initials: (mentorship.menteeId?.name || 'UU').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2),
        major: 'Student',
        graduationYear: 'Current Student',
        interests: (mentorship.mentorDetails?.expertise || []).flatMap(exp => [exp.category, ...(exp.skills || [])]).slice(0,3),
        message: mentorship.requestMessage,
        status: mentorship.status,
        createdAt: mentorship.createdAt,
        color: 'from-blue-500 to-purple-600'
      };
      if (io && mentorUserId) {
        io.to(`user_${mentorUserId}`).emit('mentorshipRequest', transformedSingle);
      }
      // Emit full requests update
      await emitRequestsUpdate(mentorProfile.userId);
      // Emit my mentorships update for the mentee
      await emitMyMentorships(menteeId);
    } catch (err) {
      console.warn('Failed to emit mentorship events', err);
    }

    res.status(201).json({
      success: true,
      message: 'Mentorship request sent successfully',
      data: mentorship
    });

  } catch (error) {
    console.error('Request mentorship error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending mentorship request',
      error: error.message
    });
  }
};

// Get mentorship requests for a mentor
export const getMentorshipRequests = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { status = 'pending' } = req.query;

    const requests = await Mentorship.find({
      mentorId,
      status
    })
    .populate('menteeId', 'name email')
    .populate('mentorId', 'name email')
    .sort({ createdAt: -1 });

    // Transform data for frontend
    const transformedRequests = requests.map(request => ({
      id: request._id,
      name: request.menteeId?.name || 'Unknown',
      initials: (request.menteeId?.name || 'UU')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      major: 'Student', // You might want to get this from student profile
      graduationYear: 'Current Student',
      interests: request.mentorDetails.expertise.flatMap(exp => 
        [exp.category, ...exp.skills]
      ).slice(0, 3),
      message: request.requestMessage,
      status: request.status,
      createdAt: request.createdAt,
      color: `from-blue-500 to-purple-600` // Default color
    }));

    res.json({
      success: true,
      data: transformedRequests
    });

  } catch (error) {
    console.error('Get mentorship requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching mentorship requests',
      error: error.message
    });
  }
};

// Accept mentorship request
export const acceptMentorship = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { requestId } = req.params;

    const mentorship = await Mentorship.findOne({
      _id: requestId,
      mentorId,
      status: 'pending'
    });

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship request not found'
      });
    }

    mentorship.status = 'active';
    mentorship.startDate = new Date();
    await mentorship.save();

    await mentorship.populate('menteeId', 'name email');
    await mentorship.populate('mentorId', 'name email');

    res.json({
      success: true,
      message: 'Mentorship request accepted',
      data: mentorship
    });

    // Emit updates to mentor and mentee
    try {
      const mentorUserId = mentorId;
      const menteeUserId = mentorship.menteeId?._id?.toString();
      await emitRequestsUpdate(mentorUserId);
      await emitMyMentorships(mentorUserId);
      if (menteeUserId) await emitMyMentorships(menteeUserId);
    } catch (err) {
      console.warn('emit after accept failed', err);
    }

  } catch (error) {
    console.error('Accept mentorship error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error accepting mentorship request',
      error: error.message
    });
  }
};

// Decline mentorship request
export const declineMentorship = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { requestId } = req.params;

    const mentorship = await Mentorship.findOne({
      _id: requestId,
      mentorId,
      status: 'pending'
    });

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship request not found'
      });
    }

    mentorship.status = 'rejected';
    await mentorship.save();

    res.json({
      success: true,
      message: 'Mentorship request declined'
    });

    // Emit updates for the mentor
    try {
      const mentorUserId = mentorId;
      await emitRequestsUpdate(mentorUserId);
      await emitMyMentorships(mentorUserId);
    } catch (err) {
      console.warn('emit after decline failed', err);
    }

  } catch (error) {
    console.error('Decline mentorship error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error declining mentorship request',
      error: error.message
    });
  }
};

// Get user's mentorships
export const getMyMentorships = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get mentorships where user is mentee
    const asMentee = await Mentorship.find({
      menteeId: userId,
      status: 'active'
    })
    .populate('mentorId', 'name email')
    .sort({ startDate: -1 });

    // Get mentorships where user is mentor
    const asMentor = await Mentorship.find({
      mentorId: userId,
      status: 'active'
    })
    .populate('menteeId', 'name email')
    .sort({ startDate: -1 });

    // Transform data for frontend
    const transformedAsMentee = asMentee.map(mentorship => ({
      id: mentorship._id,
      name: mentorship.mentorId?.name || 'Unknown Mentor',
      initials: (mentorship.mentorId?.name || 'UM')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      expertise: mentorship.mentorDetails.expertise
        .flatMap(exp => [exp.category, ...exp.skills])
        .slice(0, 2)
        .join(', '),
      nextSession: 'To be scheduled', // You can implement session scheduling
      color: `from-blue-500 to-purple-600`
    }));

    const transformedAsMentor = asMentor.map(mentorship => ({
      id: mentorship._id,
      name: mentorship.menteeId?.name || 'Unknown Mentee',
      initials: (mentorship.menteeId?.name || 'UM')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      expertise: 'Student', // You might want to get this from student profile
      nextSession: 'To be scheduled',
      color: `from-green-500 to-teal-600`
    }));

    res.json({
      success: true,
      data: {
        asMentee: transformedAsMentee,
        asMentor: transformedAsMentor
      }
    });

  } catch (error) {
    console.error('Get my mentorships error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching mentorships',
      error: error.message
    });
  }
};

// Get mentor profile
export const getMentorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const mentorProfile = await MentorProfile.findOne({ userId })
      .populate('userId', 'name email');

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    res.json({
      success: true,
      data: mentorProfile
    });

  } catch (error) {
    console.error('Get mentor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching mentor profile',
      error: error.message
    });
  }
};

// Emit helpers
const emitMentorsUpdate = async () => {
  try {
    const aggregation = [
      { $match: { isActive: true } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $lookup: { from: 'alumnis', localField: 'userId', foreignField: 'userId', as: 'alumni' } },
      { $unwind: { path: '$alumni', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, user: 1, alumni: 1, expertise: 1, availability:1, description:1, industry:1, experience:1, companySize:1, location:1, rating:1, createdAt:1 } },
      { $sort: { 'rating.average': -1, createdAt: -1 } }
    ];
    const docs = await MentorProfile.aggregate(aggregation);
    const transformed = docs.map(d => buildMentorDto(d, d.user || {}, d.alumni || {}));
    const io = getIo();
    if (io) io.emit('mentorsUpdated', transformed);
  } catch (err) {
    console.error('emitMentorsUpdate error:', err);
  }
};

const emitRequestsUpdate = async (mentorUserId) => {
  try {
    const query = mentorUserId ? { mentorId: mentorUserId, status: 'pending' } : { status: 'pending' };
    const requests = await Mentorship.find(query)
      .populate('menteeId', 'name email')
      .populate('mentorId', 'name email')
      .sort({ createdAt: -1 });

    const transformed = requests.map(request => ({
      id: request._id,
      name: request.menteeId?.name || 'Unknown',
      initials: (request.menteeId?.name || 'UU').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2),
      major: 'Student',
      graduationYear: 'Current Student',
      interests: (request.mentorDetails?.expertise || []).flatMap(exp => [exp.category, ...(exp.skills || [])]).slice(0,3),
      message: request.requestMessage,
      status: request.status,
      createdAt: request.createdAt,
      color: 'from-blue-500 to-purple-600'
    }));

    const io = getIo();
    if (io) {
      // send to the specific mentor room and broadcast general update
      if (mentorUserId) io.to(`user_${mentorUserId}`).emit('requestsUpdated', transformed.filter(r => true));
      io.emit('requestsUpdated', transformed);
    }
  } catch (err) {
    console.error('emitRequestsUpdate error:', err);
  }
};

const emitMyMentorships = async (userId) => {
  try {
    if (!userId) return;
    const asMenteeDocs = await Mentorship.find({ menteeId: userId, status: 'active' }).populate('mentorId', 'name email').sort({ startDate: -1 });
    const asMentorDocs = await Mentorship.find({ mentorId: userId, status: 'active' }).populate('menteeId', 'name email').sort({ startDate: -1 });

    const asMentee = asMenteeDocs.map(m => ({
      id: m._id,
      name: m.mentorId?.name || 'Unknown Mentor',
      initials: (m.mentorId?.name || 'UM').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2),
      expertise: (m.mentorDetails?.expertise || []).flatMap(e=> [e.category, ...(e.skills||[])]).slice(0,2).join(', '),
      nextSession: 'To be scheduled',
      color: 'from-blue-500 to-purple-600'
    }));

    const asMentor = asMentorDocs.map(m => ({
      id: m._id,
      name: m.menteeId?.name || 'Unknown Mentee',
      initials: (m.menteeId?.name || 'UM').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2),
      expertise: 'Student',
      nextSession: 'To be scheduled',
      color: 'from-green-500 to-teal-600'
    }));

    const io = getIo();
    if (io) io.to(`user_${userId}`).emit('myMentorshipsUpdated', { asMentee, asMentor });
  } catch (err) {
    console.error('emitMyMentorships error:', err);
  }
};
