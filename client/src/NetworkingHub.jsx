import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NetworkingHub = () => {
  const [activeSection, setActiveSection] = useState('directory');
  const [alumniData, setAlumniData] = useState([]);
  const [filteredAlumni, setFilteredAlumni] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    year: '',
    branch: '',
    page: 1,
    limit: 12
  });

  // Success Stories states
  const [successStories, setSuccessStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [showAddStoryForm, setShowAddStoryForm] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyFilters, setStoryFilters] = useState({
    category: '',
    search: ''
  });
  const [storyPagination, setStoryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [storyLoading, setStoryLoading] = useState(false);

  // Navigation items
  const navItems = [
    { id: 'directory', label: 'Alumni Directory', icon: '👥' },
    { id: 'connections', label: 'My Connections', icon: '🔗' },
    { id: 'stories', label: 'Success Stories', icon: '🌟' }
  ];

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch alumni directory from backend
  const fetchAlumniDirectory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.year && { graduationYear: filters.year }),
        ...(filters.branch && { branch: filters.branch })
      });

      const response = await fetch(`http://localhost:5000/api/alumni-directory?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAlumniData(data.alumni || []);
        setFilteredAlumni(data.alumni || []);
      } else {
        throw new Error(data.message || 'Failed to load alumni directory');
      }
    } catch (error) {
      console.error('Error fetching alumni directory:', error);
      toast.error('Failed to load alumni directory.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch alumni profile for viewing
  const fetchAlumniProfile = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/alumni/profile/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alumni profile');
      }

      const profileData = await response.json();
      setSelectedProfile(profileData);
    } catch (error) {
      console.error('Error fetching alumni profile:', error);
      toast.error('Failed to load alumni profile');
    }
  };

  // Fetch connection requests
  const fetchConnectionRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/connection-requests', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch connection requests: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPendingRequests(data.pendingRequests || []);
      } else {
        throw new Error(data.message || 'Failed to load connection requests');
      }
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      toast.error('Failed to load connection requests');
    }
  };

  // Fetch my connections
  const fetchMyConnections = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/my-connections', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.status}`);
      }

      const data = await response.json();
      setMyConnections(data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    }
  };

  // Fetch success stories
  const fetchSuccessStories = async (page = 1, filters = {}) => {
    setStoryLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await fetch(`http://localhost:5000/api/stories?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch success stories');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccessStories(data.stories);
        setFilteredStories(data.stories);
        setStoryPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching success stories:', error);
      toast.error('Failed to load success stories');
    } finally {
      setStoryLoading(false);
    }
  };

  // Create new success story
  const createSuccessStory = async (storyData) => {
    try {
      const response = await fetch('http://localhost:5000/api/stories', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(storyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create story');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Success story published!');
        setShowAddStoryForm(false);
        fetchSuccessStories(); // Refresh the list
        return true;
      }
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error(error.message || 'Failed to publish story');
      return false;
    }
  };

  // Like/Unlike story
  const toggleStoryLike = async (storyId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setSuccessStories(prev => prev.map(story => 
          story._id === storyId 
            ? { ...story, likeCount: data.likeCount, isLiked: data.isLiked }
            : story
        ));
        
        setFilteredStories(prev => prev.map(story => 
          story._id === storyId 
            ? { ...story, likeCount: data.likeCount, isLiked: data.isLiked }
            : story
        ));

        if (selectedStory && selectedStory._id === storyId) {
          setSelectedStory(prev => ({
            ...prev,
            likeCount: data.likeCount,
            isLiked: data.isLiked
          }));
        }

        toast.success(data.message);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  // Fetch single story
  const fetchStoryById = async (storyId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/stories/${storyId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch story');
      }

      const data = await response.json();
      
      if (data.success) {
        setSelectedStory(data.story);
      }
    } catch (error) {
      console.error('Error fetching story:', error);
      toast.error('Failed to load story');
    }
  };

  // Load data based on active section
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      return;
    }

    if (activeSection === 'directory') {
      fetchAlumniDirectory();
    } else if (activeSection === 'connections') {
      fetchConnectionRequests();
      fetchMyConnections();
    } else if (activeSection === 'stories') {
      fetchSuccessStories();
    }
  }, [activeSection, filters]);

  // Filter stories when filters change
  useEffect(() => {
    if (activeSection === 'stories') {
      fetchSuccessStories(1, storyFilters);
    }
  }, [storyFilters, activeSection]);

  // Send connection request
  const sendConnectionRequest = async (alumniId) => {
    try {
      if (!alumniId) {
        toast.error('Invalid alumni ID');
        return;
      }

      const response = await fetch('http://localhost:5000/api/connection-request', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipientId: alumniId })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message.includes('already exists') || 
            data.message.includes('already sent') ||
            data.message.includes('pending request')) {
          updateAlumniConnectionStatus(alumniId, 'pending_sent');
          toast.info(data.message);
          return;
        }
        if (data.message.includes('connected')) {
          updateAlumniConnectionStatus(alumniId, 'connected');
          toast.info(data.message);
          return;
        }
        if (data.message.includes('previously declined') || 
            data.message.includes('cancelled')) {
          updateAlumniConnectionStatus(alumniId, 'not_connected');
          toast.info(data.message);
          return;
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      if (data.success) {
        updateAlumniConnectionStatus(alumniId, 'pending_sent');
        toast.success('Connection request sent successfully!');
        
        if (activeSection === 'connections') {
          await fetchConnectionRequests();
        }
      } else {
        throw new Error(data.message || 'Request failed');
      }
      
    } catch (error) {
      console.error('Connection request failed:', error);
      
      if (error.message.includes('Invalid recipient ID') || error.message.includes('not found')) {
        toast.error('Invalid user selected');
      } else if (error.message.includes('cannot connect to yourself')) {
        toast.error('Cannot connect to yourself');
      } else if (error.message.includes('duplicate key')) {
        toast.error('Connection already exists. Please refresh the page.');
      } else {
        toast.error(error.message || 'Failed to send connection request');
      }
    }
  };

  // Helper function to update alumni connection status
  const updateAlumniConnectionStatus = (alumniId, status) => {
    const updateStatus = (alumni) => 
      alumni.id === alumniId 
        ? { ...alumni, connectionStatus: status }
        : alumni;

    setAlumniData(prev => prev.map(updateStatus));
    setFilteredAlumni(prev => prev.map(updateStatus));
  };

  // Accept connection request
  const acceptConnection = async (connectionId, alumniId) => {
    try {
      const response = await fetch('http://localhost:5000/api/accept-connection', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ connectionId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.json();

      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      updateAlumniConnectionStatus(alumniId, 'connected');

      await fetchMyConnections();
      
      toast.success('Connection request accepted!');
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection request');
    }
  };

  // Decline connection request
  const declineConnection = async (connectionId, alumniId) => {
    try {
      const response = await fetch('http://localhost:5000/api/decline-connection', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ connectionId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      updateAlumniConnectionStatus(alumniId, 'not_connected');

      toast.info('Connection request declined');
    } catch (error) {
      console.error('Error declining connection:', error);
      toast.error('Failed to decline connection request');
    }
  };

  // View profile handler
  const handleViewProfile = async (alumniId) => {
    await fetchAlumniProfile(alumniId);
  };

  // Close profile modal
  const handleCloseProfile = () => {
    setSelectedProfile(null);
  };

  // Filter handlers
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ 
      ...prev, 
      [filterName]: value,
      page: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      year: '',
      branch: '',
      page: 1,
      limit: 12
    });
  };

  // Story form submission
  const handleStorySubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const storyData = {
      title: formData.get('title'),
      content: formData.get('content'),
      category: formData.get('category'),
      tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
    };

    const success = await createSuccessStory(storyData);
    if (success) {
      e.target.reset();
    }
  };

  // Navigation handler
  const handleNavClick = (section) => {
    setActiveSection(section);
  };

  // AlumniCard Component
  const AlumniCard = ({ alumni, onConnect, onViewProfile }) => {
    const getConnectionButton = () => {
      const buttonClass = "px-4 py-2 rounded-lg font-medium text-sm flex-1 transition-colors flex items-center justify-center";
      
      switch (alumni.connectionStatus) {
        case 'connected':
          return (
            <button 
              className={`${buttonClass} bg-green-600 text-white cursor-not-allowed`}
              disabled
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Connected
            </button>
          );
        case 'pending_sent':
          return (
            <button 
              className={`${buttonClass} bg-yellow-600 text-white cursor-not-allowed`}
              disabled
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Request Sent
            </button>
          );
        case 'pending_received':
          return (
            <button 
              onClick={() => {
                setActiveSection('connections');
                toast.info('Please go to Connections tab to respond');
              }}
              className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white`}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Respond
            </button>
          );
        default:
          return (
            <button 
              onClick={() => onConnect(alumni.id)}
              className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white`}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Connect
            </button>
          );
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {alumni.profileImageUrl ? (
              <img 
                src={alumni.profileImageUrl} 
                alt={alumni.name}
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
            ) : (
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold text-lg">
                  {alumni.name?.charAt(0) || 'A'}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{alumni.name}</h3>
              <p className="text-gray-600 text-sm">{alumni.email}</p>
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mt-1">
                Alumni
              </span>
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            alumni.connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            alumni.connectionStatus === 'pending_sent' ? 'bg-yellow-100 text-yellow-800' :
            alumni.connectionStatus === 'pending_received' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {alumni.connectionStatus === 'connected' ? 'Connected' :
             alumni.connectionStatus === 'pending_sent' ? 'Request Sent' :
             alumni.connectionStatus === 'pending_received' ? 'Request Received' :
             'Not Connected'}
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          {alumni.graduationYear && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Batch:</span>
              <span>Class of {alumni.graduationYear}</span>
            </div>
          )}
          {alumni.alumniProfile?.academicInfo?.branch && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Branch:</span>
              <span className="capitalize">{alumni.alumniProfile.academicInfo.branch?.replace(/-/g, ' ')}</span>
            </div>
          )}
          {alumni.alumniProfile?.careerDetails?.companyName && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Company:</span>
              <span>{alumni.alumniProfile.careerDetails.companyName}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          {getConnectionButton()}
          <button 
            onClick={() => onViewProfile(alumni.id)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            View Profile
          </button>
        </div>
      </div>
    );
  };

  // Profile Modal Component
  const ProfileModal = ({ profile, onClose }) => {
    if (!profile) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Alumni Profile</h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mr-6">
                  <span className="text-blue-600 font-semibold text-2xl">
                    {profile.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                  <p className="text-gray-600">{profile.email}</p>
                  <p className="text-gray-600">Class of {profile.graduationYear}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // PendingRequestCard Component
  const PendingRequestCard = ({ request, onAccept, onDecline }) => (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center">
        <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
          <span className="text-blue-600 font-semibold">
            {request.person.name.charAt(0)}
          </span>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{request.person.name}</h4>
          <p className="text-sm text-gray-600">{request.person.email}</p>
          {request.person.graduationYear && (
            <p className="text-xs text-gray-500">Class of {request.person.graduationYear}</p>
          )}
          <p className="text-xs text-blue-500 mt-1">
            Requested on {new Date(request.requestedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={() => onAccept(request.id, request.person.id)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          Accept
        </button>
        <button 
          onClick={() => onDecline(request.id, request.person.id)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );

  // ConnectionCard Component
  const ConnectionCard = ({ connection }) => (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center">
        <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
          <span className="text-green-600 font-semibold">
            {connection.person.name.charAt(0)}
          </span>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{connection.person.name}</h4>
          <p className="text-sm text-gray-600">{connection.person.email}</p>
          {connection.person.graduationYear && (
            <p className="text-xs text-gray-500">Class of {connection.person.graduationYear}</p>
          )}
          {connection.connectedSince && (
            <p className="text-xs text-gray-500">
              Connected since {new Date(connection.connectedSince).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // StoryCard Component
  const StoryCard = ({ story, onLike, onOpen }) => {
    const categoryNames = {
      'career': 'Career Growth',
      'entrepreneurship': 'Entrepreneurship',
      'education': 'Higher Education',
      'innovation': 'Innovation & Research',
      'leadership': 'Leadership',
      'social-impact': 'Social Impact'
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
              <span className="text-blue-600 font-semibold text-lg">
                {story.author?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{story.author?.name || 'Anonymous'}</h3>
              <p className="text-sm text-gray-600">
                {story.author?.role === 'alumni' ? 'Alumni' : 'Student'}
                {story.author?.graduationYear && ` • Class of ${story.author.graduationYear}`}
              </p>
              <p className="text-xs text-gray-500">{formatDate(story.createdAt)}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {categoryNames[story.category]}
            </span>
          </div>
        </div>
        
        <h2 
          className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 cursor-pointer"
          onClick={() => onOpen(story._id)}
        >
          {story.title}
        </h2>
        
        <p className="text-gray-700 mb-4 line-clamp-3">
          {story.content.length > 200 ? `${story.content.substring(0, 200)}...` : story.content}
        </p>
        
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {story.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onLike(story._id)} 
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
            >
              <svg className={`w-5 h-5 ${story.isLiked ? 'text-blue-600 fill-current' : ''}`} 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{story.likeCount || 0} likes</span>
            </button>
            <span className="text-sm text-gray-500">{story.views || 0} views</span>
          </div>
          <button 
            onClick={() => onOpen(story._id)} 
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Read Full Story →
          </button>
        </div>
      </div>
    );
  };

  // StoryModal Component
  const StoryModal = ({ story, onClose, onLike }) => {
    const categoryNames = {
      'career': 'Career Growth',
      'entrepreneurship': 'Entrepreneurship',
      'education': 'Higher Education',
      'innovation': 'Innovation & Research',
      'leadership': 'Leadership',
      'social-impact': 'Social Impact'
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Success Story</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {categoryNames[story.category]}
                </span>
                <span className="text-sm text-gray-500">{formatDate(story.createdAt)}</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{story.title}</h1>
              
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-semibold text-xl">
                    {story.author?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{story.author?.name || 'Anonymous'}</h3>
                  <p className="text-gray-600">
                    {story.author?.role === 'alumni' ? 'Alumni' : 'Student'}
                    {story.author?.graduationYear && ` • Class of ${story.author.graduationYear}`}
                  </p>
                </div>
              </div>
              
              <div className="prose max-w-none mb-8">
                <div className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
                  {story.content}
                </div>
              </div>
              
              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {story.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-6 border-t">
                <button 
                  onClick={() => onLike(story._id)} 
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                >
                  <svg className={`w-6 h-6 ${story.isLiked ? 'text-blue-600 fill-current' : ''}`} 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-medium">{story.likeCount || 0} people liked this story</span>
                </button>
                
                <div className="flex space-x-4">
                  <span className="text-gray-500">{story.views || 0} views</span>
                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    Share Story
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Alumni Directory
  const renderAlumniDirectory = () => (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Alumni Directory</h2>
        <p className="text-gray-600">Connect with fellow alumni from your institution</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Alumni</label>
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.branch}
              onChange={(e) => handleFilterChange('branch', e.target.value)}
            >
              <option value="">All Branches</option>
              <option value="computer-science">Computer Science</option>
              <option value="electrical-engineering">Electrical Engineering</option>
              <option value="mechanical-engineering">Mechanical Engineering</option>
            </select>
          </div>
        </div>
        <button onClick={clearFilters} className="text-blue-600 hover:text-blue-800 font-medium">
          Clear All Filters
        </button>
      </div>
      
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map(alumni => (
            <AlumniCard 
              key={alumni.id} 
              alumni={alumni} 
              onConnect={sendConnectionRequest}
              onViewProfile={handleViewProfile}
            />
          ))}
        </div>
      )}
      
      {!loading && filteredAlumni.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No alumni found matching your criteria.</p>
        </div>
      )}
    </div>
  );

  // Render Connections
  const renderConnections = () => (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Connections</h2>
        <p className="text-gray-600">Manage your professional network</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending requests</p>
            ) : (
              pendingRequests.map(request => (
                <PendingRequestCard 
                  key={request.id} 
                  request={request} 
                  onAccept={acceptConnection}
                  onDecline={declineConnection}
                />
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            My Network ({myConnections.length})
          </h3>
          <div className="space-y-4">
            {myConnections.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No connections yet</p>
            ) : (
              myConnections.map(connection => (
                <ConnectionCard key={connection.id} connection={connection} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Success Stories
  const renderSuccessStories = () => (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Success Stories</h2>
        <p className="text-gray-600">Share your journey and get inspired by fellow alumni achievements</p>
      </div>
      
      <div className="mb-6">
        <button 
          onClick={() => setShowAddStoryForm(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Share Your Success Story
        </button>
      </div>
      
      {showAddStoryForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Share Your Success Story</h3>
          <form onSubmit={handleStorySubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Story Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="e.g., From Student to Tech Lead at Google" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select 
                  name="category" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  <option value="career">Career Growth</option>
                  <option value="entrepreneurship">Entrepreneurship</option>
                  <option value="education">Higher Education</option>
                  <option value="innovation">Innovation & Research</option>
                  <option value="leadership">Leadership</option>
                  <option value="social-impact">Social Impact</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Story *</label>
              <textarea 
                name="content" 
                required 
                rows="8" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Share your journey, challenges you overcame, key milestones, and advice for fellow alumni..."
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
              <input 
                type="text" 
                name="tags" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="e.g., career-growth, technology, leadership" 
              />
            </div>
            
            <div className="flex space-x-4">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                Publish Story
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddStoryForm(false)} 
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filter by category:</label>
          <select 
            value={storyFilters.category}
            onChange={(e) => setStoryFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="career">Career Growth</option>
            <option value="entrepreneurship">Entrepreneurship</option>
            <option value="education">Higher Education</option>
            <option value="innovation">Innovation & Research</option>
            <option value="leadership">Leadership</option>
            <option value="social-impact">Social Impact</option>
          </select>
          
          <input 
            type="text" 
            value={storyFilters.search}
            onChange={(e) => setStoryFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search stories..." 
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          
          <button 
            onClick={() => setStoryFilters({ category: '', search: '' })}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {storyLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!storyLoading && (
        <>
          <div className="space-y-6">
            {filteredStories.map(story => (
              <StoryCard 
                key={story._id} 
                story={story} 
                onLike={toggleStoryLike} 
                onOpen={fetchStoryById} 
              />
            ))}
          </div>
          
          {filteredStories.length === 0 && !storyLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500">No success stories found matching your criteria.</p>
            </div>
          )}
        </>
      )}
      
      {storyPagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => fetchSuccessStories(storyPagination.currentPage - 1, storyFilters)}
            disabled={!storyPagination.hasPrev}
            className={`px-4 py-2 rounded-lg ${
              storyPagination.hasPrev 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Previous
          </button>
          
          <span className="text-gray-600">
            Page {storyPagination.currentPage} of {storyPagination.totalPages}
          </span>
          
          <button
            onClick={() => fetchSuccessStories(storyPagination.currentPage + 1, storyFilters)}
            disabled={!storyPagination.hasNext}
            className={`px-4 py-2 rounded-lg ${
              storyPagination.hasNext 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      )}
      
      {selectedStory && (
        <StoryModal 
          story={selectedStory} 
          onClose={() => setSelectedStory(null)} 
          onLike={toggleStoryLike} 
        />
      )}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === item.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-blue-600'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'directory' && renderAlumniDirectory()}
        {activeSection === 'connections' && renderConnections()}
        {activeSection === 'stories' && renderSuccessStories()}
      </div>

      <ProfileModal profile={selectedProfile} onClose={handleCloseProfile} />
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default NetworkingHub;