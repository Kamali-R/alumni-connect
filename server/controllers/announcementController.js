import Announcement from '../models/Announcement.js';

// Create a new announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { subject, message, category, audience } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const announcement = new Announcement({
      subject,
      message,
      category: category || 'General',
      audience: audience || 'All Users',
      createdBy: req.user?.id || null
    });

    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

// Get all announcements (admin only)
export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

// Get announcements for students
export const getStudentAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      audience: { $in: ['All Users', 'Students Only'] }
    }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching student announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

// Get announcements for alumni
export const getAlumniAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      audience: { $in: ['All Users', 'Alumni Only'] }
    }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching alumni announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

// Get announcements by category
export const getAnnouncementsByCategory = async (req, res) => {
  try {
    const { category, userType } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (userType === 'student') {
      query.audience = { $in: ['All Users', 'Students Only'] };
    } else if (userType === 'alumni') {
      query.audience = { $in: ['All Users', 'Alumni Only'] };
    }

    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements by category:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

// Delete announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};
