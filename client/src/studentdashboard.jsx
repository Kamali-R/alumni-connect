import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentProfileDisplay from './studentprofiledisplay';
import AlumniProfilePage from './profile';
import AlumniDirectory from './alumnidirectory';
import InternHub from './studentinternship';
import NewsAndAchievements from './NewsAndAchievements';
import EventHub from './studentevents';
import StudentMessages from './StudentMessages';


const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [fadeAnimation, setFadeAnimation] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('Student User');
  const [userMajor, setUserMajor] = useState('');
  const [expectedGraduation, setExpectedGraduation] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication and fetch profile data
  useEffect(() => {
  const checkAuthenticationAndFetchProfile = async () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!storedToken) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Get user data from localStorage
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      console.log('User data:', userData);
      setUserRole(userData.role);
      setUserName(userData.name || 'Student User');
      
      // If user is an alumni, redirect to alumni dashboard
      if (userData.role === 'alumni') {
        navigate('/dashboard');
        return;
      }
      
      // For students, check if profile is completed
      if (!userData.profileCompleted) {
        console.log('Student profile not completed, redirecting to profile');
        navigate('/student-profile', {
          state: {
            userData: userData,
            verified: true,
            role: userData.role
          }
        });
        return;
      }
    }
    
    // If we get here, user is authenticated student with complete profile
    console.log('✅ Student authenticated with complete profile - loading dashboard');
    
    // Fetch student profile data for display
    try {
      const response = await fetch('http://localhost:5000/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (response.ok) {
        const profileData = await response.json();
        setProfileData(profileData);
        
        if (profileData.academicInfo) {
          setUserMajor(profileData.academicInfo.branch || '');
          setExpectedGraduation(`Class of ${profileData.academicInfo.graduationYear || ''}`);
        }
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
    } finally {
      setLoading(false);
    }
  };

  checkAuthenticationAndFetchProfile();
}, [navigate]);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
        </svg>
      ) },
    { id: 'profile', label: 'My Profile', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
        </svg>
      ) },
    { id: 'alumni-directory', label: 'Alumni Directory', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
        </svg>
      ) },
    { id: 'internships', label: 'Internships', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
      ) },
    { id: 'events', label: 'Events', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
        </svg>
      ) },
      { id: 'news', label: 'News & Achievements', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd"></path>
        </svg>
      ) },
     { id: 'messages', label: 'Messages', icon: (
      <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
      </svg>
    ) },
    { id: 'logout', label: 'Logout', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"></path>
        </svg>
      ), action: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } },
  ];
  
  // Quick action buttons
  const quickActions = [
    { 
      label: 'Find Alumni', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path>
        </svg>
      )
    },
    { 
      label: 'Browse Internships', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
      )
    },
    { 
      label: 'Career Advice', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"></path>
        </svg>
      )
    },
    { 
      label: 'Campus Events', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
        </svg>
      )
    },
  ];
  
  // Recent activity items
  const recentActivities = [
    {
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
        </svg>
      ),
      bgColor: 'bg-green-100',
      title: 'New Alumni Connection',
      time: '2 hours ago',
      description: 'You connected with Sarah Johnson (Class of 2018, Software Engineer at Google).'
    },
    {
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
        </svg>
      ),
      bgColor: 'bg-blue-100',
      title: 'Internship Opportunity',
      time: '5 hours ago',
      description: 'Microsoft is hiring summer interns. Application deadline is next Friday.'
    },
    {
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
        </svg>
      ),
      bgColor: 'bg-indigo-100',
      title: 'Career Workshop',
      time: '1 day ago',
      description: 'Resume building workshop scheduled for this Wednesday at 3 PM in the Student Center.'
    },
    {
      icon: (
        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
        </svg>
      ),
      bgColor: 'bg-yellow-100',
      title: 'Alumni Response',
      time: '2 days ago',
      description: 'Michael Chen responded to your career advice request. Check your messages.'
    },
  ];
  
  // Handle navigation click
  const handleNavClick = (sectionId, action) => {
    if (action) {
      action();
      return;
    }
    
    setActiveSection(sectionId);
    setFadeAnimation(true);
    setTimeout(() => setFadeAnimation(false), 10);
  };
  
  // Handle quick action click
  const handleQuickActionClick = (label) => {
    console.log('Quick action clicked:', label);
    // Add navigation logic based on the action
    if (label === 'Find Alumni') {
      setActiveSection('alumni-directory');
    } else if (label === 'Browse Internships') {
      setActiveSection('internships');
    } else if (label === 'Career Advice') {
      setActiveSection('career-advice');
    } else if (label === 'Campus Events') {
      setActiveSection('events');
    }
  };
  
  // Stat cards data
  const statCards = [
    { 
      title: 'Alumni Connections', 
      value: '8', 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      )
    },
    { 
      title: 'Internship Opportunities', 
      value: '15', 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
      )
    },
    { 
      title: 'Upcoming Events', 
      value: '3', 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
        </svg>
      )
    },
    { 
      title: 'Unread Messages', 
      value: '2', 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
        </svg>
      )
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="sidebar w-64 h-full bg-white shadow-lg z-10">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"></path>
              </svg>
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">Alumni Connect</span>
          </div>
          
          {/* Student Profile Section */}
          <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {userName.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="ml-3">
              <p className="font-semibold text-gray-900">{userName}</p>
              <p className="text-sm text-gray-600">{userMajor}</p>
              <p className="text-xs text-blue-600 mt-1">{expectedGraduation}</p>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeSection === item.id
                    ? 'active bg-blue-700 text-white shadow-md'
                    : 'text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                }`}
                onClick={() => handleNavClick(item.id, item.action)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div className={`content-section ${fadeAnimation ? 'fade-in' : ''}`}>
              {/* Welcome Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome to Student Portal, {userName}! 👋
                </h1>
                <p className="text-gray-600">
                  Connect with alumni, find internships, and get career advice to jumpstart your future.
                </p>
              </div>
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, index) => (
                  <div key={index} className="stat-card p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                      </div>
                      {card.icon}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Quick Actions */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Started</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="quick-action-btn bg-blue-700 text-white p-4 rounded-lg text-center hover:bg-blue-800 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center justify-center"
                      onClick={() => handleQuickActionClick(action.label)}
                    >
                      {action.icon}
                      <span className="text-sm font-medium mt-2">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Recent Activity */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="activity-card p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-start">
                        <div className={`w-10 h-10 ${activity.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          {activity.icon}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-500">{activity.time}</p>
                          </div>
                          <p className="text-gray-600 mt-1">{activity.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Profile Information Display */}
              {profileData && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Roll Number:</span> {profileData.academicInfo?.rollNumber}</p>
                      <p><span className="font-medium">College Email:</span> {profileData.academicInfo?.collegeEmail}</p>
                      <p><span className="font-medium">Degree:</span> {profileData.academicInfo?.degree}</p>
                      <p><span className="font-medium">Branch:</span> {profileData.academicInfo?.branch}</p>
                      <p><span className="font-medium">Current Year:</span> {profileData.academicInfo?.currentYear}</p>
                      <p><span className="font-medium">Graduation Year:</span> {profileData.academicInfo?.graduationYear}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Skills & Interests</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {profileData.skills?.map((skill, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium mb-2">Interests:</p>
                        <div className="flex flex-wrap gap-2">
                          {profileData.interests?.map((interest, index) => (
                            <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Profile Section - render based on user role (student | alumni) */}
          {activeSection === 'profile' && (
            <div className="mt-8">
              {userRole === 'alumni' ? <AlumniProfilePage /> : <StudentProfileDisplay />}
            </div>
          )}
          {activeSection === 'internships' && (
            <div className="mt-8">
              <InternHub />
            </div>
          )}
          {activeSection === 'messages' && (
  <div className={`content-section ${fadeAnimation ? 'fade-in' : ''}`}>
    <StudentMessages />
  </div>
)}
          {activeSection === 'events' && (
            <div className="mt-8">
              <EventHub />
            </div>
          )}
          {activeSection === 'news' && (
            <div className="mt-8">
              <NewsAndAchievements />
            </div>
          )}
          {activeSection === 'alumni-directory' && <AlumniDirectory />}
          
          {/* Other Sections (Placeholders) */}
          {activeSection !== 'dashboard' && activeSection !== 'profile' && activeSection !== 'internships' && activeSection !== 'messages' && activeSection !== 'events' && activeSection !== 'alumni-directory' && (
            <div className="content-section">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {navItems.find(item => item.id === activeSection)?.label}
              </h1>
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
                <p className="text-gray-600">This section is under development.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;