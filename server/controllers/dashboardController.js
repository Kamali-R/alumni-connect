import MentorshipRequest from '../models/MentorshipRequest.js';
import Alumni from '../models/Alumni.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      activeMentorships,
      pendingRequests,
      mentorProfile
    ] = await Promise.all([
      // Count active mentorships
      MentorshipRequest.countDocuments({
        $or: [{ mentorId: userId }, { menteeId: userId }],
        status: 'accepted'
      }),

      // Count pending requests (received)
      MentorshipRequest.countDocuments({
        mentorId: userId,
        status: 'pending'
      }),

      // Check if user is a mentor
      Alumni.findById(userId).select('isMentor')
    ]);

    res.json({
      activeMentorships,
      pendingRequests,
      isMentor: mentorProfile?.isMentor || false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
