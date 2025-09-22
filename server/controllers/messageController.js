import Message from '../models/Message.js';
import MentorshipRequest from '../models/MentorshipRequest.js';

// Get messages for a mentorship
export const getMessages = async (req, res) => {
  try {
    const { mentorshipId } = req.params;
    const userId = req.user.id;

    // Verify user is part of this mentorship
    const mentorship = await MentorshipRequest.findOne({
      _id: mentorshipId,
      $or: [{ mentorId: userId }, { menteeId: userId }],
      status: 'accepted'
    });

    if (!mentorship) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ mentorshipId })
      .populate('senderId', 'name')
      .populate('receiverId', 'name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { mentorshipId, content, receiverId } = req.body;
    const senderId = req.user.id;

    // Verify user is part of this mentorship
    const mentorship = await MentorshipRequest.findOne({
      _id: mentorshipId,
      $or: [{ mentorId: senderId }, { menteeId: senderId }],
      status: 'accepted'
    });

    if (!mentorship) {
      return res.status(403).json({ message: 'Not authorized to send messages in this mentorship' });
    }

    const message = new Message({
      mentorshipId,
      senderId,
      receiverId,
      content
    });

    await message.save();

    // Populate for response
    await message.populate('senderId', 'name');
    await message.populate('receiverId', 'name');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiverId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.isRead = true;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
