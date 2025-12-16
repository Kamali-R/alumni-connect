import React, { useState, useEffect, useCallback } from 'react';
import { eventsAPI } from './api';

const EventsAndReunions = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [userPostedEvents, setUserPostedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('viewEvents');
  const [attendanceLoading, setAttendanceLoading] = useState(new Set());
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: '',
    endDate: '',
    location: '',
    mode: '', // 'online' | 'offline' | '' for all
    audience: '' // 'alumni' | 'student' | '' for all
  });
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    date: '',
    time: '',
    location: '',
    rsvpInfo: '',
    // new fields for online/offline events
    mode: 'offline',
    eventLink: '',
    audience: '',
    description: ''
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userPostedEventsLoading, setUserPostedEventsLoading] = useState(false);

  // Helper function to get current user ID
  const getCurrentUserId = () => localStorage.getItem('userId');

  // Helper function to check if event date has passed
  const isEventPast = (eventDate) => {
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj < today;
  };

  // Helper function to check if user is attending an event
  const checkUserAttendance = useCallback((event, userId) => {
    if (!event || !userId) return false;
    
    // First check the isUserAttending flag from server (most reliable)
    if (event.isUserAttending !== undefined && event.isUserAttending !== null) {
      return Boolean(event.isUserAttending);
    }
    
    // Fallback to checking attendees array
    if (event.attendees && Array.isArray(event.attendees)) {
      return event.attendees.some(attendee => {
        if (typeof attendee === 'string') {
          return attendee === userId;
        }
        if (typeof attendee === 'object' && attendee !== null) {
          return attendee._id === userId || attendee.id === userId || attendee.userId === userId;
        }
        return false;
      });
    }
    
    return false;
  }, []);

  // Process events to normalize data structure
  const processEvents = useCallback((eventsArray) => {
    const userId = getCurrentUserId();
    
    return eventsArray.map(event => {
      // Use server-provided isUserAttending flag directly if available
      let isUserAttending = false;
      
      if (event.isUserAttending !== undefined && event.isUserAttending !== null) {
        // Trust the server's calculation
        isUserAttending = Boolean(event.isUserAttending);
      } else {
        // Fallback to local calculation only if server didn't provide it
        isUserAttending = checkUserAttendance(event, userId);
      }
      
      // Calculate attendance count from various possible sources
      let attendanceCount = 0;
      
      if (event.attendees && Array.isArray(event.attendees)) {
        attendanceCount = event.attendees.length;
      } else if (event.attendance !== undefined && event.attendance !== null) {
        attendanceCount = Math.max(0, parseInt(event.attendance) || 0);
      } else if (event.attendeeCount !== undefined) {
        attendanceCount = Math.max(0, parseInt(event.attendeeCount) || 0);
      }
      
      return {
        ...event,
        attendance: attendanceCount,
        isUserAttending
      };
    });
  }, [checkUserAttendance]);

  // Handler functions
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      eventType: '',
      startDate: '',
      endDate: '',
      location: '',
      mode: '',
      audience: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch user's posted events
  const fetchUserPostedEvents = useCallback(async () => {
    try {
      setUserPostedEventsLoading(true);
      
      console.log('Fetching user posted events...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        setUserPostedEvents([]);
        return;
      }

      const response = await eventsAPI.getUserEvents();
      console.log('getUserEvents API response:', response);
      
      // Extract events data from response
      let eventsData = [];
      if (response?.data?.data) {
        eventsData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        eventsData = response.data;
      } else if (response && Array.isArray(response)) {
        eventsData = response;
      }

      console.log('Extracted user events data:', eventsData);
      
      // Process the events
      const processedEvents = processEvents(eventsData);
      console.log('Processed user events:', processedEvents);
      
      setUserPostedEvents(processedEvents);
      
    } catch (err) {
      console.error('Failed to fetch user posted events:', err);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        console.error('Authentication failed - user may need to log in again');
      }
      
      setUserPostedEvents([]);
    } finally {
      setUserPostedEventsLoading(false);
    }
  }, [processEvents]);

  // Fetch all events - FIXED: Always refresh from server to get latest attendance status
  const fetchAllEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await eventsAPI.getAll(filters);
      const eventsData = response.data?.data || response.data || response || [];
      
      console.log('Raw events from server:', eventsData);
      
      const processedEvents = processEvents(Array.isArray(eventsData) ? eventsData : []);
      
      console.log('Processed events with attendance status:', processedEvents);
      
      setEvents(processedEvents);
      setFilteredEvents(processedEvents);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, processEvents]);

  useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    // Fetch user posted events immediately on component mount if user is logged in
    fetchUserPostedEvents();
  }
  // Also fetch all events
  fetchAllEvents();
}, [fetchAllEvents, fetchUserPostedEvents]);

  // FIXED: Also refresh events when switching to viewEvents tab to get latest data
  useEffect(() => {
    if (activeTab === 'viewEvents') {
      fetchAllEvents();
    }
  }, [activeTab, fetchAllEvents]);

  useEffect(() => {
    if (activeTab === 'postedEvents') {
      fetchUserPostedEvents();
    }
  }, [activeTab, fetchUserPostedEvents]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // client-side validation: online events must include an event link
      if (formData.mode === 'online' && (!formData.eventLink || formData.eventLink.trim() === '')) {
        alert('Please provide the online event link for online events');
        return;
      }
      const response = await eventsAPI.create(formData);
      const newEvent = response.data?.data || response.data;
      
      // Add current user info to the new event
      const userId = getCurrentUserId();
      const enrichedEvent = {
        ...newEvent,
        postedBy: userId,
        attendance: 0,
        isUserAttending: false, // Creator doesn't automatically attend
        attendees: []
      };
      
      const processedEvent = processEvents([enrichedEvent])[0];
      
      // Add to all relevant state arrays
      setEvents(prev => [processedEvent, ...prev]);
      setFilteredEvents(prev => [processedEvent, ...prev]);
      setUserPostedEvents(prev => [processedEvent, ...prev]);
      
      setFormData({
        title: '',
        type: '',
        date: '',
        time: '',
        location: '',
        rsvpInfo: '',
        mode: 'offline',
        eventLink: '',
        description: ''
      });
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('postedEvents');
      }, 2000);
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  // FIXED: Handle attendance button click with better server sync
  const handleAttendanceClick = async (eventId) => {
    if (attendanceLoading.has(eventId)) {
      return;
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to attend events');
      return;
    }

    const currentEvent = events.find(e => e._id === eventId || e.id === eventId);
    if (!currentEvent) {
      console.error('Event not found:', eventId);
      return;
    }

    console.log('=== ATTENDANCE CLICK DEBUG ===');
    console.log('Event ID:', eventId);
    console.log('Current event:', currentEvent);
    console.log('Current isUserAttending:', currentEvent.isUserAttending);

    setAttendanceLoading(prev => new Set([...prev, eventId]));

    try {
      const response = await eventsAPI.toggleAttendance(eventId);
      console.log('Toggle attendance API response:', response);
      
      // Get the updated event data from server response
      let updatedEventFromServer = null;
      if (response.data?.data) {
        updatedEventFromServer = response.data.data;
      } else if (response.data) {
        updatedEventFromServer = response.data;
      }

      console.log('Updated event from server:', updatedEventFromServer);

      // Update function that uses server data
      const updateEventInArray = (eventArray) => {
        return eventArray.map(event => {
          if (event._id === eventId || event.id === eventId) {
            // Use server-provided data for the most accurate state
            const updatedEvent = {
              ...event,
              ...updatedEventFromServer, // Use server data
              // Ensure we have the correct attendance count and status
              attendance: updatedEventFromServer?.attendance || updatedEventFromServer?.attendees?.length || 0,
              isUserAttending: Boolean(updatedEventFromServer?.isUserAttending)
            };
            console.log('Updated event with server data:', updatedEvent);
            return updatedEvent;
          }
          return event;
        });
      };

      // Apply updates to all arrays
      setEvents(prev => updateEventInArray(prev));
      setFilteredEvents(prev => updateEventInArray(prev));
      setUserPostedEvents(prev => updateEventInArray(prev));

      console.log('State updated successfully with server data');

    } catch (err) {
      console.error('Attendance update failed:', err);
      if (err.response?.status === 401) {
        alert('Please log in again to attend events');
      } else {
        alert('Failed to update attendance. Please try again.');
      }
    } finally {
      setAttendanceLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const dateObj = new Date(dateString);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    try {
      if (!timeString) return 'No time specified';
      
      const [hours, minutes] = timeString.split(':');
      const dateObj = new Date();
      dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Get event type display name and color
  const getEventTypeDisplay = (type) => {
    const types = {
      networking: { text: 'Networking Event', color: 'bg-green-100 text-green-800' },
      reunion: { text: 'Class Reunion', color: 'bg-blue-100 text-blue-800' },
      gala: { text: 'Gala/Formal Event', color: 'bg-purple-100 text-purple-800' },
      workshop: { text: 'Workshop/Seminar', color: 'bg-yellow-100 text-yellow-800' },
      social: { text: 'Social Gathering', color: 'bg-pink-100 text-pink-800' },
      fundraiser: { text: 'Fundraiser', color: 'bg-red-100 text-red-800' },
      other: { text: 'Other', color: 'bg-gray-100 text-gray-800' }
    };
    
    return types[type] || { text: 'Other', color: 'bg-gray-100 text-gray-800' };
  };

  // Calculate time since posted
  const getTimeSincePosted = (postedDate) => {
    try {
      if (!postedDate) return 'recently';
      
      const now = new Date();
      const posted = new Date(postedDate);
      const diffMs = now - posted;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch (error) {
      return 'recently';
    }
  };

  // Event Card Component
  const EventCard = ({ event, onAttendanceClick }) => {
    const eventTypeDisplay = getEventTypeDisplay(event.type);
    const isPastEvent = isEventPast(event.date);
    const eventId = event._id || event.id;
    const isLoadingAttendance = attendanceLoading.has(eventId);
    
    // Use server-provided values
    const attendanceCount = Math.max(0, event.attendance || 0);
    const isUserAttending = Boolean(event.isUserAttending);
    
    // Check if user is logged in
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    
    console.log(`Button Debug - Event: ${event.title}`);
    console.log(`- isUserAttending: ${isUserAttending}`);
    console.log(`- attendanceCount: ${attendanceCount}`);
    console.log(`- isLoggedIn: ${isLoggedIn}`);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
            <div className="flex items-center text-sm text-gray-600 mb-1 flex-wrap gap-2">
              <span className={`${eventTypeDisplay.color} px-2 py-1 rounded-full text-xs font-medium`}>
                {eventTypeDisplay.text}
              </span>
              <span className={`${event.mode === 'online' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'} px-2 py-1 rounded-full text-xs font-medium`}>
                {event.mode === 'online' ? 'Online' : 'Offline'}
              </span>
              <span className={`${event.audience === 'student' ? 'bg-indigo-50 text-indigo-800' : event.audience === 'alumni' ? 'bg-yellow-50 text-yellow-800' : 'bg-gray-100 text-gray-800'} px-2 py-1 rounded-full text-xs font-medium`}>
                {event.audience === 'student' ? 'For: Students' : event.audience === 'alumni' ? 'For: Alumni' : 'For: All'}
              </span>
              <span>{formatDate(event.date)}</span>
              <span>{formatTime(event.time)}</span>
              {isPastEvent && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  Event Closed
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 mb-3">
              <span>{event.location}</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">{event.description}</p>
            {event.rsvpInfo && (
              <p className="text-sm text-gray-600"><strong>RSVP:</strong> {event.rsvpInfo}</p>
            )}
            {event.mode === 'online' && event.eventLink && (
              <p className="text-sm text-blue-600 mt-2"><strong>Join:</strong> <a href={event.eventLink} target="_blank" rel="noreferrer" className="underline">{event.eventLink}</a></p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-gray-100 gap-4">
          <span className="text-xs text-gray-500">
            Posted {getTimeSincePosted(event.postedDate || event.createdAt)}
          </span>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">👥</span>
              <span>{attendanceCount} {attendanceCount === 1 ? 'person' : 'people'} willing to attend</span>
            </div>
            
            {/* Only show attendance button if user is logged in */}
            {isLoggedIn && (
              <button 
                onClick={() => onAttendanceClick(eventId)}
                disabled={isPastEvent || isLoadingAttendance}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  min-w-[140px] h-10 flex items-center justify-center
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isPastEvent 
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : isLoadingAttendance
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : isUserAttending 
                        ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-md' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                  }
                `}>
                
                {isLoadingAttendance ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : isPastEvent ? (
                  'Event Closed'
                ) : isUserAttending ? (
                  <span className="flex items-center gap-1">
                    <span className="text-lg">✓</span>
                    <span>Attending</span>
                  </span>
                ) : (
                  "I'm Attending"
                )}
              </button>
            )}
            
            {/* Show login prompt for non-logged in users */}
            {!isLoggedIn && !isPastEvent && (
              <span className="text-sm text-gray-500 italic">
                Login to attend events
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Events & Reunions</h1>
          <p className="text-gray-600 mt-1">Create and manage alumni events</p>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button 
              onClick={() => setActiveTab('viewEvents')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'viewEvents' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              View Events
            </button>
            <button 
              onClick={() => setActiveTab('postEvent')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'postEvent' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              Post Event
            </button>
            <button 
              onClick={() => setActiveTab('postedEvents')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'postedEvents' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              Posted Events ({userPostedEvents.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* View Events Section */}
        {activeTab === 'viewEvents' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upcoming Events</h2>
              <p className="text-gray-600">Browse and RSVP to upcoming alumni events</p>
              
              {/* Filter Options */}
              <div className="mt-6 bg-gray-50 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Filter Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Event Type</label>
                    <select 
                      name="eventType"
                      value={filters.eventType}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="">All Types</option>
                      <option value="networking">Networking Event</option>
                      <option value="reunion">Class Reunion</option>
                      <option value="gala">Gala/Formal Event</option>
                      <option value="workshop">Workshop/Seminar</option>
                      <option value="social">Social Gathering</option>
                      <option value="fundraiser">Fundraiser</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">From Date</label>
                    <input 
                      type="date" 
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">To Date</label>
                    <input 
                      type="date" 
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Location</label>
                    <input 
                      type="text" 
                      name="location"
                      value={filters.location}
                      onChange={handleFilterChange}
                      placeholder="Search location..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Event Mode</label>
                    <select
                      name="mode"
                      value={filters.mode}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">All Modes</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Event Audience</label>
                    <select
                      name="audience"
                      value={filters.audience}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">All Audiences</option>
                      <option value="alumni">Alumni</option>
                      <option value="student">Students</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Clear all filters
                  </button>
                  <div className="text-xs text-gray-500">
                    Showing {filteredEvents.length} events
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading events...</p>
                </div>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <EventCard 
                    key={event._id || event.id}
                    event={event} 
                    onAttendanceClick={handleAttendanceClick} 
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600">Try adjusting your filters or check back later</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post Event Form */}
        {activeTab === 'postEvent' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Post an Event</h2>
              <p className="text-gray-600">Fill out the form below to create a new alumni event</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Select event type</option>
                  <option value="networking">Networking Event</option>
                  <option value="reunion">Class Reunion</option>
                  <option value="gala">Gala/Formal Event</option>
                  <option value="workshop">Workshop/Seminar</option>
                  <option value="social">Social Gathering</option>
                  <option value="fundraiser">Fundraiser</option>
                  <option value="other">Other</option>
                </select>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Audience <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="audience"
                    value={formData.audience}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Select audience</option>
                    <option value="alumni">Alumni</option>
                    <option value="student">Students</option>
                  </select>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]} // Prevents selecting past dates
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter venue address or location"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Mode <span className="text-gray-400 text-sm">(Online or Offline)</span>
                  </label>
                  <select
                    name="mode"
                    value={formData.mode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white mb-3"
                  >
                    <option value="offline">Offline (In-person)</option>
                    <option value="online">Online</option>
                  </select>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RSVP Link or Contact Info <span className="text-gray-400 text-sm">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="rsvpInfo"
                    value={formData.rsvpInfo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="RSVP link or contact email"
                  />
                </div>
              </div>
              {formData.mode === 'online' && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Online Event Link <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      name="eventLink"
                      value={formData.eventLink}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="https://example.com/meeting-link"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Provide details about the event, agenda, dress code, and any other relevant information..."
                ></textarea>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className={`font-medium px-8 py-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    submitSuccess 
                      ? 'bg-green-600' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}>
                  {submitSuccess ? '✅ Event Posted!' : 'Post Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posted Events Section */}
        {activeTab === 'postedEvents' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Posted Events</h2>
              <p className="text-gray-600">Events you have created</p>
            </div>
            
            <div className="space-y-4">
              {userPostedEventsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading your events...</p>
                </div>
              ) : userPostedEvents.length > 0 ? (
                userPostedEvents.map(event => (
                  <EventCard 
                    key={event._id || event.id}
                    event={event} 
                    onAttendanceClick={handleAttendanceClick} 
                  />
                ))
              ) : (
                <div id="emptyState" className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events added</h3>
                  <p className="text-gray-600">You haven't created any events yet</p>
                  <button
                    onClick={() => setActiveTab('postEvent')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Event
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsAndReunions;