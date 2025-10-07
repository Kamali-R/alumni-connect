import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AlumniJobDashboard = () => {
  // State management
  const [currentView, setCurrentView] = useState('postJob');
  const [postedJobs, setPostedJobs] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCloseSuccessMessage, setShowCloseSuccessMessage] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    jobLocation: '',
    jobType: '',
    experienceRequired: '',
    salary: '',
    referralCode: '',
    jobDescription: '',
    applyLink: ''
  });

  // Sample initial jobs data (fallback if API fails)
  const [availableJobs, setAvailableJobs] = useState([]);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch all available jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/jobs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAvailableJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs. Using sample data.');
      // Fallback to sample data if API fails
      setAvailableJobs([
        {
          _id: 1001,
          title: 'Senior Product Manager',
          company: 'TechCorp Solutions',
          location: 'San Francisco, CA',
          type: 'Full-time',
          experience: '5+',
          salary: '$120,000 - $150,000',
          role: 'Product Manager',
          description: 'We are looking for an experienced professional to join our dynamic team. This role offers excellent growth opportunities and the chance to work with cutting-edge technologies in a collaborative environment.',
          datePosted: '09/14/2025',
          status: 'Open'
        },
        {
          _id: 1002,
          title: 'Software Engineering Intern',
          company: 'StartupXYZ',
          location: 'Remote',
          type: 'Internship',
          experience: '0-1',
          salary: '$25 - $35 per hour',
          role: 'Software Engineer',
          description: 'We are looking for an experienced professional to join our dynamic team. This role offers excellent growth opportunities and the chance to work with cutting-edge technologies in a collaborative environment.',
          datePosted: '09/10/2025',
          status: 'Open'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's posted jobs
  const fetchPostedJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/jobs/my-jobs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPostedJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching posted jobs:', error);
      setError('Failed to fetch your posted jobs.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.jobTitle || !formData.companyName || !formData.jobLocation || 
        !formData.jobType || !formData.experienceRequired || 
        !formData.jobDescription || !formData.applyLink) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (formData.jobDescription.length < 50) {
      setError('Job description must be at least 50 characters long.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/jobs`, {
        title: formData.jobTitle,
        company: formData.companyName,
        location: formData.jobLocation,
        type: formData.jobType,
        experience: formData.experienceRequired,
        salary: formData.salary,
        referralCode: formData.referralCode,
        description: formData.jobDescription,
        applyLink: formData.applyLink
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 4000);
      
      // Refresh the jobs list
      fetchJobs();
      fetchPostedJobs();
      
      // Reset form
      setFormData({
        jobTitle: '',
        companyName: '',
        jobLocation: '',
        jobType: '',
        experienceRequired: '',
        salary: '',
        referralCode: '',
        jobDescription: '',
        applyLink: ''
      });
    } catch (error) {
      console.error('Error posting job:', error);
      setError('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Close job opportunity
  const closeJobOpportunity = async (jobId) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      await axios.patch(`${API_BASE_URL}/jobs/${jobId}/status`, {
        status: 'Closed'
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Show success message
      setShowCloseSuccessMessage(true);
      setTimeout(() => setShowCloseSuccessMessage(false), 3000);
      
      // Refresh the jobs list
      fetchPostedJobs();
      
      // Also update available jobs if viewing them
      if (currentView === 'viewJobs') {
        fetchJobs();
      }
    } catch (error) {
      console.error('Error closing job:', error);
      setError('Failed to close job. Please try again.');
    }
  };

  // View job details
  const viewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetailsModal(true);
  };

  // Filter jobs based on selected filters
  const filteredJobs = availableJobs.filter(job => {
    // Only show open jobs in the view jobs section
    if (job.status === 'Closed') return false;
    
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(job.type);
    const locationMatch = !selectedLocation || job.location.includes(selectedLocation);
    const experienceMatch = !selectedExperience || job.experience === selectedExperience;
    const roleMatch = !selectedRole || job.role === selectedRole;
    const companyMatch = !companySearch || job.company.toLowerCase().includes(companySearch.toLowerCase());
    
    return typeMatch && locationMatch && experienceMatch && roleMatch && companyMatch;
  });

  // Handle job type filter changes
  const handleJobTypeChange = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedLocation('');
    setSelectedExperience('');
    setSelectedRole('');
    setCompanySearch('');
  };

  // Determine type badge color
  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'Full-time': return 'bg-blue-100 text-blue-800';
      case 'Part-time': return 'bg-yellow-100 text-yellow-800';
      case 'Internship': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Determine status badge color
  const getStatusBadgeColor = (status) => {
    return status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Load data when component mounts or view changes
  useEffect(() => {
    if (currentView === 'viewJobs') {
      fetchJobs();
    } else if (currentView === 'postedJobs') {
      fetchPostedJobs();
    }
  }, [currentView]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Alumni Job Network</h1>
            <div className="flex space-x-4">
              <button 
                onClick={() => setCurrentView('postJob')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'postJob' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white text-blue-600 border border-blue-600 hover:bg-gray-50'
                }`}
              >
                Post a Job
              </button>
              <button 
                onClick={() => setCurrentView('viewJobs')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'viewJobs' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white text-blue-600 border border-blue-600 hover:bg-gray-50'
                }`}
              >
                View Jobs
              </button>
              <button 
                onClick={() => setCurrentView('postedJobs')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'postedJobs' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white text-blue-600 border border-blue-600 hover:bg-gray-50'
                }`}
              >
                Posted Jobs
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-700">Processing...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Job Posting Form */}
        {currentView === 'postJob' && (
          <div className="fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Post a Job Opportunity</h2>
              
              {/* Success Message */}
              {showSuccessMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg success-slide-down">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-green-800 font-medium">✅ Job posted successfully!</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Job Title */}
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="jobTitle" 
                      name="jobTitle" 
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g. Senior Software Engineer"
                    />
                    <p className="text-xs text-gray-500 mt-1">Required field</p>
                  </div>
                  
                  {/* Company Name */}
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="companyName" 
                      name="companyName" 
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g. Tech Innovations Inc."
                    />
                    <p className="text-xs text-gray-500 mt-1">Required field</p>
                  </div>
                  
                  {/* Job Location */}
                  <div>
                    <label htmlFor="jobLocation" className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Location <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="jobLocation" 
                      name="jobLocation" 
                      value={formData.jobLocation}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g. San Francisco, CA or Remote"
                    />
                    <p className="text-xs text-gray-500 mt-1">Required field</p>
                  </div>
                  
                  {/* Job Type */}
                  <div>
                    <label htmlFor="jobType" className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <select 
                      id="jobType" 
                      name="jobType" 
                      value={formData.jobType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select job type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Required field</p>
                  </div>
                  
                  {/* Experience Required */}
                  <div>
                    <label htmlFor="experienceRequired" className="block text-sm font-semibold text-gray-700 mb-2">
                      Experience Required <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="experienceRequired" 
                      name="experienceRequired" 
                      value={formData.experienceRequired}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g. 3-5 years"
                    />
                    <p className="text-xs text-gray-500 mt-1">Required field</p>
                  </div>
                  
                  {/* Salary */}
                  <div>
                    <label htmlFor="salary" className="block text-sm font-semibold text-gray-700 mb-2">
                      Salary / Compensation
                    </label>
                    <input 
                      type="text" 
                      id="salary" 
                      name="salary" 
                      value={formData.salary}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g. $80,000 - $100,000 or Negotiable"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional field</p>
                  </div>
                  
                  {/* Referral Code */}
                  <div>
                    <label htmlFor="referralCode" className="block text-sm font-semibold text-gray-700 mb-2">
                      Referral Code
                    </label>
                    <input 
                      type="text" 
                      id="referralCode" 
                      name="referralCode" 
                      value={formData.referralCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Optional referral code"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional field</p>
                  </div>
                </div>
                
                {/* Job Description */}
                <div>
                  <label htmlFor="jobDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    id="jobDescription" 
                    name="jobDescription" 
                    rows="6" 
                    value={formData.jobDescription}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Provide a detailed description of the role, responsibilities, and requirements..."
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">Required field - Minimum 50 characters</p>
                </div>
                
                {/* Apply Link */}
                <div>
                  <label htmlFor="applyLink" className="block text-sm font-semibold text-gray-700 mb-2">
                    Apply Link <span className="text-red-500">*</span>
                  </label>
                    <input 
                      type="url" 
                      id="applyLink" 
                      name="applyLink" 
                      value={formData.applyLink}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="https://company.com/careers/job-id"
                    />
                    <p className="text-xs text-gray-500 mt-1">Required field - Must be a valid URL</p>
                  </div>
                
                {/* Submit Button */}
                <div className="pt-4">
                  <button 
                    type="submit" 
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Post Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Posted Jobs View */}
        {currentView === 'postedJobs' && (
          <div className="fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">My Posted Jobs</h2>
              
              {/* Close Success Message */}
              {showCloseSuccessMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg success-slide-down">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <p className="text-red-800 font-medium">Job opportunity closed successfully!</p>
                  </div>
                </div>
              )}
              
              {postedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {postedJobs.map(job => (
                    <div key={job._id} className="job-card bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 fade-in flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <p className="text-blue-600 font-medium mb-1">{job.company}</p>
                          <p className="text-gray-600 text-sm mb-2">📍 {job.location}</p>
                          <p className="text-gray-600 text-sm mb-2">💼 {job.experience} experience</p>
                          {job.salary && (
                            <p className="text-green-600 font-medium text-sm mb-2">💰 {job.salary}</p>
                          )}
                          <p className="text-gray-600 text-sm mb-3">📅 Posted: {new Date(job.datePosted || job.createdAt).toLocaleDateString()}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500 text-sm">Status:</span>
                            <span className={`${getStatusBadgeColor(job.status)} text-xs font-medium px-2 py-1 rounded-full`}>
                              {job.status}
                            </span>
                          </div>
                        </div>
                        <span className={`${getTypeBadgeColor(job.type)} text-xs font-medium px-2 py-1 rounded-full`}>
                          {job.type}
                        </span>
                      </div>
                      <div className="mt-auto space-y-2">
                        <button 
                          onClick={() => viewJobDetails(job)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          View Details
                        </button>
                        {job.status === 'Open' && (
                          <button 
                            onClick={() => closeJobOpportunity(job._id)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                          >
                            Close Opportunity
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                  <p className="text-gray-500 mb-4">Start by posting your first job opportunity to help fellow alumni.</p>
                  <button 
                    onClick={() => setCurrentView('postJob')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Post Your First Job
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Job Listing View */}
        {currentView === 'viewJobs' && (
          <div className="fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Available Job Opportunities</h2>
                
                {/* Enhanced Filters Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Filter Jobs</h3>
                    <button 
                      onClick={clearFilters}
                      className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Job Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Job Type</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={selectedTypes.includes('Full-time')}
                            onChange={() => handleJobTypeChange('Full-time')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" 
                          />
                          <span className="text-sm text-gray-700">Full-time</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={selectedTypes.includes('Part-time')}
                            onChange={() => handleJobTypeChange('Part-time')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" 
                          />
                          <span className="text-sm text-gray-700">Part-time</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={selectedTypes.includes('Internship')}
                            onChange={() => handleJobTypeChange('Internship')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" 
                          />
                          <span className="text-sm text-gray-700">Internship</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Location Filter */}
                    <div>
                      <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-700 mb-3">Location</label>
                      <select 
                        id="locationFilter" 
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">All Locations</option>
                        <option value="Remote">Remote</option>
                        <option value="San Francisco">San Francisco</option>
                        <option value="New York">New York</option>
                        <option value="Seattle">Seattle</option>
                        <option value="Boston">Boston</option>
                        <option value="Austin">Austin</option>
                        <option value="Chicago">Chicago</option>
                        <option value="Los Angeles">Los Angeles</option>
                      </select>
                    </div>
                    
                    {/* Experience Filter */}
                    <div>
                      <label htmlFor="experienceFilter" className="block text-sm font-medium text-gray-700 mb-3">Experience Required</label>
                      <select 
                        id="experienceFilter" 
                        value={selectedExperience}
                        onChange={(e) => setSelectedExperience(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">All Experience Levels</option>
                        <option value="0-1">0-1 years (Entry Level)</option>
                        <option value="2-4">2-4 years (Mid Level)</option>
                        <option value="3-5">3-5 years (Mid Level)</option>
                        <option value="4-6">4-6 years (Senior Level)</option>
                        <option value="5+">5+ years (Senior Level)</option>
                      </select>
                    </div>
                    
                    {/* Job Role Filter */}
                    <div>
                      <label htmlFor="jobRoleFilter" className="block text-sm font-medium text-gray-700 mb-3">Job Role</label>
                      <select 
                        id="jobRoleFilter" 
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">All Roles</option>
                        <option value="Software Engineer">Software Engineer</option>
                        <option value="Senior Software Engineer">Senior Software Engineer</option>
                        <option value="Data Scientist">Data Scientist</option>
                        <option value="Data Analyst">Data Analyst</option>
                        <option value="Product Manager">Product Manager</option>
                        <option value="Senior Product Manager">Senior Product Manager</option>
                        <option value="UX Designer">UX Designer</option>
                        <option value="UI Designer">UI Designer</option>
                        <option value="Marketing Manager">Marketing Manager</option>
                        <option value="Business Analyst">Business Analyst</option>
                        <option value="DevOps Engineer">DevOps Engineer</option>
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="Full Stack Developer">Full Stack Developer</option>
                      </select>
                    </div>
                    
                    {/* Company Name Filter */}
                    <div>
                      <label htmlFor="companyFilter" className="block text-sm font-medium text-gray-700 mb-3">Company Name</label>
                      <input 
                        type="text" 
                        id="companyFilter" 
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        placeholder="Search companies..." 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Type to search by company name</p>
                    </div>
                  </div>
                  
                  {/* Active Filters Display */}
                  {(selectedTypes.length > 0 || selectedLocation || selectedExperience || selectedRole || companySearch) && (
                    <div className="mt-4">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-sm font-medium text-gray-700">Active filters:</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedTypes.map(type => (
                            <span key={type} className="filter-tag bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                              {type}
                              <button 
                                onClick={() => handleJobTypeChange(type)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </span>
                          ))}
                          
                          {selectedLocation && (
                            <span className="filter-tag bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                              {selectedLocation}
                              <button 
                                onClick={() => setSelectedLocation('')}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </span>
                          )}
                          
                          {selectedExperience && (
                            <span className="filter-tag bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                              {selectedExperience}
                              <button 
                                onClick={() => setSelectedExperience('')}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </span>
                          )}
                          
                          {selectedRole && (
                            <span className="filter-tag bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                              {selectedRole}
                              <button 
                                onClick={() => setSelectedRole('')}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </span>
                          )}
                          
                          {companySearch && (
                            <span className="filter-tag bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                              Company: {companySearch}
                              <button 
                                onClick={() => setCompanySearch('')}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Job Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map(job => (
                    <div key={job._id} className="job-card bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <p className="text-blue-600 font-medium mb-1">{job.company}</p>
                          <p className="text-gray-600 text-sm mb-2">📍 {job.location}</p>
                          <p className="text-gray-600 text-sm mb-2">💼 {job.experience} experience</p>
                          {job.salary && (
                            <p className="text-green-600 font-medium text-sm mb-2">💰 {job.salary}</p>
                          )}
                        </div>
                        <span className={`${getTypeBadgeColor(job.type)} text-xs font-medium px-2 py-1 rounded-full`}>
                          {job.type}
                        </span>
                      </div>
                      <div className="mt-auto">
                        <button 
                          onClick={() => viewJobDetails(job)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs match your filters</h3>
                    <p className="text-gray-500">Try adjusting your filters or check back later for new opportunities.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Job Details Modal */}
      {showJobDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h3>
                <p className="text-blue-600 font-medium text-lg">{selectedJob.company}</p>
              </div>
              <button 
                onClick={() => setShowJobDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-gray-600">
                <span className="mr-2">📍</span>
                <span>{selectedJob.location}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="mr-2">💼</span>
                <span>{selectedJob.experience} experience required</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="mr-2">⏰</span>
                <span className={`${getTypeBadgeColor(selectedJob.type)} text-sm font-medium px-2 py-1 rounded-full`}>
                  {selectedJob.type}
                </span>
              </div>
              {selectedJob.salary && (
                <div className="flex items-center text-gray-600">
                  <span className="mr-2">💰</span>
                  <span>Salary: {selectedJob.salary}</span>
                </div>
              )}
              {selectedJob.referralCode && (
                <div className="flex items-center text-gray-600">
                  <span className="mr-2">🔑</span>
                  <span>Referral Code: {selectedJob.referralCode}</span>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h4>
              <p className="text-gray-600 leading-relaxed">
                {selectedJob.description}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href={selectedJob.applyLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors text-center"
              >
                Apply Now
              </a>
              <button 
                onClick={() => setShowJobDetailsModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniJobDashboard;