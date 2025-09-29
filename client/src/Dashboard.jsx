import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AlumniProfilePage from './profile';
import AlumniJobDashboard from './AlumniJobDashboard';
import NetworkingHub from './NetworkingHub';
import NewsAndAchievements from './NewsAndAchievements';
import EventsAndReunions from './EventsAndReunions';
const AlumniConnectDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [fadeAnimation, setFadeAnimation] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userGraduation, setUserGraduation] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);
  
  // Check authentication and fetch user data on component mount
 // Fixed dashboard user initialization in dashboard.jsx
useEffect(() => {
  const initializeUser = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      // Fetch current user data from backend
      const response = await fetch('http://localhost:5000/user', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token expired, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      console.log('User data fetched:', userData);

      // FIXED: Check registration completion based on role
      let registrationComplete = false;
      
      if (userData.role === 'alumni') {
        // For alumni, check if they have both profileCompleted AND alumni profile
        registrationComplete = userData.profileCompleted && userData.alumniProfile;
        
        // Double-check by trying to fetch alumni profile
        if (userData.profileCompleted) {
          try {
            const alumniResponse = await fetch('http://localhost:5000/api/alumni/profile', {
              headers: {
                'Authorization': `Bearer ${storedToken}`
              }
            });
            
            if (alumniResponse.status === 404) {
              // No alumni profile found, registration not complete
              registrationComplete = false;
              console.log('Alumni profile not found, registration incomplete');
            } else if (alumniResponse.ok) {
              const alumniData = await alumniResponse.json();
              registrationComplete = alumniData.status === 'complete';
              console.log('Alumni profile status:', alumniData.status);
            }
          } catch (error) {
            console.error('Error checking alumni profile:', error);
            registrationComplete = false;
          }
        }
      } else {
        // For students, just check profileCompleted
        registrationComplete = userData.profileCompleted;
      }
      
      console.log('Registration complete status:', registrationComplete);
      
      // If alumni user hasn't completed registration, redirect to profile setup
      if (!registrationComplete && userData.role === 'alumni') {
        console.log('Registration not complete, redirecting to profile setup');
        navigate('/alumni-profile', {
          state: {
            userData: userData,
            verified: true,
            role: userData.role
          }
        });
        return;
      }

      // Update state
      setUserRole(userData.role);
      setUserName(userData.name || 'User');
      setProfileCompleted(registrationComplete);
      
      if (userData.graduationYear) {
        setUserGraduation(`Class of ${userData.graduationYear}`);
      } else {
        setUserGraduation('Alumni');
      }

      // Update localStorage with corrected data
      const updatedUserData = {
        ...userData,
        profileCompleted: registrationComplete,
        registrationComplete: registrationComplete
      };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      localStorage.setItem('registrationComplete', registrationComplete ? 'true' : 'false');

    } catch (error) {
      console.error('Error initializing user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  initializeUser();
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
    { id: 'networking', label: 'Networking Hub', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
        </svg>
      ) },
    { id: 'jobs', label: 'Job Opportunities', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
      ) },
    { id: 'events', label: 'Events & Reunions', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
        </svg>
      ) },
      
    { id: 'mentorship', label: 'Mentorship Program', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"></path>
        </svg>
      ) },
    { id: 'messages', label: 'Messages', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
        </svg>
      ) },
    { id: 'news', label: 'News & Achievements', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd"></path>
        </svg>
      ) },
    { id: 'donations', label: 'Donations', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
        </svg>
      ) },
    { id: 'logout', label: 'Logout', icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"></path>
        </svg>
      ), action: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('profileCompleted');
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
      label: 'Browse Jobs', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
      )
    },
    { 
      label: 'View Events', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
        </svg>
      )
    },
    { 
      label: 'Send Message', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
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
      title: 'New Alumni Joined',
      time: '2 hours ago',
      description: '5 new alumni from the Computer Science department joined the network.'
    },
    {
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
        </svg>
      ),
      bgColor: 'bg-blue-100',
      title: 'Event Reminder',
      time: '5 hours ago',
      description: 'Annual Alumni Gala is scheduled for next Saturday. Don\'t forget to RSVP!'
    },
    {
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
        </svg>
      ),
      bgColor: 'bg-indigo-100',
      title: 'Mentorship Opportunity',
      time: '1 day ago',
      description: 'Sarah Johnson (Class of 2015) is offering mentorship for recent graduates.'
    },
    {
      icon: (
        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
        </svg>
      ),
      bgColor: 'bg-yellow-100',
      title: 'Alumni Achievement',
      time: '2 days ago',
      description: 'Michael Chen (Class of 2010) received the Industry Leadership Award.'
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
    // Add specific navigation logic for each quick action
    switch (label) {
      case 'Find Alumni':
        setActiveSection('networking');
        break;
      case 'Browse Jobs':
        setActiveSection('jobs');
        break;
      case 'View Events':
        setActiveSection('events');
        break;
      case 'Send Message':
        setActiveSection('messages');
        break;
      default:
        break;
    }
  };
  
  // Stat cards data
  const statCards = [
    { 
      title: 'Network Connections', 
      value: '0', 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      )
    },
    { 
      title: 'Job Opportunities', 
      value: '12', 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
      )
    },
    { 
      title: 'Upcoming Events', 
      value: '5', 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
        </svg>
      )
    },
    { 
      title: 'Messages', 
      value: '0', 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
        </svg>
      )
    },
  ];

  // Loading state
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
          
          {/* Alumni Profile Section */}
          <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="font-semibold text-gray-900">{userName}</p>
              <p className="text-sm text-gray-600">{userGraduation}</p>
              <p className="text-xs text-blue-600 mt-1">
                {userRole === 'alumni' ? 'Alumni' : 'Student'}
                {!profileCompleted && (
                  <span className="ml-2 text-red-600">• Profile Incomplete</span>
                )}
              </p>
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
                  Welcome to Alumni Connect, {userName}!
                </h1>
                <p className="text-gray-600">
                  {userRole === 'alumni' 
                    ? profileCompleted 
                      ? "Your profile is complete! Start connecting with other alumni." 
                      : "Please complete your profile to get the most out of Alumni Connect."
                    : "Explore opportunities and connect with alumni from your institution."}
                </p>
              </div>

              {/* Profile Completion Alert */}
              {!profileCompleted && userRole === 'alumni' && (
                <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Complete Your Alumni Profile
                      </h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        Add your academic and professional information to connect with other alumni and access all features.
                      </p>
                    </div>
                    <div className="ml-6 flex-shrink-0">
                      <button
                        onClick={() => navigate('/alumni-profile')}
                        className="bg-yellow-50 text-yellow-800 hover:bg-yellow-100 font-medium py-2 px-4 rounded-lg border border-yellow-200 transition-colors"
                      >
                        Complete Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
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
            </div>
          )}
          
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className={`content-section ${fadeAnimation ? 'fade-in' : ''}`}>
              <AlumniProfilePage />
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'jobs' && (
            <div className={`content-section ${fadeAnimation ? 'fade-in' : ''}`}>
              <AlumniJobDashboard />
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'events' && (
            <div className={`content-section ${fadeAnimation ? 'fade-in' : ''}`}>
              <EventsAndReunions />
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'news' && (
            <div className={`content-section ${fadeAnimation ? 'fade-in' : ''}`}>
              <NewsAndAchievements />
            </div>
          )}
          
          {activeSection === 'networking' && (
            <div className={`content-section ${fadeAnimation ? 'fade-in' : ''}`}>
              <NetworkingHub/>
            </div>
          )}
          
        </main>
      </div>
    </div>
  );
};

export default AlumniConnectDashboard;