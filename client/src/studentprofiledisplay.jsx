import React, { useState, useEffect } from 'react';
import {
  FaUser, FaVenusMars, FaCalendar, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaGraduationCap, FaUniversity, FaIdCard, FaCodeBranch, FaCalendarAlt,
  FaBriefcase, FaTools, FaStar, FaUserEdit, FaGlobe, FaUpload, FaInfoCircle,
  FaPlus, FaTimes, FaCheckCircle, FaEdit, FaCamera, FaSave, FaLinkedin, FaGithub, FaFile
} from 'react-icons/fa';
import axios from 'axios';

const StudentProfileDisplay = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    personalInfo: {},
    academicInfo: {},
    professionalInfo: {},
    skills: [],
    interests: [],
    careerGoals: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
     
      setProfileData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    // Initialize editData with current profile data
    setEditData({
      personalInfo: { ...profileData.personalInfo },
      academicInfo: { ...profileData.academicInfo },
      professionalInfo: { ...profileData.professionalInfo },
      skills: [...(profileData.skills || [])],
      interests: [...(profileData.interests || [])],
      careerGoals: profileData.careerGoals || ''
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleInputChange = (section, field, value) => {
    setEditData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (arrayName, value, action) => {
    setEditData(prev => {
      const currentArray = prev[arrayName] || [];
      let newArray;
      
      if (action === 'add') {
        newArray = [...currentArray, value];
      } else if (action === 'remove') {
        newArray = currentArray.filter(item => item !== value);
      } else {
        newArray = currentArray;
      }
      
      return {
        ...prev,
        [arrayName]: newArray
      };
    });
  };

  const handleImageUpload = (e) => {
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
      setResumeFile(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdateLoading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('personalInfo', JSON.stringify(editData.personalInfo));
      formData.append('academicInfo', JSON.stringify(editData.academicInfo));
      formData.append('professionalInfo', JSON.stringify(editData.professionalInfo));
      formData.append('skills', JSON.stringify(editData.skills));
      formData.append('interests', JSON.stringify(editData.interests));
      formData.append('careerGoals', editData.careerGoals);

      if (profileImage) {
        formData.append('profileImage', profileImage);
      }
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const response = await axios.put('http://localhost:5000/api/student/profile', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
     
      setProfileData(response.data.student);
      setIsEditing(false);
      setError(null);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile data:', err);
      setError('Failed to update profile. Please try again later.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getDegreeDisplayValue = (degreeValue) => {
    if (!degreeValue) return 'Not specified';
   
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
   
    return degreeMap[degreeValue.toLowerCase()] || degreeValue;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">No profile data found. Please complete your profile first.</p>
          </div>
        </div>
      </div>
    );
  }

  const { personalInfo, academicInfo, professionalInfo, skills, interests, careerGoals } = profileData;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
          {isEditing ? (
            <div className="flex space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 flex items-center"
              >
                <FaTimes className="mr-2" /> Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={updateLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
              >
                {updateLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" /> Update Profile
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <FaUserEdit className="mr-2" /> Edit Profile
            </button>
          )}
        </div>
       
        {/* Profile Image Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : profileData.profileImage ? (
                  <img 
                    src={`http://localhost:5000/uploads/${profileData.profileImage}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <FaUser className="text-gray-400 text-4xl" />
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <FaCamera />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.personalInfo.fullName || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
                    className="text-2xl font-bold bg-gray-100 px-3 py-1 rounded w-full border border-gray-300"
                  />
                ) : (
                  personalInfo?.fullName || 'Not specified'
                )}
              </h2>
              <p className="text-gray-600">
                {isEditing ? (
                  <div className="flex space-x-2 mt-2">
                    <select
                      value={editData.academicInfo.degree || ''}
                      onChange={(e) => handleInputChange('academicInfo', 'degree', e.target.value)}
                      className="bg-gray-100 px-3 py-1 rounded border border-gray-300"
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
                    <input
                      type="text"
                      value={editData.academicInfo.branch || ''}
                      onChange={(e) => handleInputChange('academicInfo', 'branch', e.target.value)}
                      placeholder="Branch"
                      className="bg-gray-100 px-3 py-1 rounded border border-gray-300"
                    />
                  </div>
                ) : (
                  <>
                    {academicInfo?.degree ? getDegreeDisplayValue(academicInfo.degree) : 'Degree not specified'}
                    {academicInfo?.branch ? ` in ${academicInfo.branch}` : ''}
                  </>
                )}
              </p>
              <p className="text-gray-600">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.academicInfo.graduationYear || ''}
                    onChange={(e) => handleInputChange('academicInfo', 'graduationYear', e.target.value)}
                    placeholder="Graduation Year"
                    className="bg-gray-100 px-3 py-1 rounded border border-gray-300 mt-2"
                  />
                ) : (
                  academicInfo?.graduationYear ? `Class of ${academicInfo.graduationYear}` : 'Graduation year not specified'
                )}
              </p>
              <p className="text-gray-600 mt-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.personalInfo.location || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'location', e.target.value)}
                    placeholder="Location"
                    className="bg-gray-100 px-3 py-1 rounded border border-gray-300"
                  />
                ) : (
                  personalInfo?.location || 'Location not specified'
                )}
              </p>
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
              <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.personalInfo.fullName || ''}
                  onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">{personalInfo?.fullName || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
              {isEditing ? (
                <select
                  value={editData.personalInfo.gender || ''}
                  onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              ) : (
                <p className="text-gray-900">{personalInfo?.gender || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.personalInfo.dob ? new Date(editData.personalInfo.dob).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('personalInfo', 'dob', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">
                  {personalInfo?.dob ? new Date(personalInfo.dob).toLocaleDateString() : 'Not specified'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Personal Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.personalInfo.personalEmail || ''}
                  onChange={(e) => handleInputChange('personalInfo', 'personalEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">{personalInfo?.personalEmail || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.personalInfo.phone || ''}
                  onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">{personalInfo?.phone || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.personalInfo.location || ''}
                  onChange={(e) => handleInputChange('personalInfo', 'location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">{personalInfo?.location || 'Not specified'}</p>
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
              <label className="block text-sm font-medium text-gray-500 mb-1">College Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.academicInfo.collegeEmail || ''}
                  onChange={(e) => handleInputChange('academicInfo', 'collegeEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">{academicInfo?.collegeEmail || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Roll Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.academicInfo.rollNumber || ''}
                  onChange={(e) => handleInputChange('academicInfo', 'rollNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">{academicInfo?.rollNumber || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Degree</label>
              {isEditing ? (
                <select
                  value={editData.academicInfo.degree || ''}
                  onChange={(e) => handleInputChange('academicInfo', 'degree', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                <p className="text-gray-900">
                  {academicInfo?.degree ? getDegreeDisplayValue(academicInfo.degree) : 'Not specified'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Branch</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.academicInfo.branch || ''}
                  onChange={(e) => handleInputChange('academicInfo', 'branch', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">{academicInfo?.branch || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Current Year</label>
              {isEditing ? (
                <select
                  value={editData.academicInfo.currentYear || ''}
                  onChange={(e) => handleInputChange('academicInfo', 'currentYear', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              ) : (
                <p className="text-gray-900">
                  {academicInfo?.currentYear ? `${academicInfo.currentYear} Year` : 'Not specified'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Graduation Year</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.academicInfo.graduationYear || ''}
                  onChange={(e) => handleInputChange('academicInfo', 'graduationYear', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">{academicInfo?.graduationYear || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">CGPA</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.academicInfo.cgpa || ''}
                  onChange={(e) => handleInputChange('academicInfo', 'cgpa', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">{academicInfo?.cgpa || 'Not specified'}</p>
              )}
            </div>
          </div>
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
              <label className="block text-sm font-medium text-gray-500 mb-1">Skills</label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editData.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleArrayChange('skills', skill, 'remove')}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Add a skill"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          handleArrayChange('skills', e.target.value.trim(), 'add');
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        if (input.value.trim()) {
                          handleArrayChange('skills', input.value.trim(), 'add');
                          input.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills && skills.length > 0 ? (
                    skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills added yet.</p>
                  )}
                </div>
              )}
            </div>
            {/* Interests Section */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Interests</label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editData.interests.map((interest, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {interest}
                        <button
                          type="button"
                          onClick={() => handleArrayChange('interests', interest, 'remove')}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Add an interest"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          handleArrayChange('interests', e.target.value.trim(), 'add');
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        if (input.value.trim()) {
                          handleArrayChange('interests', input.value.trim(), 'add');
                          input.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {interests && interests.length > 0 ? (
                    interests.map((interest, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No interests added yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
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
              <label className="block text-sm font-medium text-gray-500 mb-1">Career Goals</label>
              {isEditing ? (
                <textarea
                  value={editData.careerGoals || ''}
                  onChange={(e) => setEditData(prev => ({...prev, careerGoals: e.target.value}))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-line">
                  {careerGoals || 'No career goals added yet.'}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">LinkedIn</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.professionalInfo.linkedin || ''}
                    onChange={(e) => handleInputChange('professionalInfo', 'linkedin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-gray-900">
                    {professionalInfo?.linkedin ? (
                      <a href={professionalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {professionalInfo.linkedin}
                      </a>
                    ) : 'Not provided'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">GitHub</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.professionalInfo.github || ''}
                    onChange={(e) => handleInputChange('professionalInfo', 'github', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-gray-900">
                    {professionalInfo?.github ? (
                      <a href={professionalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {professionalInfo.github}
                      </a>
                    ) : 'Not provided'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Portfolio</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.professionalInfo.portfolio || ''}
                    onChange={(e) => handleInputChange('professionalInfo', 'portfolio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-gray-900">
                    {professionalInfo?.portfolio ? (
                      <a href={professionalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {professionalInfo.portfolio}
                      </a>
                    ) : 'Not provided'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Resume</label>
                {isEditing ? (
                  <div className="flex items-center">
                    <label className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center cursor-pointer hover:bg-blue-700">
                      <FaUpload className="mr-2" />
                      Upload Resume
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                      />
                    </label>
                    {resumeFile && (
                      <span className="ml-3 text-gray-600">{resumeFile.name}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FaFile className="text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {profileData?.resumeFileName || 'No resume uploaded'}
                    </span>
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

export default StudentProfileDisplay;