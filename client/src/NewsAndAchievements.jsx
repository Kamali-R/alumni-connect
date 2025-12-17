import React, { useState, useEffect } from 'react';
import { newsAPI, achievementsAPI, testAPI, announcementsAPI } from './api';

const NewsAndAchievements = () => {
  // State management
  const [activeTab, setActiveTab] = useState('news');
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // NEW: State for My Achievements
  const [myAchievements, setMyAchievements] = useState([]);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Data states
  const [newsItems, setNewsItems] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Sample news data
    const sampleNews = [
    {
      _id: 1,
      title: "🚀 Annual Tech Fest 2024 Registration Now Open!",
      description: "Get ready for the biggest tech event of the year! Registration for Tech Fest 2024 is now open. Join us for 3 days of innovation, competitions, workshops, and networking opportunities with industry leaders.",
      fullStory: `We are thrilled to announce that the Annual Tech Fest 2024 registration is officially open! This year's theme is "Innovate for Tomorrow" and promises to be bigger and better than ever before.

📅 Event Dates: March 15-17, 2024
🏛️ Venue: Main Campus Auditorium and Tech Park
👥 Expected Participants: 500+ students from across the country

**Event Highlights:**
• AI & Machine Learning Hackathon
• Robotics Competition
• Startup Pitch Competition
• Tech Workshops by Industry Experts
• Career Fair with Top Tech Companies
• Keynote speeches from industry leaders

**Registration Details:**
- Early bird registration: Until February 15, 2024
- Regular registration: February 16 - March 10, 2024
- Team size: 1-4 members per event

Don't miss this opportunity to showcase your skills, learn from experts, and connect with potential employers!`,
      category: "events",
      time: "2 hours ago",
      details: {
        attendees: "500+ Expected",
        date: "March 15-17, 2024",
        venue: "Main Campus Auditorium"
      }
    },
    {
      _id: 2,
      title: "📚 New Digital Library Wing Inauguration",
      description: "The new state-of-the-art library wing with modern study spaces, digital resources, and collaborative areas will be inaugurated next week.",
      fullStory: `We are proud to announce the inauguration of our new Digital Library Wing, a state-of-the-art facility designed to meet the evolving needs of 21st-century learners.

**Grand Inauguration:**
📅 Date: January 25, 2024
⏰ Time: 10:00 AM
👨‍🎓 Chief Guest: Dr. Rajesh Kumar, Vice Chancellor

**New Features Include:**
• AI-powered research assistance system
• Virtual Reality learning zones
• 24/7 digital access to resources
• Collaborative study pods with smart boards
• Silent study zones with noise cancellation
• Digital media production studio

**Resource Expansion:**
- 10,000+ new digital books added
- Access to 50+ international journals
- Online database subscriptions
- E-learning platform integration

The new wing represents our commitment to providing world-class educational infrastructure and fostering a culture of innovation and research.`,
      category: "academic",
      time: "1 day ago",
      details: {
        books: "10,000+ Digital Books",
        feature: "AI Research Assistant",
        capacity: "200 Students"
      }
    },
    {
      _id: 3,
      title: "🤝 Industry Partnership with Tech Giants",
      description: "Exciting news! We've signed new partnerships with Google, Microsoft, and Amazon for internships, placements, and collaborative research projects.",
      fullStory: `We are excited to announce groundbreaking partnerships with three of the world's leading technology companies: Google, Microsoft, and Amazon. These collaborations will open up unprecedented opportunities for our students and faculty.

**Partnership Benefits:**

🎓 **For Students:**
- 200+ internship opportunities annually
- Exclusive placement drives
- Mentorship programs with industry experts
- Project-based learning opportunities
- Certification programs in emerging technologies

🔬 **For Faculty:**
- Collaborative research projects
- Industry-academia knowledge exchange
- Access to cutting-edge technologies
- Joint publication opportunities

**Upcoming Opportunities:**
• Google Summer Internship Program (Application deadline: February 28)
• Microsoft Research Fellowship (Starts: April 2024)
• Amazon Web Services Certification Program (Ongoing)

These partnerships reinforce our commitment to bridging the gap between academia and industry, ensuring our students are industry-ready.`,
      category: "announcements",
      time: "3 days ago",
      details: {
        companies: "3 Major Tech Companies",
        opportunities: "200+ Internships",
        deadline: "April 30, 2024"
      }
    },
    {
      _id: 4,
      title: "🌱 Green Campus Initiative Launch",
      description: "Join our mission towards sustainability! The Green Initiative aims to achieve carbon-neutrality by 2025 through solar panels, waste management systems, and eco-friendly campus infrastructure.",
      fullStory: `We are launching the Green Campus Initiative, a comprehensive sustainability program aimed at making our campus carbon-neutral by 2025. This initiative reflects our commitment to environmental stewardship and sustainable development.

**Key Projects:**

☀️ **Solar Energy Implementation:**
- Installation of 500 kW solar panels across campus buildings
- Target: 40% energy from renewable sources by 2024
- Solar-powered charging stations for electric vehicles

🗑️ **Waste Management:**
- Segregation at source across all campus areas
- Composting organic waste from hostels and canteens
- Recycling program for paper, plastic, and e-waste

🌳 **Green Infrastructure:**
- Vertical gardens on building facades
- Rainwater harvesting systems
- Native species plantation drive
- Pedestrian-friendly campus pathways

**Student Involvement:**
We encourage student participation through the Green Club and various eco-friendly initiatives. Together, we can create a sustainable future!`,
      category: "general",
      time: "5 days ago",
      details: {
        initiative: "Eco-Friendly Campus",
        goal: "Carbon Neutral by 2025",
        projects: "10+ Green Projects"
      }
    },
    {
      _id: 5,
      title: "👥 Alumni Mentorship Program Expansion",
      description: "We're expanding our successful alumni mentorship program! Now including international alumni connections and specialized mentorship tracks for different career paths.",
      fullStory: `Due to overwhelming success, we are expanding our Alumni Mentorship Program to include international alumni and specialized career tracks. This program connects current students with experienced alumni for guidance and career development.

**Program Enhancements:**

🌍 **International Expansion:**
- Connect with alumni in 15+ countries
- Virtual mentorship sessions across time zones
- Global career guidance and opportunities

🎯 **Specialized Tracks:**
- Technology and Software Development
- Business and Entrepreneurship
- Research and Academia
- Creative Arts and Design
- Social Impact and NGOs

**Benefits for Mentees:**
- One-on-one guidance from industry experts
- Career path planning and advice
- Networking opportunities
- Resume building and interview preparation
- Industry insights and trends

**Registration:**
Current students can register through the student portal. Limited spots available!`,
      category: "events",
      time: "1 week ago",
      details: {
        network: "Global Alumni Network",
        mentors: "150+ Industry Experts",
        domains: "Tech, Business, Research"
      }
    }
  ];
  
  // Form state for new achievement
  const [newAchievement, setNewAchievement] = useState({
    title: "",
    description: "",
    achievementDate: "",
    category: "academic"
  });

  // NEW: Form state for editing achievement
  const [editAchievement, setEditAchievement] = useState({
    title: "",
    description: "",
    achievementDate: "",
    category: "academic"
  });

  // Avatar color options
  const avatarColors = [
    "from-blue-500 to-purple-500",
    "from-green-500 to-teal-500",
    "from-purple-500 to-pink-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-blue-500",
    "from-teal-500 to-green-500",
    "from-pink-500 to-rose-500",
    "from-cyan-500 to-blue-500"
  ];
  
  // Category emojis for news
  const newsCategoryEmojis = {
    general: "📢",
    academic: "🎓",
    announcements: "📢",
    events: "📅",
    research: "🔬"
  };

  // Category emojis for achievements
  const achievementCategoryEmojis = {
    academic: "🎓",
    research: "🔬",
    competition: "🏆",
    career: "💼",
    entrepreneurship: "🚀",
    social: "🤝",
    sports: "🏅",
    arts: "🎨",
    innovation: "💡"
  };

  // ✅ ALL FUNCTION DECLARATIONS

  // Get congratulated achievements from localStorage
  const getCongratulatedAchievements = () => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('congratulatedAchievements') || '[]');
    }
    return [];
  };

  // Save congratulated achievements to localStorage
  const saveCongratulatedAchievements = (achievementIds) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('congratulatedAchievements', JSON.stringify(achievementIds));
    }
  };

  // Helper function to get initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return 'PR';
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Enhanced getCurrentPosition function
  const getCurrentPosition = (careerStatus, careerDetails, currentPosition) => {
    if (currentPosition) return currentPosition;
    if (!careerStatus) return 'Alumni';
    
    switch (careerStatus) {
      case 'working':
        return careerDetails?.jobTitle || careerDetails?.position || 'Professional';
      case 'entrepreneur':
        const role = careerDetails?.roleInStartup || careerDetails?.role || 'Entrepreneur';
        const startup = careerDetails?.startupName ? ` at ${careerDetails.startupName}` : '';
        return `${role}${startup}`;
      case 'studies':
        const institution = careerDetails?.institutionName ? ` at ${careerDetails.institutionName}` : '';
        return `Student${institution}`;
      case 'not-working':
        return 'Exploring Opportunities';
      default:
        return 'Alumni';
    }
  };

  // Get fallback profile
  // Get fallback profile based on role
const getFallbackProfile = () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    if (userData.role === 'student') {
      return {
        name: userData.name || "Student User",
        initials: getInitials(userData.name || "Student User"),
        department: "Computer Science",
        graduationYear: "2024",
        currentPosition: "Student",
        role: 'student'
      };
    }
  }
  
  return {
    name: "Alumni User",
    initials: "AU",
    department: "Information Technology",
    graduationYear: "2018",
    currentPosition: "Alumni",
    role: 'alumni'
  };
};
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Enhanced time display function
  const getTimeDisplay = (createdAt, achievementDate) => {
    if (!createdAt) return 'Recently';
    
    const now = new Date();
    const created = new Date(createdAt);
    const diff = now - created;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return formatDate(achievementDate);
  };

  // Get category badge color
  const getNewsCategoryColor = (category) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      academic: 'bg-green-100 text-green-800',
      announcements: 'bg-purple-100 text-purple-800',
      events: 'bg-orange-100 text-orange-800',
      research: 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Sample achievements fallback
  const getSampleAchievements = () => [
    {
      _id: 1,
      userId: "user123",
      userProfile: {
        name: "Sanjay Kumar",
        initials: "SK",
        department: "Computer Science",
        graduationYear: "2018",
        currentPosition: "Senior Tech Lead at Google"
      },
      title: "Promoted to Senior Tech Lead",
      description: "Congratulations to Sanjay for his promotion to Senior Tech Lead at Google Cloud division.",
      category: "career",
      achievementDate: "2024-01-15",
      createdAt: new Date(),
      company: "Google",
      avatarColor: "from-blue-500 to-purple-500",
      congratulations: { count: 5, users: [] },
      userCongratulated: false
    },
    {
      _id: 2,
      userId: "user456",
      userProfile: {
        name: "Priya Reddy",
        initials: "PR",
        department: "Computer Science",
        graduationYear: "2024",
        currentPosition: "Final Year Student"
      },
      title: "Won National Coding Championship",
      description: "Priya secured 1st place in the National Coding Championship 2024.",
      category: "competition",
      achievementDate: "2024-01-10",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      level: "National Level",
      avatarColor: "from-green-500 to-teal-500",
      congratulations: { count: 12, users: [] },
      userCongratulated: false
    }
  ];

  // Load user profile from profile data
 // Load user profile based on role
const loadUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      console.warn('No authentication token or user data found');
      setUserProfile(getFallbackProfile());
      return;
    }

    const userData = JSON.parse(storedUser);
    const userRole = userData.role; // 'student' or 'alumni'
    
    console.log('Current user role:', userRole);

    if (userRole === 'alumni') {
      // Load alumni profile
      const endpoints = [
        'http://localhost:5000/api/alumni/profile',
        'http://localhost:5000/api/user/profile',
        'http://localhost:5000/api/profile',
        'http://localhost:5000/api/auth/profile'
      ];

      let profileData = null;
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Alumni profile response from', endpoint, ':', data);
            
            if (data.success && data.data) {
              profileData = data.data;
            } else if (data.user) {
              profileData = data.user;
            } else if (data.profile) {
              profileData = data.profile;
            } else if (data) {
              profileData = data;
            }
            
            if (profileData) {
              console.log('Alumni profile loaded from:', endpoint, profileData);
              break;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}:`, error);
        }
      }

      if (profileData) {
        const userProfileData = {
          name: profileData.personalInfo?.fullName || 
                profileData.fullName ||
                profileData.name || 
                "Alumni User",
          initials: getInitials(profileData.personalInfo?.fullName || profileData.fullName || profileData.name || "Alumni User"),
          department: profileData.academicInfo?.branch || 
                     profileData.department || 
                     profileData.branch ||
                     profileData.degree ||
                     "Information Technology",
          graduationYear: profileData.academicInfo?.graduationYear || 
                         profileData.graduationYear || 
                         profileData.yearOfPassing ||
                         "2018",
          currentPosition: getCurrentPosition(
            profileData.careerStatus, 
            profileData.careerDetails,
            profileData.currentPosition
          ) || "Alumni",
          role: 'alumni'
        };
        
        console.log('Processed alumni profile:', userProfileData);
        setUserProfile(userProfileData);
        localStorage.setItem('userProfile', JSON.stringify(userProfileData));
        
        if (profileData._id) {
          setCurrentUserId(profileData._id);
        }
      } else {
        console.warn('No alumni profile data found from any endpoint');
        setUserProfile(getFallbackProfile());
      }
    } else if (userRole === 'student') {
      // Load student profile
      try {
        const response = await fetch('http://localhost:5000/api/student/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Student profile response:', data);
          
          let profileData = data.data || data;
          
          const userProfileData = {
            name: profileData.personalInfo?.fullName || 
                  profileData.fullName ||
                  profileData.name || 
                  userData.name ||
                  "Student User",
            initials: getInitials(profileData.personalInfo?.fullName || profileData.fullName || profileData.name || userData.name || "Student User"),
            department: profileData.academicInfo?.branch || 
                       profileData.department || 
                       profileData.branch ||
                       "Computer Science",
            graduationYear: profileData.academicInfo?.graduationYear || 
                           profileData.graduationYear || 
                           "2024",
            currentPosition: "Student",
            role: 'student'
          };
          
          console.log('Processed student profile:', userProfileData);
          setUserProfile(userProfileData);
          localStorage.setItem('userProfile', JSON.stringify(userProfileData));
          
          if (profileData._id || userData._id) {
            setCurrentUserId(profileData._id || userData._id);
          }
        } else {
          console.warn('Student profile not found, using basic user data');
          const userProfileData = {
            name: userData.name || "Student User",
            initials: getInitials(userData.name || "Student User"),
            department: userData.department || "Computer Science",
            graduationYear: userData.graduationYear || "2024",
            currentPosition: "Student",
            role: 'student'
          };
          setUserProfile(userProfileData);
        }
      } catch (error) {
        console.error('Error loading student profile:', error);
        // Use basic user data as fallback
        const userProfileData = {
          name: userData.name || "Student User",
          initials: getInitials(userData.name || "Student User"),
          department: userData.department || "Computer Science",
          graduationYear: userData.graduationYear || "2024",
          currentPosition: "Student",
          role: 'student'
        };
        setUserProfile(userProfileData);
      }
    } else {
      console.warn('Unknown user role:', userRole);
      setUserProfile(getFallbackProfile());
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
    setUserProfile(getFallbackProfile());
  }
};
  // Load achievements from API
  // Load achievements from API - UPDATED
// Load achievements from API - UPDATED
const loadAchievements = async () => {
  try {
    console.log('🔄 Loading achievements from API...');
    
    const response = await achievementsAPI.getAll();
    console.log('✅ Achievements API response status:', response.status);
    
    let achievementsData = [];
    
    if (response.data && response.data.success !== false) {
      achievementsData = response.data.data || response.data || [];
      console.log(`✅ Loaded ${achievementsData.length} achievements from API`);
    } else {
      console.log('ℹ️ API returned error or no data, using sample data');
      achievementsData = getSampleAchievements();
    }
    
    if (achievementsData.length === 0) {
      console.log('ℹ️ No achievements found, using sample data');
      achievementsData = getSampleAchievements();
    }
    
    const congratulated = getCongratulatedAchievements();
    
    // Enhanced achievements with role preservation
    const enhancedAchievements = achievementsData.map(achievement => {
      // Determine role based on userProfile data
      let userRole = 'alumni'; // Default to alumni
      
      if (achievement.userProfile) {
        // If role is already defined, use it
        if (achievement.userProfile.role) {
          userRole = achievement.userProfile.role;
        } 
        // Otherwise, determine role based on profile data
        else if (achievement.userProfile.currentPosition?.toLowerCase().includes('student') || 
                 achievement.userProfile.currentPosition === 'Student') {
          userRole = 'student';
        } else if (achievement.userProfile.graduationYear && 
                  parseInt(achievement.userProfile.graduationYear) > new Date().getFullYear()) {
          userRole = 'student'; // Future graduation year indicates student
        }
      }
      
      return {
        ...achievement,
        userProfile: {
          ...achievement.userProfile,
          role: userRole // Ensure role is included
        },
        congratulations: achievement.congratulations || { count: 0, users: [] },
        userCongratulated: congratulated.includes(achievement._id)
      };
    });
    
    setAchievements(enhancedAchievements);
    return enhancedAchievements;
    
  } catch (error) {
    console.error('❌ Error loading achievements:', error);
    console.log('🔄 Using sample achievements as fallback');
    const sampleData = getSampleAchievements();
    setAchievements(sampleData);
    return sampleData;
  }
};

  // NEW: Load only current user's achievements
  // NEW: Load only current user's achievements
const loadMyAchievements = async () => {
  try {
    if (!currentUserId && !userProfile) return;
    
    console.log('🔄 Loading my achievements for user:', currentUserId);
    const response = await achievementsAPI.getAll();
    const allAchievements = response.data.data || response.data || [];
    
    // Filter achievements created by current user
    const myAchievementsData = allAchievements.filter(achievement => 
      achievement.userId === currentUserId || 
      achievement.userProfile?.name === userProfile?.name
    );
    
    // Enhance with role information
    const enhancedMyAchievements = myAchievementsData.map(achievement => ({
      ...achievement,
      userProfile: {
        ...achievement.userProfile,
        role: userProfile?.role || 'alumni' // Use current user's role
      }
    }));
    
    console.log(`✅ Found ${enhancedMyAchievements.length} achievements by current user`);
    setMyAchievements(enhancedMyAchievements);
    
  } catch (error) {
    console.error('❌ Error loading my achievements:', error);
    // Use sample data as fallback
    const sampleMyAchievements = getSampleAchievements().filter(achievement => 
      achievement.userProfile?.name === userProfile?.name
    );
    setMyAchievements(sampleMyAchievements);
  }
};

  const loadNews = async () => {
    try {
      setNewsItems(sampleNews);
    } catch (error) {
      console.error('Error loading news:', error);
      setNewsItems(sampleNews);
    }
  };

  // Load announcements based on user type
  const loadAnnouncements = async () => {
    try {
      console.log('🔄 Loading announcements...');
      
      // Get user role from localStorage
      const storedUser = localStorage.getItem('user');
      const userData = storedUser ? JSON.parse(storedUser) : {};
      const userRole = userData.role || 'alumni';
      
      let response;
      if (userRole === 'student') {
        response = await announcementsAPI.getStudentAnnouncements();
      } else if (userRole === 'alumni') {
        response = await announcementsAPI.getAlumniAnnouncements();
      } else {
        response = await announcementsAPI.getAll();
      }
      
      console.log('✅ Announcements loaded:', response.data);
      const announcementList = response.data.data || response.data || [];
      setAnnouncements(announcementList);
      return announcementList;
    } catch (error) {
      console.error('❌ Error loading announcements:', error);
      setAnnouncements([]);
      return [];
    }
  };

  // ✅ SINGLE loadData FUNCTION
 // ✅ UPDATED: Better error handling for data loading
const loadData = async () => {
  setLoading(true);
  setError(null);
  try {
    console.log('🔄 Starting data load...');
    
    // Load all achievements
    let loadedAchievements = [];
    try {
      console.log('📥 Loading all achievements...');
      loadedAchievements = await loadAchievements();
      console.log('✅ All achievements loaded:', loadedAchievements.length);
    } catch (achievementError) {
      console.warn('❌ Using sample achievements due to server error');
      loadedAchievements = getSampleAchievements();
      setAchievements(loadedAchievements);
    }

    // Load my achievements if user profile exists
    if (userProfile) {
      console.log('👤 User profile exists, loading my achievements...');
      await loadMyAchievements();
    } else {
      console.log('⏳ No user profile yet, will load my achievements later');
    }
    
    // Always use sample news for now
    setNewsItems(sampleNews);
    
    // Load announcements
    try {
      console.log('📥 Loading announcements...');
      await loadAnnouncements();
      console.log('✅ Announcements loaded');
    } catch (announcementError) {
      console.warn('⚠️ Failed to load announcements:', announcementError);
      setAnnouncements([]);
    }
    
    console.log('🎉 Data load completed successfully');
    
  } catch (error) {
    console.error('❌ Error loading data:', error);
    setError('Failed to load data. Using sample data instead.');
    setNewsItems(sampleNews);
    setAchievements(getSampleAchievements());
  } finally {
    setLoading(false);
  }
};

  // Check backend health
  const checkBackendHealth = async () => {
    try {
      console.log('🏥 Checking backend health...');
      const healthResponse = await testAPI.health();
      console.log('✅ Backend health check:', healthResponse.data);
      
      const testResponse = await testAPI.test();
      console.log('✅ Backend test endpoint:', testResponse.data);
      
      return true;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return false;
    }
  };

  const testBackendConnection = async () => {
    try {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        setError('Backend server is not responding. Using sample data.');
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      setError('Unable to connect to server. Using sample data instead.');
    }
  };

  // Enhanced handleCongratulate function
  const handleCongratulate = async (achievementId) => {
    try {
      const userIdentifier = userProfile?.name || 'anonymous-user';
      const congratulatedKey = `congratulated-${userIdentifier}`;
      
      const congratulated = JSON.parse(localStorage.getItem(congratulatedKey) || '[]');
      
      if (congratulated.includes(achievementId)) {
        setError('You have already congratulated this achievement! 👏');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const response = await achievementsAPI.congratulate(achievementId);
      
      if (response.data.success) {
        const updatedCongratulated = [...congratulated, achievementId];
        localStorage.setItem(congratulatedKey, JSON.stringify(updatedCongratulated));
        
        setAchievements(prevAchievements => 
          prevAchievements.map(achievement => 
            achievement._id === achievementId 
              ? {
                  ...achievement,
                  congratulations: {
                    count: (achievement.congratulations?.count || 0) + 1,
                    users: [...(achievement.congratulations?.users || []), { userId: userIdentifier }]
                  },
                  userCongratulated: true
                }
              : achievement
          )
        );
        
        setSuccessMessage('Congratulations sent! 👏');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
      }
    } catch (error) {
      console.error('Error congratulating achievement:', error);
      
      if (error.response?.status === 400) {
        setError('You have already congratulated this achievement!');
        setTimeout(() => setError(null), 3000);
      } else {
        setError('Failed to send congratulations. Please try again.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  // NEW: Handle edit achievement
  const handleEditAchievement = (achievement) => {
    setEditingAchievement(achievement);
    setEditAchievement({
      title: achievement.title,
      description: achievement.description,
      achievementDate: achievement.achievementDate.split('T')[0],
      category: achievement.category
    });
    setShowEditModal(true);
  };

  // NEW: Handle update achievement
  const handleUpdateAchievement = async (e) => {
    e.preventDefault();
    
    try {
      console.log('🔄 Updating achievement:', editingAchievement._id);
      
      const response = await achievementsAPI.update(editingAchievement._id, editAchievement);
      
      if (response.data.success) {
        // Update in all achievements
        setAchievements(prev => 
          prev.map(achievement => 
            achievement._id === editingAchievement._id 
              ? { ...achievement, ...editAchievement }
              : achievement
          )
        );
        
        // Update in my achievements
        setMyAchievements(prev => 
          prev.map(achievement => 
            achievement._id === editingAchievement._id 
              ? { ...achievement, ...editAchievement }
              : achievement
          )
        );
        
        setShowEditModal(false);
        setEditingAchievement(null);
        setSuccessMessage("✅ Achievement updated successfully!");
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('❌ Error updating achievement:', error);
      setError('Failed to update achievement. Please try again.');
    }
  };

  // NEW: Handle delete achievement
  const handleDeleteAchievement = async (achievementId) => {
    if (!window.confirm('Are you sure you want to delete this achievement? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('🗑️ Deleting achievement:', achievementId);
      
      const response = await achievementsAPI.delete(achievementId);
      
      if (response.data.success) {
        // Remove from all achievements
        setAchievements(prev => 
          prev.filter(achievement => achievement._id !== achievementId)
        );
        
        // Remove from my achievements
        setMyAchievements(prev => 
          prev.filter(achievement => achievement._id !== achievementId)
        );
        
        setSuccessMessage("🗑️ Achievement deleted successfully!");
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('❌ Error deleting achievement:', error);
      setError('Failed to delete achievement. Please try again.');
    }
  };

  // NEW: Close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAchievement(null);
    setEditAchievement({
      title: "",
      description: "",
      achievementDate: "",
      category: "academic"
    });
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    
    // Load my achievements when switching to that tab
    if (tab === 'my-achievements' && userProfile) {
      loadMyAchievements();
    }
  };
  
  // Handle read full story button click
  const handleReadFullStory = (news) => {
    setSelectedNews(news);
    setShowNewsModal(true);
  };
  
  // Handle close news modal
  const handleCloseNewsModal = () => {
    setShowNewsModal(false);
    setSelectedNews(null);
  };

  // Handle announcement modal
  const handleOpenAnnouncementModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
  };

  const handleCloseAnnouncementModal = () => {
    setShowAnnouncementModal(false);
    setSelectedAnnouncement(null);
  };
  
  // Handle opening achievement modal
// Handle opening achievement modal
const handleOpenAchievementModal = () => {
  console.log('🎯 Share Achievement button clicked');
  console.log('📊 User Profile:', userProfile);
  
  if (!userProfile) {
    setError('Please complete your profile first to share achievements.');
    setTimeout(() => setError(null), 3000);
    return;
  }
  
  // Additional check for student profile completion
  if (userProfile.role === 'student' && userProfile.name === 'Student User') {
    setError('Please complete your student profile first to share achievements.');
    setTimeout(() => setError(null), 3000);
    return;
  }
  
  console.log('✅ Opening achievement modal');
  setShowAchievementModal(true);
};
  // Handle closing achievement modal
  const handleCloseAchievementModal = () => {
    setShowAchievementModal(false);
    setNewAchievement({
      title: "",
      description: "",
      achievementDate: "",
      category: "academic"
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAchievement({
      ...newAchievement,
      [name]: value
    });
  };

  // NEW: Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditAchievement({
      ...editAchievement,
      [name]: value
    });
  };
  
  // Handle form submission
  // Handle form submission
const handleSubmitAchievement = async (e) => {
  e.preventDefault();
  
  try {
    // Get current user role from localStorage
    const storedUser = localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : {};
    const userRole = userData.role || 'alumni'; // Default to alumni if not found

    const achievementData = {
      ...newAchievement,
      userProfile: {
        ...userProfile,
        role: userRole // Add role to userProfile
      }
    };

    const response = await achievementsAPI.create(achievementData);
    
    if (response.data.success) {
      const newAchievementWithCongrats = {
        ...response.data.data,
        congratulations: { count: 0, users: [] },
        userCongratulated: false,
        userProfile: {
          ...response.data.data.userProfile,
          role: userRole // Ensure role is included
        }
      };
      
      // Add to all achievements
      setAchievements([newAchievementWithCongrats, ...achievements]);
      
      // Add to my achievements
      setMyAchievements([newAchievementWithCongrats, ...myAchievements]);
      
      handleCloseAchievementModal();
      setSuccessMessage("🎉 Achievement added successfully! 🏆");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  } catch (error) {
    console.error('Error adding achievement:', error);
    setError('Failed to add achievement. Please try again.');
  }
};

  // ✅ USE EFFECT HOOKS
  useEffect(() => {
    testBackendConnection();
    loadUserProfile();
    loadData();
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'news') {
      loadNews();
    } else if (activeTab === 'achievements') {
      loadAchievements();
    } else if (activeTab === 'my-achievements' && userProfile) {
      loadMyAchievements();
    } else if (activeTab === 'announcements') {
      loadAnnouncements();
    }
  }, [activeTab, userProfile]);

  // ... (keep the rest of your JSX return statement exactly as you had it with the My Achievements tab)
  // The JSX part remains the same as in the previous response

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Error Message */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md text-center">
          ⚠️ {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          {successMessage}
        </div>
      )}
      
      {/* Navigation Tabs - UPDATED */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex space-x-1">
              <button 
                onClick={() => handleTabChange('news')}
                className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'news' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📰 Campus News
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'news' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {newsItems.length}
                </span>
              </button>
              <button 
                onClick={() => handleTabChange('achievements')}
                className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'achievements' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🏆 All Achievements
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'achievements' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {achievements.length}
                </span>
              </button>
              {/* NEW: My Achievements Tab */}
              <button 
                onClick={() => handleTabChange('my-achievements')}
                className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'my-achievements' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📋 My Achievements
              </button>
              {/* NEW: Campus Announcements Tab */}
              <button 
                onClick={() => handleTabChange('announcements')}
                className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'announcements' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📢 Campus Announcements
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'announcements' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {announcements.length}
                </span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {(activeTab === 'achievements' || activeTab === 'my-achievements') && (
                <button 
                  onClick={handleOpenAchievementModal}
                  className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center text-sm shadow-lg"
                >
                  🏆 Share Achievement
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Notice for News */}
      {activeTab === 'news' && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <span className="text-blue-500 text-lg mr-2">ℹ️</span>
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> News updates are managed by campus administration. 
                To share updates, please contact the admin office.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* News Section */}
        {activeTab === 'news' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {newsItems.map((news) => (
              <div key={news._id} className="news-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${getNewsCategoryColor(news.category)}`}>
                      {newsCategoryEmojis[news.category]} {news.category.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{news.time}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">{news.title}</h3>
                  
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                    {news.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {news.details && Object.entries(news.details).map(([key, value]) => (
                      <div key={key} className="flex items-center text-xs text-gray-500">
                        <span className="mr-2">
                          {key === 'attendees' && '👥'}
                          {key === 'date' && '📅'}
                          {key === 'venue' && '🏛️'}
                          {key === 'books' && '📚'}
                          {key === 'feature' && '💡'}
                          {key === 'capacity' && '👥'}
                          {key === 'companies' && '🏢'}
                          {key === 'opportunities' && '💼'}
                          {key === 'deadline' && '⏰'}
                          {key === 'initiative' && '🌱'}
                          {key === 'goal' && '🎯'}
                          {key === 'projects' && '📋'}
                          {key === 'network' && '🌍'}
                          {key === 'mentors' && '👨‍🏫'}
                          {key === 'domains' && '📊'}
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => handleReadFullStory(news)}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    Read Full Story →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
{/* All Achievements Section */}
{activeTab === 'achievements' && (
  <div>
    {loading ? (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading achievements...</div>
        </div>
      </div>
    ) : achievements.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-bold text-gray-600 mb-2">No Achievements Found</h3>
        <p className="text-gray-500 mb-4">Be the first to share your achievement!</p>
        <button 
          onClick={handleOpenAchievementModal}
          className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-colors"
        >
          Share Your Achievement
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => (
          <div key={achievement._id} className="achievement-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                {/* UPDATED BADGE SECTION */}
                <div className={`bg-gradient-to-r ${
                  achievement.userProfile?.role === 'student' 
                    ? 'from-green-600 to-green-800' 
                    : 'from-blue-600 to-blue-800'
                } text-white px-3 py-1 rounded-full text-xs font-medium`}>
                  {achievement.userProfile?.role === 'student' ? '🎓 Student' : '👨‍🎓 Alumni'}
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {getTimeDisplay(achievement.createdAt, achievement.achievementDate)}
                </span>
              </div>
              
              {/* UPDATED User profile display */}
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${
                  achievement.userProfile?.role === 'student' 
                    ? 'from-green-500 to-teal-500' 
                    : (achievement.avatarColor || 'from-blue-500 to-purple-500')
                } rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {achievement.userProfile?.initials || "UN"}
                </div>
                <div className="ml-3">
                  <h4 className="font-bold text-gray-900 text-sm">
                    {achievement.userProfile?.name || (achievement.userProfile?.role === 'student' ? "Student" : "Alumni")}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Class of {achievement.userProfile?.graduationYear || '2020'} • {achievement.userProfile?.currentPosition || (achievement.userProfile?.role === 'student' ? 'Student' : 'Alumni')}
                  </p>
                  {achievement.userProfile?.role && (
                    <p className="text-xs text-blue-600 mt-1">
                      {achievement.userProfile.role === 'student' ? '🎓 Current Student' : '👨‍🎓 Alumni'}
                    </p>
                  )}
                </div>
              </div>
              
              <h3 className="text-md font-bold text-gray-900 mb-2 leading-tight">
                {achievementCategoryEmojis[achievement.category] || '🏆'} {achievement.title}
              </h3>
              
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">
                {achievement.description}
              </p>

              {/* Achievement Date Display */}
              <div className="mb-4">
                <div className="flex items-center text-xs text-gray-500">
                  <span className="mr-2">📅</span>
                  <span className="font-medium">
                    Achieved on: {formatDate(achievement.achievementDate)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  {achievement.company && (
                    <span className="bg-blue-50 px-2 py-1 rounded">💼 {achievement.company}</span>
                  )}
                  {achievement.level && (
                    <span className="bg-green-50 px-2 py-1 rounded">🏆 {achievement.level}</span>
                  )}
                  {achievement.publication && (
                    <span className="bg-purple-50 px-2 py-1 rounded">📚 {achievement.publication}</span>
                  )}
                  
                  {/* Congratulations Count */}
                  <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded flex items-center">
                    👏 {achievement.congratulations?.count || 0}
                  </span>
                </div>
                
                <button 
                  onClick={() => handleCongratulate(achievement._id)}
                  disabled={achievement.userCongratulated}
                  className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                    achievement.userCongratulated
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md'
                  }`}
                >
                  {achievement.userCongratulated 
                    ? 'Congratulated 👏' 
                    : 'Congratulate 👏'
                  }
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
{/* NEW: My Achievements Section */}
{/* NEW: My Achievements Section */}
{activeTab === 'my-achievements' && (
  <div>
    {/* Header Section */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Achievements</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your shared achievements
          </p>
        </div>
      </div>
    </div>

    {myAchievements.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-bold text-gray-600 mb-2">No Achievements Yet</h3>
        <p className="text-gray-500 mb-4">We couldn't find any achievements linked to your account.</p>
        <div className="space-y-3">
          <button 
            onClick={handleOpenAchievementModal}
            className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-colors block mx-auto"
          >
            🏆 Share Your First Achievement
          </button>
          <button 
            onClick={() => {
              // Create a test achievement for the user
              const testAchievement = {
                _id: 'test-' + Date.now(),
                userId: currentUserId,
                userProfile: userProfile,
                title: "Test Achievement",
                description: "This is a test achievement to verify the functionality.",
                category: "academic",
                achievementDate: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                avatarColor: "from-blue-500 to-purple-500",
                congratulations: { count: 0, users: [] },
                userCongratulated: false
              };
              setMyAchievements([testAchievement]);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Create Test Achievement
          </button>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myAchievements.map((achievement) => (
          <div key={achievement._id} className="achievement-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
            {/* UPDATED Edit/Delete Actions */}
            {/* Edit/Delete Actions */}
<div className="flex justify-between items-start mb-4 p-6 pb-0">
  <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-3 py-1 rounded-full text-xs font-medium">
    👑 My Achievement
  </div>
  <div className="flex space-x-2">
    <button 
      onClick={() => handleEditAchievement(achievement)}
      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors shadow-md flex items-center"
    >
      <span className="mr-1">✏️</span>
      Edit
    </button>
    <button 
      onClick={() => handleDeleteAchievement(achievement._id)}
      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors shadow-md flex items-center"
    >
      <span className="mr-1">🗑️</span>
      Delete
    </button>
  </div>
</div>
            
            <div className="p-6 pt-4">
              {/* UPDATED User profile display */}
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${
                  achievement.userProfile?.role === 'student' 
                    ? 'from-green-500 to-teal-500' 
                    : (achievement.avatarColor || 'from-blue-500 to-purple-500')
                } rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {achievement.userProfile?.initials || "UN"}
                </div>
                <div className="ml-3">
                  <h4 className="font-bold text-gray-900 text-sm">
                    {achievement.userProfile?.name || (achievement.userProfile?.role === 'student' ? "Student" : "Alumni")}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Class of {achievement.userProfile?.graduationYear || '2020'} • {achievement.userProfile?.currentPosition || (achievement.userProfile?.role === 'student' ? 'Student' : 'Alumni')}
                  </p>
                  {achievement.userProfile?.role && (
                    <p className="text-xs text-blue-600 mt-1">
                      {achievement.userProfile.role === 'student' ? '🎓 Current Student' : '👨‍🎓 Alumni'}
                    </p>
                  )}
                </div>
              </div>
              
              <h3 className="text-md font-bold text-gray-900 mb-2 leading-tight">
                {achievementCategoryEmojis[achievement.category] || '🏆'} {achievement.title}
              </h3>
              
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">
                {achievement.description}
              </p>

              {/* Achievement Date Display */}
              <div className="mb-4">
                <div className="flex items-center text-xs text-gray-500">
                  <span className="mr-2">📅</span>
                  <span className="font-medium">Achieved on: {formatDate(achievement.achievementDate)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  {achievement.company && <span className="bg-blue-50 px-2 py-1 rounded">💼 {achievement.company}</span>}
                  {achievement.level && <span className="bg-green-50 px-2 py-1 rounded">🏆 {achievement.level}</span>}
                  
                  {/* Congratulations Count */}
                  <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded flex items-center">
                    👏 {achievement.congratulations?.count || 0}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500">
                  {achievement.updatedAt && achievement.updatedAt !== achievement.createdAt ? 'Edited' : 'Created'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
{/* NEW: Campus Announcements Section */}
{activeTab === 'announcements' && (
  <div>
    {announcements.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">📢</div>
        <h3 className="text-xl font-bold text-gray-600 mb-2">No Announcements</h3>
        <p className="text-gray-500">No announcements available at this time. Check back later!</p>
      </div>
    ) : (
      <div className="space-y-4">
        {announcements.map((announcement) => {
          // Truncate message to 2 lines
          const lines = (announcement.message || '').split('\n');
          const truncatedMessage = lines.slice(0, 2).join('\n');
          const isFullMessageShown = truncatedMessage === announcement.message;
          
          return (
            <div key={announcement._id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${
                    announcement.category === 'Announcements' ? 'from-purple-500 to-pink-500' :
                    announcement.category === 'Academic' ? 'from-blue-500 to-cyan-500' :
                    announcement.category === 'Events' ? 'from-green-500 to-emerald-500' :
                    'from-yellow-500 to-orange-500'
                  } rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                    {announcement.category === 'Announcements' && '📢'}
                    {announcement.category === 'Academic' && '📚'}
                    {announcement.category === 'Events' && '🎉'}
                    {announcement.category === 'General' && '💡'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{announcement.subject}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        announcement.category === 'Announcements' ? 'bg-purple-100 text-purple-700' :
                        announcement.category === 'Academic' ? 'bg-blue-100 text-blue-700' :
                        announcement.category === 'Events' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {announcement.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  announcement.audience === 'All Users' ? 'bg-blue-100 text-blue-700' :
                  announcement.audience === 'Students Only' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {announcement.audience === 'All Users' && '👥 All'}
                  {announcement.audience === 'Students Only' && '🎓 Students'}
                  {announcement.audience === 'Alumni Only' && '👨‍🎓 Alumni'}
                </span>
              </div>
              
              <p className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">
                {truncatedMessage}
              </p>
              
              {!isFullMessageShown && (
                <button 
                  onClick={() => handleOpenAnnouncementModal(announcement)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Read Full Announcement →
                </button>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
      </main>

      {/* Edit Achievement Modal */}
      {showEditModal && editingAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm" onClick={handleCloseEditModal}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative z-10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">✏️ Edit Achievement</h3>
                <button onClick={handleCloseEditModal} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              
              <form onSubmit={handleUpdateAchievement}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Title *</label>
                    <input 
                      type="text" 
                      name="title"
                      value={editAchievement.title}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Won National Coding Championship"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Description *</label>
                    <textarea 
                      name="description"
                      value={editAchievement.description}
                      onChange={handleEditInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Describe your achievement in detail..."
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">When did you achieve this? *</label>
                    <input 
                      type="date" 
                      name="achievementDate"
                      value={editAchievement.achievementDate}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select 
                      name="category"
                      value={editAchievement.category}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="academic">🎓 Academic Excellence</option>
                      <option value="research">🔬 Research & Innovation</option>
                      <option value="competition">🏆 Competition Winner</option>
                      <option value="career">💼 Career Milestone</option>
                      <option value="entrepreneurship">🚀 Entrepreneurship</option>
                      <option value="social">🤝 Social Impact</option>
                      <option value="sports">🏅 Sports & Athletics</option>
                      <option value="arts">🎨 Arts & Culture</option>
                      <option value="innovation">💡 Innovation</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-6">
                  <button 
                    type="button" 
                    onClick={handleCloseEditModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                  >
                    Update Achievement
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Achievement Modal */}
{showAchievementModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div 
      className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm" 
      onClick={handleCloseAchievementModal}
    ></div>
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative z-10">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">🏆 Share Your Achievement</h3>
          <button 
            onClick={handleCloseAchievementModal} 
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            ×
          </button>
        </div>
        
        {/* User Profile Info Display */}
        {userProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Your Profile Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Name:</span>
                <p className="text-blue-800">{userProfile.name}</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Initials:</span>
                <p className="text-blue-800">{userProfile.initials}</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Department:</span>
                <p className="text-blue-800">{userProfile.department}</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Graduation Year:</span>
                <p className="text-blue-800">{userProfile.graduationYear}</p>
              </div>
              <div className="col-span-2">
                <span className="text-blue-600 font-medium">Current Position:</span>
                <p className="text-blue-800">{userProfile.currentPosition}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmitAchievement}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Title *
              </label>
              <input 
                type="text" 
                name="title"
                value={newAchievement.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Won National Coding Championship"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Description *
              </label>
              <textarea 
                name="description"
                value={newAchievement.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                placeholder="Describe your achievement in detail..."
                required
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When did you achieve this? *
              </label>
              <input 
                type="date" 
                name="achievementDate"
                value={newAchievement.achievementDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select 
                name="category"
                value={newAchievement.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="academic">🎓 Academic Excellence</option>
                <option value="research">🔬 Research & Innovation</option>
                <option value="competition">🏆 Competition Winner</option>
                <option value="career">💼 Career Milestone</option>
                <option value="entrepreneurship">🚀 Entrepreneurship</option>
                <option value="social">🤝 Social Impact</option>
                <option value="sports">🏅 Sports & Athletics</option>
                <option value="arts">🎨 Arts & Culture</option>
                <option value="innovation">💡 Innovation</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-6">
            <button 
              type="button" 
              onClick={handleCloseAchievementModal}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Share Achievement
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

      {/* Announcement Full Message Modal */}
      {showAnnouncementModal && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm" 
            onClick={handleCloseAnnouncementModal}
          ></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedAnnouncement.subject || 'Announcement'}</h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{new Date(selectedAnnouncement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      selectedAnnouncement.category === 'Academic' ? 'bg-blue-100 text-blue-700' :
                      selectedAnnouncement.category === 'Events' ? 'bg-purple-100 text-purple-700' :
                      selectedAnnouncement.category === 'General' ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {selectedAnnouncement.category || 'Announcements'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      selectedAnnouncement.audience === 'All Users' ? 'bg-blue-100 text-blue-700' :
                      selectedAnnouncement.audience === 'Students Only' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {selectedAnnouncement.audience === 'All Users' && '👥 All'}
                      {selectedAnnouncement.audience === 'Students Only' && '🎓 Students'}
                      {selectedAnnouncement.audience === 'Alumni Only' && '👨‍🎓 Alumni'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handleCloseAnnouncementModal} 
                  className="text-gray-400 hover:text-gray-600 text-3xl transition-colors"
                  aria-label="Close announcement"
                >
                  ×
                </button>
              </div>

              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 border border-gray-100 rounded-lg p-4">
                {selectedAnnouncement.message || ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Full Story Modal */}
      {showNewsModal && selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm" 
            onClick={handleCloseNewsModal}
          ></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative z-10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{selectedNews.title}</h3>
                <button 
                  onClick={handleCloseNewsModal} 
                  className="text-gray-400 hover:text-gray-600 text-3xl transition-colors"
                >
                  ×
                </button>
              </div>
              
              {/* News Details */}
              <div className="mb-6 flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center">
                  <span className="mr-2">📅</span>
                  {selectedNews.time}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedNews.category === 'events' ? 'bg-purple-100 text-purple-700' :
                  selectedNews.category === 'academic' ? 'bg-blue-100 text-blue-700' :
                  selectedNews.category === 'placement' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedNews.category}
                </span>
              </div>
              
              {/* Full Story Content */}
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {selectedNews.fullStory}
                </div>
              </div>
              
              {/* Details Section */}
              {selectedNews.details && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Event Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(selectedNews.details).map(([key, value]) => (
                      <div key={key} className="flex items-start">
                        <span className="text-2xl mr-2">
                          {key === 'attendees' && '👥'}
                          {key === 'date' && '📅'}
                          {key === 'venue' && '📍'}
                          {key === 'books' && '📚'}
                          {key === 'feature' && '✨'}
                          {key === 'capacity' && '👥'}
                          {key === 'companies' && '🏢'}
                          {key === 'placements' && '📊'}
                          {key === 'package' && '💰'}
                          {key === 'awards' && '🏆'}
                          {key === 'participants' && '👥'}
                          {key === 'winners' && '🥇'}
                        </span>
                        <div>
                          <div className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div className="font-medium text-gray-900">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleCloseNewsModal}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .news-card, .achievement-card { 
          transition: all 0.3s ease; 
          animation: slideIn 0.5s ease-out;
        }
        .news-card:hover, .achievement-card:hover { 
          transform: translateY(-2px); 
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .modal-backdrop {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default NewsAndAchievements;