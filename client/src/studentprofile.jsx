import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const StudentProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dob: '',
    personalEmail: '',
    phone: '',
    location: '',
    rollNumber: '',
    collegeEmail: '',
    degree: '',
    otherDegree: '',
    branch: '',
    currentYear: '',
    graduationYear: '',
    cgpa: '',
    linkedin: '',
    github: '',
    portfolio: '',
    skills: [],
    otherSkills: '',
    interests: [],
    otherInterests: '',
    careerGoals: '',
    terms: false
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [showOtherDegree, setShowOtherDegree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  useEffect(() => {
    // Load user data from navigation state
    if (location.state?.userData) {
      const userData = location.state.userData;
      setFormData(prev => ({
        ...prev,
        personalEmail: userData.email || '',
        fullName: userData.name || ''
      }));
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'skills' || name === 'interests') {
        const updatedValues = checked
          ? [...formData[name], value]
          : formData[name].filter(item => item !== value);
        
        setFormData(prev => ({
          ...prev,
          [name]: updatedValues
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      if (name === 'degree') {
        setShowOtherDegree(value === 'Other');
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB. Please choose a smaller image.');
      return;
    }

    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB. Please choose a smaller file.');
      return;
    }

    setResumeFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.fullName || !formData.rollNumber || !formData.collegeEmail || 
        !formData.degree || !formData.branch || !formData.currentYear || !formData.graduationYear) {
      alert('Please fill all required fields');
      return;
    }

    // Validate interests
    if (formData.interests.length === 0) {
      alert('Please select at least one area of interest');
      return;
    }

    // Validate other degree
    if (formData.degree === 'Other' && !formData.otherDegree.trim()) {
      alert('Please specify your degree');
      return;
    }

    if (!formData.terms) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare FormData for submission
      const submissionData = new FormData();
      
      // Prepare profile data
      const profileData = {
        personalInfo: {
          fullName: formData.fullName,
          gender: formData.gender,
          dob: formData.dob,
          personalEmail: formData.personalEmail,
          phone: formData.phone,
          location: formData.location
        },
        academicInfo: {
          rollNumber: formData.rollNumber,
          collegeEmail: formData.collegeEmail,
          degree: formData.degree === 'Other' ? formData.otherDegree : formData.degree,
          branch: formData.branch,
          currentYear: formData.currentYear,
          graduationYear: formData.graduationYear,
          cgpa: formData.cgpa
        },
        professionalInfo: {
          linkedin: formData.linkedin,
          github: formData.github,
          portfolio: formData.portfolio
        },
        skills: formData.skills,
        interests: formData.interests,
        careerGoals: formData.careerGoals
      };

      // Append JSON data
      submissionData.append('personalInfo', JSON.stringify(profileData.personalInfo));
      submissionData.append('academicInfo', JSON.stringify(profileData.academicInfo));
      submissionData.append('professionalInfo', JSON.stringify(profileData.professionalInfo));
      submissionData.append('skills', JSON.stringify(profileData.skills));
      submissionData.append('interests', JSON.stringify(profileData.interests));
      submissionData.append('careerGoals', profileData.careerGoals);

      // Add files
      if (profileImage) {
        submissionData.append('profileImage', profileImage);
      }
      if (resumeFile) {
        submissionData.append('resume', resumeFile);
      }

      console.log('Submitting student profile...');

      const response = await axios.post('http://localhost:5000/api/student/profile', submissionData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Profile submission response:', response.data);

      // Clear progress and show success
      setTimeout(() => {
        setLoading(false);
        setShowSuccessModal(true);
        clearInterval(interval);
        
        // Update localStorage
        localStorage.setItem('profileCompleted', 'true');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...user,
          profileCompleted: true,
          registrationComplete: true
        }));
      }, 1000);

    } catch (error) {
      console.error('Error submitting profile:', error);
      setLoading(false);
      clearInterval(interval);
      alert(error.response?.data?.message || 'Error submitting profile. Please try again.');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/student-dashboard');
  };

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Progress Bar */}
      {loading && (
        <div className="fixed top-0 left-0 h-1 bg-indigo-600 transition-all duration-300" 
             style={{ width: `${progress}%` }}></div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Created Successfully!</h2>
            <p className="text-gray-600 mb-6">Your student profile has been created. You can now access the student dashboard.</p>
            <button 
              onClick={handleGoToDashboard}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-300 w-full"
            >
              Go to Student Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8 mb-10">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Complete Your Student Profile</h1>
          <p className="text-gray-600">Help us personalize your experience and connect you with alumni</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Profile Photo</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div 
                className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer relative overflow-hidden border-2 border-dashed border-gray-300"
                onClick={() => fileInputRef.current?.click()}
              >
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition duration-200 mb-2">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                  </svg>
                  Upload Photo
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                <p className="text-xs text-gray-500">JPG or PNG, max 2MB</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select 
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              
              <div>
                <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-700 mb-1">Personal Email *</label>
                <input 
                  type="email" 
                  id="personalEmail"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input 
                  type="text" 
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="City, Country" 
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Academic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1">Roll Number *</label>
                <input 
                  type="text" 
                  id="rollNumber"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g., 21CS10045" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="collegeEmail" className="block text-sm font-medium text-gray-700 mb-1">College Email ID *</label>
                <input 
                  type="email" 
                  id="collegeEmail"
                  name="collegeEmail"
                  value={formData.collegeEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
                <select 
                  id="degree"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  required
                >
                  <option value="">Select degree</option>
                  <option value="B.Tech">B.Tech / B.E.</option>
                  <option value="M.Tech">M.Tech / M.E.</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="BSc">BSc</option>
                  <option value="MSc">MSc</option>
                  <option value="BBA">BBA</option>
                  <option value="MBA">MBA</option>
                  <option value="PhD">PhD</option>
                  <option value="Other">Other</option>
                </select>
                {showOtherDegree && (
                  <div className="mt-2">
                    <input 
                      type="text" 
                      id="otherDegree"
                      name="otherDegree"
                      value={formData.otherDegree}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      placeholder="Please specify your degree" 
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">Branch/Specialization *</label>
                <input 
                  type="text" 
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g., Computer Science, Mechanical" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="currentYear" className="block text-sm font-medium text-gray-700 mb-1">Current Year *</label>
                <select 
                  id="currentYear"
                  name="currentYear"
                  value={formData.currentYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  required
                >
                  <option value="">Select current year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">Expected Graduation Year *</label>
                <select 
                  id="graduationYear"
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  required
                >
                  <option value="">Select year</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                  <option value="2030">2030</option>
                </select>
              </div>

              <div>
                <label htmlFor="cgpa" className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
                <input 
                  type="text" 
                  id="cgpa"
                  name="cgpa"
                  value={formData.cgpa}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g., 8.5" 
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Professional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                    linkedin.com/in/
                  </span>
                  <input 
                    type="text" 
                    id="linkedin"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="username" 
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">GitHub Profile</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                    github.com/
                  </span>
                  <input 
                    type="text" 
                    id="github"
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="username" 
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 mb-1">Portfolio Website</label>
                <input 
                  type="url" 
                  id="portfolio"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="https://yourportfolio.com" 
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">Resume/CV</label>
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition duration-200 w-full justify-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                  {resumeFile ? resumeFile.name : 'Upload Resume'}
                  <input 
                    type="file" 
                    ref={resumeInputRef}
                    id="resume"
                    className="hidden" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX, max 5MB</p>
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Technical Skills</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {['java', 'python', 'javascript', 'html_css', 'react', 'angular', 'node', 'sql', 'nosql', 'aws', 'docker', 'git'].map(skill => (
                <label key={skill} className="inline-flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="skills"
                    value={skill}
                    checked={formData.skills.includes(skill)}
                    onChange={handleInputChange}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" 
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {skill === 'html_css' ? 'HTML/CSS' : 
                     skill === 'nosql' ? 'NoSQL' : 
                     skill === 'aws' ? 'AWS' : 
                     skill === 'node' ? 'Node.js' : skill}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <label htmlFor="otherSkills" className="block text-sm font-medium text-gray-700 mb-1">Other Skills</label>
              <input 
                type="text" 
                id="otherSkills"
                name="otherSkills"
                value={formData.otherSkills}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="Enter any other skills, separated by commas" 
              />
            </div>
          </div>

          {/* Areas of Interest */}
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Areas of Interest</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {[
                {value: 'ai_ml', label: 'AI/Machine Learning'},
                {value: 'web_dev', label: 'Web Development'},
                {value: 'mobile_dev', label: 'Mobile Development'},
                {value: 'cloud', label: 'Cloud Computing'},
                {value: 'data_science', label: 'Data Science'},
                {value: 'cybersecurity', label: 'Cybersecurity'},
                {value: 'iot', label: 'Internet of Things'},
                {value: 'blockchain', label: 'Blockchain'},
                {value: 'ar_vr', label: 'AR/VR'},
                {value: 'ui_ux', label: 'UI/UX Design'},
                {value: 'devops', label: 'DevOps'},
                {value: 'robotics', label: 'Robotics'}
              ].map(interest => (
                <label key={interest.value} className="inline-flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="interests"
                    value={interest.value}
                    checked={formData.interests.includes(interest.value)}
                    onChange={handleInputChange}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" 
                  />
                  <span className="ml-2 text-sm text-gray-700">{interest.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <label htmlFor="otherInterests" className="block text-sm font-medium text-gray-700 mb-1">Other Interests</label>
              <input 
                type="text" 
                id="otherInterests"
                name="otherInterests"
                value={formData.otherInterests}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="Enter any other interests, separated by commas" 
              />
            </div>
          </div>

          {/* Career Goals */}
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Career Goals</h2>
            <div>
              <textarea 
                id="careerGoals"
                name="careerGoals"
                value={formData.careerGoals}
                onChange={handleInputChange}
                rows="3" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="Briefly describe your career aspirations, what you hope to achieve after graduation, and how alumni connections can help you..." 
              ></textarea>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="pt-2">
            <label className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input 
                type="checkbox" 
                name="terms"
                checked={formData.terms}
                onChange={handleInputChange}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-1" 
                required 
              />
              <span className="ml-3 text-sm text-gray-700">
                I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-800">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</a>. I understand that my information will be used to connect me with alumni and enhance my career opportunities.
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="order-2 sm:order-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition duration-300"
            >
              Back
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="order-1 sm:order-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-300 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating Profile...
                </>
              ) : (
                'Complete Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;