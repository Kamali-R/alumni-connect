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
    limit: 20
  });

  // Navigation items
  const navItems = [
    { id: 'directory', label: 'Alumni Directory', icon: '👥' },
    { id: 'connections', label: 'My Connections', icon: '🔗' }
  ];

  // Fetch alumni directory from backend
 // In NetworkingHub.jsx - update fetchAlumniDirectory
const fetchAlumniDirectory = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams({
      page: filters.page,
      limit: filters.limit,
      ...(filters.search && { search: filters.search }),
      ...(filters.year && { graduationYear: filters.year }),
      ...(filters.branch && { branch: filters.branch })
    });

    console.log('🔄 Fetching alumni from:', `http://localhost:5000/api/alumni-directory?${queryParams}`);

    const response = await fetch(`http://localhost:5000/api/alumni-directory?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch alumni directory');
    }

    const data = await response.json();
    console.log('✅ Received alumni data:', {
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      alumniCount: data.alumni.length,
      alumni: data.alumni.map(a => ({ name: a.name, id: a.id }))
    });

    setAlumniData(data.alumni);
    setFilteredAlumni(data.alumni);
  } catch (error) {
    console.error('❌ Error fetching alumni directory:', error);
    toast.error('Failed to load alumni directory');
  } finally {
    setLoading(false);
  }
};
  // Fetch alumni profile for viewing
  const fetchAlumniProfile = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/alumni/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/connection-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connection requests');
      }

      const data = await response.json();
      setPendingRequests(data.pendingRequests);
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      toast.error('Failed to load connection requests');
    }
  };

  // Fetch my connections
  const fetchMyConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/my-connections', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }

      const data = await response.json();
      setMyConnections(data.connections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
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

  // Handle connection request
  const sendConnectionRequest = async (alumniId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/connection-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipientId: alumniId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send connection request');
      }

      // Update local state
      setAlumniData(prev => prev.map(alumni => 
        alumni.id === alumniId 
          ? { ...alumni, connectionStatus: 'pending_sent' }
          : alumni
      ));

      toast.success('Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error(error.message || 'Failed to send connection request');
    }
  };

  // Handle accept connection
  const acceptConnection = async (connectionId, alumniId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/accept-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId })
      });

      if (!response.ok) {
        throw new Error('Failed to accept connection request');
      }

      // Update local state
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      fetchMyConnections(); // Refresh connections
      
      // Also update alumni directory if needed
      setAlumniData(prev => prev.map(alumni => 
        alumni.id === alumniId 
          ? { ...alumni, connectionStatus: 'connected' }
          : alumni
      ));

      toast.success('Connection request accepted!');
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection request');
    }
  };

  // Handle decline connection
  const declineConnection = async (connectionId, alumniId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/decline-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId })
      });

      if (!response.ok) {
        throw new Error('Failed to decline connection request');
      }

      // Update local state
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      
      // Also update alumni directory if needed
      setAlumniData(prev => prev.map(alumni => 
        alumni.id === alumniId 
          ? { ...alumni, connectionStatus: 'not_connected' }
          : alumni
      ));

      toast.info('Connection request declined.');
    } catch (error) {
      console.error('Error declining connection:', error);
      toast.error('Failed to decline connection request');
    }
  };

  // Handle cancel connection request
  const cancelConnectionRequest = async (alumniId) => {
    try {
      // First find the connection ID
      const connection = pendingRequests.find(req => req.person.id === alumniId);
      if (!connection) return;

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cancel-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId: connection.id })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel connection request');
      }

      // Update local state
      setAlumniData(prev => prev.map(alumni => 
        alumni.id === alumniId 
          ? { ...alumni, connectionStatus: 'not_connected' }
          : alumni
      ));

      toast.info('Connection request cancelled.');
    } catch (error) {
      console.error('Error cancelling connection:', error);
      toast.error('Failed to cancel connection request');
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
      page: 1 // Reset to first page when filters change
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
  <option value="computer science">Computer Science</option>
  <option value="electrical engineering">Electrical Engineering</option>
  <option value="mechanical engineering">Mechanical Engineering</option>
  <option value="electronics communication">Electronics & Communication</option>
  <option value="business administration">Business Administration</option>
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

  // Add this debug function to networkinghub.jsx
const testAlumniFetch = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/alumni/all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Alumni fetch response status:', response.status);
    const data = await response.json();
    console.log('Alumni fetch data:', data);
    
    if (!response.ok) {
      console.error('Alumni fetch error:', data);
    }
    
    return data;
  } catch (error) {
    console.error('Alumni fetch exception:', error);
  }
};
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

  // AlumniCard Component
  const AlumniCard = ({ alumni, onConnect, onCancel, onViewProfile }) => {
  const getConnectionButton = () => {
    switch (alumni.connectionStatus) {
      case 'connected':
        return (
          <button 
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex-1 cursor-not-allowed"
            disabled
          >
            Connected
          </button>
        );
      case 'pending_sent':
        return (
          <button 
            onClick={() => onCancel(alumni.id)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex-1 hover:bg-yellow-700"
          >
            Cancel Request
          </button>
        );
      case 'pending_received':
        return (
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex-1 cursor-not-allowed"
            disabled
          >
            Respond to Request
          </button>
        );
      default:
        return (
          <button 
            onClick={() => onConnect(alumni.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex-1"
          >
            Connect
          </button>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          {/* Profile Image with fallback to initial */}
          {alumni.profileImageUrl ? (
            <img 
              src={alumni.profileImageUrl} 
              alt={alumni.name}
              className="w-12 h-12 rounded-full object-cover mr-4"
            />
          ) : (
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
              <span className="text-blue-600 font-semibold text-lg">
                {alumni.name.charAt(0)}
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
      </div>
      
      {/* Enhanced Profile Information */}
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
            <span className="capitalize">{alumni.alumniProfile.academicInfo.branch.replace(/-/g, ' ')}</span>
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
          <p className="text-sm text-gray-600 mb-2">Skills:</p>
          <div className="flex flex-wrap gap-1">
            {alumni.alumniProfile.skills.slice(0, 3).map((skill, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
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
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

// Update ProfileModal component to display images properly
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
          
          {/* Profile Header with Image */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              {/* Profile Image */}
              {profile.profileImageUrl ? (
                <img 
                  src={profile.profileImageUrl} 
                  alt={profile.name}
                  className="w-20 h-20 rounded-full object-cover mr-6"
                />
              ) : (
                <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mr-6">
                  <span className="text-blue-600 font-semibold text-2xl">
                    {profile.name.charAt(0)}
                  </span>
                </div>
              )}
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
  const PendingRequestCard = ({ request, onAccept, onDecline }) => (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
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
        </div>
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={() => onAccept(request.id, request.person.id)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
        >
          Accept
        </button>
        <button 
          onClick={() => onDecline(request.id, request.person.id)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm"
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
      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
        Message
      </button>
    </div>
  );

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