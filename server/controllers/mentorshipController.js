import Mentorship from '../models/Mentorship.js';
import MentorProfile from '../models/MentorProfile.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';

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