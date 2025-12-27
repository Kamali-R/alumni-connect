import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SkillsSection from './SkillsSection';
import ReportsSection from './ReportsSection';
import SecuritySection from './SecuritySection';
import AdminUserManagement from './AdminUserManagement';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [fadeAnimation, setFadeAnimation] = useState(false);
  const [userName, setUserName] = useState('Admin');
  const [userRole] = useState('System Administrator');
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalAlumni: 0,
    totalStudents: 0,
    activeJobs: 0,
    pendingEvents: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Notification handler
  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    setNotification({ message, type });
    if (duration > 0) {
      const timer = setTimeout(() => setNotification(null), duration);
      return () => clearTimeout(timer);
    }
  }, []);

  // Confirmation dialog handler
  const showConfirmDialog = useCallback((title, message, onConfirm, onCancel) => {
    setConfirmDialog({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmDialog(null);
      }
    });
  }, []);
  
  const [announcements, setAnnouncements] = useState([
    { 
      subject: 'Platform Maintenance Notice', 
      audience: 'All Users', 
      timestamp: '2 days ago' 
    },
    { 
      subject: 'New Feature Announcement', 
      audience: 'All Users', 
      timestamp: '1 week ago' 
    }
  ]);
  
  const [announcementForm, setAnnouncementForm] = useState({
    subject: '',
    message: '',
    audience: 'All Users'
  });
  
  const [events, setEvents] = useState({
    pending: [
      {
        id: 1,
        title: 'Alumni Startup Pitch Night',
        submitter: 'Sarah Johnson (Class of 2018)',
        date: 'March 25, 2024 • 6:30 PM',
        location: 'Innovation Hub, Downtown',
        description: 'An evening where alumni entrepreneurs can pitch their startups to fellow alumni and potential investors.'
      },
      {
        id: 2,
        title: 'Photography Workshop',
        submitter: 'Mike Chen (Class of 2015)',
        date: 'April 8, 2024 • 2:00 PM',
        location: 'University Art Building',
        description: 'Learn professional photography techniques from alumni working in the creative industry.'
      }
    ],
    approved: [
      {
        id: 3,
        title: 'Alumni Networking Night',
        date: 'March 15, 2024 • 7:00 PM',
        location: 'Downtown Conference Center',
        registered: 45
      },
      {
        id: 4,
        title: 'Career Fair 2024',
        date: 'April 2, 2024 • 10:00 AM',
        location: 'University Campus',
        registered: 128
      }
    ],
    past: [
      {
        id: 5,
        title: 'Tech Talk: AI in Industry',
        date: 'February 20, 2024',
        attended: 67
      },
      {
        id: 6,
        title: 'Alumni Reunion',
        date: 'January 15, 2024',
        attended: 203
      }
    ]
  });
  
  // Navigation items
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
        </svg>
      ) 
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
        </svg>
      ) 
    },
    { 
      id: 'events', 
      label: 'Event Management', 
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
        </svg>
      ) 
    },
    { 
      id: 'skills', 
      label: 'Skills & Technology', 
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      ) 
    },
    { 
      id: 'reports', 
      label: 'Reports & Analytics', 
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
        </svg>
      ) 
    },
    { 
      id: 'notifications', 
      label: 'Announcements', 
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
        </svg>
      ) 
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
        </svg>
      ) 
    },
    { 
      id: 'logout', 
      label: 'Logout', 
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"></path>
        </svg>
      ), 
      action: () => {
        // Show custom confirmation dialog
        showConfirmDialog(
          "Confirm Logout",
          "Are you sure you want to logout?",
          () => {
            // Clear authentication data from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('profileCompleted');
            
            // Show success notification
            showNotification("Logged out successfully!", 'success', 2000);
            
            // Redirect to login page after notification
            setTimeout(() => navigate('/login'), 2000);
          }
        );
      }
    },
  ];
  
  
  // Quick action buttons
  const quickActions = [
    { 
      label: 'Manage Users', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
        </svg>
      )
    },
    { 
      label: 'Approve Events', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
        </svg>
      )
    },
    { 
      label: 'Send Announcement', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
        </svg>
      )
    },
    { 
      label: 'View Reports', 
      icon: (
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
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
      title: 'New User Registration',
      time: '2 hours ago',
      description: '15 new users registered on the platform today.'
    },
    {
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
        </svg>
      ),
      bgColor: 'bg-blue-100',
      title: 'Event Approval Pending',
      time: '5 hours ago',
      description: '3 new events are waiting for your approval.'
    },
    {
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
        </svg>
      ),
      bgColor: 'bg-indigo-100',
      title: 'System Update',
      time: '1 day ago',
      description: 'Platform was updated to version 2.4.1 with new security features.'
    },
    {
      icon: (
        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
        </svg>
      ),
      bgColor: 'bg-yellow-100',
      title: 'Milestone Reached',
      time: '2 days ago',
      description: 'Platform reached 10,000 active users milestone.'
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
    // Navigate to the appropriate section
    if (label === 'Manage Users') setActiveSection('users');
    else if (label === 'Approve Events') setActiveSection('events');
    else if (label === 'Send Announcement') setActiveSection('notifications');
    else if (label === 'View Reports') setActiveSection('reports');
  };
  
  // Stat cards data - now using real data from state
  const statCards = [
    { 
      title: 'Total Alumni', 
      value: dashboardStats.totalAlumni.toString(), 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      trend: null,
      trendColor: 'text-green-600'
    },
    { 
      title: 'Total Students', 
      value: dashboardStats.totalStudents.toString(), 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
        </svg>
      ),
      trend: null,
      trendColor: 'text-green-600'
    },
    { 
      title: 'Active Jobs', 
      value: dashboardStats.activeJobs.toString(), 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
      ),
      trend: '+8%',
      trendColor: 'text-green-600'
    },
    { 
      title: 'Pending Events', 
      value: dashboardStats.pendingEvents.toString(), 
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
        </svg>
      ),
      trend: dashboardStats.pendingEvents > 0 ? '-2' : '0',
      trendColor: dashboardStats.pendingEvents > 0 ? 'text-red-600' : 'text-gray-600'
    }
  ];
  
  // Rest of the methods remain the same
  const handleAnnouncementChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    
    if (!announcementForm.subject.trim() || !announcementForm.message.trim()) {
      showNotification("Please fill in both subject and message fields.", 'error');
      return;
    }
    
    const newAnnouncement = {
      subject: announcementForm.subject,
      audience: announcementForm.audience,
      timestamp: 'Just now'
    };
    
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    
    // Show success notification
    showNotification("Announcement sent successfully!", 'success');
    
    // Reset form
  };
  
  const handleApproveEvent = (eventId) => {
    const eventToApprove = events.pending.find(event => event.id === eventId);
    if (!eventToApprove) return;
    
    // Move from pending to approved
    setEvents(prev => ({
      ...prev,
      pending: prev.pending.filter(event => event.id !== eventId),
      approved: [...prev.approved, {
        ...eventToApprove,
        registered: 0 // Initialize with 0 registrations
      }]
    }));
    
    showNotification(`Event "${eventToApprove.title}" has been approved!`, 'success');
  };
  
  const handleRejectEvent = (eventId) => {
    const eventToReject = events.pending.find(event => event.id === eventId);
    if (!eventToReject) return;
    
    if (window.confirm(`Are you sure you want to reject "${eventToReject.title}"?`)) {
      setEvents(prev => ({
        ...prev,
        pending: prev.pending.filter(event => event.id !== eventId)
      }));
      
      showNotification(`Event "${eventToReject.title}" has been rejected.`, 'success');
    }
  };
  
  const handleEditEvent = (eventId) => {
    const eventToEdit = events.pending.find(event => event.id === eventId);
    if (!eventToEdit) return;
    
    const newTitle = window.prompt('Edit event title:', eventToEdit.title);
    if (newTitle && newTitle.trim() !== '') {
      setEvents(prev => ({
        ...prev,
        pending: prev.pending.map(event => 
          event.id === eventId 
            ? { ...event, title: newTitle.trim() } 
            : event
        )
      }));
      
      showNotification('Event updated successfully!', 'success');
    }
  };
  
  // Component sections with updated styling to match AlumniConnectDashboard
  const DashboardSection = () => (
    <div className={`content-section p-8 ${fadeAnimation ? 'fade-in' : ''}`}>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Admin Dashboard, {userName}! 👋
        </h1>
        <p className="text-gray-600">
          Monitor and manage all aspects of the Alumni Connect platform.
        </p>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{card.title}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  {card.trend && (
                    <span className={`ml-2 text-sm font-medium ${card.trendColor}`}>
                      {card.trend}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 rounded-xl text-center hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center justify-center"
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
                <div className={`w-12 h-12 ${activity.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
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
      
      {/* System Status Card */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">System Status</h3>
            <p className="opacity-90">All systems operational. Last maintenance: 2 days ago</p>
          </div>
          <div className="flex items-center">
            <span className="bg-green-500 w-3 h-3 rounded-full mr-2 animate-pulse"></span>
            <span className="font-medium">Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  // EventManagementSection with updated styling
  const EventManagementSection = () => (
    <div className={`content-section p-8 ${fadeAnimation ? 'fade-in' : ''}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Management</h1>
        <p className="text-gray-600">Manage all events on the platform</p>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">All Events</h2>
          <button className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
            </svg>
            Create Event
          </button>
        </div>
        
        {/* Pending Approval Events */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Events Pending Approval</h3>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {events.pending.length} pending
            </span>
          </div>
          <div className="space-y-4">
            {events.pending.map(event => (
              <div key={event.id} className="border border-orange-200 bg-orange-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">Submitted by: {event.submitter}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                      </svg>
                      {event.date}
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                      </svg>
                      {event.location}
                    </div>
                    <p className="text-gray-700 text-sm mt-2">{event.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleApproveEvent(event.id)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectEvent(event.id)}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                      </svg>
                      Reject
                    </button>
                    <button 
                      onClick={() => handleEditEvent(event.id)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Approved Upcoming Events</h3>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {events.approved.length} approved
              </span>
            </div>
            <div className="space-y-3">
              {events.approved.map(event => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                    </svg>
                    {event.date}
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                    </svg>
                    {event.location}
                  </div>
                  <div className="flex items-center mt-2">
                    <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                    </svg>
                    <span className="text-blue-600 text-sm font-medium">{event.registered} registered</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Past Events</h3>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {events.past.length} completed
              </span>
            </div>
            <div className="space-y-3">
              {events.past.map(event => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                    </svg>
                    {event.date}
                  </div>
                  <div className="flex items-center mt-2">
                    <svg className="w-4 h-4 mr-1.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-green-600 text-sm font-medium">{event.attended} attended</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Skills & Technology Section
  const [skillsData, setSkillsData] = useState({
    summary: { totalSkills: 0, mostPopularSkill: null, totalUsersWithSkills: 0 },
    skillsList: [],
    top10Skills: []
  });
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState('popularity'); // popularity or name
  
  // Create ref for search input to prevent focus loss
  const searchInputRef = useRef(null);

  // Reports & Analytics
  const [reportsData, setReportsData] = useState({
    summaryCards: { userGrowthPercent: 0, jobApplicationsThisMonth: 0, eventAttendanceRate: 0 },
    registrationTrend: [],
    jobPostingTrend: [],
    platformStats: { dailyActiveUsers: 0, newRegistrations: 0, eventSignups: 0, jobApplications: 0 },
    meta: { generatedAt: '', totalUsers: 0, totalEvents: 0 }
  });
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(null);

  // Security Overview
  const [securityData, setSecurityData] = useState({
    otpVerification: { status: 'Enabled', percentage: 0, totalVerified: 0, totalUsers: 0 },
    passwordSecurity: { status: 'Active', allUsersProtected: true, hashingAlgorithm: 'bcrypt' },
    userRoles: { totalRoles: 0, breakdown: {} },
    verifiedAccounts: { total: 0, percentage: 0, unverified: 0 },
    loginActivity: { lastLogin: null, failedAttempts: 0, recentLogins: 0, uniqueDevices: 0, uniqueIPs: 0 },
    dataProtection: { passwordHashing: 'Enabled', databaseValidation: 'Active', tokenSessionTimeout: '30 mins' },
    securityScore: 0
  });
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securityError, setSecurityError] = useState(null);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Dashboard stats received:', data);
      if (data.stats) {
        setDashboardStats(data.stats);
      }
      setStatsError(null);
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      setStatsError(error.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch events
  const fetchEventsList = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch('/api/admin/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Events received:', data);
      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
    }
  }, []);

  // Initial fetch of dashboard data
  useEffect(() => {
    fetchDashboardStats();
    fetchEventsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Test the API and fetch skills overview
  const testSkillsAPI = useCallback(async () => {
    try {
      console.log('🧪 Testing Skills API endpoint...');
      const testResponse = await fetch('/api/skills/test');
      const testData = await testResponse.json();
      console.log('✅ API Test response:', testData);
      
      // Now fetch the actual skills overview
      fetchSkillsOverview();
    } catch (error) {
      console.error('❌ API test failed:', error);
      setSkillsError('API endpoint not accessible');
    }
  }, []);

  // Fetch skills overview
  useEffect(() => {
    // First test if the endpoint exists
    testSkillsAPI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSkillsOverview = useCallback(async () => {
    try {
      setSkillsLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching skills overview...');
      console.log('Token available:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const fetchUrl = '/api/admin/skills/overview';
      console.log('📡 Fetch URL:', fetchUrl);

      const response = await fetch(fetchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP Error: ${response.status}`;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = response.statusText || errorMessage;
          }
        } else {
          errorMessage = response.statusText || errorMessage;
        }
        
        // If 401, provide helpful message
        if (response.status === 401) {
          errorMessage = 'Authentication required. Please log in as an admin user to access this feature.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Skills data received:', data);
      setSkillsData(data);
      setSkillsError(null);
    } catch (error) {
      console.error('❌ Error fetching skills:', error);
      setSkillsError(error.message);
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  const handleSearchSkills = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch(`/api/skills/search?query=${encodeURIComponent(trimmedQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Search failed: ${response.status}`;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = response.statusText || errorMessage;
          }
        } else {
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching skills:', error);
      showNotification(`Search error: ${error.message}`, 'error');
      setSearchResults([]);
    }
  }, [searchQuery]);

  const getSortedSkillsList = () => {
    const list = searchResults.length > 0 ? searchResults : skillsData.skillsList;
    if (sortBy === 'name') {
      return [...list].sort((a, b) => a.skillName.localeCompare(b.skillName));
    }
    return list; // Already sorted by popularity
  };

  const fetchReportsOverview = useCallback(async () => {
    try {
      setReportsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch('/api/admin/reports/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP Error: ${response.status}`;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setReportsData({
        summaryCards: data.summaryCards || {},
        registrationTrend: data.registrationTrend || [],
        jobPostingTrend: data.jobPostingTrend || [],
        platformStats: data.platformStats || {},
        meta: data.meta || {}
      });
      setReportsError(null);
    } catch (error) {
      console.error('Error fetching reports overview:', error);
      setReportsError(error.message);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportsOverview();
  }, [fetchReportsOverview]);

  // Fetch security overview
  const fetchSecurityOverview = useCallback(async () => {
    try {
      setSecurityLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch('/api/admin/security/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP Error: ${response.status}`;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSecurityData({
        otpVerification: data.otpVerification || {},
        passwordSecurity: data.passwordSecurity || {},
        userRoles: data.userRoles || {},
        verifiedAccounts: data.verifiedAccounts || {},
        loginActivity: data.loginActivity || {},
        dataProtection: data.dataProtection || {},
        securityScore: data.securityScore || 0
      });
      setSecurityError(null);
    } catch (error) {
      console.error('Error fetching security overview:', error);
      setSecurityError(error.message);
    } finally {
      setSecurityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityOverview();
  }, [fetchSecurityOverview]);

  // Reports Section
  
  // Announcements Section
  const AnnouncementsSection = () => (
    <div className={`content-section p-8 ${fadeAnimation ? 'fade-in' : ''}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
        <p className="text-gray-600">Send announcements to platform users</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Announcement</h2>
          <form onSubmit={handleSendAnnouncement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input 
                type="text" 
                name="subject"
                value={announcementForm.subject}
                onChange={handleAnnouncementChange}
                placeholder="Enter announcement subject" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea 
                name="message"
                value={announcementForm.message}
                onChange={handleAnnouncementChange}
                rows="4" 
                placeholder="Enter your announcement message" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
              <select 
                name="audience"
                value={announcementForm.audience}
                onChange={handleAnnouncementChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All Users">All Users</option>
                <option value="Alumni Only">Alumni Only</option>
                <option value="Students Only">Students Only</option>

              </select>
            </div>
            <button type="submit" className="w-full bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
              </svg>
              Send Announcement
            </button>
          </form>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Announcements</h2>
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{announcement.subject}</div>
                    <div className="text-sm text-gray-600 mt-1">Sent to {announcement.audience.toLowerCase()}</div>
                  </div>
                  <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                    {announcement.timestamp}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                    </svg>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Security Section
  const OldSecuritySection = () => (
    <div className={`content-section p-8 ${fadeAnimation ? 'fade-in' : ''}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Security</h1>
        <p className="text-gray-600">Monitor platform security and user permissions</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Login Attempts</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">john.doe@admin.com</div>
                  <div className="text-sm text-gray-600">192.168.1.100 • Chrome on Windows</div>
                </div>
              </div>
              <div className="text-green-600 font-medium flex items-center">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Success
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">unknown@suspicious.com</div>
                  <div className="text-sm text-gray-600">45.123.45.67 • Unknown Browser</div>
                </div>
              </div>
              <div className="text-red-600 font-medium flex items-center">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
                Failed
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">john.doe@admin.com</div>
                  <div className="text-sm text-gray-600">192.168.1.100 • Safari on macOS</div>
                </div>
              </div>
              <div className="text-green-600 font-medium flex items-center">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Success
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Permissions</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Super Admin</div>
                  <div className="text-sm text-gray-600">Full system access</div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                </svg>
                Manage
              </button>
            </div>
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Content Moderator</div>
                  <div className="text-sm text-gray-600">Can moderate posts and users</div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                </svg>
                Manage
              </button>
            </div>
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Event Manager</div>
                  <div className="text-sm text-gray-600">Can create and manage events</div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                </svg>
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Two-Factor Authentication</div>
              <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Login Notifications</div>
              <div className="text-sm text-gray-600">Get notified when someone logs into your account</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Session Timeout</div>
              <div className="text-sm text-gray-600">Automatically log out after 30 minutes of inactivity</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'users':
        return (
          <div className={`content-section p-8 ${fadeAnimation ? 'fade-in' : ''}`}>
            <AdminUserManagement />
          </div>
        );
      case 'events':
        return <EventManagementSection />;
      case 'skills':
        return (
          <SkillsSection
            skillsData={skillsData}
            skillsLoading={skillsLoading}
            skillsError={skillsError}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            sortBy={sortBy}
            setSortBy={setSortBy}
            handleSearchSkills={handleSearchSkills}
            getSortedSkillsList={getSortedSkillsList}
            searchInputRef={searchInputRef}
            fadeAnimation={fadeAnimation}
          />
        );
      case 'reports':
        return (
          <ReportsSection
            reportsData={reportsData}
            reportsLoading={reportsLoading}
            reportsError={reportsError}
            onRefresh={fetchReportsOverview}
            fadeAnimation={fadeAnimation}
          />
        );
      case 'notifications':
        return <AnnouncementsSection />;
      case 'security':
        return (
          <SecuritySection
            securityData={securityData}
            securityLoading={securityLoading}
            securityError={securityError}
            onRefresh={fetchSecurityOverview}
          />
        );
      default:
        return <DashboardSection />;
    }
  };
  
 
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
            <span className="ml-3 text-xl font-bold text-gray-900">Admin Portal</span>
          </div>
          
          {/* Admin Profile Section */}
          <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {userName.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="ml-3">
              <p className="font-semibold text-gray-900">{userName}</p>
              <p className="text-sm text-gray-600">{userRole}</p>
              <p className="text-xs text-blue-600 mt-1">Administrator</p>
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
        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg z-50 animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success' 
              ? 'bg-green-500' 
              : notification.type === 'error' 
              ? 'bg-red-500' 
              : 'bg-blue-500'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
              )}
              {notification.message}
            </div>
          </div>
        )}
        
        {/* Confirmation Dialog Modal */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 transform transition-all">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{confirmDialog.title}</h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-600">{confirmDialog.message}</p>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={confirmDialog.onCancel}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;