import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    personalEmail: '',
    phone: '',
    rollNumber: '',
    collegeEmail: '',
    degree: '',
    otherDegree: '',
    branch: '',
    currentYear: '',
    graduationYear: '',
    linkedin: '',
    github: '',
    skills: [],
    otherSkills: '',
    interests: [],
    otherInterests: '',
    careerGoals: '',
    terms: false
  });
  const [profileImage, setProfileImage] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [showOtherDegree, setShowOtherDegree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  useEffect(() => {
    // Load saved profile image from localStorage
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

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

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target.result;
      setProfileImage(imageDataUrl);
      localStorage.setItem('profileImage', imageDataUrl);
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
      // Prepare data for submission
      const submissionData = {
        ...formData,
        profileImage,
        resumeFile: resumeFile ? resumeFile.name : null
      };

      // In a real application, you would send this data to your backend
      const response = await axios.post('/student/profile', submissionData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Clear progress and show success
      setTimeout(() => {
        setLoading(false);
        setShowSuccessModal(true);
        clearInterval(interval);
      }, 1000);

    } catch (error) {
      console.error('Error submitting profile:', error);
      setLoading(false);
      clearInterval(interval);
      alert('Error submitting profile. Please try again.');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleBack = () => {
    if (window.confirm('Are you sure you want to go back? Your changes may not be saved.')) {
      navigate(-1);
    }
  };

  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
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
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
                <div className="icon-circle"></div>
                <div className="icon-fix"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-4">Account Created Successfully!</h2>
            <p className="text-gray-600 mt-2">Your student profile has been created. You can now connect with alumni.</p>
            <div className="mt-6">
              <button 
                onClick={handleGoToDashboard}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-300 w-full"
              >
                Go to Dashboard
              </button>
            </div>
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
                className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition duration-200 mb-2">
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
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
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
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth*</label>
                <input 
                  type="date" 
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-700 mb-1">Personal Email*</label>
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
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Academic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1">Roll Number*</label>
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
                <label htmlFor="collegeEmail" className="block text-sm font-medium text-gray-700 mb-1">College Email ID*</label>
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
                <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">Degree*</label>
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
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">Branch/Specialization*</label>
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
                <label htmlFor="currentYear" className="block text-sm font-medium text-gray-700 mb-1">Current Year*</label>
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
                <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">Expected Graduation Year*</label>
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
                </select>
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
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">Resume/CV</label>
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition duration-200 w-full justify-center">
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
                <label key={skill} className="inline-flex items-center">
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
                <label key={interest.value} className="inline-flex items-center">
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
                placeholder="Briefly describe your career aspirations..." 
              ></textarea>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="pt-2">
            <label className="flex items-start">
              <input 
                type="checkbox" 
                name="terms"
                checked={formData.terms}
                onChange={handleInputChange}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-1" 
                required 
              />
              <span className="ml-2 text-sm text-gray-700">I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-800">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</a></span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
            <button 
              type="button" 
              onClick={handleBack}
              className="order-2 sm:order-1 px-6 py-3 border border-gray-300 text-indigo-600 font-medium rounded-lg hover:bg-gray-50 transition duration-300"
            >
              Back
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="order-1 sm:order-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .success-checkmark {
          width: 80px;
          height: 80px;
          margin: 0 auto;
          position: relative;
        }
        
        .success-checkmark .check-icon {
          width: 80px;
          height: 80px;
          position: relative;
          border-radius: 50%;
          box-sizing: content-box;
          border: 4px solid #4CAF50;
        }
        
        .success-checkmark .check-icon::before {
          top: 3px;
          left: -2px;
          width: 30px;
          transform-origin: 100% 50%;
          border-radius: 100px 0 0 100px;
        }
        
        .success-checkmark .check-icon::after {
          top: 0;
          left: 30px;
          width: 60px;
          transform-origin: 0 50%;
          border-radius: 0 100px 100px 0;
          animation: rotate-circle 4.25s ease-in;
        }
        
        .success-checkmark .check-icon::before, .success-checkmark .check-icon::after {
          content: '';
          height: 100px;
          position: absolute;
          background: #FFFFFF;
          transform: rotate(-45deg);
        }
        
        .success-checkmark .check-icon .icon-line {
          height: 5px;
          background-color: #4CAF50;
          display: block;
          border-radius: 2px;
          position: absolute;
          z-index: 10;
        }
        
        .success-checkmark .check-icon .icon-line.line-tip {
          top: 46px;
          left: 14px;
          width: 25px;
          transform: rotate(45deg);
          animation: icon-line-tip 0.75s;
        }
        
        .success-checkmark .check-icon .icon-line.line-long {
          top: 38px;
          right: 8px;
          width: 47px;
          transform: rotate(-45deg);
          animation: icon-line-long 0.75s;
        }
        
        .success-checkmark .check-icon .icon-circle {
          top: -4px;
          left: -4px;
          z-index: 10;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          position: absolute;
          box-sizing: content-box;
          border: 4px solid rgba(76, 175, 80, .5);
        }
        
        .success-checkmark .check-icon .icon-fix {
          top: 8px;
          width: 5px;
          left: 26px;
          z-index: 1;
          height: 85px;
          position: absolute;
          transform: rotate(-45deg);
          background-color: #FFFFFF;
        }
        
        @keyframes rotate-circle {
          0% { transform: rotate(-45deg); }
          5% { transform: rotate(-45deg); }
          12% { transform: rotate(-405deg); }
          100% { transform: rotate(-405deg); }
        }
        
        @keyframes icon-line-tip {
          0% { width: 0; left: 1px; top: 19px; }
          54% { width: 0; left: 1px; top: 19px; }
          70% { width: 50px; left: -8px; top: 37px; }
          84% { width: 17px; left: 21px; top: 48px; }
          100% { width: 25px; left: 14px; top: 46px; }
        }
        
        @keyframes icon-line-long {
          0% { width: 0; right: 46px; top: 54px; }
          65% { width: 0; right: 46px; top: 54px; }
          84% { width: 55px; right: 0px; top: 35px; }
          100% { width: 47px; right: 8px; top: 38px; }
        }
      `}</style>
    </div>
  );
};

export default studentprofile;