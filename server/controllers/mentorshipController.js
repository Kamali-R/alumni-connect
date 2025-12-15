import Mentor from '../models/Mentor.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import User from '../models/User.js';

// GET /api/mentorship/mentors
export const getMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find().populate('user', 'name email');
    res.status(200).json({ success: true, count: mentors.length, data: mentors });
  } catch (err) {
    console.error('Get mentors error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/mentorship/mentors - create or update mentor profile
export const becomeMentor = async (req, res) => {
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

// GET /api/mentorship/my
export const getMyMentorships = async (req, res) => {
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
