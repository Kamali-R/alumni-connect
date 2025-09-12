import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AlumniConnectProfile = ({ userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, verified, role } = location.state || {};
  
  // State for form data
  const [formData, setFormData] = useState(() => {
    const initialUserData = location.state?.userData || JSON.parse(localStorage.getItem('user')) || {};
    return {
      firstName: initialUserData.name?.split(' ')[0] || '',
      lastName: initialUserData.name?.split(' ')[1] || '',
      email: initialUserData.email || '',
      phone: '',
      dob: '',
      gender: '',
      address: '',
      city: '',
      state: '',
      country: '',
      degreeType: '',
      fieldOfStudy: '',
      graduationYear: '',
      gpa: '',
      studentId: '',
      activities: '',
      experiences: [{
        jobTitle: '',
        company: '',
        startDate: '',
        endDate: '',
        jobDescription: '',
        industry: '',
        workLocation: ''
      }],
      linkedin: '',
      website: '',
      skills: [],
      bio: '',
      networking: [],
      privacy: ['profile-visible', 'email-notifications'],
      terms: false
    };
  });
  
  const [progress, setProgress] = useState(0);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const formRef = useRef(null);
  
  // Populate graduation years
  const graduationYears = [];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 1950; year--) {
    graduationYears.push(year);
  }
  
  // Check if user data exists and if OTP is verified
  // In AlumniConnectProfile component, update the useEffect
useEffect(() => {
  const token = localStorage.getItem('token');
  const isOtpVerified = localStorage.getItem('otpVerified') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  const profileCompleted = localStorage.getItem('profileCompleted') === 'true';
  
  const urlParams = new URLSearchParams(window.location.search);
  const fromGoogle = urlParams.get('fromGoogle');
  const tokenFromQuery = urlParams.get('token');
  
  // Get role from multiple possible sources
  const effectiveRole = userRole || 
                    localStorage.getItem('userRole') || 
                    (location.state ? location.state.role : null);
  
  // Handle Google auth users
  if (fromGoogle === 'true' && tokenFromQuery) {
    localStorage.setItem('token', tokenFromQuery);
    return;
  }
  
  // If profile is already completed, redirect to dashboard
  if (profileCompleted) {
    setMessage({ 
      text: 'Your profile is already completed. Redirecting to dashboard...', 
      type: 'info' 
    });
    setTimeout(() => {
      if (effectiveRole === 'student') {
        navigate('/student-dashboard');
      } else {
        navigate('/dashboard');
      }
    }, 2000);
    return;
  }
  
  // If we don't have user data and we're not coming from Google, redirect to register
  if (!userData && !token && !isOtpVerified) {
    setMessage({ 
      text: 'Unauthorized access. Please register first.', 
      type: 'error' 
    });
    setTimeout(() => navigate('/register'), 2000);
  } else if (userEmail && userData && userEmail !== userData.email) {
    setMessage({ 
      text: 'Session expired. Please register again.', 
      type: 'error' 
    });
    setTimeout(() => navigate('/register'), 2000);
  } else if (!effectiveRole) {
    setMessage({ 
      text: 'Role information missing. Please register again.', 
      type: 'error' 
    });
    setTimeout(() => navigate('/register'), 2000);
  }
}, [userData, navigate, userRole, location.state]);
  
  // Update progress
  useEffect(() => {
    if (formRef.current) {
      const requiredFields = formRef.current.querySelectorAll('input[required], select[required]');
      const filledFields = Array.from(requiredFields).filter(field => field.value.trim() !== '');
      const newProgress = Math.round((filledFields.length / requiredFields.length) * 100);
      setProgress(newProgress);
    }
  }, [formData]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'terms') {
        setFormData(prev => ({ ...prev, [name]: checked }));
      } else if (name === 'networking[]' || name === 'privacy[]') {
        const key = name === 'networking[]' ? 'networking' : 'privacy';
        setFormData(prev => {
          const newArray = checked 
            ? [...prev[key], value]
            : prev[key].filter(item => item !== value);
          return { ...prev, [key]: newArray };
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle experience changes
  const handleExperienceChange = (index, e) => {
    const { name, value } = e.target;
    const fieldName = name.replace('[]', '');
    
    setFormData(prev => {
      const newExperiences = [...prev.experiences];
      newExperiences[index] = { ...newExperiences[index], [fieldName]: value };
      return { ...prev, experiences: newExperiences };
    });
  };
  
  // Add new experience
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          jobTitle: '',
          company: '',
          startDate: '',
          endDate: '',
          jobDescription: '',
          industry: '',
          workLocation: ''
        }
      ]
    }));
  };
  
  // Remove experience
  const removeExperience = (index) => {
    if (formData.experiences.length <= 1) return;
    
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };
  
  // Add skill
  const addSkill = (skill) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !formData.skills.includes(trimmedSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill]
      }));
      setSkillInput('');
    }
  };
  
  // Remove skill
  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };
  
  // Handle form submission
  // In the AlumniConnectProfile component, update the form submission logic

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate required fields
  const requiredFields = formRef.current.querySelectorAll('input[required], select[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('border-red-500');
      isValid = false;
    } else {
      field.classList.remove('border-red-500');
    }
  });
  
  if (!isValid) {
    setMessage({ text: 'Please fill in all required fields marked with *', type: 'error' });
    return;
  }
  
  // Check terms agreement
  if (!formData.terms) {
    setMessage({ text: 'Please agree to the Terms of Service and Privacy Policy to continue.', type: 'error' });
    return;
  }
  
  try {
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    // Get the token
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Prepare form data
    const submitData = {
      ...formData,
      role: userRole || role || localStorage.getItem('userRole')
    };
    
    // For alumni, generate studentId if not provided
    if (isAlumni && !submitData.studentId) {
      const timestamp = Date.now().toString().slice(-6);
      submitData.studentId = `ALUM-${timestamp}`;
    }
    
    console.log('Submitting profile data:', submitData);
    
    // Update the user profile
    const response = await axios.post('http://localhost:5000/complete-profile', submitData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Profile update response:', response.data);
    
    if (response.data && response.data.message) {
      setMessage({ 
        text: 'Profile completed successfully! Redirecting to dashboard...', 
        type: 'success' 
      });
      
      // Update user data in localStorage - this is crucial
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userRole', response.data.user.role);
        localStorage.setItem('profileCompleted', 'true');
      }
      
      // Clear OTP verification data
      localStorage.removeItem('otpVerified');
      localStorage.removeItem('userEmail');
      
      // Redirect to dashboard after successful profile completion
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      throw new Error('Profile update failed');
    }
    
  } catch (error) {
    console.error('Profile update error:', error);
    
    let errorMessage = 'Profile update failed. Please try again.';
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Authentication expired. Please login again.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response.status === 400) {
        errorMessage = error.response.data.message || error.response.data.error || 'Invalid profile data.';
      } else {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      }
    }
    
    setMessage({ text: errorMessage, type: 'error' });
  } finally {
    setLoading(false);
  }
};
  // Save as draft
  const saveAsDraft = () => {
    // In a real application, you would save the current form state
    setMessage({ 
      text: 'Profile saved as draft. You can complete it later from your account settings.', 
      type: 'success' 
    });
  };
  
  // If no user data, show loading or error
  if (!userData || !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 mb-2">Redirecting...</div>
          <div className="text-gray-600">Please wait while we redirect you to the registration page.</div>
        </div>
      </div>
    );
  }
  
  // Determine if user is alumni or student
  const isAlumni = userRole === 'alumni' || role === 'alumni' || localStorage.getItem('userRole') === 'alumni';
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-indigo-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Alumni Connect</h1>
            </div>
            <div className="text-sm text-gray-600">
              Complete Your {isAlumni ? 'Alumni' : 'Student'} Profile
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Alumni Connect!</h2>
          <p className="text-lg text-gray-600 mb-2">
            Let's complete your {isAlumni ? 'alumni' : 'student'} profile to connect you with the community
          </p>
          <p className="text-sm text-gray-500">
            This information helps us create meaningful connections within our alumni network
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {progress}% Complete
          </p>
        </div>
        
        {/* Form Container */}
        <form 
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {/* Message Display */}
          {message.text && (
            <div className={`mb-6 p-3 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-100 text-red-700 border-l-4 border-red-500'
                : 'bg-green-100 text-green-700 border-l-4 border-green-500'
            }`}>
              {message.text}
            </div>
          )}
          
          {/* Personal Details Section */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Personal Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Educational Details Section */}
          {/* Educational Details Section */}
<div className="mb-8">
  <div className="flex items-center mb-6">
    <div className="bg-indigo-100 p-2 rounded-lg mr-3">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-800">Educational Details</h3>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Degree Type *</label>
      <select
        name="degreeType"
        value={formData.degreeType}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        required
      >
        <option value="">Select Degree</option>
        <option value="bachelor">Bachelor's</option>
        <option value="master">Master's</option>
        <option value="doctorate">Doctorate</option>
        <option value="diploma">Diploma</option>
        <option value="certificate">Certificate</option>
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study *</label>
      <input
        type="text"
        name="fieldOfStudy"
        value={formData.fieldOfStudy}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="e.g., Computer Science"
        required
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {isAlumni ? 'Graduation Year' : 'Expected Graduation Year'} *
      </label>
      <select
        name="graduationYear"
        value={formData.graduationYear}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        required
      >
        <option value="">Select Year</option>
        {graduationYears.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
      <input
        type="text"
        name="gpa"
        value={formData.gpa}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="e.g., 3.8"
      />
    </div>
    
    {/* Only show Student ID field for students */}
    {!isAlumni && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
        <input
          type="text"
          name="studentId"
          value={formData.studentId}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
    )}
    
    {/* For alumni, we'll add a hidden field for studentId that will be populated on the backend */}
    {isAlumni && (
      <input
        type="hidden"
        name="studentId"
        value={formData.studentId}
      />
    )}
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Activities & Societies</label>
      <textarea
        name="activities"
        value={formData.activities}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        rows="2"
        placeholder="e.g., Debate Club, Football Team"
      ></textarea>
    </div>
  </div>
</div>
          
          {/* Professional Experience Section - Only for Alumni */}
          {isAlumni && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Professional Experience</h3>
                </div>
                
                {formData.experiences.length < 5 && (
                  <button
                    type="button"
                    onClick={addExperience}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Experience
                  </button>
                )}
              </div>
              
              {formData.experiences.map((experience, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-800">Experience {index + 1}</h4>
                    {formData.experiences.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        name="jobTitle[]"
                        value={experience.jobTitle}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Software Engineer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        name="company[]"
                        value={experience.company}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Tech Company"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="month"
                        name="startDate[]"
                        value={experience.startDate}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="month"
                        name="endDate[]"
                        value={experience.endDate}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <input
                        type="text"
                        name="industry[]"
                        value={experience.industry}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Technology"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                      <input
                        type="text"
                        name="workLocation[]"
                        value={experience.workLocation}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., New York, USA"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                      <textarea
                        name="jobDescription[]"
                        value={experience.jobDescription}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows="2"
                        placeholder="Brief description of your role and responsibilities"
                      ></textarea>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Skills Section */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Skills</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Skills</label>
              <div className="flex">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., JavaScript, Project Management"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <div key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full flex items-center">
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="ml-2 text-indigo-600 hover:text-indigo-900"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Information Section */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Additional Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Tell us about yourself, your achievements, and goals"
                ></textarea>
              </div>
              
              {isAlumni && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                    <input
                      type="text"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personal Website</label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Privacy Settings Section */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Privacy Settings</h3>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="privacy[]"
                  value="profile-visible"
                  checked={formData.privacy.includes('profile-visible')}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make my profile visible to other alumni and students
                </span>
              </label>
              
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="privacy[]"
                  value="email-notifications"
                  checked={formData.privacy.includes('email-notifications')}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Send me email notifications about events and opportunities
                </span>
              </label>
              
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="privacy[]"
                  value="contact-alumni"
                  checked={formData.privacy.includes('contact-alumni')}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Allow other alumni to contact me for mentorship opportunities
                </span>
              </label>
            </div>
          </div>
          
          {/* Terms and Submit */}
          <div className="border-t pt-8">
            <div className="mb-6">
              <label className="flex items-start">
                <input 
                  type="checkbox" 
                  name="terms" 
                  required 
                  checked={formData.terms}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1" 
                />
                <span className="ml-2 text-sm text-gray-700">
                  I agree to the{' '}
                  <button 
                    type="button" 
                    className="text-indigo-600 hover:text-indigo-800 underline bg-transparent border-none p-0 cursor-pointer"
                    onClick={() => alert('Terms of Service would open here')}
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button 
                    type="button" 
                    className="text-indigo-600 hover:text-indigo-800 underline bg-transparent border-none p-0 cursor-pointer"
                    onClick={() => alert('Privacy Policy would open here')}
                  >
                    Privacy Policy
                  </button>{' '}
                  *
                </span>
              </label>
            </div>
            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={saveAsDraft}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Save as Draft
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlumniConnectProfile;