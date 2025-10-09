import Application from '../models/Application.js';
import Event from '../models/Events.js';

// @desc Create an application for an event
// @route POST /api/applications
// @access Private (expects auth middleware)
export const createApplication = async (req, res) => {
  try {
    const { eventId, message } = req.body;
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Prevent duplicate application by same student for same event
    const existing = await Application.findOne({ student: studentId, event: eventId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied to this event' });
    }

    const application = await Application.create({
      student: studentId,
      event: eventId,
      studentName: req.user?.name || req.body.studentName || '',
      studentEmail: req.user?.email || req.body.studentEmail || '',
      message: message || ''
    });

    // Add the student to the event's attendees (avoid duplicates) and update attendance
    try {
      await Event.findByIdAndUpdate(eventId, { $addToSet: { attendees: studentId } });
      const updatedEvent = await Event.findById(eventId);
      if (updatedEvent) {
        updatedEvent.attendance = updatedEvent.attendees.length;
        await updatedEvent.save();
      }
    } catch (err) {
      console.error('Failed to update event attendees after application:', err);
      // Do not fail the application creation - log and continue
    }

    // Populate application and fetch the updated event to return to client for optimistic sync
    const populatedApp = await Application.findById(application._id).populate({ path: 'event', populate: { path: 'postedBy', select: 'name email' } });
    const refreshedEvent = await Event.findById(eventId).populate('postedBy', 'name email');

    // Return both created application and updated event
    res.status(201).json({ success: true, data: populatedApp, event: refreshedEvent });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc Get applications for current student
// @route GET /api/applications/my-applications
// @access Private
export const getMyApplications = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ success: false, message: 'Authentication required' });

    const applications = await Application.find({ student: studentId })
      .populate({ path: 'event', populate: { path: 'postedBy', select: 'name email' } })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc Delete current student's application for an event
// @route DELETE /api/applications/:eventId
// @access Private
export const deleteApplication = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const eventId = req.params.eventId;

    if (!studentId) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!eventId) return res.status(400).json({ success: false, message: 'Event ID required' });

    const application = await Application.findOne({ student: studentId, event: eventId });
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    // Check cancellation window: only allow cancellation if current date is at least 5 days before event date
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const now = new Date();
    const fiveDaysBefore = new Date(event.date);
    fiveDaysBefore.setDate(fiveDaysBefore.getDate() - 5);

    if (now > fiveDaysBefore) {
      return res.status(400).json({ success: false, message: 'Cancellation window has closed (within 5 days of the event)' });
    }

    // Delete the application
    await application.deleteOne();

    // Remove student from event attendees and update attendance
    await Event.findByIdAndUpdate(eventId, { $pull: { attendees: studentId } });
    const refreshedEvent = await Event.findById(eventId).populate('postedBy', 'name email');
    if (refreshedEvent) {
      refreshedEvent.attendance = refreshedEvent.attendees.length;
      await refreshedEvent.save();
    }

    // Return updated event so frontend can sync state without needing to re-fetch lists
    res.status(200).json({ success: true, message: 'Application cancelled', event: refreshedEvent });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
