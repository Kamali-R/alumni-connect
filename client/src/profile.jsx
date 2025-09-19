import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaVenusMars, FaCalendar, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaGraduationCap, FaUniversity, FaIdCard, FaCertificate, FaCodeBranch, FaCalendarAlt,
  FaBriefcase, FaTools, FaStar, FaUserEdit, FaGlobe, FaUpload, FaShieldAlt, FaInfoCircle,
  FaPlus, FaTimes, FaArrowRight, FaCheckCircle, FaWrench, FaHeart, FaDollarSign,
  FaBuilding, FaLightbulb, FaGraduationCap as FaGraduation, FaSearch, FaExclamationCircle,
  FaEdit, FaCamera, FaTrophy, FaAward, FaMedal, FaSave, FaLinkedin, FaGithub, FaFile
} from 'react-icons/fa';
import axios from 'axios';

const AlumniProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [profileData, setProfileData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState('');
  
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    gender: '',
    dob: '',
    personalEmail: '',
    phone: '',
    location: ''
  });
  
  const [academicInfo, setAcademicInfo] = useState({
    collegeEmail: '',
    enrollmentNumber: '',
    degree: '',
    branch: '',
    graduationYear: '',
    cgpa: ''
  });
  
  const [careerStatus, setCareerStatus] = useState('');
  const [careerDetails, setCareerDetails] = useState({
    companyName: '',
    jobTitle: '',
    companyLocation: '',
    yearsOfExperience: '',
    startupName: '',
    industry: '',
    roleInStartup: '',
    yearsRunning: '',
    institutionName: '',
    courseArea: '',
    institutionLocation: '',
    expectedGraduationYear: '',
    careerGoal: ''
  });
  
  const [otherInfo, setOtherInfo] = useState({
    bio: '',
    linkedin: '',
    github: '',
    portfolio: '',
    emailConsent: false
  });
  
  const [experiences, setExperiences] = useState([]);
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  
  // Location states
  const [locationInputs, setLocationInputs] = useState({
    personal: '',
    company: '',
    institution: ''
  });
  const [locationSuggestions, setLocationSuggestions] = useState({
    personal: [],
    company: [],
    institution: []
  });
  
  // Skills and interests states
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [filteredInterests, setFilteredInterests] = useState([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);
  
  // New fields for profile
  const [achievements, setAchievements] = useState([]);
  const [awards, setAwards] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  
  const [newAchievement, setNewAchievement] = useState({ title: '', description: '', year: '' });
  const [newAward, setNewAward] = useState({ title: '', organization: '', year: '' });
  const [newRecognition, setNewRecognition] = useState({ title: '', description: '', year: '' });
  
  // URL validation states
  const [urlErrors, setUrlErrors] = useState({
    linkedin: '',
    github: '',
    portfolio: ''
  });

  // Sample data for suggestions
  const skillSuggestions = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'HTML/CSS', 'SQL', 
    'MongoDB', 'AWS', 'Docker', 'Git', 'Project Management', 'Communication', 
    'Problem Solving', 'Data Analysis', 'Machine Learning', 'UI/UX Design'
  ];
  
  const interestSuggestions = [
    'Technology', 'Artificial Intelligence', 'Machine Learning', 'Data Science', 
    'Web Development', 'Mobile Development', 'Cloud Computing', 'Entrepreneurship', 
    'Startups', 'Finance', 'Marketing', 'Design', 'Photography', 'Travel', 
    'Sports', 'Music', 'Reading', 'Gaming', 'Cooking'
  ];
  
  const locationSuggestionsData = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 
    'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 
    'Seattle', 'Denver', 'Washington', 'Boston', 'Nashville', 'Detroit', 
    'Portland', 'Las Vegas', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque'
  ];

  useEffect(() => {
    fetchProfileData();
  }, []);

 
const fetchProfileData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    console.log('Fetching profile data from backend...');
    
    const response = await fetch('http://localhost:5000/api/alumni/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 404) {
      // Profile doesn't exist yet - this is normal for new users
      console.log('Alumni profile not found - user needs to complete profile');
      setProfileData(null);
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Profile data fetched successfully');
    console.log('Fetched achievements:', data.achievements);
    console.log('Fetched awards:', data.awards);
    console.log('Fetched recognitions:', data.recognitions);
    
    setProfileData(data);
    
    // Populate form fields with existing data
    if (data.personalInfo) {
      setPersonalInfo(data.personalInfo);
      setLocationInputs(prev => ({
        ...prev,
        personal: data.personalInfo.location || ''
      }));
    }
    
    if (data.academicInfo) {
      setAcademicInfo(data.academicInfo);
    }
    
    if (data.careerStatus) {
      setCareerStatus(data.careerStatus);
    }
    
    if (data.careerDetails) {
      setCareerDetails(data.careerDetails);
      setLocationInputs(prev => ({
        ...prev,
        company: data.careerDetails.companyLocation || '',
        institution: data.careerDetails.institutionLocation || ''
      }));
    }
    
    if (data.otherInfo) {
      setOtherInfo(data.otherInfo);
    }
    
    // Set arrays with fallback to empty arrays
    setExperiences(data.experiences || []);
    setSkills(data.skills || []);
    setInterests(data.interests || []);
    
    // CRITICAL: Properly set achievements, awards, and recognitions
    console.log('Setting achievements state:', data.achievements || []);
    console.log('Setting awards state:', data.awards || []);
    console.log('Setting recognitions state:', data.recognitions || []);
    
    setAchievements(data.achievements || []);
    setAwards(data.awards || []);
    setRecognitions(data.recognitions || []);
    
    // Set file data
    if (data.profileImage) {
      setProfileImagePreview(data.profileImage.startsWith('http') ? 
        data.profileImage : 
        `http://localhost:5000/uploads/${data.profileImage}`
      );
    }
    if (data.resumeFileName) {
      setResumeName(data.resumeFileName);
    }
    
  } catch (error) {
    console.error('Error fetching profile data:', error);
    setMessage({ 
      text: 'Failed to load profile data. Please refresh the page.', 
      type: 'error' 
    });
  }
};
// Also add these debug functions to help troubleshoot:
const debugAchievements = () => {
  console.log('Current achievements state:', achievements);
  console.log('Current awards state:', awards);
  console.log('Current recognitions state:', recognitions);
};


  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: 'File size must be less than 5MB', type: 'error' });
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ text: 'Only PDF, DOC, and DOCX files are allowed', type: 'error' });
        return;
      }
      
      setResumeFile(file);
      setResumeName(file.name);
    }
  };

  const validateUrl = (url) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleUrlChange = (field, value) => {
    setOtherInfo({...otherInfo, [field]: value});
    
    if (value && !validateUrl(value)) {
      setUrlErrors({...urlErrors, [field]: 'Please enter a valid URL'});
    } else {
      setUrlErrors({...urlErrors, [field]: ''});
    }
  };

  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    setSkillInput(value);
    
    if (value.trim() === '') {
      setShowSkillDropdown(false);
      return;
    }
    
    const filtered = skillSuggestions.filter(skill => 
      skill.toLowerCase().includes(value.toLowerCase()) && 
      !skills.includes(skill)
    );
    
    setFilteredSkills(filtered.slice(0, 8));
    setShowSkillDropdown(true);
  };

  const handleInterestInputChange = (e) => {
    const value = e.target.value;
    setInterestInput(value);
    
    if (value.trim() === '') {
      setShowInterestDropdown(false);
      return;
    }
    
    const filtered = interestSuggestions.filter(interest => 
      interest.toLowerCase().includes(value.toLowerCase()) && 
      !interests.includes(interest)
    );
    
    setFilteredInterests(filtered.slice(0, 8));
    setShowInterestDropdown(true);
  };

  const handleLocationInputChange = (field, value) => {
    setLocationInputs({
      ...locationInputs,
      [field]: value
    });
    
    if (value.length > 0) {
      const filtered = locationSuggestionsData.filter(location => 
        location.toLowerCase().includes(value.toLowerCase())
      );
      setLocationSuggestions({
        ...locationSuggestions,
        [field]: filtered
      });
    } else {
      setLocationSuggestions({
        ...locationSuggestions,
        [field]: []
      });
    }
  };

  const selectLocation = (field, location) => {
    if (field === 'personal') {
      setPersonalInfo({...personalInfo, location: location});
    } else if (field === 'company') {
      setCareerDetails({...careerDetails, companyLocation: location});
    } else if (field === 'institution') {
      setCareerDetails({...careerDetails, institutionLocation: location});
    }
    
    setLocationInputs({
      ...locationInputs,
      [field]: location
    });
    
    setLocationSuggestions({
      ...locationSuggestions,
      [field]: []
    });
  };

  const selectSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
    setSkillInput('');
    setShowSkillDropdown(false);
  };

  const selectInterest = (interest) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
    setInterestInput('');
    setShowInterestDropdown(false);
  };

  const addCustomSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
      setShowSkillDropdown(false);
    }
  };

  const addCustomInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
      setShowInterestDropdown(false);
    }
  };

 const handleSave = async () => {
  // Validate URLs
  if (otherInfo.linkedin && !validateUrl(otherInfo.linkedin)) {
    setMessage({ text: 'Please enter a valid LinkedIn URL', type: 'error' });
    return;
  }
  
  if (otherInfo.github && !validateUrl(otherInfo.github)) {
    setMessage({ text: 'Please enter a valid GitHub URL', type: 'error' });
    return;
  }
  
  if (otherInfo.portfolio && !validateUrl(otherInfo.portfolio)) {
    setMessage({ text: 'Please enter a valid Portfolio URL', type: 'error' });
    return;
  }
  
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ text: 'Authentication token not found. Please login again.', type: 'error' });
      return;
    }

    // Create FormData to handle file uploads
    const formData = new FormData();
    
    // Debug log to check achievements data before sending
    console.log('Achievements before sending:', achievements);
    console.log('Awards before sending:', awards);
    console.log('Recognitions before sending:', recognitions);
    
    // Append JSON data as strings - ENSURE achievements, awards, recognitions are included
    formData.append('personalInfo', JSON.stringify(personalInfo));
    formData.append('academicInfo', JSON.stringify(academicInfo));
    formData.append('careerStatus', careerStatus);
    formData.append('careerDetails', JSON.stringify(careerDetails));
    formData.append('otherInfo', JSON.stringify(otherInfo));
    formData.append('experiences', JSON.stringify(experiences));
    formData.append('skills', JSON.stringify(skills));
    formData.append('interests', JSON.stringify(interests));
    
    // CRITICAL: Ensure these are properly stringified and appended
    formData.append('achievements', JSON.stringify(achievements));
    formData.append('awards', JSON.stringify(awards));
    formData.append('recognitions', JSON.stringify(recognitions));
    
    // Append files if they exist
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }
    
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }

    console.log('Sending profile data to backend...');
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    // Use PUT for updates, POST for creation
    const method = profileData ? 'PUT' : 'POST';
    const response = await fetch('http://localhost:5000/api/alumni/profile', {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header - let browser set it for FormData
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Profile saved successfully:', result);
    
    setMessage({ text: 'Profile updated successfully!', type: 'success' });
    setIsEditing(false);
    
    // Update local storage to reflect profile completion
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userData.profileCompleted = true;
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    // Refresh profile data from backend
    await fetchProfileData();
    
    // Clear the message after 3 seconds
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
    
  } catch (error) {
    console.error('Error updating profile:', error);
    setMessage({ 
      text: error.message || 'Failed to update profile. Please try again.', 
      type: 'error' 
    });
    
    // Clear error message after 5 seconds
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 5000);
  } finally {
    setLoading(false);
  }
};

  const addAchievement = () => {
  if (newAchievement.title && newAchievement.year) {
    const achievementToAdd = { 
      ...newAchievement, 
      id: Date.now() // Ensure unique ID
    };
    console.log('Adding achievement:', achievementToAdd);
    setAchievements([...achievements, achievementToAdd]);
    setNewAchievement({ title: '', description: '', year: '' });
    
    // Debug log after adding
    setTimeout(() => {
      console.log('Achievements after adding:', achievements);
    }, 100);
  } else {
    console.warn('Cannot add achievement - missing required fields:', newAchievement);
  }
};

  const removeAchievement = (id) => {
    setAchievements(achievements.filter(a => a.id !== id));
  };

  const addAward = () => {
  if (newAward.title && newAward.organization && newAward.year) {
    const awardToAdd = { 
      ...newAward, 
      id: Date.now() // Ensure unique ID
    };
    console.log('Adding award:', awardToAdd);
    setAwards([...awards, awardToAdd]);
    setNewAward({ title: '', organization: '', year: '' });
    
    // Debug log after adding
    setTimeout(() => {
      console.log('Awards after adding:', awards);
    }, 100);
  } else {
    console.warn('Cannot add award - missing required fields:', newAward);
  }
};

  const removeAward = (id) => {
    setAwards(awards.filter(a => a.id !== id));
  };

  const addRecognition = () => {
  if (newRecognition.title && newRecognition.year) {
    const recognitionToAdd = { 
      ...newRecognition, 
      id: Date.now() // Ensure unique ID
    };
    console.log('Adding recognition:', recognitionToAdd);
    setRecognitions([...recognitions, recognitionToAdd]);
    setNewRecognition({ title: '', description: '', year: '' });
    
    // Debug log after adding
    setTimeout(() => {
      console.log('Recognitions after adding:', recognitions);
    }, 100);
  } else {
    console.warn('Cannot add recognition - missing required fields:', newRecognition);
  }
};

  const removeRecognition = (id) => {
    setRecognitions(recognitions.filter(r => r.id !== id));
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1950; year--) {
      years.push(year);
    }
    return years;
  };

  const getDegreeDisplayValue = (degreeValue) => {
    const degreeMap = {
      'btech': 'B.Tech',
      'be': 'B.E',
      'bsc': 'B.Sc',
      'ba': 'B.A',
      'bcom': 'B.Com',
      'bba': 'BBA',
      'bca': 'BCA',
      'mtech': 'M.Tech',
      'me': 'M.E',
      'msc': 'M.Sc',
      'ma': 'M.A',
      'mcom': 'M.Com',
      'mba': 'MBA',
      'mca': 'MCA',
      'phd': 'PhD',
      'other': 'Other'
    };
    
    return degreeMap[degreeValue] || degreeValue;
  };

  if (!profileData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg flex items-center"
            >
              <FaEdit className="mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message.text}
          </div>
        )}
        {/* Profile Image Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden">
                {profileImagePreview ? (
                  <img 
                    src={profileImagePreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <FaUser className="text-gray-400 text-4xl" />
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer">
                  <FaCamera />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                  />
                </label>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{personalInfo.fullName}</h2>
              <p className="text-gray-600">{getDegreeDisplayValue(academicInfo.degree)} in {academicInfo.branch}</p>
              <p className="text-gray-600">Class of {academicInfo.graduationYear}</p>
              <p className="text-gray-600 mt-2">{personalInfo.location}</p>
            </div>
          </div>
        </div>
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-full">
              <FaUser className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={personalInfo.fullName}
                  onChange={(e) => setPersonalInfo({...personalInfo, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{personalInfo.fullName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              {isEditing ? (
                <select
                  value={personalInfo.gender}
                  onChange={(e) => setPersonalInfo({...personalInfo, gender: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              ) : (
                <p className="text-gray-900">{personalInfo.gender}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={personalInfo.dob ? personalInfo.dob.split('T')[0] : ''}
                  onChange={(e) => setPersonalInfo({...personalInfo, dob: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">
                  {personalInfo.dob ? new Date(personalInfo.dob).toLocaleDateString() : 'Not provided'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={personalInfo.personalEmail}
                  onChange={(e) => setPersonalInfo({...personalInfo, personalEmail: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{personalInfo.personalEmail}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{personalInfo.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    value={locationInputs.personal}
                    onChange={(e) => handleLocationInputChange('personal', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  {locationSuggestions.personal.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-auto">
                      {locationSuggestions.personal.map((location, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectLocation('personal', location)}
                        >
                          {location}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-900">{personalInfo.location}</p>
              )}
            </div>
          </div>
        </div>
        {/* Academic Information */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-2 rounded-full">
              <FaGraduationCap className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Academic Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">College Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={academicInfo.collegeEmail}
                  onChange={(e) => setAcademicInfo({...academicInfo, collegeEmail: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{academicInfo.collegeEmail}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={academicInfo.enrollmentNumber}
                  onChange={(e) => setAcademicInfo({...academicInfo, enrollmentNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{academicInfo.enrollmentNumber}</p>
              )}
            </div>
            {/* Degree Field */}
            
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
  {isEditing ? (
    <select
      value={academicInfo.degree}
      onChange={(e) => setAcademicInfo({...academicInfo, degree: e.target.value})}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Select Degree</option>
      <option value="btech">B.Tech</option>
      <option value="be">B.E</option>
      <option value="bsc">B.Sc</option>
      <option value="ba">B.A</option>
      <option value="bcom">B.Com</option>
      <option value="bba">BBA</option>
      <option value="bca">BCA</option>
      <option value="mtech">M.Tech</option>
      <option value="me">M.E</option>
      <option value="msc">M.Sc</option>
      <option value="ma">M.A</option>
      <option value="mcom">M.Com</option>
      <option value="mba">MBA</option>
      <option value="mca">MCA</option>
      <option value="phd">PhD</option>
      <option value="other">Other</option>
    </select>
  ) : (
    <p className="text-gray-900">{academicInfo.degree}
    </p>
  )}
</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              {isEditing ? (
                <select
                  value={academicInfo.branch}
                  onChange={(e) => setAcademicInfo({...academicInfo, branch: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Branch</option>
                  <option value="computer-science">Computer Science</option>
                  <option value="information-technology">Information Technology</option>
                  <option value="electrical-engineering">Electrical Engineering</option>
                  <option value="electronics-communication">Electronics & Communication</option>
                  <option value="mechanical-engineering">Mechanical Engineering</option>
                  <option value="civil-engineering">Civil Engineering</option>
                  <option value="chemical-engineering">Chemical Engineering</option>
                  <option value="biotechnology">Biotechnology</option>
                  <option value="business-administration">Business Administration</option>
                  <option value="economics">Economics</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900">{academicInfo.branch}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
              {isEditing ? (
                <select
                  value={academicInfo.graduationYear}
                  onChange={(e) => setAcademicInfo({...academicInfo, graduationYear: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: 30 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <p className="text-gray-900">{academicInfo.graduationYear}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
              {isEditing ? (
                <input
                  type="text"
                  value={academicInfo.cgpa}
                  onChange={(e) => setAcademicInfo({...academicInfo, cgpa: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{academicInfo.cgpa}</p>
              )}
            </div>
          </div>
        </div>
        {/* Career Information */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-100 p-2 rounded-full">
              <FaBriefcase className="text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Career Information</h3>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Career Status</label>
            {isEditing ? (
              <select
                value={careerStatus}
                onChange={(e) => setCareerStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Career Status</option>
                <option value="working">Currently Working</option>
                <option value="entrepreneur">Entrepreneur</option>
                <option value="studies">Higher Studies</option>
                <option value="not-working">Not Working</option>
              </select>
            ) : (
              <p className="text-gray-900">
                {careerStatus === 'working' && 'Currently Working'}
                {careerStatus === 'entrepreneur' && 'Entrepreneur'}
                {careerStatus === 'studies' && 'Higher Studies'}
                {careerStatus === 'not-working' && 'Not Working'}
              </p>
            )}
          </div>
          
          {/* Currently Working */}
          {careerStatus === 'working' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={careerDetails.companyName}
                    onChange={(e) => setCareerDetails({...careerDetails, companyName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{careerDetails.companyName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={careerDetails.jobTitle}
                    onChange={(e) => setCareerDetails({...careerDetails, jobTitle: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{careerDetails.jobTitle}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Location</label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={locationInputs.company}
                      onChange={(e) => handleLocationInputChange('company', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    {locationSuggestions.company.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-auto">
                        {locationSuggestions.company.map((location, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectLocation('company', location)}
                          >
                            {location}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">{careerDetails.companyLocation}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={careerDetails.yearsOfExperience}
                    onChange={(e) => setCareerDetails({...careerDetails, yearsOfExperience: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{careerDetails.yearsOfExperience}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Entrepreneur */}
          {careerStatus === 'entrepreneur' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startup Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={careerDetails.startupName}
                    onChange={(e) => setCareerDetails({...careerDetails, startupName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{careerDetails.startupName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={careerDetails.industry}
                    onChange={(e) => setCareerDetails({...careerDetails, industry: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{careerDetails.industry}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role in Startup</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={careerDetails.roleInStartup}
                    onChange={(e) => setCareerDetails({...careerDetails, roleInStartup: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{careerDetails.roleInStartup}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years Running</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={careerDetails.yearsRunning}
                    onChange={(e) => setCareerDetails({...careerDetails, yearsRunning: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{careerDetails.yearsRunning}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Higher Studies */}
          {careerStatus === 'studies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={careerDetails.institutionName}
                    onChange={(e) => setCareerDetails({...careerDetails, institutionName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{careerDetails.institutionName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Area</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={careerDetails.courseArea}
                    onChange={(e) => setCareerDetails({...careerDetails, courseArea: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{careerDetails.courseArea}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Location</label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={locationInputs.institution}
                      onChange={(e) => handleLocationInputChange('institution', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    {locationSuggestions.institution.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-auto">
                        {locationSuggestions.institution.map((location, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectLocation('institution', location)}
                          >
                            {location}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">{careerDetails.institutionLocation}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Graduation Year</label>
                {isEditing ? (
                  <select
                    value={careerDetails.expectedGraduationYear}
                    onChange={(e) => setCareerDetails({...careerDetails, expectedGraduationYear: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 15 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <p className="text-gray-900">{careerDetails.expectedGraduationYear}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Not Working */}
          {careerStatus === 'not-working' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Career Goal</label>
              {isEditing ? (
                <textarea
                  value={careerDetails.careerGoal}
                  onChange={(e) => setCareerDetails({...careerDetails, careerGoal: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              ) : (
                <p className="text-gray-900">{careerDetails.careerGoal}</p>
              )}
            </div>
          )}
        </div>
        {/* Skills & Interests */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-yellow-100 p-2 rounded-full">
              <FaTools className="text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Skills & Interests</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              {isEditing ? (
                <div className="relative">
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={handleSkillInputChange}
                      placeholder="Type to search or add skills"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={addCustomSkill}
                      className="bg-blue-600 text-white px-4 py-2 rounded-r-lg"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  
                  {showSkillDropdown && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredSkills.map((skill, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectSkill(skill)}
                        >
                          {skill}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {skill}
                        <button
                          type="button"
                          onClick={() => setSkills(skills.filter(s => s !== skill))}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Interests Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
              {isEditing ? (
                <div className="relative">
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={interestInput}
                      onChange={handleInterestInputChange}
                      placeholder="Type to search or add interests"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={addCustomInterest}
                      className="bg-green-600 text-white px-4 py-2 rounded-r-lg"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  
                  {showInterestDropdown && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredInterests.map((interest, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectInterest(interest)}
                        >
                          {interest}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map((interest, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {interest}
                        <button
                          type="button"
                          onClick={() => setInterests(interests.filter(i => i !== interest))}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Achievements, Awards & Recognitions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-red-100 p-2 rounded-full">
              <FaTrophy className="text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Achievements, Awards & Recognitions</h3>
          </div>
          {isEditing ? (
            <div className="space-y-6">
              {/* Achievements */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Achievements</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newAchievement.title}
                    onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={newAchievement.year}
                    onChange={(e) => setNewAchievement({...newAchievement, year: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Year</option>
                    {generateYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <button
                    onClick={addAchievement}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                  >
                    <FaPlus className="mr-2" />
                    Add Achievement
                  </button>
                </div>
                <textarea
                  placeholder="Description"
                  value={newAchievement.description}
                  onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-4"
                  rows="2"
                />
                
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="bg-gray-50 p-4 rounded-lg relative">
                      <button
                        onClick={() => removeAchievement(achievement.id)}
                        className="absolute top-3 right-3 text-red-500"
                      >
                        <FaTimes />
                      </button>
                      <h5 className="font-medium text-gray-900">{achievement.title} ({achievement.year})</h5>
                      <p className="text-gray-600">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Awards */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Awards</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newAward.title}
                    onChange={(e) => setNewAward({...newAward, title: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Organization"
                    value={newAward.organization}
                    onChange={(e) => setNewAward({...newAward, organization: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={newAward.year}
                    onChange={(e) => setNewAward({...newAward, year: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Year</option>
                    {generateYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addAward}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center mb-4"
                >
                  <FaPlus className="mr-2" />
                  Add Award
                </button>
                
                <div className="space-y-4">
                  {awards.map((award) => (
                    <div key={award.id} className="bg-gray-50 p-4 rounded-lg relative">
                      <button
                        onClick={() => removeAward(award.id)}
                        className="absolute top-3 right-3 text-red-500"
                      >
                        <FaTimes />
                      </button>
                      <h5 className="font-medium text-gray-900">{award.title}</h5>
                      <p className="text-gray-600">{award.organization} ({award.year})</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Recognitions */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Recognitions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newRecognition.title}
                    onChange={(e) => setNewRecognition({...newRecognition, title: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={newRecognition.year}
                    onChange={(e) => setNewRecognition({...newRecognition, year: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Year</option>
                    {generateYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <button
                    onClick={addRecognition}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                  >
                    <FaPlus className="mr-2" />
                    Add Recognition
                  </button>
                </div>
                <textarea
                  placeholder="Description"
                  value={newRecognition.description}
                  onChange={(e) => setNewRecognition({...newRecognition, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-4"
                  rows="2"
                />
                
                <div className="space-y-4">
                  {recognitions.map((recognition) => (
                    <div key={recognition.id} className="bg-gray-50 p-4 rounded-lg relative">
                      <button
                        onClick={() => removeRecognition(recognition.id)}
                        className="absolute top-3 right-3 text-red-500"
                      >
                        <FaTimes />
                      </button>
                      <h5 className="font-medium text-gray-900">{recognition.title} ({recognition.year})</h5>
                      <p className="text-gray-600">{recognition.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Achievements */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Achievements</h4>
                <div className="space-y-4">
                  {achievements.length > 0 ? (
                    achievements.map((achievement, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900">{achievement.title} ({achievement.year})</h5>
                        <p className="text-gray-600">{achievement.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No achievements added yet.</p>
                  )}
                </div>
              </div>
              {/* Awards */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Awards</h4>
                <div className="space-y-4">
                  {awards.length > 0 ? (
                    awards.map((award, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900">{award.title}</h5>
                        <p className="text-gray-600">{award.organization} ({award.year})</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No awards added yet.</p>
                  )}
                </div>
              </div>
              {/* Recognitions */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Recognitions</h4>
                <div className="space-y-4">
                  {recognitions.length > 0 ? (
                    recognitions.map((recognition, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900">{recognition.title} ({recognition.year})</h5>
                        <p className="text-gray-600">{recognition.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No recognitions added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-indigo-100 p-2 rounded-full">
              <FaInfoCircle className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Additional Information</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              {isEditing ? (
                <textarea
                  value={otherInfo.bio}
                  onChange={(e) => setOtherInfo({...otherInfo, bio: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-line">{otherInfo.bio || 'No bio added yet.'}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                {isEditing ? (
                  <div>
                    <input
                      type="url"
                      value={otherInfo.linkedin}
                      onChange={(e) => handleUrlChange('linkedin', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    {urlErrors.linkedin && (
                      <p className="mt-1 text-sm text-red-600">{urlErrors.linkedin}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">{otherInfo.linkedin || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                {isEditing ? (
                  <div>
                    <input
                      type="url"
                      value={otherInfo.github}
                      onChange={(e) => handleUrlChange('github', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    {urlErrors.github && (
                      <p className="mt-1 text-sm text-red-600">{urlErrors.github}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">{otherInfo.github || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                {isEditing ? (
                  <div>
                    <input
                      type="url"
                      value={otherInfo.portfolio}
                      onChange={(e) => handleUrlChange('portfolio', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    {urlErrors.portfolio && (
                      <p className="mt-1 text-sm text-red-600">{urlErrors.portfolio}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">{otherInfo.portfolio || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                {isEditing ? (
                  <div className="flex items-center">
                    <label className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center cursor-pointer">
                      <FaUpload className="mr-2" />
                      Upload Resume
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                      />
                    </label>
                    {resumeName && (
                      <span className="ml-3 text-gray-600">{resumeName}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FaFile className="text-gray-400 mr-2" />
                    <span className="text-gray-900">{resumeName || 'No resume uploaded'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniProfilePage;