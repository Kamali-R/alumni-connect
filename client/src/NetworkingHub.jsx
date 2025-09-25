import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaUser, 
  FaGraduationCap, 
  FaBriefcase, 
  FaTools, 
  FaInfoCircle, 
  FaGlobe, 
  FaLinkedin, 
  FaGithub, 
  FaFile 
} from 'react-icons/fa';

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
  careerStatus: '',
  skills: '',
  interests: '',
  company: '',
  location: '',
  experience: '',
  connectionStatus: '', 
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
      // Don't set filteredAlumni here - let the useEffect handle filtering
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
      // Ensure like data is properly structured
      const storiesWithLikes = data.stories.map(story => ({
        ...story,
        likeCount: story.likes?.length || story.likeCount || 0,
        isLiked: story.likes?.includes?.(getCurrentUserId()) || story.isLiked || false
      }));

      setSuccessStories(storiesWithLikes);
      setFilteredStories(storiesWithLikes);
      setStoryPagination(data.pagination);
    }
  } catch (error) {
    console.error('Error fetching success stories:', error);
    toast.error('Failed to load success stories');
  } finally {
    setStoryLoading(false);
  }
};
// Add helper function to get current user ID
const getCurrentUserId = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  return null;
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
      // Update all story states consistently
      const updateStoryInState = (story) => 
        story._id === storyId 
          ? { 
              ...story, 
              likeCount: data.likeCount, 
              isLiked: data.isLiked,
              likes: data.likes // Ensure likes array is updated
            }
          : story;

      setSuccessStories(prev => prev.map(updateStoryInState));
      setFilteredStories(prev => prev.map(updateStoryInState));
      
      if (selectedStory && selectedStory._id === storyId) {
        setSelectedStory(prev => ({
          ...prev,
          likeCount: data.likeCount,
          isLiked: data.isLiked,
          likes: data.likes
        }));
      }

      toast.success(data.isLiked ? 'Story liked!' : 'Story unliked!');
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
}, [activeSection, filters.page, filters.limit, filters.search, filters.year, filters.branch]);
  // Filter stories when filters change
  useEffect(() => {
    if (activeSection === 'stories') {
      fetchSuccessStories(1, storyFilters);
    }
  }, [storyFilters, activeSection]);

  // Enhanced filter function
const applyAlumniFilters = () => {
  let filtered = alumniData;
  
  // Search filter (name, email, company)
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(alumni => 
      alumni.name?.toLowerCase().includes(searchTerm) ||
      alumni.email?.toLowerCase().includes(searchTerm) ||
      alumni.alumniProfile?.careerDetails?.companyName?.toLowerCase().includes(searchTerm) ||
      alumni.alumniProfile?.academicInfo?.branch?.toLowerCase().includes(searchTerm)
    );
  }
  
  // Year filter
  if (filters.year) {
    filtered = filtered.filter(alumni => 
      alumni.graduationYear?.toString() === filters.year
    );
  }
  
  // Branch filter
  if (filters.branch) {
    filtered = filtered.filter(alumni => 
      alumni.alumniProfile?.academicInfo?.branch?.toLowerCase().includes(filters.branch.toLowerCase())
    );
  }
  
  // Career Status filter
  if (filters.careerStatus) {
    filtered = filtered.filter(alumni => 
      alumni.alumniProfile?.careerStatus?.toLowerCase() === filters.careerStatus.toLowerCase()
    );
  }
  
  // Skills filter
  if (filters.skills) {
    const skillsTerm = filters.skills.toLowerCase();
    filtered = filtered.filter(alumni => 
      alumni.alumniProfile?.skills?.some(skill => 
        skill.toLowerCase().includes(skillsTerm)
      )
    );
  }
  
  // Interests filter
  if (filters.interests) {
    const interestsTerm = filters.interests.toLowerCase();
    filtered = filtered.filter(alumni => 
      alumni.alumniProfile?.interests?.some(interest => 
        interest.toLowerCase().includes(interestsTerm)
      )
    );
  }
  
  // Company filter
  if (filters.company) {
    const companyTerm = filters.company.toLowerCase();
    filtered = filtered.filter(alumni => 
      alumni.alumniProfile?.careerDetails?.companyName?.toLowerCase().includes(companyTerm)
    );
  }
  
  // Location filter
  if (filters.location) {
    const locationTerm = filters.location.toLowerCase();
    filtered = filtered.filter(alumni => 
      alumni.alumniProfile?.personalInfo?.location?.toLowerCase().includes(locationTerm) ||
      alumni.alumniProfile?.careerDetails?.companyLocation?.toLowerCase().includes(locationTerm)
    );
  }
  
  // Experience filter
  if (filters.experience) {
    filtered = filtered.filter(alumni => {
      const experience = alumni.alumniProfile?.careerDetails?.yearsOfExperience;
      if (!experience) return false;
      
      const expNum = parseInt(experience);
      switch (filters.experience) {
        case '0-2': return expNum <= 2;
        case '3-5': return expNum >= 3 && expNum <= 5;
        case '6-10': return expNum >= 6 && expNum <= 10;
        case '10+': return expNum > 10;
        default: return true;
      }
    });
  }
  
  // Connection Status filter
  if (filters.connectionStatus) {
    filtered = filtered.filter(alumni => 
      alumni.connectionStatus === filters.connectionStatus
    );
  }
  
  setFilteredAlumni(filtered);
};
// Call this function whenever filters change
// Update the useEffect for filters
useEffect(() => {
  if (activeSection === 'directory' && alumniData.length > 0) {
    applyAlumniFilters();
  }
}, [
  filters.search, 
  filters.year, 
  filters.branch, 
  filters.careerStatus,
  filters.skills,
  filters.interests,
  filters.company,
  filters.location,
  filters.experience,
  filters.connectionStatus,
  alumniData, 
  activeSection
]);
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
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Connection Status</label>
  <select 
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    value={filters.connectionStatus}
    onChange={(e) => handleFilterChange('connectionStatus', e.target.value)}
  >
    <option value="">All Connections</option>
    <option value="connected">Connected</option>
    <option value="pending">Pending</option>
    <option value="not_connected">Not Connected</option>
  </select>
</div>

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
    careerStatus: '',
    skills: '',
    interests: '',
    company: '',
    location: '',
    experience: '',
    connectionStatus: '',
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
  // Enhanced AlumniCard Component
// Fixed AlumniCard Component
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

  // Fixed profile image handling
  const getProfileImage = () => {
    if (alumni.profileImageUrl) {
      return (
        <img 
          src={alumni.profileImageUrl} 
          alt={alumni.name}
          className="w-12 h-12 rounded-full object-cover mr-4"
          onError={(e) => {
            e.target.style.display = 'none';
            // Fixed: Use standard conditional check
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="relative">
            {getProfileImage()}
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-12 h-12 flex items-center justify-center mr-4">
              <span className="text-blue-600 font-semibold text-lg">
                {alumni.name?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
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
      
      {/* Essential Details Section */}
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
        {alumni.alumniProfile?.careerDetails?.jobTitle && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium w-20">Role:</span>
            <span>{alumni.alumniProfile.careerDetails.jobTitle}</span>
          </div>
        )}
        {alumni.alumniProfile?.careerDetails?.yearsOfExperience && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium w-20">Experience:</span>
            <span>{alumni.alumniProfile.careerDetails.yearsOfExperience} years</span>
          </div>
        )}
        {alumni.alumniProfile?.personalInfo?.location && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium w-20">Location:</span>
            <span>{alumni.alumniProfile.personalInfo.location}</span>
          </div>
        )}
      </div>

      {/* Skills Preview */}
      {alumni.alumniProfile?.skills && alumni.alumniProfile.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {alumni.alumniProfile.skills.slice(0, 3).map((skill, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                {skill}
              </span>
            ))}
            {alumni.alumniProfile.skills.length > 3 && (
              <span className="text-gray-500 text-xs">+{alumni.alumniProfile.skills.length - 3} more</span>
            )}
          </div>
        </div>
      )}

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
//profile Modal Component
// Enhanced ProfileModal Component
// ProfileModal Component with proper imports
const ProfileModal = ({ profile, onClose }) => {
  if (!profile) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCareerInfo = () => {
    if (!profile.careerStatus) return null;
    
    switch (profile.careerStatus) {
      case 'working':
        return {
          title: 'Professional Information',
          details: [
            { label: 'Company', value: profile.careerDetails?.companyName },
            { label: 'Job Title', value: profile.careerDetails?.jobTitle },
            { label: 'Location', value: profile.careerDetails?.companyLocation },
            { label: 'Experience', value: profile.careerDetails?.yearsOfExperience }
          ]
        };
      case 'entrepreneur':
        return {
          title: 'Entrepreneurial Venture',
          details: [
            { label: 'Startup Name', value: profile.careerDetails?.startupName },
            { label: 'Industry', value: profile.careerDetails?.industry },
            { label: 'Role', value: profile.careerDetails?.roleInStartup },
            { label: 'Years Running', value: profile.careerDetails?.yearsRunning }
          ]
        };
      case 'studies':
        return {
          title: 'Educational Pursuit',
          details: [
            { label: 'Institution', value: profile.careerDetails?.institutionName },
            { label: 'Course', value: profile.careerDetails?.courseArea },
            { label: 'Location', value: profile.careerDetails?.institutionLocation },
            { label: 'Expected Graduation', value: profile.careerDetails?.expectedGraduationYear }
          ]
        };
      default:
        return null;
    }
  };

  const careerInfo = getCareerInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Alumni Profile</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl p-2"
            >
              ×
            </button>
          </div>
          
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mr-6">
                {profile.profileImageUrl ? (
                  <img 
                    src={profile.profileImageUrl} 
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-semibold text-2xl">
                    {profile.name?.charAt(0) || 'A'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-600 text-lg">{profile.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Class of {profile.graduationYear}
                  </span>
                  {profile.role && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {profile.role}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaUser className="text-blue-600 mr-2" />
                Personal Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{profile.personalInfo?.location || 'Not specified'}</span>
                </div>
                {profile.personalInfo?.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{profile.personalInfo.phone}</span>
                  </div>
                )}
                {profile.personalInfo?.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium capitalize">{profile.personalInfo.gender}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaGraduationCap className="text-green-600 mr-2" />
                Academic Background
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Degree:</span>
                  <span className="font-medium">{profile.academicInfo?.degree || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Branch:</span>
                  <span className="font-medium">{profile.academicInfo?.branch || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CGPA:</span>
                  <span className="font-medium">{profile.academicInfo?.cgpa || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Career Information */}
            {careerInfo && (
              <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaBriefcase className="text-purple-600 mr-2" />
                  {careerInfo.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {careerInfo.details.map((detail, index) => (
                    detail.value && (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{detail.label}:</span>
                        <span className="font-medium">{detail.value}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaTools className="text-yellow-600 mr-2" />
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {profile.otherInfo?.bio && (
              <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaInfoCircle className="text-indigo-600 mr-2" />
                  About
                </h3>
                <p className="text-gray-700 leading-relaxed">{profile.otherInfo.bio}</p>
              </div>
            )}

            {/* Contact Links */}
            <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaGlobe className="text-green-600 mr-2" />
                Connect
              </h3>
              <div className="flex space-x-4">
                {profile.otherInfo?.linkedin && (
                  <a 
                    href={profile.otherInfo.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FaLinkedin className="mr-2" />
                    LinkedIn
                  </a>
                )}
                {profile.otherInfo?.github && (
                  <a 
                    href={profile.otherInfo.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-gray-800"
                  >
                    <FaGithub className="mr-2" />
                    GitHub
                  </a>
                )}
                {profile.resumeUrl && (
                  <a 
                    href={profile.resumeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-red-600 hover:text-red-800"
                  >
                    <FaFile className="mr-2" />
                    Resume
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
            <button 
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button 
              onClick={() => {
                // Add connection logic here
                toast.info('Connection feature will be implemented soon');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Message
            </button>
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
 // Updated ConnectionCard Component with Message Button
// Updated ConnectionCard Component with Blue Message Button
// Fixed ConnectionCard Component with Blue Message Button
// Fixed ConnectionCard Component with Blue Message Button
const ConnectionCard = ({ connection, onMessage }) => {
  // Fixed profile photo handling for connections
  const getProfileImage = () => {
    // Try to get profile image from connection data
    if (connection.person.profileImageUrl) {
      return (
        <img 
          src={connection.person.profileImageUrl} 
          alt={connection.person.name}
          className="w-12 h-12 rounded-full object-cover mr-4"
          onError={(e) => {
            e.target.style.display = 'none';
            // Fixed: Use standard conditional check
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center flex-1">
        <div className="relative">
          {getProfileImage()}
          <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
            <span className="text-green-600 font-semibold text-lg">
              {connection.person.name.charAt(0)}
            </span>
          </div>
        </div>
        <div className="flex-1">
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
      
      <div className="flex space-x-2">
        <button 
          onClick={() => onMessage(connection.person.id)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
          </svg>
          Message
        </button>
      </div>
    </div>
  );
};
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
// Enhanced renderAlumniDirectory function
const renderAlumniDirectory = () => (
  <div className="mb-8">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Alumni Directory</h2>
      <p className="text-gray-600">Connect with fellow alumni from your institution</p>
    </div>
    
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search (Name, Email, Company)</label>
          <input 
            type="text" 
            placeholder="Search by name, email, company..." 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        
        {/* Graduation Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
          >
            <option value="">All Years</option>
            {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        {/* Branch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.branch}
            onChange={(e) => handleFilterChange('branch', e.target.value)}
          >
            <option value="">All Branches</option>
            <option value="computer-science">Computer Science</option>
            <option value="information-technology">Information Technology</option>
            <option value="electrical-engineering">Electrical Engineering</option>
            <option value="electronics-communication">Electronics & Communication</option>
            <option value="mechanical-engineering">Mechanical Engineering</option>
            <option value="civil-engineering">Civil Engineering</option>
            <option value="chemical-engineering">Chemical Engineering</option>
            <option value="biotechnology">Biotechnology</option>
            <option value="business-administration">Business Administration</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        {/* Career Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Career Status</label>
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.careerStatus}
            onChange={(e) => handleFilterChange('careerStatus', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="working">Working</option>
            <option value="entrepreneur">Entrepreneur</option>
            <option value="studies">Higher Studies</option>
            <option value="not-working">Not Working</option>
          </select>
        </div>
        
        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
          <input 
            type="text" 
            placeholder="e.g., JavaScript, React" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.skills}
            onChange={(e) => handleFilterChange('skills', e.target.value)}
          />
        </div>
        
        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
          <input 
            type="text" 
            placeholder="e.g., AI, Startups" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.interests}
            onChange={(e) => handleFilterChange('interests', e.target.value)}
          />
        </div>
        
        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
          <input 
            type="text" 
            placeholder="Company name" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.company}
            onChange={(e) => handleFilterChange('company', e.target.value)}
          />
        </div>
        
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input 
            type="text" 
            placeholder="City or country" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />
        </div>
        
        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.experience}
            onChange={(e) => handleFilterChange('experience', e.target.value)}
          >
            <option value="">All Experience</option>
            <option value="0-2">0-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>
        
        {/* Connection Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Connection Status</label>
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.connectionStatus}
            onChange={(e) => handleFilterChange('connectionStatus', e.target.value)}
          >
            <option value="">All Connections</option>
            <option value="connected">Connected</option>
            <option value="pending_sent">Request Sent</option>
            <option value="pending_received">Request Received</option>
            <option value="not_connected">Not Connected</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <button onClick={clearFilters} className="text-blue-600 hover:text-blue-800 font-medium">
          Clear All Filters
        </button>
        <span className="text-sm text-gray-500">
          Showing {filteredAlumni.length} of {alumniData.length} alumni
        </span>
      </div>
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
  // Updated renderConnections function
const renderConnections = () => {
  const handleMessage = (userId) => {
    // Implement messaging functionality
    toast.info(`Messaging feature for user ${userId} will be implemented soon`);
    // You can redirect to a messaging page or open a chat modal
  };

  return (
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
                <ConnectionCard 
                  key={connection.id} 
                  connection={connection} 
                  onMessage={handleMessage}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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