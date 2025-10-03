import React, { useState, useEffect } from 'react';
import { newsAPI, achievementsAPI, testAPI } from './api';

const NewsAndAchievements = () => {
  // State management
  const [activeTab, setActiveTab] = useState('news');
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [newsItems, setNewsItems] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  // Sample news data (since only admins can post news)
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

  // Add this function to fetch user profile from backend
  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No authentication token found');
        setUserProfile(getFallbackProfile());
        return;
      }

      const response = await fetch('http://localhost:5000/api/alumni/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          const profile = data.data;
          
          // Extract user profile data from the backend response
          const userProfileData = {
            name: profile.personalInfo?.fullName || "Alumni User",
            initials: getInitials(profile.personalInfo?.fullName),
            department: profile.academicInfo?.branch || "Not Specified",
            graduationYear: profile.academicInfo?.graduationYear || "Not Specified",
            currentPosition: getCurrentPosition(profile.careerStatus, profile.careerDetails)
          };
          
          setUserProfile(userProfileData);
          
          // Also save to localStorage for quick access
          localStorage.setItem('userProfile', JSON.stringify(userProfileData));
          
        } else {
          console.warn('No profile data found in response');
          setUserProfile(getFallbackProfile());
        }
      } else {
        console.warn('Failed to fetch profile from backend');
        setUserProfile(getFallbackProfile());
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(getFallbackProfile());
    }
  };

  // Helper function to get initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return 'AU';
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get current position based on career status
  const getCurrentPosition = (careerStatus, careerDetails) => {
    if (!careerStatus) return 'Alumni';
    
    switch (careerStatus) {
      case 'working':
        return careerDetails?.jobTitle || 'Professional';
      case 'entrepreneur':
        const role = careerDetails?.roleInStartup || 'Entrepreneur';
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

  // Fallback profile data
  const getFallbackProfile = () => {
    // Check if we have any cached data in localStorage
    const cachedProfile = localStorage.getItem('userProfile');
    if (cachedProfile) {
      return JSON.parse(cachedProfile);
    }
    
    return {
      name: "Alumni User",
      initials: "AU",
      department: "Please complete your profile",
      graduationYear: "YYYY",
      currentPosition: "Update your career status"
    };
  };

  // Test backend connection on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await testBackendConnection();
        await loadUserProfile(); // Load user profile first
        await loadData();
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load data. Using sample data instead.');
        setNewsItems(sampleNews);
        setAchievements(getSampleAchievements());
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'news') {
      loadNews();
    } else {
      loadAchievements();
    }
  }, [activeTab]);

  const testBackendConnection = async () => {
    try {
      const response = await testAPI.test();
      console.log('✅ Backend connection successful:', response.data);
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      setError('Unable to connect to server. Using sample data instead.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadAchievements();
      setNewsItems(sampleNews);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load achievements. Using sample data instead.');
      setNewsItems(sampleNews);
      setAchievements(getSampleAchievements());
    } finally {
      setLoading(false);
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

  const loadAchievements = async () => {
    try {
      const response = await achievementsAPI.getAll();
      const congratulated = getCongratulatedAchievements();
      
      // Enhance achievements with congratulation data
      const enhancedAchievements = (response.data.data || []).map(achievement => ({
        ...achievement,
        // Ensure congratulations object exists
        congratulations: achievement.congratulations || { count: 0, users: [] },
        // Check if current user has congratulated
        userCongratulated: congratulated.includes(achievement._id)
      }));
      
      setAchievements(enhancedAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
      throw error;
    }
  };
  
  // Sample achievements fallback
  const getSampleAchievements = () => [
    {
      _id: 1,
      userProfile: {
        name: "Sanjay Kumar",
        initials: "SK",
        department: "Computer Science",
        graduationYear: "2018",
        currentPosition: "Senior Tech Lead at Google"
      },
      title: "Promoted to Senior Tech Lead",
      description: "Congratulations to Sanjay for his promotion to Senior Tech Lead at Google Cloud division, leading a team of 15 engineers on AI infrastructure projects.",
      category: "career",
      achievementDate: "2024-01-15",
      time: "Today",
      company: "Google",
      avatarColor: "from-blue-500 to-purple-500",
      congratulations: { count: 5, users: [] },
      userCongratulated: false
    },
    {
      _id: 2,
      userProfile: {
        name: "Priya Reddy",
        initials: "PR",
        department: "Computer Science",
        graduationYear: "2024",
        currentPosition: "Final Year Student"
      },
      title: "Won National Coding Championship",
      description: "Priya secured 1st place in the National Coding Championship 2024, competing against 5000+ participants from across the country.",
      category: "competition",
      achievementDate: "2024-01-10",
      time: "2 days ago",
      level: "National Level",
      avatarColor: "from-green-500 to-teal-500",
      congratulations: { count: 12, users: [] },
      userCongratulated: false
    }
  ];

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
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
  
  // Handle congratulate button click - UPDATED with persistence
  const handleCongratulate = async (achievementId) => {
    try {
      const congratulated = getCongratulatedAchievements();
      
      // Check if already congratulated
      if (congratulated.includes(achievementId)) {
        setError('You have already congratulated this achievement!');
        return;
      }

      // Update backend first
      const response = await achievementsAPI.congratulate(achievementId);
      
      if (response.data.success) {
        // Update localStorage
        const updatedCongratulated = [...congratulated, achievementId];
        saveCongratulatedAchievements(updatedCongratulated);
        
        // Update UI state
        setAchievements(prevAchievements => 
          prevAchievements.map(achievement => 
            achievement._id === achievementId 
              ? {
                  ...achievement,
                  congratulations: {
                    count: (achievement.congratulations?.count || 0) + 1,
                    users: [...(achievement.congratulations?.users || []), 'current-user']
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
      } else {
        // Fallback: Update UI even if API fails (for demo purposes)
        const congratulated = getCongratulatedAchievements();
        if (!congratulated.includes(achievementId)) {
          const updatedCongratulated = [...congratulated, achievementId];
          saveCongratulatedAchievements(updatedCongratulated);
          
          setAchievements(prevAchievements => 
            prevAchievements.map(achievement => 
              achievement._id === achievementId 
                ? {
                    ...achievement,
                    congratulations: {
                      count: (achievement.congratulations?.count || 0) + 1,
                      users: [...(achievement.congratulations?.users || []), 'current-user']
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
      }
    }
  };
  
  // Handle opening achievement modal
  const handleOpenAchievementModal = () => {
    if (!userProfile) {
      setError('Please complete your profile first to share achievements.');
      return;
    }
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
  
  // Handle form submission
  const handleSubmitAchievement = async (e) => {
    e.preventDefault();
    
    if (!userProfile) {
      setError('Please complete your profile first to share achievements.');
      return;
    }
    
    try {
      // Include user profile data with the achievement
      const achievementData = {
        ...newAchievement,
        userProfile: userProfile // This now comes from the backend
      };

      const response = await achievementsAPI.create(achievementData);
      
      if (response.data.success) {
        // Add congratulations data to new achievement
        const newAchievementWithCongrats = {
          ...response.data.data,
          congratulations: { count: 0, users: [] },
          userCongratulated: false
        };
        
        setAchievements([newAchievementWithCongrats, ...achievements]);
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

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading news and achievements...</div>
        </div>
      </div>
    );
  }

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
      
      {/* Navigation Tabs */}
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
                🏆 Achievements
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'achievements' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {achievements.length}
                </span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === 'achievements' && (
                <button 
                  onClick={handleOpenAchievementModal}
                  className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center text-sm shadow-lg"
                >
                  🏆 Share Achievement
                </button>
              )}
              <button 
                onClick={loadData}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
              >
                🔄 Refresh
              </button>
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
        {/* News Section - EXACTLY AS BEFORE */}
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
        
        {/* Achievements Section - UPDATED with user profile data and achievement date */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">No Achievements Yet</h3>
                <p className="text-gray-500 mb-4">Be the first to share your achievement!</p>
                <button 
                  onClick={handleOpenAchievementModal}
                  className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Share Your Achievement
                </button>
              </div>
            ) : (
              achievements.map((achievement) => (
                <div key={achievement._id} className="achievement-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-3 py-1 rounded-full text-xs font-medium">
                        👨‍🎓 Alumni
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{achievement.time}</span>
                    </div>
                    
                    {/* UPDATED: User profile display */}
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${achievement.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {achievement.userProfile?.initials || "AU"}
                      </div>
                      <div className="ml-3">
                        <h4 className="font-bold text-gray-900 text-sm">{achievement.userProfile?.name || "Alumni User"}</h4>
                        <p className="text-xs text-gray-500">
                          Class of {achievement.userProfile?.graduationYear} • {achievement.userProfile?.currentPosition}
                        </p>
                      </div>
                    </div>
                    
                    <h3 className="text-md font-bold text-gray-900 mb-2 leading-tight">
                      {achievementCategoryEmojis[achievement.category] || '🏆'} {achievement.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">
                      {achievement.description}
                    </p>

                    {/* NEW: Achievement Date Display */}
                    <div className="mb-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="mr-2">📅</span>
                        <span className="font-medium">Achieved on: {formatDate(achievement.achievementDate)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500 space-x-2">
                        {achievement.company && <span className="bg-blue-50 px-2 py-1 rounded">💼 {achievement.company}</span>}
                        {achievement.level && <span className="bg-green-50 px-2 py-1 rounded">🏆 {achievement.level}</span>}
                        {achievement.deal && <span className="bg-purple-50 px-2 py-1 rounded">💰 {achievement.deal}</span>}
                        
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
              ))
            )}
          </div>
        )}
      </main>

      {/* News Detail Modal - EXACTLY AS BEFORE */}
      {showNewsModal && selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm" 
            onClick={handleCloseNewsModal}
          ></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${getNewsCategoryColor(selectedNews.category)}`}>
                    {newsCategoryEmojis[selectedNews.category]} {selectedNews.category.toUpperCase()}
                  </span>
                  <span className="ml-3 text-sm text-gray-500">{selectedNews.time}</span>
                </div>
                <button 
                  onClick={handleCloseNewsModal} 
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedNews.title}</h2>
              
              <div className="prose prose-lg max-w-none mb-6">
                {selectedNews.fullStory.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? (
                    <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ) : (
                    <br key={index} />
                  )
                ))}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">📋 Key Details:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedNews.details && Object.entries(selectedNews.details).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <span className="text-lg mr-3">
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
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-gray-600">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={handleCloseNewsModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Achievement Modal - UPDATED with user profile info and achievement date */}
      {showAchievementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm" onClick={handleCloseAchievementModal}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative z-10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">🏆 Share Your Achievement</h3>
                <button onClick={handleCloseAchievementModal} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              
              {/* NEW: User Profile Info Display */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Title *</label>
                    <input 
                      type="text" 
                      name="title"
                      value={newAchievement.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Won National Coding Championship"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Description *</label>
                    <textarea 
                      name="description"
                      value={newAchievement.description}
                      onChange={handleInputChange}
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
                      value={newAchievement.achievementDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select 
                      name="category"
                      value={newAchievement.category}
                      onChange={handleInputChange}
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
                    onClick={handleCloseAchievementModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                  >
                    Share Achievement
                  </button>
                </div>
              </form>
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