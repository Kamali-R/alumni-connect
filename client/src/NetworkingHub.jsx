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

  // Navigation items
  const navItems = [
    { id: 'directory', label: 'Alumni Directory', icon: '👥' },
    { id: 'connections', label: 'My Connections', icon: '🔗' }
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
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.year && { graduationYear: filters.year }),
        ...(filters.branch && { branch: filters.branch })
      });

      const response = await fetch(`http://localhost:5000/api/alumni-directory?${queryParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch alumni directory');
      }

      const data = await response.json();
      setAlumniData(data.alumni || []);
      setFilteredAlumni(data.alumni || []);
    } catch (error) {
      console.error('Error fetching alumni directory:', error);
      toast.error('Failed to load alumni directory: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch alumni profile for viewing
  const fetchAlumniProfile = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/alumni/profile/${userId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch alumni profile');
      }

      const profileData = await response.json();
      setSelectedProfile(profileData);
    } catch (error) {
      console.error('Error fetching alumni profile:', error);
      toast.error('Failed to load alumni profile: ' + error.message);
    }
  };

  // Fetch connection requests
  const fetchConnectionRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/connection-requests', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch connection requests');
      }

      const data = await response.json();
      setPendingRequests(data.pendingRequests || []);
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      toast.error('Failed to load connection requests: ' + error.message);
    }
  };

  // Fetch my connections
  const fetchMyConnections = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/my-connections', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch connections');
      }

      const data = await response.json();
      setMyConnections(data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections: ' + error.message);
    }
  };

  // Load data based on active section
  useEffect(() => {
    if (activeSection === 'directory') {
      fetchAlumniDirectory();
    } else if (activeSection === 'connections') {
      fetchConnectionRequests();
      fetchMyConnections();
    }
  }, [activeSection, filters]);

  // Handle connection request - FIXED VERSION
 // FIXED: Handle connection request - Enhanced version
const sendConnectionRequest = async (alumniId) => {
  try {
    console.log('Sending connection request to alumni ID:', alumniId);
    
    // Validate alumniId
    if (!alumniId) {
      throw new Error('Alumni ID is required');
    }

    const response = await fetch('http://localhost:5000/api/connection-request', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recipientId: alumniId })
    });

    // Check if response is OK
    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle specific error cases
      if (response.status === 400 && errorData.message.includes('already exists')) {
        // Connection already exists, update local state accordingly
        const updateAlumniStatus = (alumni) => 
          alumni.id === alumniId 
            ? { 
                ...alumni, 
                connectionStatus: errorData.status === 'accepted' ? 'connected' : 'pending_sent' 
              }
            : alumni;

        setAlumniData(prev => prev.map(updateAlumniStatus));
        setFilteredAlumni(prev => prev.map(updateAlumniStatus));
        
        toast.info(errorData.message || 'Connection already exists');
        return;
      }
      
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Connection request successful:', data);

    // Update local state to show "Requested" status
    const updateAlumniStatus = (alumni) => 
      alumni.id === alumniId 
        ? { ...alumni, connectionStatus: 'pending_sent' }
        : alumni;

    setAlumniData(prev => prev.map(updateAlumniStatus));
    setFilteredAlumni(prev => prev.map(updateAlumniStatus));

    toast.success('Connection request sent successfully!');
    
  } catch (error) {
    console.error('Connection request failed:', error);
    
    // Enhanced error handling
    if (error.message.includes('Failed to fetch')) {
      toast.error('Network error: Please check if the backend is running on port 5000');
    } else if (error.message.includes('401')) {
      toast.error('Authentication failed. Please log in again.');
      localStorage.removeItem('token');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else if (error.message.includes('400')) {
      toast.info(error.message || 'Connection request already sent');
    } else {
      toast.error(error.message || 'Failed to send connection request');
    }
  }
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
        throw new Error(errorData.message || 'Failed to accept connection');
      }

      // Update states
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      
      const updateAlumniStatus = (alumni) => 
        alumni.id === alumniId 
          ? { ...alumni, connectionStatus: 'connected' }
          : alumni;

      setAlumniData(prev => prev.map(updateAlumniStatus));
      setFilteredAlumni(prev => prev.map(updateAlumniStatus));

      // Refresh connections
      await fetchMyConnections();
      
      toast.success('Connection request accepted!');
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error(error.message || 'Failed to accept connection request');
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
        throw new Error(errorData.message || 'Failed to decline connection request');
      }

      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      
      const updateAlumniStatus = (alumni) => 
        alumni.id === alumniId 
          ? { ...alumni, connectionStatus: 'not_connected' }
          : alumni;

      setAlumniData(prev => prev.map(updateAlumniStatus));
      setFilteredAlumni(prev => prev.map(updateAlumniStatus));

      toast.info('Connection request declined.');
    } catch (error) {
      console.error('Error declining connection:', error);
      toast.error(error.message || 'Failed to decline connection request');
    }
  };

  // Cancel connection request
  // Enhanced cancel connection function
const cancelConnectionRequest = async (alumniId) => {
  try {
    console.log('Cancelling connection request for alumni:', alumniId);
    
    // First, try to find the connection ID by checking all connections
    let connectionId = null;
    
    try {
      const connectionsResponse = await fetch('http://localhost:5000/api/connection-requests', {
        headers: getAuthHeaders()
      });
      
      if (connectionsResponse.ok) {
        const data = await connectionsResponse.json();
        // Look for sent requests in pending requests
        const sentRequest = data.pendingRequests?.find(req => 
          req.person.id === alumniId
        );
        if (sentRequest) {
          connectionId = sentRequest.id;
        }
      }
    } catch (error) {
      console.log('Could not fetch connection requests:', error.message);
    }
    
    // If we found a connection ID, cancel it properly
    if (connectionId) {
      const cancelResponse = await fetch('http://localhost:5000/api/cancel-connection', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ connectionId })
      });

      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.json();
        throw new Error(errorData.message || 'Failed to cancel connection request');
      }
    }
    
    // Update local state regardless
    const updateAlumniStatus = (alumni) => 
      alumni.id === alumniId 
        ? { ...alumni, connectionStatus: 'not_connected' }
        : alumni;

    setAlumniData(prev => prev.map(updateAlumniStatus));
    setFilteredAlumni(prev => prev.map(updateAlumniStatus));

    // Also remove from pending requests if it's there
    setPendingRequests(prev => prev.filter(req => req.person.id !== alumniId));

    toast.success('Connection request cancelled successfully.');
    
  } catch (error) {
    console.error('Error cancelling connection:', error);
    toast.error(error.message || 'Failed to cancel connection request');
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
    toast.success("Filters cleared successfully!");
  };

  // Navigation handler
  const handleNavClick = (section) => {
    setActiveSection(section);
  };

  // Alumni Card Component
// Enhanced AlumniCard Component
const AlumniCard = ({ alumni, onConnect, onCancel, onViewProfile }) => {
  const getConnectionButton = () => {
    switch (alumni.connectionStatus) {
      case 'connected':
        return (
          <button 
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex-1 cursor-not-allowed flex items-center justify-center"
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
            onClick={() => onCancel(alumni.id)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex-1 transition-colors flex items-center justify-center"
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
              toast.info('Please go to Connections tab to respond to this request');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex-1 transition-colors flex items-center justify-center"
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex-1 transition-colors flex items-center justify-center"
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
        
        {/* Connection Status Badge */}
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
      
      {/* Profile Information */}
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

      {/* Action Buttons */}
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
            
            {/* Profile Header */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mr-6">
                  <span className="text-blue-600 font-semibold text-2xl">
                    {profile.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                  <p className="text-gray-600">{profile.email}</p>
                  <p className="text-gray-600">Class of {profile.graduationYear}</p>
                  {profile.otherInfo?.linkedin && (
                    <a 
                      href={profile.otherInfo.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            {profile.academicInfo && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-gray-700">Degree</label>
                    <p className="text-gray-900">{profile.academicInfo.degree}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Branch</label>
                    <p className="text-gray-900 capitalize">{profile.academicInfo.branch?.replace(/-/g, ' ')}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Enrollment Number</label>
                    <p className="text-gray-900">{profile.academicInfo.enrollmentNumber}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">CGPA</label>
                    <p className="text-gray-900">{profile.academicInfo.cgpa}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Career Information */}
            {profile.careerStatus && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Career Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Current Status</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {profile.careerStatus}
                    </span>
                  </div>
                  
                  {profile.careerDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {profile.careerDetails.companyName && (
                        <div>
                          <label className="font-medium text-gray-700">Company</label>
                          <p className="text-gray-900">{profile.careerDetails.companyName}</p>
                        </div>
                      )}
                      {profile.careerDetails.jobTitle && (
                        <div>
                          <label className="font-medium text-gray-700">Job Title</label>
                          <p className="text-gray-900">{profile.careerDetails.jobTitle}</p>
                        </div>
                      )}
                      {profile.careerDetails.companyLocation && (
                        <div>
                          <label className="font-medium text-gray-700">Location</label>
                          <p className="text-gray-900">{profile.careerDetails.companyLocation}</p>
                        </div>
                      )}
                      {profile.careerDetails.yearsOfExperience && (
                        <div>
                          <label className="font-medium text-gray-700">Experience</label>
                          <p className="text-gray-900">{profile.careerDetails.yearsOfExperience} years</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experiences */}
            {profile.experiences && profile.experiences.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Work Experience</h3>
                <div className="space-y-4">
                  {profile.experiences.map((exp, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900">{exp.title} at {exp.company}</h4>
                      <p className="text-gray-600 text-sm">{exp.duration}</p>
                      <p className="text-gray-600 text-sm">{exp.location}</p>
                      {exp.description && (
                        <p className="text-gray-700 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {profile.achievements && profile.achievements.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Achievements</h3>
                <div className="space-y-3">
                  {profile.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <div>
                        <p className="font-medium text-gray-900">{achievement.title}</p>
                        {achievement.description && (
                          <p className="text-gray-600 text-sm">{achievement.description}</p>
                        )}
                        <p className="text-gray-500 text-xs">{achievement.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            {profile.personalInfo && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.personalInfo.phone && (
                    <div>
                      <label className="font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{profile.personalInfo.phone}</p>
                    </div>
                  )}
                  {profile.personalInfo.location && (
                    <div>
                      <label className="font-medium text-gray-700">Location</label>
                      <p className="text-gray-900">{profile.personalInfo.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // PendingRequestCard Component
  const PendingRequestCard = ({ request, onAccept, onDecline }) => {
    const handleAccept = () => {
      onAccept(request.id, request.person.id);
    };

    const handleDecline = () => {
      onDecline(request.id, request.person.id);
    };

    return (
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
            onClick={handleAccept}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            Accept
          </button>
          <button 
            onClick={handleDecline}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    );
  };

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
      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
        Message
      </button>
    </div>
  );

  // Render Alumni Directory
  const renderAlumniDirectory = () => (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Alumni Directory</h2>
        <p className="text-gray-600">Connect with fellow alumni from your institution</p>
      </div>
      
      {/* Search and Filters */}
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
              <option value="2019">2019</option>
              <option value="2018">2018</option>
              <option value="2017">2017</option>
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
              <option value="electronics-communication">Electronics & Communication</option>
              <option value="business-administration">Business Administration</option>
            </select>
          </div>
        </div>
        <button onClick={clearFilters} className="text-blue-600 hover:text-blue-800 font-medium">
          Clear All Filters
        </button>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Alumni Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map(alumni => (
            <AlumniCard 
              key={alumni.id} 
              alumni={alumni} 
              onConnect={sendConnectionRequest}
              onCancel={cancelConnectionRequest}
              onViewProfile={handleViewProfile}
            />
          ))}
        </div>
      )}
      
      {/* No Results */}
      {!loading && filteredAlumni.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No alumni found matching your criteria.</p>
        </div>
      )}
    </div>
  );
  // Debug function to test connection flow
const testConnectionFlow = async () => {
  try {
    console.log('=== Testing Connection Flow ===');
    
    // Test authentication
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    
    if (token) {
      // Test backend connectivity
      const testResponse = await fetch('http://localhost:5000/api/test');
      console.log('Backend connectivity:', testResponse.ok);
      
      // Test alumni directory
      const alumniResponse = await fetch('http://localhost:5000/api/alumni-directory?limit=1', {
        headers: getAuthHeaders()
      });
      console.log('Alumni directory access:', alumniResponse.ok);
      
      if (alumniResponse.ok) {
        const alumniData = await alumniResponse.json();
        console.log('Available alumni:', alumniData.alumni?.length || 0);
        
        if (alumniData.alumni && alumniData.alumni.length > 0) {
          const testAlumni = alumniData.alumni[0];
          console.log('Test alumni ID:', testAlumni.id);
          console.log('Test alumni name:', testAlumni.name);
          console.log('Current connection status:', testAlumni.connectionStatus);
          
          return testAlumni.id;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Debug test failed:', error);
    return null;
  }
};

// Call this function when component mounts for debugging
useEffect(() => {
  if (activeSection === 'directory') {
    testConnectionFlow().then(alumniId => {
      if (alumniId) {
        console.log('Ready to test connection with alumni ID:', alumniId);
      }
    });
  }
}, [activeSection]);

  // Render Connections
  const renderConnections = () => (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Connections</h2>
        <p className="text-gray-600">Manage your professional network</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Connection Requests */}
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
        
        {/* My Connections */}
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

  // Refresh connection data when switching to connections tab
  useEffect(() => {
    if (activeSection === 'connections') {
      fetchConnectionRequests();
      fetchMyConnections();
      // Also refresh alumni directory to update connection statuses
      fetchAlumniDirectory();
    }
  }, [activeSection]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Navigation */}
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
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'directory' && renderAlumniDirectory()}
        {activeSection === 'connections' && renderConnections()}
      </div>

      {/* Profile Modal */}
      <ProfileModal profile={selectedProfile} onClose={handleCloseProfile} />
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default NetworkingHub;