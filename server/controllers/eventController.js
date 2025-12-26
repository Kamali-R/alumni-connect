import Event from '../models/Events.js';
import User from '../models/User.js';

// @desc    Get all events with optional filtering
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
  const { eventType, startDate, endDate, location, mode, audience } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (eventType) {
      filter.type = eventType;
    }
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Filter by event mode if provided (online/offline)
    if (mode && (mode === 'online' || mode === 'offline')) {
      if (mode === 'online') {
        // only events explicitly marked online
        filter.mode = 'online';
      } else {
        // Treat missing mode as offline for backward compatibility
        filter.$or = [
          { mode: 'offline' },
          { mode: { $exists: false } },
          { mode: null }
        ];
      }
    }
    
    // Get user role if authenticated
    let userRole = null;
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id).select('role');
      userRole = user?.role;
    }
    
    // Filter by audience based on user role
    // - If event audience is "student", only students can see it
    // - If event audience is "alumni", only alumni can see it
    // - If event audience is "all", everyone can see it
    // - Users always see their own events
    const audienceFilter = [];
    
    if (userRole === 'student') {
      audienceFilter.push({ audience: 'student' });
      audienceFilter.push({ audience: 'all' });
    } else if (userRole === 'alumni') {
      audienceFilter.push({ audience: 'alumni' });
      audienceFilter.push({ audience: 'all' });
    } else {
      // Non-authenticated users only see "all" audience events
      audienceFilter.push({ audience: 'all' });
    }
    
    // User can always see their own events
    if (req.user && req.user.id) {
      audienceFilter.push({ postedBy: req.user.id });
    }
    
    // Filter by event status - only show accepted events to regular users
    // Users can see their own pending/rejected events
    if (req.user && req.user.id) {
      filter.$and = [
        {
          $or: [
            { status: 'accepted' }, // Show all accepted events
            { postedBy: req.user.id } // Show user's own events regardless of status
          ]
        },
        {
          $or: audienceFilter // Apply audience filter
        }
      ];
    } else {
      // Non-authenticated users only see accepted events with "all" audience
      filter.$and = [
        { status: 'accepted' },
        { $or: audienceFilter }
      ];
    }
    
    const events = await Event.find(filter)
      .populate('postedBy', 'name email role')
      .populate('attendees', 'name email')
      .sort({ createdAt: -1 });
    
    // Add isUserAttending flag for each event if user is authenticated
    const eventsWithAttendanceStatus = events.map(event => {
      const eventObj = event.toObject();
      
      // Check if user is authenticated and attending
      if (req.user && req.user.id) {
        eventObj.isUserAttending = event.attendees.some(
          attendee => attendee._id.toString() === req.user.id.toString()
        );
      } else {
        eventObj.isUserAttending = false;
      }
      
      // Ensure attendance count is accurate
      eventObj.attendance = event.attendees.length;
      // Ensure mode and eventLink defaults
      eventObj.mode = event.mode || 'offline';
      eventObj.eventLink = event.eventLink || '';
    eventObj.audience = event.audience || 'all';
      
      return eventObj;
    });
    
    console.log('Events fetched with attendance status:', {
      totalEvents: events.length,
      userAuthenticated: !!req.user,
      userRole: userRole,
      userId: req.user?.id
    });
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: eventsWithAttendanceStatus
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('postedBy', 'name email role')
      .populate('attendees', 'name email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user can view this event
    // User can view if:
    // 1. User is the one who posted it (any status)
    // 2. Event is accepted AND matches user's role/audience
    
    const isOwner = req.user && req.user.id && event.postedBy._id.toString() === req.user.id.toString();
    
    if (!isOwner && event.status !== 'accepted') {
      return res.status(403).json({
        success: false,
        message: 'This event is not available'
      });
    }
    
    // Check audience permissions
    if (!isOwner && event.status === 'accepted') {
      let userRole = null;
      if (req.user && req.user.id) {
        const user = await User.findById(req.user.id).select('role');
        userRole = user?.role;
      }
      
      const canView = 
        event.audience === 'all' ||
        (userRole === 'student' && event.audience === 'student') ||
        (userRole === 'alumni' && event.audience === 'alumni');
      
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'This event is not intended for your audience'
        });
      }
    }
    
    const eventObj = event.toObject();
    
    // Add isUserAttending flag if user is authenticated
    if (req.user && req.user.id) {
      eventObj.isUserAttending = event.attendees.some(
        attendee => attendee._id.toString() === req.user.id.toString()
      );
    } else {
      eventObj.isUserAttending = false;
    }
    
    // Ensure attendance count is accurate
    eventObj.attendance = event.attendees.length;
    eventObj.mode = event.mode || 'offline';
    eventObj.eventLink = event.eventLink || '';
  eventObj.audience = event.audience || 'all';
    
    res.status(200).json({
      success: true,
      data: eventObj
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private
export const createEvent = async (req, res) => {
  try {
    console.log('Creating event with user ID:', req.user?.id);
    console.log('Request body:', req.body);
    
    // Use req.user.id (from your auth middleware)
    req.body.postedBy = req.user.id;
    // Normalize audience (accept case-insensitive and common plurals from frontend)
    if (req.body.audience && typeof req.body.audience === 'string') {
      const rawAudience = req.body.audience.toLowerCase().trim();
      if (rawAudience === 'students' || rawAudience === 'student') {
        req.body.audience = 'student';
      } else if (rawAudience === 'alumni' || rawAudience === 'alumnus' || rawAudience === 'alum') {
        req.body.audience = 'alumni';
      } else if (rawAudience === 'all' || rawAudience === '') {
        req.body.audience = 'all';
      } else {
        // leave as provided (will be validated below)
        req.body.audience = rawAudience;
      }
    }

    // Validate audience (allow 'student', 'alumni', or 'all')
    if (!req.body.audience || !['alumni', 'student', 'all'].includes(req.body.audience)) {
      return res.status(400).json({ success: false, message: 'Event audience must be one of "alumni", "student", or "all"' });
    }
    // Ensure mode and eventLink consistency
    if (req.body.mode === 'online') {
      if (!req.body.eventLink || typeof req.body.eventLink !== 'string' || req.body.eventLink.trim() === '') {
        return res.status(400).json({ success: false, message: 'Online events must include an eventLink' });
      }
    } else {
      // For offline events, clear eventLink to avoid stale data
      req.body.eventLink = req.body.eventLink || '';
      req.body.mode = 'offline';
    }
    
    const event = await Event.create(req.body);
    
    // Populate the created event with user details
    const populatedEvent = await Event.findById(event._id)
      .populate('postedBy', 'name email');
    
    const eventObj = populatedEvent.toObject();
    eventObj.isUserAttending = false; // New event, user not attending yet
    eventObj.attendance = 0; // New event, no attendees
  eventObj.audience = eventObj.audience || 'all';
    
    console.log('Event created successfully:', populatedEvent);
    
    res.status(201).json({
      success: true,
      data: eventObj
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Make sure user is event owner
    if (event.postedBy.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }
    // Validate mode and eventLink on update
    if (req.body.mode === 'online') {
      if (!req.body.eventLink || typeof req.body.eventLink !== 'string' || req.body.eventLink.trim() === '') {
        return res.status(400).json({ success: false, message: 'Online events must include an eventLink' });
      }
    } else if (req.body.mode === 'offline') {
      // clear link if switching to offline
      req.body.eventLink = req.body.eventLink || '';
    }
    // Normalize audience on update (accept case-insensitive and common plurals)
    if (req.body.audience && typeof req.body.audience === 'string') {
      const rawAudience = req.body.audience.toLowerCase().trim();
      if (rawAudience === 'students' || rawAudience === 'student') {
        req.body.audience = 'student';
      } else if (rawAudience === 'alumni' || rawAudience === 'alumnus' || rawAudience === 'alum') {
        req.body.audience = 'alumni';
      } else if (rawAudience === 'all' || rawAudience === '') {
        req.body.audience = 'all';
      } else {
        req.body.audience = rawAudience;
      }
    }

    // Validate audience on update if provided
    if (req.body.audience && !['alumni', 'student', 'all'].includes(req.body.audience)) {
      return res.status(400).json({ success: false, message: 'Event audience must be one of "alumni", "student", or "all"' });
    }
    
    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('postedBy', 'name email')
      .populate('attendees', 'name email');
    
    const eventObj = event.toObject();
    eventObj.isUserAttending = event.attendees.some(
      attendee => attendee._id.toString() === req.user.id.toString()
    );
    eventObj.attendance = event.attendees.length;
    // Ensure mode and eventLink are present in response
    eventObj.mode = event.mode || 'offline';
    eventObj.eventLink = event.eventLink || '';
    
    res.status(200).json({
      success: true,
      data: eventObj
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Make sure user is event owner
    if (event.postedBy.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }
    
    await event.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Toggle attendance for an event
// @route   PUT /api/events/:id/attendance
// @access  Private
export const toggleAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const userId = req.user.id;
    
    // Check if user is already attending - use string comparison for consistency
    const isCurrentlyAttending = event.attendees.some(
      attendee => attendee.toString() === userId.toString()
    );
    
    console.log('Toggle attendance - Current state:', {
      eventId: req.params.id,
      userId: userId,
      isCurrentlyAttending,
      currentAttendeeCount: event.attendees.length,
      currentAttendees: event.attendees.map(a => a.toString())
    });
    
    if (isCurrentlyAttending) {
      // Remove user from attendees - use filter to ensure clean removal
      event.attendees = event.attendees.filter(
        attendee => attendee.toString() !== userId.toString()
      );
    } else {
      // Add user to attendees - check if already exists to prevent duplicates
      const userIdString = userId.toString();
      if (!event.attendees.some(attendee => attendee.toString() === userIdString)) {
        event.attendees.push(userId);
      }
    }
    
    // Update attendance count based on attendees array length
    event.attendance = event.attendees.length;
    
    // Save the event
    await event.save();
    
    // Get updated event with populated fields for response
    const updatedEvent = await Event.findById(req.params.id)
      .populate('postedBy', 'name email')
      .populate('attendees', 'name email');
    
    const eventObj = updatedEvent.toObject();
    
    // Set the correct attendance status
    eventObj.isUserAttending = !isCurrentlyAttending;
    eventObj.attendance = updatedEvent.attendees.length;
  eventObj.mode = updatedEvent.mode || 'offline';
  eventObj.eventLink = updatedEvent.eventLink || '';
    
    console.log('Toggle attendance - New state:', {
      eventId: req.params.id,
      userId: userId,
      newIsUserAttending: eventObj.isUserAttending,
      newAttendeeCount: eventObj.attendance,
      newAttendees: eventObj.attendees.map(a => a._id || a.id)
    });
    
    res.status(200).json({
      success: true,
      data: eventObj,
      message: eventObj.isUserAttending 
        ? 'Successfully registered for event' 
        : 'Successfully unregistered from event'
    });
  } catch (error) {
    console.error('Toggle attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get events posted by the currently authenticated user
// @route   GET /api/events/my-events
// @access  Private
export const getUserEvents = async (req, res) => {
  try {
    // Use the authenticated user's ID from the auth middleware
    const userId = req.user.id;
    
    console.log('Fetching events for user ID:', userId);
    
    const events = await Event.find({ postedBy: userId })
      .populate('postedBy', 'name email')
      .populate('attendees', 'name email')
      .sort({ createdAt: -1 });
    
    // Add isUserAttending flag for each event
    const eventsWithAttendanceStatus = events.map(event => {
      const eventObj = event.toObject();
      eventObj.isUserAttending = event.attendees.some(
        attendee => attendee._id.toString() === userId.toString()
      );
      eventObj.attendance = event.attendees.length;
      eventObj.mode = event.mode || 'offline';
      eventObj.eventLink = event.eventLink || '';
      return eventObj;
    });
    
    console.log('Found user events:', {
      userId: userId,
      eventsCount: events.length,
      events: eventsWithAttendanceStatus.map(e => ({
        id: e._id,
        title: e.title,
        isUserAttending: e.isUserAttending,
        attendance: e.attendance
      }))
    });
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: eventsWithAttendanceStatus
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get pending events (admin only)
// @route   GET /api/events/pending
// @access  Private (Admin only)
export const getPendingEvents = async (req, res) => {
  try {
    // Note: Admin check should be done in middleware, not here
    const events = await Event.find({ status: 'pending' })
      .populate('postedBy', 'name email')
      .populate('attendees', 'name email')
      .sort({ createdAt: -1 });
    
    const eventsWithData = events.map(event => {
      const eventObj = event.toObject();
      eventObj.attendance = event.attendees.length;
      eventObj.mode = event.mode || 'offline';
      eventObj.eventLink = event.eventLink || '';
      eventObj.audience = event.audience || 'all';
      return eventObj;
    });
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: eventsWithData
    });
  } catch (error) {
    console.error('Get pending events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get rejected events (admin only)
// @route   GET /api/events/admin/rejected
// @access  Private (Admin only)
export const getRejectedEvents = async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check admin role - handle dev token
    if (req.user.id !== 'admin-dev') {
      const user = await User.findById(req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can view rejected events'
        });
      }
    }

    const events = await Event.find({ status: 'rejected' })
      .populate('postedBy', 'name email role')
      .populate('attendees', 'name email')
      .sort({ updatedAt: -1 });

    const eventsWithData = events.map(event => {
      const eventObj = event.toObject();
      eventObj.attendance = event.attendees.length;
      eventObj.mode = event.mode || 'offline';
      eventObj.eventLink = event.eventLink || '';
      eventObj.audience = event.audience || 'all';
      return eventObj;
    });

    res.status(200).json({
      success: true,
      count: events.length,
      data: eventsWithData
    });
  } catch (error) {
    console.error('Get rejected events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Approve event (admin only)
// @route   PATCH /api/events/:id/approve
// @access  Private (Admin only)
export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    if (event.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending events can be approved'
      });
    }
    
    event.status = 'accepted';
    event.rejectionReason = ''; // Clear any rejection reason
    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('postedBy', 'name email')
      .populate('attendees', 'name email');
    
    const eventObj = populatedEvent.toObject();
    eventObj.attendance = populatedEvent.attendees.length;
    eventObj.mode = eventObj.mode || 'offline';
    eventObj.eventLink = eventObj.eventLink || '';
    eventObj.audience = eventObj.audience || 'all';
    
    res.status(200).json({
      success: true,
      message: 'Event approved successfully',
      data: eventObj
    });
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Reject event (admin only)
// @route   PATCH /api/events/:id/reject
// @access  Private (Admin only)
export const rejectEvent = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    if (event.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending events can be rejected'
      });
    }
    
    event.status = 'rejected';
    event.rejectionReason = reason || 'Event was rejected by admin';
    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('postedBy', 'name email')
      .populate('attendees', 'name email');
    
    const eventObj = populatedEvent.toObject();
    eventObj.attendance = populatedEvent.attendees.length;
    eventObj.mode = eventObj.mode || 'offline';
    eventObj.eventLink = eventObj.eventLink || '';
    eventObj.audience = eventObj.audience || 'all';
    
    res.status(200).json({
      success: true,
      message: 'Event rejected successfully',
      data: eventObj
    });
  } catch (error) {
    console.error('Reject event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};