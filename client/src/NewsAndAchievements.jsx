import React, { useState, useEffect } from 'react';

const NewsAndAchievements = () => {
  // State management
  const [activeTab, setActiveTab] = useState('news');
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [congratulatedAchievements, setCongratulatedAchievements] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  
  // Initial news data
  const [newsItems, setNewsItems] = useState([
    {
      id: 1,
      title: "Annual Tech Fest 2024 Registration Opens",
      description: "Get ready for the biggest tech event of the year! Registration for Tech Fest 2024 is now open. Join us for 3 days of innovation, competitions, and networking opportunities.",
      category: "general",
      time: "2 hours ago",
      details: {
        attendees: "500+ Expected",
        date: "March 15-17"
      }
    },
    {
      id: 2,
      title: "New Library Wing Inauguration",
      description: "The new state-of-the-art library wing with modern study spaces, digital resources, and collaborative areas will be inaugurated next week by the Dean.",
      category: "academic",
      time: "1 day ago",
      details: {
        books: "5000+ Books",
        feature: "Digital Hub"
      }
    },
    {
      id: 3,
      title: "Industry Partnership with Tech Giants",
      description: "New partnerships signed with leading tech companies for internships, placements, and collaborative research projects benefiting all students.",
      category: "announcements",
      time: "3 days ago",
      details: {
        companies: "5 Companies",
        opportunities: "200+ Opportunities"
      }
    },
    {
      id: 4,
      title: "Green Initiative Launch",
      description: "Join our sustainability mission! The Green Initiative aims to achieve carbon-neutrality by 2025 through various eco-friendly projects and sustainable practices.",
      category: "general",
      time: "5 days ago",
      details: {
        initiative: "Eco-Friendly",
        goal: "Zero Waste"
      }
    },
    {
      id: 5,
      title: "Alumni Mentorship Program Expansion",
      description: "We're expanding our successful alumni mentorship program to include more departments and international alumni connections for global opportunities.",
      category: "events",
      time: "1 week ago",
      details: {
        network: "Global Network",
        mentors: "100+ Mentors"
      }
    }
  ]);
  
  // Initial achievements data
  const [achievements, setAchievements] = useState([
    {
      id: 1,
      personType: "alumni",
      name: "Sanjay Kumar",
      initials: "SK",
      department: "Software Engineer",
      graduationYear: "2018",
      currentPosition: "Senior Tech Lead",
      title: "Promoted to Senior Tech Lead at Google",
      description: "Congratulations to Sanjay for his promotion to Senior Tech Lead at Google Cloud division, leading a team of 15 engineers on AI infrastructure projects.",
      category: "career",
      time: "Today",
      company: "Google",
      avatarColor: "from-blue-500 to-purple-500"
    },
    {
      id: 2,
      personType: "student",
      name: "Priya Reddy",
      initials: "PR",
      department: "Computer Science",
      currentYear: "Final Year",
      title: "Won National Coding Championship",
      description: "Priya secured 1st place in the National Coding Championship 2024, competing against 5000+ participants from across the country.",
      category: "competition",
      time: "2 days ago",
      level: "National Level",
      avatarColor: "from-green-500 to-teal-500"
    },
    {
      id: 3,
      personType: "alumni",
      name: "Arjun Mehta",
      initials: "AM",
      department: "Entrepreneur",
      graduationYear: "2015",
      currentPosition: "CEO",
      title: "Startup Acquired by Microsoft",
      description: "Arjun's AI startup 'DataFlow' was acquired by Microsoft for $50M, making it one of the biggest success stories from our alumni network.",
      category: "entrepreneurship",
      time: "3 days ago",
      deal: "$50M Deal",
      avatarColor: "from-purple-500 to-pink-500"
    },
    {
      id: 4,
      personType: "student",
      name: "Rahul Kumar",
      initials: "RK",
      department: "Mechanical Engineering",
      currentYear: "Third Year",
      title: "Research Paper Published in IEEE",
      description: "Rahul's research on sustainable energy systems was published in IEEE Transactions, making him the youngest author from our college.",
      category: "research",
      time: "5 days ago",
      publication: "IEEE Publication",
      avatarColor: "from-orange-500 to-red-500"
    },
    {
      id: 5,
      personType: "alumni",
      name: "Neha Sharma",
      initials: "NS",
      department: "Data Scientist",
      graduationYear: "2019",
      currentPosition: "Senior Data Scientist",
      title: "Forbes 30 Under 30 Recognition",
      description: "Neha was featured in Forbes 30 Under 30 list for her groundbreaking work in AI-powered healthcare solutions at her current company.",
      category: "academic",
      time: "1 week ago",
      recognition: "Forbes Featured",
      avatarColor: "from-indigo-500 to-blue-500"
    },
    {
      id: 6,
      personType: "student",
      name: "Vikram Gupta",
      initials: "VG",
      department: "Electronics Engineering",
      currentYear: "Second Year",
      title: "International Robotics Competition Winner",
      description: "Vikram's team won the International Robotics Challenge in Tokyo, showcasing innovative automation solutions for smart cities.",
      category: "competition",
      time: "1 week ago",
      scope: "International",
      avatarColor: "from-teal-500 to-green-500"
    },
    {
      id: 7,
      personType: "alumni",
      name: "Deepika Thakur",
      initials: "DT",
      department: "Product Manager",
      graduationYear: "2017",
      currentPosition: "Senior Product Manager",
      title: "Patent Granted for Innovation",
      description: "Deepika received a patent for her innovative mobile app security framework, which is now being implemented across major tech companies.",
      category: "innovation",
      time: "2 weeks ago",
      status: "Patent Granted",
      avatarColor: "from-pink-500 to-rose-500"
    },
    {
      id: 8,
      personType: "student",
      name: "Ananya Singh",
      initials: "AS",
      department: "Biotechnology",
      currentYear: "Final Year",
      title: "Breakthrough Research in Cancer Treatment",
      description: "Ananya's research on targeted cancer therapy showed promising results and has been selected for clinical trials at a leading medical institute.",
      category: "research",
      time: "2 weeks ago",
      status: "Clinical Trials",
      avatarColor: "from-cyan-500 to-blue-500"
    }
  ]);
  
  // Form state for new achievement
  const [newAchievement, setNewAchievement] = useState({
    name: "",
    initials: "",
    department: "",
    graduationYear: "",
    currentPosition: "",
    title: "",
    description: "",
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
  
  // Category emojis
  const categoryEmojis = {
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
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Handle congratulate button click
  const handleCongratulate = (achievementId) => {
    if (!congratulatedAchievements.includes(achievementId)) {
      setCongratulatedAchievements([...congratulatedAchievements, achievementId]);
    }
  };
  
  // Handle opening achievement modal
  const handleOpenAchievementModal = () => {
    setShowAchievementModal(true);
  };
  
  // Handle closing achievement modal
  const handleCloseAchievementModal = () => {
    setShowAchievementModal(false);
    // Reset form
    setNewAchievement({
      name: "",
      initials: "",
      department: "",
      graduationYear: "",
      currentPosition: "",
      title: "",
      description: "",
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
  const handleSubmitAchievement = (e) => {
    e.preventDefault();
    
    // Generate a random avatar color
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    
    // Create new achievement object (alumni type)
    const achievement = {
      id: achievements.length + 1,
      personType: "alumni",
      ...newAchievement,
      time: "Just now",
      avatarColor: randomColor
    };
    
    // Add to achievements list
    setAchievements([achievement, ...achievements]);
    
    // Close modal
    handleCloseAchievementModal();
    
    // Show success message
    setSuccessMessage("Achievement added successfully! 🏆");
    setShowSuccessMessage(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };
  
  // Get category display name
  const getCategoryDisplayName = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 shadow-sm mt-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex space-x-1">
              <button 
                onClick={() => handleTabChange('news')}
                className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'news' 
                    ? 'bg-blue-600 text-white border-b-3 border-blue-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📰 News
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
                    ? 'bg-blue-600 text-white border-b-3 border-blue-800' 
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
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
                >
                  🏆 Add Achievement
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300">
          {successMessage}
        </div>
      )}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* News Section */}
        {activeTab === 'news' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {newsItems.map((news) => (
              <div key={news.id} className="news-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {/* Removed priority indicators */}
                    </div>
                    <span className="text-xs text-gray-500">{news.time}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{news.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{news.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      {Object.entries(news.details).map(([key, value]) => (
                        <span key={key} className="mr-4">
                          {key === 'attendees' && '👥'}
                          {key === 'date' && '📅'}
                          {key === 'books' && '📚'}
                          {key === 'feature' && '💻'}
                          {key === 'companies' && '🤝'}
                          {key === 'opportunities' && '💼'}
                          {key === 'initiative' && '🌱'}
                          {key === 'goal' && '♻'}
                          {key === 'network' && '🌍'}
                          {key === 'mentors' && '👨‍🏫'}
                          {key === 'deal' && '💰'}
                          {key === 'publication' && '📖'}
                          {key === 'recognition' && '📰'}
                          {key === 'scope' && '🌍'}
                          {key === 'status' && '⚖'}
                          {value}
                        </span>
                      ))}
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Read More →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Achievements Section */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="achievement-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${
                      achievement.personType === 'alumni' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-800' 
                        : 'bg-gradient-to-r from-green-600 to-green-800'
                    } text-white px-3 py-1 rounded-full text-xs font-medium`}>
                      {achievement.personType === 'alumni' ? '👨‍🎓 Alumni' : '🎓 Student'}
                    </div>
                    <span className="text-xs text-gray-500">{achievement.time}</span>
                  </div>
                  <div className="flex items-center mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${achievement.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                      {achievement.initials}
                    </div>
                    <div className="ml-3">
                      <h4 className="font-bold text-gray-900 text-sm">{achievement.name}</h4>
                      <p className="text-xs text-gray-500">
                        {achievement.personType === 'alumni' 
                          ? `Class of ${achievement.graduationYear} • ${achievement.currentPosition}`
                          : `${achievement.currentYear} • ${achievement.department}`}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-md font-bold text-gray-900 mb-2">
                    {categoryEmojis[achievement.category] || '🏆'} {achievement.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{achievement.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      {achievement.company && <span>💼 {achievement.company}</span>}
                      {achievement.level && <span>🏆 {achievement.level}</span>}
                      {achievement.deal && <span>💰 {achievement.deal}</span>}
                      {achievement.publication && <span>📖 {achievement.publication}</span>}
                      {achievement.recognition && <span>📰 {achievement.recognition}</span>}
                      {achievement.scope && <span>🌍 {achievement.scope}</span>}
                      {achievement.status && <span>⚖ {achievement.status}</span>}
                    </div>
                    <button 
                      onClick={() => handleCongratulate(achievement.id)}
                      className={`text-xs font-medium ${
                        congratulatedAchievements.includes(achievement.id)
                          ? 'text-gray-500'
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                    >
                      {congratulatedAchievements.includes(achievement.id) 
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
      </main>
      
      {/* Achievement Modal */}
      {showAchievementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm" onClick={handleCloseAchievementModal}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative z-10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">🏆 Add Achievement</h3>
                <button onClick={handleCloseAchievementModal} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              <form onSubmit={handleSubmitAchievement}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={newAchievement.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Initials</label>
                    <input 
                      type="text" 
                      name="initials"
                      value={newAchievement.initials}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., JD"
                      maxLength="3"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department/Field</label>
                  <input 
                    type="text" 
                    name="department"
                    value={newAchievement.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                    <input 
                      type="number" 
                      name="graduationYear"
                      value={newAchievement.graduationYear}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2020"
                      min="1990"
                      max="2024"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Position</label>
                    <input 
                      type="text" 
                      name="currentPosition"
                      value={newAchievement.currentPosition}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Software Engineer"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Title</label>
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
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Description</label>
                  <textarea 
                    name="description"
                    value={newAchievement.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe the achievement in detail..."
                    required
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Category</label>
                  <select 
                    name="category"
                    value={newAchievement.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="academic">Academic Excellence</option>
                    <option value="research">Research & Innovation</option>
                    <option value="competition">Competition Winner</option>
                    <option value="career">Career Milestone</option>
                    <option value="entrepreneurship">Entrepreneurship</option>
                    <option value="social">Social Impact</option>
                    <option value="sports">Sports & Athletics</option>
                    <option value="arts">Arts & Culture</option>
                    <option value="innovation">Innovation</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={handleCloseAchievementModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Achievement
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .news-card { 
          transition: all 0.3s ease; 
          animation: slideIn 0.5s ease-out;
        }
        .news-card:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .achievement-card {
          transition: all 0.3s ease;
          animation: slideIn 0.5s ease-out;
        }
        .achievement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NewsAndAchievements;