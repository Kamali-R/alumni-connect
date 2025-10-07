import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
 // Make sure this is imported
  import { 
  FaUser, FaVenusMars, FaCalendar, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaGraduationCap, FaUniversity, FaIdCard, FaCertificate, FaCodeBranch, FaCalendarAlt,
  FaBriefcase, FaTools, FaStar, FaUserEdit, FaGlobe, FaUpload, FaShieldAlt, FaInfoCircle,
  FaPlus, FaTimes, FaArrowRight, FaCheckCircle, FaWrench, FaHeart, FaDollarSign,
  FaBuilding, FaLightbulb, FaGraduationCap as FaGraduation, FaSearch, FaExclamationCircle
} from 'react-icons/fa';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
// Make sure to import useNavigate from react-router-dom

const AlumniConnectProfile = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate(); 
  const [showSuccess, setShowSuccess] = useState(false);
  // Personal Information State

  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    gender: '',
    dob: '',
    personalEmail: '',
    phone: '',
    location: ''
  });
  
  // Academic Information State
  const [academicInfo, setAcademicInfo] = useState({
    collegeEmail: '',
    enrollmentNumber: '',
    degree: '',
    branch: '',
    graduationYear: '',
    cgpa: '' // Added CGPA field
  });
  
  // Professional Information State
  const [professionalInfo, setProfessionalInfo] = useState({
    employmentStatus: '',
    salaryRange: ''
  });
  
  // Career Status State
  const [careerStatus, setCareerStatus] = useState('');
  const [careerDetails, setCareerDetails] = useState({
    // Currently Working
    companyName: '',
    jobTitle: '',
    companyLocation: '',
    yearsOfExperience: '',
    
    // Entrepreneur
    startupName: '',
    industry: '',
    roleInStartup: '',
    yearsRunning: '',
    
    // Higher Studies
    institutionName: '',
    courseArea: '',
    institutionLocation: '',
    expectedGraduationYear: '',
    
    // Not Currently Working
    careerGoal: ''
  });
  
  // Other Information State
  const [otherInfo, setOtherInfo] = useState({
    bio: '',
    linkedin: '',
    github: '',
    portfolio: '',
    termsAccept: false,
    emailConsent: false
  });
  
  // Dynamic sections state
  const [experiences, setExperiences] = useState([]);
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  
  // Experience input states
  const [currentExperience, setCurrentExperience] = useState({
    company: '',
    title: '',
    location: '',
    duration: '',
    description: ''
  });
  
  // Dropdown states
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [filteredInterests, setFilteredInterests] = useState([]);
  
  // Location dropdown states
  const [locationInput, setLocationInput] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState([]);
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Refs
  const fileInputRef = useRef(null);
  
  // Options for dropdowns
  const degreeOptions = [
    'B.Tech', 'B.E', 'B.Sc', 'B.A', 'B.Com', 'BBA', 'BCA', 'B.Arch', 'B.Des', 'B.Pharm',
    'M.Tech', 'M.E', 'M.Sc', 'M.A', 'M.Com', 'MBA', 'MCA', 'M.Arch', 'M.Des', 'M.Pharm',
    'PhD', 'MPhil', 'Post Doc', 'Diploma', 'Integrated Dual Degree', 'Other'
  ];
  
  const branchOptions = [
    'Computer Science', 'Computer Science & Engineering', 'Information Technology',
    'Electrical Engineering', 'Electrical & Electronics Engineering', 'Electronics & Communication Engineering',
    'Electronics & Instrumentation Engineering', 'Mechanical Engineering', 'Mechanical & Automation Engineering',
    'Civil Engineering', 'Chemical Engineering', 'Aerospace Engineering', 'Biotechnology',
    'Information Technology', 'Electronics and Communication', 'Instrumentation Engineering',
    'Production Engineering', 'Metallurgical Engineering', 'Mining Engineering', 'Petroleum Engineering',
    'Biomedical Engineering', 'Environmental Engineering', 'Industrial Engineering', 'Agricultural Engineering',
    'Marine Engineering', 'Nuclear Engineering', 'Business Administration', 'Economics', 'Mathematics',
    'Physics', 'Chemistry', 'Biology', 'English Literature', 'History', 'Psychology', 'Sociology',
    'Philosophy', 'Fine Arts', 'Performing Arts', 'Architecture', 'Pharmacy', 'Medicine', 'Dentistry',
    'Nursing', 'Public Health', 'Law', 'Education', 'Journalism', 'Hospitality Management', 'Other'
  ];
  
  const locationOptions = [
    'Karur, Tamil Nadu, India', 'Chennai, Tamil Nadu, India', 'Coimbatore, Tamil Nadu, India',
    'Madurai, Tamil Nadu, India', 'Salem, Tamil Nadu, India', 'Tiruchirappalli, Tamil Nadu, India',
    'Bangalore, Karnataka, India', 'Mysore, Karnataka, India', 'Hubli, Karnataka, India',
    'Mangalore, Karnataka, India', 'Mumbai, Maharashtra, India', 'Pune, Maharashtra, India',
    'Nagpur, Maharashtra, India', 'Nashik, Maharashtra, India', 'Delhi, Delhi, India',
    'New Delhi, Delhi, India', 'Gurgaon, Haryana, India', 'Faridabad, Haryana, India',
    'Kolkata, West Bengal, India', 'Howrah, West Bengal, India', 'Hyderabad, Telangana, India',
    'Secunderabad, Telangana, India', 'Ahmedabad, Gujarat, India', 'Surat, Gujarat, India',
    'Vadodara, Gujarat, India', 'Jaipur, Rajasthan, India', 'Jodhpur, Rajasthan, India',
    'Udaipur, Rajasthan, India', 'Lucknow, Uttar Pradesh, India', 'Kanpur, Uttar Pradesh, India',
    'Agra, Uttar Pradesh, India', 'Patna, Bihar, India', 'Gaya, Bihar, India',
    'Bhopal, Madhya Pradesh, India', 'Indore, Madhya Pradesh, India', 'Chandigarh, Punjab, India',
    'Amritsar, Punjab, India', 'Dehradun, Uttarakhand, India', 'Rishikesh, Uttarakhand, India',
    'Guwahati, Assam, India', 'Shillong, Meghalaya, India', 'Bhubaneswar, Odisha, India',
    'Ranchi, Jharkhand, India', 'Thiruvananthapuram, Kerala, India', 'Kochi, Kerala, India',
    'Goa, Goa, India', 'Puducherry, Puducherry, India', 'Andaman and Nicobar Islands, Andaman and Nicobar Islands, India',
    'Lakshadweep, Lakshadweep, India', 'Daman and Diu, Daman and Diu, India',
    'Dadra and Nagar Haveli, Dadra and Nagar Haveli, India', 'Ladakh, Ladakh, India',
    'Jammu and Kashmir, Jammu and Kashmir, India', 'New York, New York, USA',
    'Los Angeles, California, USA', 'Chicago, Illinois, USA', 'Houston, Texas, USA',
    'Phoenix, Arizona, USA', 'Philadelphia, Pennsylvania, USA', 'San Antonio, Texas, USA',
    'San Diego, California, USA', 'Dallas, Texas, USA', 'San Jose, California, USA',
    'Austin, Texas, USA', 'Jacksonville, Florida, USA', 'London, England, United Kingdom',
    'Birmingham, England, United Kingdom', 'Manchester, England, United Kingdom',
    'Glasgow, Scotland, United Kingdom', 'Liverpool, England, United Kingdom',
    'Edinburgh, Scotland, United Kingdom', 'Leeds, England, United Kingdom',
    'Sheffield, England, United Kingdom', 'Bristol, England, United Kingdom',
    'Toronto, Ontario, Canada', 'Montreal, Quebec, Canada', 'Vancouver, British Columbia, Canada',
    'Calgary, Alberta, Canada', 'Edmonton, Alberta, Canada', 'Ottawa, Ontario, Canada',
    'Sydney, New South Wales, Australia', 'Melbourne, Victoria, Australia',
    'Brisbane, Queensland, Australia', 'Perth, Western Australia, Australia',
    'Adelaide, South Australia, Australia', 'Canberra, Australian Capital Territory, Australia',
    'Gold Coast, Queensland, Australia', 'Newcastle, New South Wales, Australia',
    'Central Coast, New South Wales, Australia', 'Singapore, Singapore, Singapore',
    'Dubai, Dubai, United Arab Emirates', 'Abu Dhabi, Abu Dhabi, United Arab Emirates',
    'Sharjah, Sharjah, United Arab Emirates', 'Tokyo, Tokyo, Japan', 'Osaka, Osaka, Japan',
    'Kyoto, Kyoto, Japan', 'Yokohama, Kanagawa, Japan', 'Nagoya, Aichi, Japan',
    'Sapporo, Hokkaido, Japan', 'Kobe, Hyogo, Japan', 'Fukuoka, Fukuoka, Japan',
    'Beijing, China', 'Shanghai, China', 'Guangzhou, China', 'Shenzhen, China',
    'Hong Kong, Hong Kong', 'Seoul, South Korea', 'Busan, South Korea',
    'Moscow, Russia', 'St. Petersburg, Russia', 'Berlin, Germany', 'Munich, Germany',
    'Paris, France', 'Marseille, France', 'Barcelona, Spain', 'Madrid, Spain',
    'Rome, Italy', 'Milan, Italy', 'Amsterdam, Netherlands', 'Stockholm, Sweden',
    'Copenhagen, Denmark', 'Oslo, Norway', 'Helsinki, Finland', 'Zurich, Switzerland',
    'Vienna, Austria', 'Warsaw, Poland', 'Prague, Czech Republic', 'Budapest, Hungary',
    'Athens, Greece', 'Lisbon, Portugal', 'Dublin, Ireland', 'Istanbul, Turkey',
    'Tel Aviv, Israel', 'Cairo, Egypt', 'Johannesburg, South Africa', 'Cape Town, South Africa',
    'Lagos, Nigeria', 'Nairobi, Kenya', 'Mexico City, Mexico', 'Buenos Aires, Argentina',
    'Rio de Janeiro, Brazil', 'São Paulo, Brazil', 'Santiago, Chile', 'Lima, Peru',
    'Bogotá, Colombia', 'Caracas, Venezuela'
  ];
  
  const industryOptions = [
    'Technology/Software', 'Healthcare', 'Finance/Banking', 'Education',
    'Retail/E-commerce', 'Manufacturing', 'Consulting', 'Real Estate',
    'Media/Entertainment', 'Hospitality/Tourism', 'Automotive', 'Telecommunications',
    'Energy/Utilities', 'Agriculture', 'Fashion/Apparel', 'Food & Beverage',
    'Transportation/Logistics', 'Construction', 'Legal Services', 'Government/Public Sector',
    'Non-profit/NGO', 'Biotechnology/Pharmaceuticals', 'Sports/Fitness', 'Art/Design'
  ];
  
  const skillSuggestions = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js', 'TypeScript',
    'HTML/CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Git',
    'Project Management', 'Agile/Scrum', 'Leadership', 'Communication', 'Problem Solving',
    'Data Analysis', 'Machine Learning', 'Artificial Intelligence', 'Cybersecurity',
    'Digital Marketing', 'Content Writing', 'Graphic Design', 'UI/UX Design', 'Photography',
    'Sales', 'Customer Service', 'Business Analysis', 'Financial Analysis', 'Accounting',
    'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Go', 'Rust', 'Scala', 'Perl',
    'MATLAB', 'R', 'SPSS', 'Excel', 'Tableau', 'Power BI', 'SAS', 'TensorFlow',
    'PyTorch', 'Natural Language Processing', 'Computer Vision', 'Deep Learning',
    'Blockchain', 'Solidity', 'Web3', 'DevOps', 'CI/CD', 'Terraform', 'Ansible',
    'Jenkins', 'Microservices', 'RESTful APIs', 'GraphQL', 'Firebase', 'MongoDB Atlas',
    'Redis', 'Elasticsearch', 'Kafka', 'RabbitMQ', 'Network Security', 'Penetration Testing',
    'Ethical Hacking', 'Cloud Security', 'Identity Management', 'Risk Assessment',
    'Adobe Creative Suite', 'Figma', 'Sketch', 'InVision', 'User Research', 'Prototyping',
    'Wireframing', 'Information Architecture', 'Interaction Design', 'Visual Design',
    'SEO', 'SEM', 'Social Media Marketing', 'Email Marketing', 'Content Strategy',
    'Copywriting', 'Brand Management', 'Public Relations', 'Event Planning', 'Salesforce',
    'HubSpot', 'Market Research', 'A/B Testing', 'Conversion Optimization', 'Google Analytics',
    'Financial Modeling', 'Valuation', 'Budgeting', 'Forecasting', 'Risk Management',
    'Audit', 'Tax Preparation', 'QuickBooks', 'SAP', 'Oracle', 'Financial Reporting',
    'Strategic Planning', 'Business Development', 'Partnership Management', 'Contract Negotiation',
    'Team Building', 'Public Speaking', 'Presentation Skills', 'Time Management', 'Conflict Resolution',
    'Critical Thinking', 'Decision Making', 'Adaptability', 'Creativity', 'Emotional Intelligence'
  ];
  
  const interestSuggestions = [
    'Technology', 'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Cybersecurity',
    'Web Development', 'Mobile Development', 'Cloud Computing', 'DevOps', 'Blockchain',
    'Entrepreneurship', 'Startups', 'Innovation', 'Leadership', 'Management', 'Consulting',
    'Finance', 'Investment', 'Marketing', 'Digital Marketing', 'Social Media', 'Content Creation',
    'Design', 'User Experience', 'Photography', 'Video Production', 'Writing', 'Blogging',
    'Travel', 'Sports', 'Fitness', 'Music', 'Art', 'Reading', 'Gaming', 'Cooking',
    'Volunteering', 'Social Impact', 'Sustainability', 'Environment', 'Education', 'Research',
    'Healthcare', 'Biotechnology', 'Pharmaceuticals', 'Mental Health', 'Wellness',
    'Film', 'Theater', 'Dance', 'Fashion', 'Interior Design', 'Architecture',
    'History', 'Philosophy', 'Politics', 'Economics', 'Psychology', 'Sociology',
    'Science', 'Space Exploration', 'Astronomy', 'Physics', 'Chemistry', 'Biology',
    'Engineering', 'Robotics', 'Automotive', 'Aviation', 'Renewable Energy', 'Sustainability',
    'Agriculture', 'Food Science', 'Nutrition', 'Culinary Arts', 'Wine', 'Craft Beer',
    'Outdoor Activities', 'Hiking', 'Camping', 'Cycling', 'Running', 'Swimming',
    'Yoga', 'Meditation', 'Mindfulness', 'Personal Development', 'Coaching', 'Mentoring'
  ];

  // Handle input changes
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleAcademicInfoChange = (e) => {
    const { name, value } = e.target;
    setAcademicInfo(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleProfessionalInfoChange = (e) => {
    const { name, value } = e.target;
    setProfessionalInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCareerStatusChange = (e) => {
    const value = e.target.value;
    setCareerStatus(value);
    
    // Clear career status error when user selects an option
    if (errors.careerStatus) {
      setErrors(prev => ({ ...prev, careerStatus: '' }));
    }
  };
  
  const handleCareerDetailsChange = (e) => {
    const { name, value } = e.target;
    setCareerDetails(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleOtherInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOtherInfo(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing or checks the box
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle blur events to mark fields as touched
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  
  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    // Personal info validation
    if (!personalInfo.fullName) newErrors.fullName = 'Full name is required';
    if (!personalInfo.gender) newErrors.gender = 'Gender is required';
    if (!personalInfo.dob) newErrors.dob = 'Date of birth is required';
    if (!personalInfo.personalEmail) newErrors.personalEmail = 'Personal email is required';
    if (!personalInfo.phone) newErrors.phone = 'Phone number is required';
    if (!personalInfo.location) newErrors.location = 'Location is required';
    
    // Academic info validation
    if (!academicInfo.collegeEmail) newErrors.collegeEmail = 'College email is required';
    if (!academicInfo.enrollmentNumber) newErrors.enrollmentNumber = 'Enrollment number is required';
    if (!academicInfo.degree) newErrors.degree = 'Degree is required';
    if (!academicInfo.branch) newErrors.branch = 'Branch is required';
    if (!academicInfo.graduationYear) newErrors.graduationYear = 'Graduation year is required';
    
    // Career status validation
    if (!careerStatus) newErrors.careerStatus = 'Career status is required';
    
    // Career details validation based on status
    if (careerStatus === 'working') {
      if (!careerDetails.companyName) newErrors.companyName = 'Company name is required';
      if (!careerDetails.jobTitle) newErrors.jobTitle = 'Job title is required';
    } else if (careerStatus === 'entrepreneur') {
      if (!careerDetails.startupName) newErrors.startupName = 'Startup name is required';
      if (!careerDetails.industry) newErrors.industry = 'Industry is required';
      if (!careerDetails.roleInStartup) newErrors.roleInStartup = 'Role is required';
    } else if (careerStatus === 'studies') {
      if (!careerDetails.institutionName) newErrors.institutionName = 'Institution name is required';
      if (!careerDetails.courseArea) newErrors.courseArea = 'Course area is required';
    } else if (careerStatus === 'not-working') {
      if (!careerDetails.careerGoal) newErrors.careerGoal = 'Career goal is required';
    }
    
    // Terms acceptance validation
    if (!otherInfo.termsAccept) newErrors.termsAccept = 'You must accept the terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Experience management
  const handleExperienceInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentExperience(prev => ({ ...prev, [name]: value }));
  };
  
  const addExperience = () => {
    // Validate required fields
    if (!currentExperience.company.trim() || !currentExperience.title.trim()) {
      return; // Prevent adding if required fields are empty
    }
    
    const newExperience = {
      id: Date.now(),
      company: currentExperience.company.trim(),
      title: currentExperience.title.trim(),
      location: currentExperience.location.trim(),
      duration: currentExperience.duration.trim(),
      description: currentExperience.description.trim()
    };
    
    setExperiences(prev => [...prev, newExperience]);
    setCurrentExperience({
      company: '',
      title: '',
      location: '',
      duration: '',
      description: ''
    });
  };
  
  const removeExperience = (id) => {
    setExperiences(prev => prev.filter(exp => exp.id !== id));
  };
  
  // Skills management
  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    setSkillInput(value);
    
    if (value.trim() === '') {
      setShowSkillDropdown(false);
      return;
    }
    
    const filtered = skillSuggestions.filter(skill => 
      skill.toLowerCase().startsWith(value.toLowerCase()) && 
      !skills.includes(skill)
    );
    
    setFilteredSkills(filtered.slice(0, 8));
    setShowSkillDropdown(true);
  };
  
  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
      setShowSkillDropdown(false);
    }
  };
  
  const removeSkill = (skill) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };
  
  const selectSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills(prev => [...prev, skill]);
    }
    setSkillInput('');
    setShowSkillDropdown(false);
  };
  
  // Interests management
  const handleInterestInputChange = (e) => {
    const value = e.target.value;
    setInterestInput(value);
    
    if (value.trim() === '') {
      setShowInterestDropdown(false);
      return;
    }
    
    const filtered = interestSuggestions.filter(interest => 
      interest.toLowerCase().startsWith(value.toLowerCase()) && 
      !interests.includes(interest)
    );
    
    setFilteredInterests(filtered.slice(0, 8));
    setShowInterestDropdown(true);
  };
  
  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests(prev => [...prev, interestInput.trim()]);
      setInterestInput('');
      setShowInterestDropdown(false);
    }
  };
  
  const removeInterest = (interest) => {
    setInterests(prev => prev.filter(i => i !== interest));
  };
  
  const selectInterest = (interest) => {
    if (!interests.includes(interest)) {
      setInterests(prev => [...prev, interest]);
    }
    setInterestInput('');
    setShowInterestDropdown(false);
  };
  
  // Location management - Personal Info
  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);
    setPersonalInfo(prev => ({ ...prev, location: value }));
    
    // Clear error when user starts typing
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
    
    if (value.trim() === '') {
      setShowLocationDropdown(false);
      return;
    }
    
    const filtered = locationOptions.filter(location => 
      location.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredLocations(filtered.slice(0, 8));
    setShowLocationDropdown(true);
  };
  
  // Location management - Company Location
  const handleCompanyLocationInputChange = (e) => {
    const value = e.target.value;
    setCareerDetails(prev => ({ ...prev, companyLocation: value }));
    
    if (value.trim() === '') {
      setShowLocationDropdown(false);
      return;
    }
    
    const filtered = locationOptions.filter(location => 
      location.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredLocations(filtered.slice(0, 8));
    setShowLocationDropdown(true);
  };
  
  // Location management - Institution Location
  const handleInstitutionLocationInputChange = (e) => {
    const value = e.target.value;
    setCareerDetails(prev => ({ ...prev, institutionLocation: value }));
    
    if (value.trim() === '') {
      setShowLocationDropdown(false);
      return;
    }
    
    const filtered = locationOptions.filter(location => 
      location.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredLocations(filtered.slice(0, 8));
    setShowLocationDropdown(true);
  };
  
  // Location management - Experience Location
  const handleExperienceLocationInputChange = (e) => {
    const value = e.target.value;
    setCurrentExperience(prev => ({ ...prev, location: value }));
    
    if (value.trim() === '') {
      setShowLocationDropdown(false);
      return;
    }
    
    const filtered = locationOptions.filter(location => 
      location.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredLocations(filtered.slice(0, 8));
    setShowLocationDropdown(true);
  };
  
  const selectLocation = (location, type = 'personal') => {
    if (type === 'personal') {
      setLocationInput(location);
      setPersonalInfo(prev => ({ ...prev, location }));
      
      // Clear error when user selects a location
      if (errors.location) {
        setErrors(prev => ({ ...prev, location: '' }));
      }
    } else if (type === 'company') {
      setCareerDetails(prev => ({ ...prev, companyLocation: location }));
    } else if (type === 'institution') {
      setCareerDetails(prev => ({ ...prev, institutionLocation: location }));
    } else if (type === 'experience') {
      setCurrentExperience(prev => ({ ...prev, location }));
    }
    setShowLocationDropdown(false);
  };
  
  // File upload handling
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  const removeResumeFile = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Form submission
  // Form submission
// Add this debug logging to your handleSubmit function in AlumniConnectProfile.jsx

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate form
  const isValid = validateForm();
  
  if (!isValid) {
    // Scroll to the first error
    const firstErrorField = Object.keys(errors)[0];
    const element = document.querySelector(`[name="${firstErrorField}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
    return;
  }
  
  // Prepare form data for submission
  const formData = {
    personalInfo,
    academicInfo,
    professionalInfo,
    careerStatus,
    careerDetails,
    otherInfo: {
      ...otherInfo,
      // Remove termsAccept as it's not needed in the profile
      termsAccept: undefined
    },
    experiences,
    skills,
    interests,
    resumeFileName: resumeFile ? resumeFile.name : null
  };
  
  // DEBUG: Log the form data being sent
  console.log('=== FORM SUBMISSION DEBUG ===');
  console.log('Form Data:', JSON.stringify(formData, null, 2));
  console.log('Personal Info:', personalInfo);
  console.log('Academic Info:', academicInfo);
  console.log('Career Status:', careerStatus);
  console.log('Career Details:', careerDetails);
  console.log('============================');
  
  setLoading(true);
  
  try {
    // Save profile to backend
    const result = await saveProfileToBackend(formData);
    
    console.log('=== PROFILE SAVE SUCCESS ===');
    console.log('Backend Response:', result);
    console.log('============================');
    
    setShowSuccess(true);
    
    // Update local storage
    localStorage.setItem('profileCompleted', 'true');
    localStorage.setItem('registrationComplete', 'true');
    
    // Update user data in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userData.profileCompleted = true;
      userData.registrationComplete = true;
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
    
  } catch (error) {
    console.error('=== PROFILE SAVE ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('==========================');
    
    setMessage({
      text: error.message || 'Failed to save profile. Please try again.',
      type: 'error'
    });
  } finally {
    setLoading(false);
  }
};
  
const saveProfileToBackend = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:5000/api/alumni/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to save profile');
    }
    
    return data;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSkillDropdown(false);
      setShowInterestDropdown(false);
      setShowLocationDropdown(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen py-8 relative">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg max-w-md">
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Registration Successful!</h3>
                <p className="text-green-700 text-sm mt-1">
                  Your alumni profile has been created successfully. You can now connect with other alumni.
                </p>
              </div>
              <button 
                onClick={() => setShowSuccess(false)}
                className="text-green-600 hover:text-green-800 transition-colors duration-200"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>
      )}
      {message.text && (
  <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in ${
    message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
  } border rounded-xl p-4 shadow-lg max-w-md`}>
    <div className="flex items-start space-x-3">
      <div className={`p-2 rounded-full ${
        message.type === 'error' ? 'bg-red-100' : 'bg-green-100'
      }`}>
        {message.type === 'error' ? (
          <FaExclamationCircle className="text-red-600 text-xl" />
        ) : (
          <FaCheckCircle className="text-green-600 text-xl" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm">{message.text}</p>
      </div>
      <button 
        onClick={() => setMessage({ text: '', type: '' })}
        className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
      >
        <FaTimes />
      </button>
    </div>
  </div>
)}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Alumni Profile Setup</h1>
          <p className="text-lg text-gray-600">Complete your profile to connect with the alumni network</p>
        </div>
        
        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-12">
          
          {/* Section 1: Personal Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUser className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Personal Information</h2>
            </div>
            <div className="section-divider mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    name="fullName"
                    value={personalInfo.fullName}
                    onChange={handlePersonalInfoChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200`} 
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.fullName}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <div className="relative">
                  <FaVenusMars className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select 
                    name="gender"
                    value={personalInfo.gender}
                    onChange={handlePersonalInfoChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.gender ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200 appearance-none bg-white`}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                {errors.gender && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.gender}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                <div className="relative">
                  <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="date" 
                    name="dob"
                    value={personalInfo.dob}
                    onChange={handlePersonalInfoChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200`}
                  />
                </div>
                {errors.dob && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.dob}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Personal Email *</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" 
                    name="personalEmail"
                    value={personalInfo.personalEmail}
                    onChange={handlePersonalInfoChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.personalEmail ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200`} 
                    placeholder="your.email@example.com"
                  />
                </div>
                {errors.personalEmail && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.personalEmail}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="tel" 
                    name="phone"
                    value={personalInfo.phone}
                    onChange={handlePersonalInfoChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200`} 
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Location *</label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    name="location"
                    value={personalInfo.location}
                    onChange={handleLocationInputChange}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.location ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200`} 
                    placeholder="City, State, Country"
                  />
                  {showLocationDropdown && (
                    <div 
                      className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {filteredLocations.map(location => (
                        <div 
                          key={location}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0" 
                          onClick={() => selectLocation(location, 'personal')}
                        >
                          {location}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.location && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.location}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Section 2: Academic Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <FaGraduationCap className="text-green-600 text-xl" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Academic Information</h2>
            </div>
            <div className="section-divider mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">College Email *</label>
                <div className="relative">
                  <FaUniversity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" 
                    name="collegeEmail"
                    value={academicInfo.collegeEmail}
                    onChange={handleAcademicInfoChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.collegeEmail ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200`} 
                    placeholder="student@university.edu"
                  />
                </div>
                {errors.collegeEmail && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.collegeEmail}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Enrollment Number *</label>
                <div className="relative">
                  <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    name="enrollmentNumber"
                    value={academicInfo.enrollmentNumber}
                    onChange={handleAcademicInfoChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.enrollmentNumber ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200`} 
                    placeholder="Enter enrollment number"
                  />
                </div>
                {errors.enrollmentNumber && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.enrollmentNumber}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Degree *</label>
                <div className="relative">
                  <FaCertificate className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select 
                    name="degree"
                    value={academicInfo.degree}
                    onChange={handleAcademicInfoChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.degree ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200 appearance-none bg-white`}
                  >
                    <option value="">Select Degree</option>
                    {degreeOptions.map(degree => (
                      <option key={degree} value={degree.toLowerCase().replace(/\s+/g, '-')}>
                        {degree}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.degree && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.degree}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Branch *</label>
                <div className="relative">
                  <FaCodeBranch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select 
                    name="branch"
                    value={academicInfo.branch}
                    onChange={handleAcademicInfoChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.branch ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200 appearance-none bg-white`}
                  >
                    <option value="">Select Branch</option>
                    {branchOptions.map(branch => (
                      <option key={branch} value={branch.toLowerCase().replace(/\s+/g, '-')}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.branch && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.branch}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Graduation Year *</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select 
                    name="graduationYear"
                    value={academicInfo.graduationYear}
                    onChange={handleAcademicInfoChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.graduationYear ? 'border-red-500' : 'border-gray-300'} rounded-xl input-focus transition-all duration-200 appearance-none bg-white`}
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
                    <option value="other">Other</option>
                  </select>
                </div>
                {errors.graduationYear && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <FaExclamationCircle className="mr-1" />
                    {errors.graduationYear}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">CGPA (Optional)</label>
                <div className="relative">
                  <FaGraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    name="cgpa"
                    value={academicInfo.cgpa}
                    onChange={handleAcademicInfoChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl input-focus transition-all duration-200" 
                    placeholder="e.g., 8.5 or 3.8"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Section 3: Career Status */}
          <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-purple-100 p-3 rounded-full">
                <FaBriefcase className="text-purple-600 text-xl" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Career Status</h2>
            </div>
            <div className="section-divider mb-8"></div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Current Career Status *</label>
                {errors.careerStatus && (
                  <p className="text-red-500 text-sm flex items-center mb-2">
                    <FaExclamationCircle className="mr-1" />
                    {errors.careerStatus}
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCareerStatus('working');
                      if (errors.careerStatus) {
                        setErrors(prev => ({ ...prev, careerStatus: '' }));
                      }
                    }}
                    className={`py-3 px-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center ${
                      careerStatus === 'working'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FaBuilding className="text-lg mb-1" />
                    <span className="text-sm font-medium">Currently Working</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setCareerStatus('entrepreneur');
                      if (errors.careerStatus) {
                        setErrors(prev => ({ ...prev, careerStatus: '' }));
                      }
                    }}
                    className={`py-3 px-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center ${
                      careerStatus === 'entrepreneur'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FaLightbulb className="text-lg mb-1" />
                    <span className="text-sm font-medium">Entrepreneur</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setCareerStatus('studies');
                      if (errors.careerStatus) {
                        setErrors(prev => ({ ...prev, careerStatus: '' }));
                      }
                    }}
                    className={`py-3 px-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center ${
                      careerStatus === 'studies'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FaGraduation className="text-lg mb-1" />
                    <span className="text-sm font-medium">Higher Studies</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setCareerStatus('not-working');
                      if (errors.careerStatus) {
                        setErrors(prev => ({ ...prev, careerStatus: '' }));
                      }
                    }}
                    className={`py-3 px-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center ${
                      careerStatus === 'not-working'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FaSearch className="text-lg mb-1" />
                    <span className="text-sm font-medium">Not Working</span>
                  </button>
                </div>
              </div>
              
              {/* Conditional Fields Based on Career Status */}
              {careerStatus === 'working' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaBuilding className="text-blue-600 mr-2" />
                    Currently Working Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                      <input 
                        type="text" 
                        name="companyName"
                        value={careerDetails.companyName}
                        onChange={handleCareerDetailsChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.companyName ? 'border-red-500' : 'border-gray-300'} rounded-lg input-focus transition-all duration-200`} 
                        placeholder="Company name"
                      />
                      {errors.companyName && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <FaExclamationCircle className="mr-1" />
                          {errors.companyName}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Job Title/Role *</label>
                      <input 
                        type="text" 
                        name="jobTitle"
                        value={careerDetails.jobTitle}
                        onChange={handleCareerDetailsChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.jobTitle ? 'border-red-500' : 'border-gray-300'} rounded-lg input-focus transition-all duration-200`} 
                        placeholder="Your role/position"
                      />
                      {errors.jobTitle && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <FaExclamationCircle className="mr-1" />
                          {errors.jobTitle}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Company Location</label>
                      <div className="relative">
                        <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          name="companyLocation"
                          value={careerDetails.companyLocation}
                          onChange={handleCompanyLocationInputChange}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200" 
                          placeholder="City, State/Country"
                        />
                        {showLocationDropdown && (
                          <div 
                            className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {filteredLocations.map(location => (
                              <div 
                                key={location}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0" 
                                onClick={() => selectLocation(location, 'company')}
                              >
                                {location}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                      <select 
                        name="yearsOfExperience"
                        value={careerDetails.yearsOfExperience}
                        onChange={handleCareerDetailsChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200 appearance-none bg-white"
                      >
                        <option value="">Select Experience</option>
                        <option value="0-1">0-1 years</option>
                        <option value="1-3">1-3 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {careerStatus === 'entrepreneur' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaLightbulb className="text-blue-600 mr-2" />
                    Entrepreneur Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Startup/Business Name *</label>
                      <input 
                        type="text" 
                        name="startupName"
                        value={careerDetails.startupName}
                        onChange={handleCareerDetailsChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.startupName ? 'border-red-500' : 'border-gray-300'} rounded-lg input-focus transition-all duration-200`} 
                        placeholder="Startup or business name"
                      />
                      {errors.startupName && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <FaExclamationCircle className="mr-1" />
                          {errors.startupName}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Industry/Domain *</label>
                      <select 
                        name="industry"
                        value={careerDetails.industry}
                        onChange={handleCareerDetailsChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.industry ? 'border-red-500' : 'border-gray-300'} rounded-lg input-focus transition-all duration-200 appearance-none bg-white`}
                      >
                        <option value="">Select Industry</option>
                        {industryOptions.map(industry => (
                          <option key={industry} value={industry.toLowerCase().replace(/\s+/g, '-')}>
                            {industry}
                          </option>
                        ))}
                      </select>
                      {errors.industry && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <FaExclamationCircle className="mr-1" />
                          {errors.industry}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Role in the Startup *</label>
                      <input 
                        type="text" 
                        name="roleInStartup"
                        value={careerDetails.roleInStartup}
                        onChange={handleCareerDetailsChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.roleInStartup ? 'border-red-500' : 'border-gray-300'} rounded-lg input-focus transition-all duration-200`} 
                        placeholder="Your role (e.g., CEO, Founder, CTO)"
                      />
                      {errors.roleInStartup && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <FaExclamationCircle className="mr-1" />
                          {errors.roleInStartup}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Years Running the Startup</label>
                      <select 
                        name="yearsRunning"
                        value={careerDetails.yearsRunning}
                        onChange={handleCareerDetailsChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200 appearance-none bg-white"
                      >
                        <option value="">Select Duration</option>
                        <option value="0-1">Less than 1 year</option>
                        <option value="1-2">1-2 years</option>
                        <option value="2-5">2-5 years</option>
                        <option value="5+">5+ years</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {careerStatus === 'studies' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaGraduation className="text-blue-600 mr-2" />
                    Higher Studies / Research Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Institution/University Name *</label>
                      <input 
                        type="text" 
                        name="institutionName"
                        value={careerDetails.institutionName}
                        onChange={handleCareerDetailsChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.institutionName ? 'border-red-500' : 'border-gray-300'} rounded-lg input-focus transition-all duration-200`} 
                        placeholder="University or institution name"
                      />
                      {errors.institutionName && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <FaExclamationCircle className="mr-1" />
                          {errors.institutionName}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Course/Research Area *</label>
                      <input 
                        type="text" 
                        name="courseArea"
                        value={careerDetails.courseArea}
                        onChange={handleCareerDetailsChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.courseArea ? 'border-red-500' : 'border-gray-300'} rounded-lg input-focus transition-all duration-200`} 
                        placeholder="Course name or research area"
                      />
                      {errors.courseArea && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <FaExclamationCircle className="mr-1" />
                          {errors.courseArea}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <div className="relative">
                        <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          name="institutionLocation"
                          value={careerDetails.institutionLocation}
                          onChange={handleInstitutionLocationInputChange}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200" 
                          placeholder="City, State/Country"
                        />
                        {showLocationDropdown && (
                          <div 
                            className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {filteredLocations.map(location => (
                              <div 
                                key={location}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0" 
                                onClick={() => selectLocation(location, 'institution')}
                              >
                                {location}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Expected Graduation Year</label>
                      <select 
                        name="expectedGraduationYear"
                        value={careerDetails.expectedGraduationYear}
                        onChange={handleCareerDetailsChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200 appearance-none bg-white"
                      >
                        <option value="">Select Year</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {careerStatus === 'not-working' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaSearch className="text-blue-600 mr-2" />
                    Career Focus Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Career Goal/Focus *</label>
                      <textarea 
                        name="careerGoal"
                        value={careerDetails.careerGoal}
                        onChange={handleCareerDetailsChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.careerGoal ? 'border-red-500' : 'border-gray-300'} rounded-lg input-focus transition-all duration-200 resize-none`} 
                        rows="3" 
                        placeholder="Describe your career goals or focus areas..."
                      ></textarea>
                      {errors.careerGoal && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <FaExclamationCircle className="mr-1" />
                          {errors.careerGoal}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Section 4: Professional Experience */}
          <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-purple-100 p-3 rounded-full">
                <FaBriefcase className="text-purple-600 text-xl" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Professional Experience</h2>
            </div>
            <div className="section-divider mb-8"></div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                  <span className="text-sm text-gray-500">(Optional)</span>
                </div>
              </div>
              
              {/* Experience Input Form */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <input 
                      type="text" 
                      name="company"
                      value={currentExperience.company}
                      onChange={handleExperienceInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200" 
                      placeholder="Company name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Job Title</label>
                    <input 
                      type="text" 
                      name="title"
                      value={currentExperience.title}
                      onChange={handleExperienceInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200" 
                      placeholder="Your role/position"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        name="location"
                        value={currentExperience.location}
                        onChange={handleExperienceLocationInputChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200" 
                        placeholder="City, State/Country"
                      />
                      {showLocationDropdown && (
                        <div 
                          className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {filteredLocations.map(location => (
                            <div 
                              key={location}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0" 
                              onClick={() => selectLocation(location, 'experience')}
                            >
                              {location}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <input 
                      type="text" 
                      name="duration"
                      value={currentExperience.duration}
                      onChange={handleExperienceInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200" 
                      placeholder="e.g., Jan 2020 - Present"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea 
                    name="description"
                    value={currentExperience.description}
                    onChange={handleExperienceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200 resize-none" 
                    rows="2" 
                    placeholder="Brief description of your role and achievements..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={addExperience}
                    disabled={!currentExperience.company.trim() || !currentExperience.title.trim()}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 ${
                      !currentExperience.company.trim() || !currentExperience.title.trim()
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    <FaPlus />
                    <span>Add Experience</span>
                  </button>
                </div>
              </div>
              
              {/* Added Experiences Display */}
              <div className="space-y-4">
                {experiences.map(exp => (
                  <div key={exp.id} className="bg-white border border-gray-200 rounded-lg p-4 relative">
                    <button 
                      type="button" 
                      onClick={() => removeExperience(exp.id)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors duration-200"
                    >
                      <FaTimes />
                    </button>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <FaBriefcase className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                        <p className="text-gray-700">{exp.company}</p>
                        {exp.location && (
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <FaMapMarkerAlt className="mr-1" />
                            <span>{exp.location}</span>
                          </div>
                        )}
                        {exp.duration && (
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <FaCalendar className="mr-1" />
                            <span>{exp.duration}</span>
                          </div>
                        )}
                        {exp.description && (
                          <p className="text-gray-600 mt-2 text-sm">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {experiences.length === 0 && (
                  <p className="text-sm text-gray-600 italic">No experiences added yet. This section is optional.</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Section 5: Skills & Interests */}
          <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-purple-100 p-3 rounded-full">
                <FaTools className="text-purple-600 text-xl" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Skills & Interests</h2>
            </div>
            <div className="section-divider mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <FaTools className="text-purple-600 text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900">Skills & Technologies</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <FaWrench className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                      <input 
                        type="text" 
                        value={skillInput}
                        onChange={handleSkillInputChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg input-focus transition-all duration-200" 
                        placeholder="Type a skill and press Enter" 
                        autoComplete="off"
                      />
                      {showSkillDropdown && (
                        <div 
                          className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {filteredSkills.map(skill => (
                            <div 
                              key={skill}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0" 
                              onClick={() => selectSkill(skill)}
                            >
                              {skill}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={addSkill}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-200 rounded-lg bg-white">
                    {skills.length === 0 ? (
                      <span className="text-gray-500 text-sm">No skills added yet. Type above and press Enter or click + to add.</span>
                    ) : (
                      skills.map(skill => (
                        <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {skill}
                          <button 
                            type="button" 
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* Areas of Interest Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <FaStar className="text-purple-600 text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900">Areas of Interest</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <FaHeart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                      <input 
                        type="text" 
                        value={interestInput}
                        onChange={handleInterestInputChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg input-focus transition-all duration-200" 
                        placeholder="Type an interest and press Enter" 
                        autoComplete="off"
                      />
                      {showInterestDropdown && (
                        <div 
                          className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {filteredInterests.map(interest => (
                            <div 
                              key={interest}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0" 
                              onClick={() => selectInterest(interest)}
                            >
                              {interest}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={addInterest}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-200 rounded-lg bg-white">
                    {interests.length === 0 ? (
                      <span className="text-gray-500 text-sm">No interests added yet. Type above and press Enter or click + to add.</span>
                    ) : (
                      interests.map(interest => (
                        <span key={interest} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                          {interest}
                          <button 
                            type="button" 
                            onClick={() => removeInterest(interest)}
                            className="ml-2 text-green-600 hover:text-green-800 transition-colors duration-200"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Section 6: Other Essentials */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-orange-100 p-3 rounded-full">
                <FaStar className="text-orange-600 text-xl" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Other Essentials</h2>
            </div>
            <div className="section-divider mb-8"></div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <div className="relative">
                  <FaUserEdit className="absolute left-3 top-4 text-gray-400" />
                  <textarea 
                    name="bio"
                    value={otherInfo.bio}
                    onChange={handleOtherInfoChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl input-focus transition-all duration-200 resize-none" 
                    rows="4" 
                    placeholder="Tell us about yourself, your interests, and what you're passionate about..."
                  ></textarea>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">LinkedIn ID</label>
                  <div className="relative">
                    <FaLinkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      type="url" 
                      name="linkedin"
                      value={otherInfo.linkedin}
                      onChange={handleOtherInfoChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl input-focus transition-all duration-200" 
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">GitHub ID</label>
                  <div className="relative">
                    <FaGithub className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      type="url" 
                      name="github"
                      value={otherInfo.github}
                      onChange={handleOtherInfoChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl input-focus transition-all duration-200" 
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Portfolio</label>
                  <div className="relative">
                    <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      type="url" 
                      name="portfolio"
                      value={otherInfo.portfolio}
                      onChange={handleOtherInfoChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl input-focus transition-all duration-200" 
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Resume Upload</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx" 
                      className="hidden"
                    />
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        onClick={triggerFileInput}
                        className="flex-1 flex items-center justify-center h-12 border-2 border-dashed border-gray-300 rounded-l-xl hover:border-blue-400 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-2 text-gray-500">
                          <FaUpload />
                          <span className="text-sm">
                            {resumeFile ? resumeFile.name : 'Choose file or drag here'}
                          </span>
                        </div>
                      </button>
                      {resumeFile && (
                        <button 
                          type="button" 
                          onClick={removeResumeFile}
                          className="bg-red-100 hover:bg-red-200 text-red-600 h-12 px-4 rounded-r-xl transition-colors duration-200"
                          title="Remove file"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Terms and Policy Agreement */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <FaShieldAlt className="text-blue-600 text-lg" />
              <h3 className="text-lg font-semibold text-gray-900">Terms & Privacy</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input 
                  type="checkbox" 
                  id="termsAccept"
                  name="termsAccept"
                  checked={otherInfo.termsAccept}
                  onChange={handleOtherInfoChange}
                  onBlur={handleBlur}
                  className={`mt-1 h-4 w-4 text-blue-600 ${errors.termsAccept ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-blue-500 focus:ring-2`}
                />
                <label htmlFor="termsAccept" className="text-sm text-gray-700 leading-relaxed">
                  I agree to the{' '}
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle terms of service click
                    }}
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle privacy policy click
                    }}
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Privacy Policy
                  </button>
                  . I understand that my information will be used to connect me with the alumni network and may be shared with other verified alumni members. *
                </label>
              </div>
              {errors.termsAccept && (
                <p className="text-red-500 text-sm flex items-center mt-1">
                  <FaExclamationCircle className="mr-1" />
                  {errors.termsAccept}
                </p>
              )}
              
              <div className="flex items-start space-x-3">
                <input 
                  type="checkbox" 
                  id="emailConsent"
                  name="emailConsent"
                  checked={otherInfo.emailConsent}
                  onChange={handleOtherInfoChange}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="emailConsent" className="text-sm text-gray-700 leading-relaxed">
                  I would like to receive updates about alumni events, networking opportunities, and relevant career information via email. (Optional)
                </label>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <FaInfoCircle className="text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Your Privacy Matters</p>
                    <p>We protect your personal information and only share it with verified alumni members for networking purposes. You can update your privacy preferences anytime after registration.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end pt-8">
<button 
  type="submit" 
  disabled={loading}
  className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-12 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-3 ${
    loading ? 'opacity-75 cursor-not-allowed' : ''
  }`}
>
  {loading ? (
    <>
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="text-lg">Saving...</span>
    </>
  ) : (
    <>
      <span className="text-lg">Complete Registration</span>
      <FaArrowRight />
    </>
  )}
</button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        .section-divider {
          background: linear-gradient(90deg, #3b82f6 0%, #e5e7eb 50%, #3b82f6 100%);
          height: 2px;
        }
        .input-focus:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AlumniConnectProfile;