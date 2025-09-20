import React, { useState, useEffect } from 'react';

const AlumniEventPortal = () => {
  const [activeTab, setActiveTab] = useState('viewEvents');
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Annual Alumni Gala 2024',
      type: 'gala',
      date: '2024-03-15',
      time: '19:00',
      location: 'Grand Ballroom, Downtown Hotel',
      description: 'Join us for an elegant evening of networking, awards, and celebration of our alumni achievements. Formal attire required.',
      rsvpInfo: '',
      attendance: 47,
      postedDate: new Date('2024-03-10'),
      isUserAttending: false,
      isPostedByUser: false
    },
    {
      id: 2,
      title: 'Class of 2010 Reunion',
      type: 'reunion',
      date: '2024-04-22',
      time: '14:00',
      location: 'University Campus, Alumni Center',
      description: 'Reconnect with your classmates and relive the memories from your graduation year. Casual attire welcome.',
      rsvpInfo: '',
      attendance: 23,
      postedDate: new Date('2024-03-03'),
      isUserAttending: false,
      isPostedByUser: false
    },
    {
      id: 3,
      title: 'Professional Networking Mixer',
      type: 'networking',
      date: '2024-05-10',
      time: '18:30',
      location: 'Rooftop Lounge, Business District',
      description: 'Connect with fellow alumni across various industries. Light refreshments and drinks will be provided.',
      rsvpInfo: 'networking@alumni.edu',
      attendance: 15,
      postedDate: new Date('2024-03-09'),
      isUserAttending: false,
      isPostedByUser: false
    }
  ]);
  
  const [userPostedEvents, setUserPostedEvents] = useState([]);
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: '',
    endDate: '',
    location: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    date: '',
    time: '',
    location: '',
    rsvpInfo: '',
    description: ''
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filter events based on current filters
  const filteredEvents = events.filter(event => {
    const eventTypeMatch = !filters.eventType || event.type === filters.eventType;
    const startDateMatch = !filters.startDate || event.date >= filters.startDate;
    const endDateMatch = !filters.endDate || event.date <= filters.endDate;
    const locationMatch = !filters.location || 
      event.location.toLowerCase().includes(filters.location.toLowerCase());
    
    return eventTypeMatch && startDateMatch && endDateMatch && locationMatch;
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      eventType: '',
      startDate: '',
      endDate: '',
      location: ''
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newEvent = {
      id: events.length + 1,
      ...formData,
      attendance: 0,
      postedDate: new Date(),
      isUserAttending: false,
      isPostedByUser: true
    };
    
    // Add to events list
    setEvents([newEvent, ...events]);
    
    // Add to user posted events
    setUserPostedEvents([newEvent, ...userPostedEvents]);
    
    // Reset form
    setFormData({
      title: '',
      type: '',
      date: '',
      time: '',
      location: '',
      rsvpInfo: '',
      description: ''
    });
    
    // Show success message
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setActiveTab('postedEvents');
    }, 2000);
  };

  // Handle attendance button click
  const handleAttendanceClick = (eventId) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const newAttendance = event.isUserAttending 
          ? event.attendance - 1 
          : event.attendance + 1;
        
        return {
          ...event,
          attendance: newAttendance,
          isUserAttending: !event.isUserAttending
        };
      }
      return event;
    }));
    
    // Also update in userPostedEvents if it exists there
    setUserPostedEvents(userPostedEvents.map(event => {
      if (event.id === eventId) {
        const newAttendance = event.isUserAttending 
          ? event.attendance - 1 
          : event.attendance + 1;
        
        return {
          ...event,
          attendance: newAttendance,
          isUserAttending: !event.isUserAttending
        };
      }
      return event;
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const dateObj = new Date();
    dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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

  };

  // Event Card Component
  const EventCard = ({ event, onAttendanceClick }) => {
    const eventTypeDisplay = getEventTypeDisplay(event.type);
    
    return (
      <div className="event-card bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
           data-event-type={event.type}
           data-event-date={event.date}
           data-event-location={event.location}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <span
  className={`${eventTypeDisplay.color} px-2 py-1 rounded-full text-xs font-medium mr-3`}
>
  {eventTypeDisplay.text}
</span>

              <span className="mr-4">📅 {formatDate(event.date)}</span>
              <span className="mr-4">🕐 {formatTime(event.time)}</span>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              <span className="mr-4">📍 {event.location}</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">{event.description}</p>
            {event.rsvpInfo && (
              <p className="text-sm text-gray-600"><strong>RSVP:</strong> {event.rsvpInfo}</p>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">Posted {getTimeSincePosted(event.postedDate)}</span>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">👥 {event.attendance} willing to attend</span>
            <button 
              onClick={() => onAttendanceClick(event.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors attendance-btn btn-interactive ${
                event.isUserAttending 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}>
              {event.isUserAttending ? '✅ Attending' : "I'm Attending"}
            </button>
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
              className={`tab-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'viewEvents' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              View Events
            </button>
            <button 
              onClick={() => setActiveTab('postEvent')}
              className={`tab-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'postEvent' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              Post Event
            </button>
            <button 
              onClick={() => setActiveTab('postedEvents')}
              className={`tab-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'postedEvents' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              Posted Events
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* View Events Section */}
        {activeTab === 'viewEvents' && (
          <div className="bg-white rounded-lg card-shadow p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upcoming Events</h2>
              <p className="text-gray-600">Browse and RSVP to upcoming alumni events</p>
              
              {/* Filter Options */}
              <div className="mt-6 bg-gray-50 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Filter Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Event Type Filter */}
                  <div>
                    <label htmlFor="filterEventType" className="block text-xs font-medium text-gray-700 mb-2">Event Type</label>
                    <select 
                      id="filterEventType"
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
                  
                  {/* Start Date Filter */}
                  <div>
                    <label htmlFor="filterStartDate" className="block text-xs font-medium text-gray-700 mb-2">From Date</label>
                    <input 
                      type="date" 
                      id="filterStartDate"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  
                  {/* End Date Filter */}
                  <div>
                    <label htmlFor="filterEndDate" className="block text-xs font-medium text-gray-700 mb-2">To Date</label>
                    <input 
                      type="date" 
                      id="filterEndDate"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  
                  {/* Location Filter */}
                  <div>
                    <label htmlFor="filterLocation" className="block text-xs font-medium text-gray-700 mb-2">Location</label>
                    <input 
                      type="text" 
                      id="filterLocation"
                      name="location"
                      value={filters.location}
                      onChange={handleFilterChange}
                      placeholder="Search location..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                </div>
                
                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-4">
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Clear all filters
                  </button>
                  <div className="text-xs text-gray-500">
                    {filteredEvents.length === events.length 
  ? 'Showing all events' 
  : `Showing ${filteredEvents.length} of ${events.length} events`}

                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onAttendanceClick={handleAttendanceClick} 
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post Event Form */}
        {activeTab === 'postEvent' && (
          <div className="bg-white rounded-lg card-shadow p-8 mb-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Post an Event</h2>
              <p className="text-gray-600">Fill out the form below to create a new alumni event</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Event Title and Event Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title <span className="required-asterisk text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="eventTitle"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter event title"
                  />
                </div>
                
                <div>
                  <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type <span className="required-asterisk text-red-500">*</span>
                  </label>
                  <select
                    id="eventType"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
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
              </div>
              
              {/* Row 2: Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date <span className="required-asterisk text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="eventDate"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Time <span className="required-asterisk text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="eventTime"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              {/* Row 3: Location and RSVP Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Location <span className="required-asterisk text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="eventLocation"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter venue address or location"
                  />
                </div>
                
                <div>
                  <label htmlFor="rsvpInfo" className="block text-sm font-medium text-gray-700 mb-2">
                    RSVP Link or Contact Info <span className="text-gray-400 text-sm">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="rsvpInfo"
                    name="rsvpInfo"
                    value={formData.rsvpInfo}
                    onChange={handleInputChange}
                    className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="RSVP link or contact email"
                  />
                </div>
              </div>
              
              {/* Row 4: Description (Full Width) */}
              <div>
                <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Description <span className="required-asterisk text-red-500">*</span>
                </label>
                <textarea
                  id="eventDescription"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="5"
                  className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
                  placeholder="Provide details about the event, agenda, dress code, and any other relevant information..."
                ></textarea>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className={`font-medium px-8 py-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 btn-interactive ${
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
          <div className="bg-white rounded-lg card-shadow p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Posted Events</h2>
              <p className="text-gray-600">Events you have created</p>
            </div>
            
            <div className="space-y-4">
              {userPostedEvents.length > 0 ? (
                userPostedEvents.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onAttendanceClick={handleAttendanceClick} 
                  />
                ))
              ) : (
                <div id="emptyState" className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events added</h3>
                  <p className="text-gray-600">You haven't created any events yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .form-container { max-width: 900px; }
        .input-field { transition: all 0.2s ease; }
        .input-field:focus { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .card-shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .event-card { transition: all 0.2s ease; }
        .event-card:hover { box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1); }
        .btn-interactive {
          transition: all 0.2s ease;
          transform: translateY(0);
        }
        .btn-interactive:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .btn-interactive:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .tab-button {
          transition: all 0.2s ease;
        }
        .tab-button:hover:not(.active) {
          background-color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AlumniEventPortal;