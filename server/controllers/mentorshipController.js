import MentorshipRequest from '../models/MentorshipRequest.js';
//import Alumni from '../models/Alumni.js';

// Send mentorship request
export const sendRequest = async (req, res) => {
  try {
    const { mentorId, message } = req.body;
    const menteeId = req.user.id;

    // Check if request already exists
    const existingRequest = await MentorshipRequest.findOne({
      mentorId,
      menteeId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    const request = new MentorshipRequest({
      mentorId,
      menteeId,
      message
    });

    await request.save();

    // Populate with user data for response
    await request.populate('menteeId', 'name graduationYear currentPosition company');

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's mentorship requests
export const getRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status } = req.query;

    let filter = {};

    if (type === 'received') {
      filter.mentorId = userId;
    } else if (type === 'sent') {
      filter.menteeId = userId;
    }

    if (status) {
      filter.status = status;
    }

    const requests = await MentorshipRequest.find(filter)
      .populate(
        'mentorId',
        'name graduationYear currentPosition company skills industry experience location'
      )
      .populate(
        'menteeId',
        'name graduationYear currentPosition company skills industry experience location'
      )
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update request status (accept/reject)
export const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const request = await MentorshipRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.mentorId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = status;
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's active mentorships
export const getMentorships = async (req, res) => {
  try {
    const userId = req.user.id;

    const mentorships = await MentorshipRequest.find({
      $or: [{ mentorId: userId }, { menteeId: userId }],
      status: 'accepted'
    })
      .populate(
        'mentorId',
        'name graduationYear currentPosition company skills industry experience location'
      )
      .populate(
        'menteeId',
        'name graduationYear currentPosition company skills industry experience location'
      )
      .sort({ updatedAt: -1 });

    res.json(mentorships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
