import React, { useState, useEffect } from 'react';
import { eventsAPI, applicationsAPI, cancelApplication } from './api';

const EventHub = () => {
  // State variables
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    interest: ''
  });
  const [applying, setApplying] = useState({}); // track per-event applying state
  const [myApplications, setMyApplications] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all' or 'applied'

  // Initialize the page
  useEffect(() => {
    loadEventsFromServer();
    loadMyApplications();
  }, []);

  // Load current student's applications and mark events applied
  const loadMyApplications = async () => {
    try {
      const res = await applicationsAPI.getMyApplications();
      if (res.data && res.data.success) {
        setMyApplications(res.data.data || []);
      }
    } catch (error) {
      console.error('Error loading my applications:', error);
    }
  };

  // Persist applied state: whenever myApplications or allEvents change, mark events as applied
  React.useEffect(() => {
    try {
      const appliedIds = new Set((myApplications || []).map(a => (a.event?._id || a.event)));
      // Update allEvents and filteredEvents with applied flag
      // Don't override an event's existing applied=true unless we are sure (i.e., no matching application exists)
      setAllEvents(prev => {
        if (!prev || prev.length === 0) return prev;
        const updated = prev.map(ev => {
          const isAppliedByApps = appliedIds.has(ev.id);
          // If event already marked applied, keep it; otherwise set based on applications
          return { ...ev, applied: ev.applied ? true : isAppliedByApps };
        });
        return updated;
      });
      // Update filteredEvents with same logic
      setFilteredEvents(prev => {
        if (!prev || prev.length === 0) return prev;
        const updated = prev.map(ev => {
          const isAppliedByApps = appliedIds.has(ev.id);
          return { ...ev, applied: ev.applied ? true : isAppliedByApps };
        });
        return updated;
      });
    } catch (err) {
      console.error('Error persisting applied state:', err);
    }
  }, [myApplications, /* keep in sync when events are reloaded */ allEvents.length]);

  // Load events from backend
  const loadEventsFromServer = async () => {
    try {
      // Request only student-specific events from the backend
      const response = await eventsAPI.getAll({ audience: 'student' });
      if (response.data && response.data.success) {
        // Defensive: ensure we only process events with audience === 'student'
        const raw = Array.isArray(response.data.data) ? response.data.data : [];
        const studentOnly = raw.filter(ev => (ev.audience || '').toString().toLowerCase() === 'student');

        const events = studentOnly.map(e => ({
          ...e,
          id: e._id,
          title: e.title,
          description: e.description,
          date: e.date,
          time: e.time || '',
          location: e.location || '',
          attendees: e.attendance || (e.attendees ? e.attendees.length : 0),
          spots: e.spots || 0,
          category: e.category || e.type || 'general',
          postedByName: e.postedBy?.name || 'Alumni'
        }));
        // Merge applied flags based on current myApplications
        const appliedEventIds = new Set((myApplications || []).map(a => (a.event?._id || a.event)));
        const eventsWithApplied = events.map(ev => ({ ...ev, applied: appliedEventIds.has(ev.id) }));

        setAllEvents(eventsWithApplied);
        setFilteredEvents(eventsWithApplied);
      } else {
        setAllEvents([]);
        setFilteredEvents([]);
      }
    } catch (error) {
      console.error('Error loading events from server:', error);
      setAllEvents([]);
      setFilteredEvents([]);
    }
  };

  // Render events
  const renderEvents = (events) => {
    setFilteredEvents(events);
  };

  // Filter events by category
  const filterEvents = (category) => {
    setActiveCategory(category);
    
    let filtered = [...allEvents];
    
    if (category !== 'all') {
      // Compare against event.type (networking, reunion, etc.)
      filtered = allEvents.filter(event => (event.type || event.category || '').toString().toLowerCase() === category.toString().toLowerCase());
    }
    
    // Apply existing date and search filters
    if (dateFilter !== 'all') {
      filtered = applyDateFilter(filtered, dateFilter);
    }
    
    if (searchQuery.trim()) {
      filtered = applySearchFilter(filtered, searchQuery);
    }
    
    renderEvents(filtered);
  };

  // Filter by date
  const filterByDate = (dateFilter) => {
    setDateFilter(dateFilter);
    
    let filtered = [...allEvents];
    
    // Apply existing category filter
    if (activeCategory !== 'all') {
      filtered = allEvents.filter(event => (event.type || event.category || '').toString().toLowerCase() === activeCategory.toString().toLowerCase());
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      filtered = applyDateFilter(filtered, dateFilter);
    }
    
    // Apply existing search filter
    if (searchQuery.trim()) {
      filtered = applySearchFilter(filtered, searchQuery);
    }
    
    renderEvents(filtered);
  };

  // Apply date filter logic
  const applyDateFilter = (events, dateFilter) => {
    const today = new Date();
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      
      switch(dateFilter) {
        case 'today':
          return eventDate.toDateString() === today.toDateString();
        case 'week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return eventDate >= today && eventDate <= weekFromNow;
        case 'month':
          const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
          return eventDate >= today && eventDate <= monthFromNow;
        default:
          return true;
      }
    });
  };

  // Search events
  const searchEvents = (query) => {
    setSearchQuery(query);
    
    let filtered = [...allEvents];
    
    // Apply existing category filter
    if (activeCategory !== 'all') {
      filtered = allEvents.filter(event => (event.type || event.category || '').toString().toLowerCase() === activeCategory.toString().toLowerCase());
    }
    
    // Apply existing date filter
    if (dateFilter !== 'all') {
      filtered = applyDateFilter(filtered, dateFilter);
    }
    
    // Apply search filter
    if (query.trim()) {
      filtered = applySearchFilter(filtered, query);
    }
    
    renderEvents(filtered);
  };

  // Apply search filter logic
  const applySearchFilter = (events, query) => {
    return events.filter(event => 
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      event.description.toLowerCase().includes(query.toLowerCase()) ||
      event.location.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Open application modal
  const openApplicationModal = (eventId) => {
    setCurrentEventId(eventId);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    document.body.style.overflow = 'auto';
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      interest: ''
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit application
  const submitApplication = async (e) => {
    e.preventDefault();
    try {
      setApplying(prev => ({ ...prev, [currentEventId]: true }));

      const studentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const studentId = localStorage.getItem('userId') || studentProfile._id || studentProfile.id || null;

      const payload = {
        eventId: currentEventId,
        studentId,
        studentName: formData.fullName || studentProfile.name || '',
        studentEmail: formData.email || studentProfile.email || '',
        message: formData.interest || ''
      };

      const res = await applicationsAPI.apply(payload);
      if (res.data && res.data.success) {
        // Use server-returned application and event to make the update authoritative
        const createdApp = res.data && res.data.data ? res.data.data : null;
        const returnedEvent = res.data && res.data.event ? res.data.event : null;

        // Update events lists with returned event data (map server fields to client shape)
        if (returnedEvent) {
          const mapped = {
            ...returnedEvent,
            id: returnedEvent._id,
            title: returnedEvent.title,
            description: returnedEvent.description,
            date: returnedEvent.date,
            time: returnedEvent.time || '',
            location: returnedEvent.location || '',
            attendees: returnedEvent.attendance || (returnedEvent.attendees ? returnedEvent.attendees.length : 0),
            spots: returnedEvent.spots || 0,
            category: returnedEvent.category || returnedEvent.type || 'general',
            postedByName: returnedEvent.postedBy?.name || 'Alumni',
            applied: true
          };

          setAllEvents(prev => prev.map(ev => ev.id === mapped.id ? mapped : ev));
          setFilteredEvents(prev => prev.map(ev => ev.id === mapped.id ? mapped : ev));
        } else {
          // Fallback to optimistic update if server didn't return event
          setAllEvents(prev => prev.map(ev => ev.id === currentEventId ? { ...ev, applied: true, attendees: (ev.attendees || 0) + 1 } : ev));
          setFilteredEvents(prev => prev.map(ev => ev.id === currentEventId ? { ...ev, applied: true, attendees: (ev.attendees || 0) + 1 } : ev));
        }

        // Add the created application returned by server or a local fallback
        const appToAdd = createdApp || {
          _id: `local-${currentEventId}-${Date.now()}`,
          // ensure event is represented by its id (string) so the applied-state effect can detect it
          event: returnedEvent ? (returnedEvent._id || returnedEvent.id) : currentEventId,
          createdAt: new Date().toISOString()
        };
        setMyApplications(prev => [appToAdd, ...(prev || [])]);
        closeModal();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        // We intentionally do NOT re-fetch lists here:
        // local state was updated using the server response (or optimistic fallback),
        // so re-fetching immediately may overwrite the applied flag with stale data.
      }
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setApplying(prev => ({ ...prev, [currentEventId]: false }));
    }
  };

  // Helper functions
  const getCategoryIcon = (category) => {
    const icons = {
      networking: '🤝',
      reunion: '🎓',
      gala: '🎩',
      workshop: '�️',
      social: '🎉',
      fundraiser: '�️',
      other: '📅'
    };
    return icons[category] || '📅';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get current event for modal
  const currentEvent = allEvents.find(e => e.id === currentEventId) || {};

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="gradient-bg text-white py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">🎉 EventHub</h1>
          <p className="text-xl opacity-90">Discover amazing events and apply instantly</p>
        </div>
      </header>
      
      {/* Filters Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Tabs: All Events / My Applied Events */}
            <div className="flex items-center gap-2 mr-4">
              <button
                onClick={() => setSelectedTab('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTab === 'all' ? 'filter-active' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Events
              </button>
              <button
                onClick={() => setSelectedTab('applied')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTab === 'applied' ? 'filter-active' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                My Applied Events
              </button>
            </div>
            <div className="w-full mt-4">
              <h3 className="text-lg font-semibold text-gray-800">Filter Events:</h3>
            </div>
            
            {/* Category Filters (Event Types) */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => filterEvents('all')} 
                className={`filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === 'all' 
                    ? 'filter-active' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Events
              </button>
              <button 
                onClick={() => filterEvents('networking')} 
                className={`filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === 'networking' 
                    ? 'filter-active' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Networking Event
              </button>
              <button 
                onClick={() => filterEvents('reunion')} 
                className={`filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === 'reunion' 
                    ? 'filter-active' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Class Reunion
              </button>
              <button 
                onClick={() => filterEvents('gala')} 
                className={`filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === 'gala' 
                    ? 'filter-active' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Gala/Formal Event
              </button>
              <button 
                onClick={() => filterEvents('workshop')} 
                className={`filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === 'workshop' 
                    ? 'filter-active' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Workshop/Seminar
              </button>
              <button 
                onClick={() => filterEvents('social')} 
                className={`filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === 'social' 
                    ? 'filter-active' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Social Gathering
              </button>
              <button 
                onClick={() => filterEvents('fundraiser')} 
                className={`filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === 'fundraiser' 
                    ? 'filter-active' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Fundraiser
              </button>
              <button 
                onClick={() => filterEvents('other')} 
                className={`filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === 'other' 
                    ? 'filter-active' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Other
              </button>
            </div>
            
            {/* Date Filter */}
            <select 
              value={dateFilter}
              onChange={(e) => filterByDate(e.target.value)}
              className="ml-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            {/* Search */}
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchQuery}
              onChange={(e) => searchEvents(e.target.value)}
              className="ml-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>
      
      {/* Events Grid */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(() => {
            // Choose which list to render based on selected tab
            const eventsToRender = selectedTab === 'all'
              ? filteredEvents
              : (myApplications || []).map(app => {
                  // app.event may be an id string or populated object
                  const evObj = (app.event && (app.event._id || app.event.id)) ? app.event : null;
                  if (evObj && evObj._id) {
                    return {
                      ...evObj,
                      id: evObj._id,
                      title: evObj.title,
                      description: evObj.description,
                      date: evObj.date,
                      time: evObj.time || '',
                      location: evObj.location || '',
                      attendees: evObj.attendance || (evObj.attendees ? evObj.attendees.length : 0),
                      spots: evObj.spots || 0,
                      category: evObj.category || evObj.type || 'general',
                      postedByName: evObj.postedBy?.name || 'Alumni',
                      applied: true
                    };
                  }
                  // If only id was stored, find it in allEvents
                  const found = allEvents.find(e => e.id === (app.event || app.event?._id));
                  if (found) return { ...found, applied: true };
                  // Last fallback: a minimal object
                  return { id: app.event || `unknown-${app._id}`, title: found?.title || 'Event', description: found?.description || '', date: found?.date || '', time: '', location: '', attendees: found?.attendees || 0, category: 'general', postedByName: 'Alumni', applied: true };
                });

            if (eventsToRender && eventsToRender.length > 0) {
              return eventsToRender.map(event => (
                <div 
                  key={event.id} 
                  className="bg-white rounded-2xl shadow-lg card-hover overflow-hidden relative" 
                  data-category={event.category}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      {(() => {
                        const safeCategory = event.category || 'general';
                        return (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {getCategoryIcon(safeCategory)} {safeCategory.charAt(0).toUpperCase() + safeCategory.slice(1)}
                          </span>
                        );
                      })()}
                      <span className="text-2xl font-bold text-green-600">{event.price}</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">{event.title}</h3>

                    <div className="space-y-2 mb-4 text-gray-600">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">📅</span>
                        <span>{formatDate(event.date)} • {event.time}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg mr-2">📍</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg mr-2">👥</span>
                        <span>{event.attendees} attendees</span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-6 line-clamp-3">{event.description}</p>
                    <div className="text-xs text-gray-500 mb-4">Posted by: <span className="font-medium text-gray-700">{event.postedByName}</span></div>

                    <div className="flex gap-3 items-center">
                      {event.applied ? (
                        <>
                          <span className="px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">Applied</span>
                          {/* Cancel button shown if cancellation window is open */}
                          {(() => {
                            const now = new Date();
                            const eventDate = new Date(event.date);
                            const fiveDaysBefore = new Date(eventDate);
                            fiveDaysBefore.setDate(fiveDaysBefore.getDate() - 5);
                            const canCancel = now <= fiveDaysBefore;
                            return (
                              <button
                                onClick={async () => {
                                  if (!canCancel) {
                                    alert('Cancellation window has closed (within 5 days of the event)');
                                    return;
                                  }
                                  if (!window.confirm('Are you sure you want to cancel your application?')) return;
                                    try {
                                      const res = await cancelApplication(event.id);
                                      const data = res.data || {};
                                      if (data.success) {
                                        // Use returned event from server if provided to update authoritative state
                                        const returnedEvent = data.event || null;
                                        if (returnedEvent) {
                                          const mapped = {
                                            ...returnedEvent,
                                            id: returnedEvent._id,
                                            title: returnedEvent.title,
                                            description: returnedEvent.description,
                                            date: returnedEvent.date,
                                            time: returnedEvent.time || '',
                                            location: returnedEvent.location || '',
                                            attendees: returnedEvent.attendance || (returnedEvent.attendees ? returnedEvent.attendees.length : 0),
                                            spots: returnedEvent.spots || 0,
                                            category: returnedEvent.category || returnedEvent.type || 'general',
                                            postedByName: returnedEvent.postedBy?.name || 'Alumni',
                                            applied: false
                                          };

                                          setAllEvents(prev => prev.map(ev => ev.id === mapped.id ? mapped : ev));
                                          setFilteredEvents(prev => prev.map(ev => ev.id === mapped.id ? mapped : ev));
                                        } else {
                                          // Fallback: decrement attendees and mark not applied
                                          setAllEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, applied: false, attendees: Math.max(0, (ev.attendees || 1) - 1) } : ev));
                                          setFilteredEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, applied: false, attendees: Math.max(0, (ev.attendees || 1) - 1) } : ev));
                                        }

                                        // Remove the corresponding application from myApplications immediately
                                        setMyApplications(prev => (prev || []).filter(a => {
                                          const eventIdFromApp = a.event?._id || a.event;
                                          return eventIdFromApp !== event.id;
                                        }));

                                        // Do not re-fetch lists here - we've updated local state using server response
                                      } else {
                                        console.error('Cancel returned failure:', data);
                                        alert(data.message || 'Failed to cancel application');
                                      }
                                    } catch (err) {
                                      console.error('Error cancelling application:', err.response || err.message || err);
                                      const msg = err.response?.data?.message || err.message || 'Failed to cancel application';
                                      alert(msg);
                                    }
                                }}
                                className={`px-3 py-2 rounded-md text-sm font-medium ${canCancel ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                                disabled={!canCancel}
                              >
                                Cancel
                              </button>
                            );
                          })()}
                        </>
                      ) : (
                        <button 
                          onClick={() => openApplicationModal(event.id)} 
                          disabled={applying[event.id]}
                          className={`w-full py-3 px-6 rounded-lg font-medium transition-opacity ${applying[event.id] ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'gradient-bg text-white hover:opacity-90'}`}
                        >
                          { applying[event.id] ? 'Applying...' : 'Apply Now' }
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ));
            }

            return (
              <div className="col-span-3 text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-semibold text-gray-600 mb-2">No events found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            );
          })()}
        </div>
      
        {/* Applied Events moved to the top tab - removed bottom listing */}
      </div>
      
      {/* Application Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Apply to Event</h2>
                <button 
                  onClick={closeModal} 
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">{currentEvent.title}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>📅 {formatDate(currentEvent.date)} • {currentEvent.time}</div>
                  <div>📍 {currentEvent.location}</div>
                  <div>💰 {currentEvent.price}</div>
                </div>
              </div>
              
              <form onSubmit={submitApplication}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input 
                      type="text" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Why are you interested in this event?</label>
                    <textarea 
                      name="interest"
                      value={formData.interest}
                      onChange={handleInputChange}
                      rows="4" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" 
                      placeholder="Tell us about your interest and what you hope to gain..."
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <span className="text-xl mr-2">✅</span>
            <span>Application submitted successfully!</span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .gradient-bg { background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%); }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        .filter-active { background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%); color: white; }
        .modal-backdrop { backdrop-filter: blur(8px); }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default EventHub;