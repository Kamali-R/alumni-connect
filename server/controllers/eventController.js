import Event from '../models/Events.js';

// @desc    Get all events with optional filtering
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
  const { eventType, startDate, endDate, location, mode } = req.query;
    
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
    
    const events = await Event.find(filter)
      .populate('postedBy', 'name email')
      .populate('attendees', 'name email')
      .sort({ date: 1 });
    
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
      
      return eventObj;
    });
    
    console.log('Events fetched with attendance status:', {
      totalEvents: events.length,
      userAuthenticated: !!req.user,
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
      .populate('postedBy', 'name email')
      .populate('attendees', 'name email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
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