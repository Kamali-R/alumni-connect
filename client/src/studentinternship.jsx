import React from 'react';

const InternHub = () => {
	return (
		<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
			<h2 className="text-xl font-semibold mb-2">Internships</h2>
			<p className="text-gray-600">Placeholder for internships listings. Implement actual intern hub here.</p>
		</div>
	);
};

export default InternHub;
// studentinternship.jsx - Complete corrected version
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const InternHub = () => {
  // State for form inputs
  const [filters, setFilters] = useState({
    mainSearch: '',
    domain: '',
    location: '',
    duration: '',
    stipend: '',
    workMode: '',
    companyType: '',
    workType: '',
    eligibility: '',
    certificate: false,
    ppo: false,
    training: false
  });
  
  // State for custom inputs
  const [customInputs, setCustomInputs] = useState({
    domain: '',
    location: '',
    duration: '',
    stipend: '',
    workMode: '',
    companyType: '',
    workType: '',
    eligibility: ''
  });
  
  // State for UI controls
  const [showMainSuggestions, setShowMainSuggestions] = useState(false);
  const [showSkillsSuggestions, setShowSkillsSuggestions] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [showResults, setShowResults] = useState(false);
  const [currentView, setCurrentView] = useState('search'); // 'search' or 'applied'
  
  // State for results
  const [searchResults, setSearchResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [resultsPerPage] = useState(6);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  
  // State for skills
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillsInput, setSkillsInput] = useState('');
  
  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Refs for input elements
  const mainSearchRef = useRef(null);
  const skillsInputRef = useRef(null);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Sample data for fallback
  const allSkills = [
    'Python', 'Java', 'JavaScript', 'C++', 'React', 'Node.js', 'SQL', 'HTML', 'CSS', 'AWS',
    'Machine Learning', 'Data Analysis', 'Photoshop', 'Figma', 'Social Media Marketing'
  ];

  // Fetch all jobs from API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/jobs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Transform API data to match our component structure
      const transformedJobs = response.data.jobs.map(job => ({
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        workMode: getWorkModeFromLocation(job.location),
        duration: 'Flexible',
        stipend: job.salary || 'Negotiable',
        domain: getDomainFromRole(job.role),
        skills: getSkillsFromDescription(job.description),
        type: 'company',
        eligibility: 'Any Year',
        certificate: false,
        ppo: false,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: job.description,
        applyLink: job.applyLink,
        referralCode: job.referralCode || '',
        experience: job.experience,
        role: job.role,
        datePosted: job.datePosted || job.createdAt
      }));
      
      setSearchResults(transformedJobs);
      setDisplayedResults(transformedJobs.slice(0, resultsPerPage));
      setShowResults(true);
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs. Please try again.');
      setSearchResults([]);
      setDisplayedResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch applied jobs
  // Fetch applied jobs - UPDATED VERSION
const fetchAppliedJobs = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/jobs/applied-jobs`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    setAppliedJobs(response.data);
    
    // ✅ ADD THIS: Extract job IDs and store in a Set for quick lookup
    const appliedIds = new Set(response.data.map(app => app.jobId._id));
    setAppliedJobIds(appliedIds);
    
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    setError('Failed to fetch applied jobs.');
  } finally {
    setLoading(false);
  }
};

  // Apply to job
  // In studentinternship.jsx - Update the applyToJob function
// Apply to job - UPDATED VERSION
const applyToJob = async (jobId, coverLetter = '') => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    console.log('Applying to job:', jobId);
    
    const response = await axios.post(
      `${API_BASE_URL}/jobs/${jobId}/apply`,
      { coverLetter },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Application response:', response.data);
    
    setSuccessMessage('Application submitted successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    
    // ✅ ADD THIS: Immediately update the applied jobs state
    setAppliedJobIds(prev => new Set([...prev, jobId]));
    
    // Refresh applied jobs list
    fetchAppliedJobs();
    
  } catch (error) {
    console.error('Error applying to job:', error);
    console.error('Error details:', error.response?.data);
    
    if (error.response?.status === 404) {
      setError('Job not found. It may have been removed.');
    } else if (error.response?.status === 400) {
      setError(error.response.data.message);
    } else if (error.response?.data?.message) {
      setError(error.response.data.message);
    } else if (error.code === 'NETWORK_ERROR') {
      setError('Network error. Please check your connection.');
    } else {
      setError('Failed to apply to job. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  // Helper functions for data transformation
  const getWorkModeFromLocation = (location) => {
    const locationLower = location.toLowerCase();
    if (locationLower.includes('remote')) return 'Remote';
    if (locationLower.includes('hybrid')) return 'Hybrid';
    return 'On-site';
  };

  const getDomainFromRole = (role) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('software') || roleLower.includes('developer')) return 'Software Development';
    if (roleLower.includes('data')) return 'Data Science';
    if (roleLower.includes('design')) return 'Design/UI-UX';
    if (roleLower.includes('product')) return 'Product Management';
    if (roleLower.includes('marketing')) return 'Marketing';
    return 'Other';
  };

  const getSkillsFromDescription = (description) => {
    const skills = [];
    const commonSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS', 'AWS'];
    
    commonSkills.forEach(skill => {
      if (description.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
    
    return skills.length > 0 ? skills : ['Various Technologies'];
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFilters(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (name === 'mainSearch') {
        handleMainSearchChange(value);
      } else if (name === 'skillsInput') {
        handleSkillsChange(value);
      }
      
      if (value === 'others') {
        setCustomInputs(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  // Handle custom input changes
  const handleCustomInputChange = (e) => {
    const { name, value } = e.target;
    setCustomInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle main search input change
  const handleMainSearchChange = (value) => {
    if (value.trim() === '') {
      setShowMainSuggestions(false);
      return;
    }
    setShowMainSuggestions(true);
  };

  // Handle skills input change
  const handleSkillsChange = (value) => {
    setSkillsInput(value);
    
    if (value.trim() === '') {
      setShowSkillsSuggestions(false);
      return;
    }
    
    const matches = allSkills.filter(skill => 
      skill.toLowerCase().includes(value.toLowerCase()) && !selectedSkills.includes(skill)
    ).slice(0, 10);
    
    setShowSkillsSuggestions(true);
  };

  // Handle suggestion click
  const handleSuggestionClick = (type, value) => {
    if (type === 'mainSearch') {
      setFilters(prev => ({
        ...prev,
        mainSearch: value
      }));
      setShowMainSuggestions(false);
    } else if (type === 'skill') {
      if (!selectedSkills.includes(value)) {
        setSelectedSkills(prev => [...prev, value]);
      }
      setSkillsInput('');
      setShowSkillsSuggestions(false);
    }
  };

  // Add skill from input
  const addSkillFromInput = () => {
    const skill = skillsInput.trim();
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills(prev => [...prev, skill]);
      setSkillsInput('');
      setShowSkillsSuggestions(false);
    }
  };

  // Remove skill
  const removeSkill = (skillToRemove) => {
    setSelectedSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  // Handle clicks outside to hide suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mainSearchRef.current && !mainSearchRef.current.contains(e.target)) {
        setShowMainSuggestions(false);
      }
      
      if (skillsInputRef.current && !skillsInputRef.current.contains(e.target)) {
        setShowSkillsSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter internships based on filters
  const filterInternships = (internships, filters) => {
    return internships.filter(internship => {
      // Main search filter
      if (filters.mainSearch) {
        const searchTerm = filters.mainSearch.toLowerCase();
        const searchableText = `${internship.title} ${internship.company} ${internship.skills.join(' ')}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }
      
      // Domain filter
      if (filters.domain && !internship.domain.toLowerCase().includes(filters.domain.toLowerCase())) return false;
      
      // Location filter
      if (filters.location && !internship.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      
      // Work mode filter
      if (filters.workMode && internship.workMode.toLowerCase() !== filters.workMode.toLowerCase()) return false;
      
      // Skills filter
      if (filters.skills) {
        const requiredSkills = filters.skills.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
        const internshipSkills = internship.skills.map(s => s.toLowerCase());
        if (!requiredSkills.some(skill => internshipSkills.some(iSkill => iSkill.includes(skill)))) return false;
      }
      
      return true;
    });
  };

  // Add this function to studentinternship.jsx for testing
const testAPI = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    
    // Test if jobs endpoint works
    const jobsResponse = await axios.get(`${API_BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Jobs API works:', jobsResponse.data);
    
    // Test if apply endpoint exists (this will fail but show the error)
    const testJobId = '123'; // dummy ID
    try {
      const applyResponse = await axios.post(
        `${API_BASE_URL}/jobs/${testJobId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Apply API works:', applyResponse.data);
    } catch (applyError) {
      console.log('Apply API test error (expected):', applyError.response?.data);
    }
    
  } catch (error) {
    console.error('API test failed:', error);
  }
};

// Call this temporarily to test
// testAPI();

  // Search internships
  const searchInternships = () => {
    const preparedFilters = {
      ...filters,
      domain: filters.domain === 'others' ? customInputs.domain : filters.domain,
      location: filters.location === 'others' ? customInputs.location : filters.location,
      duration: filters.duration === 'others' ? customInputs.duration : filters.duration,
      stipend: filters.stipend === 'others' ? customInputs.stipend : filters.stipend,
      workMode: filters.workMode === 'others' ? customInputs.workMode : filters.workMode,
      companyType: filters.companyType === 'others' ? customInputs.companyType : filters.companyType,
      workType: filters.workType === 'others' ? customInputs.workType : filters.workType,
      eligibility: filters.eligibility === 'others' ? customInputs.eligibility : filters.eligibility,
      skills: selectedSkills.join(',')
    };
    
    const results = filterInternships(searchResults, preparedFilters);
    setDisplayedResults(results.slice(0, resultsPerPage));
    
    // Update active filters
    const active = [];
    Object.entries(preparedFilters).forEach(([key, value]) => {
      if (value && value !== '' && value !== false) {
        active.push({ key, value });
      }
    });
    setActiveFilters(active);
  };

  // Remove filter
  const removeFilter = (key) => {
    setFilters(prev => ({
      ...prev,
      [key]: key === 'certificate' || key === 'ppo' || key === 'training' ? false : ''
    }));
    
    if (customInputs[key]) {
      setCustomInputs(prev => ({
        ...prev,
        [key]: ''
      }));
    }
    
    if (key === 'skills') {
      setSelectedSkills([]);
    }
    
    searchInternships();
  };

  // Load more results
  const loadMoreResults = () => {
    const currentLength = displayedResults.length;
    const newResults = searchResults.slice(currentLength, currentLength + resultsPerPage);
    setDisplayedResults(prev => [...prev, ...newResults]);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    const sortValue = e.target.value;
    setSortBy(sortValue);
    
    const sortedResults = [...searchResults];
    
    sortedResults.sort((a, b) => {
      switch(sortValue) {
        case 'date':
          return new Date(b.datePosted) - new Date(a.datePosted);
        case 'stipend':
          const aStipend = parseInt(a.stipend.replace(/[^\d]/g, '')) || 0;
          const bStipend = parseInt(b.stipend.replace(/[^\d]/g, '')) || 0;
          return bStipend - aStipend;
        default:
          return 0;
      }
    });
    
    setSearchResults(sortedResults);
    setDisplayedResults(sortedResults.slice(0, resultsPerPage));
  };

  // Custom input visibility
  const shouldShowCustomInput = (filterName) => {
    return filters[filterName] === 'others';
  };

  // Load data on component mount and when view changes
  useEffect(() => {
    if (currentView === 'search') {
      fetchJobs();
      fetchAppliedJobs();
    } else if (currentView === 'applied') {
      fetchAppliedJobs();
    }
  }, [currentView]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">InternHub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('search')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentView === 'search'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Search Jobs
              </button>
              <button
                onClick={() => setCurrentView('applied')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentView === 'applied'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Applied Jobs ({appliedJobs.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success and Error Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'search' ? (
          <>
            {/* Search Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Find Your Perfect Internship</h2>
              
              {/* Main Search Bar */}
              <div className="mb-6">
                <div className="relative" ref={mainSearchRef}>
                  <input
                    type="text"
                    name="mainSearch"
                    value={filters.mainSearch}
                    onChange={handleInputChange}
                    placeholder="Search by company, role, or skills..."
                    className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none pl-12"
                  />
                  <svg className="w-6 h-6 text-gray-400 absolute left-4 top-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
              
              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Domain Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Domain/Field</label>
                  <div className="relative">
                    <select
                      name="domain"
                      value={filters.domain}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Any Domain</option>
                      <option value="software">Software Development</option>
                      <option value="data">Data Science</option>
                      <option value="ai">AI/ML</option>
                      <option value="design">Design/UI-UX</option>
                      <option value="marketing">Marketing</option>
                      <option value="others">Others</option>
                    </select>
                    {shouldShowCustomInput('domain') && (
                      <input
                        type="text"
                        name="domain"
                        value={customInputs.domain}
                        onChange={handleCustomInputChange}
                        placeholder="Enter your custom domain..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mt-2"
                      />
                    )}
                  </div>
                </div>
                
                {/* Location Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Location</label>
                  <div className="relative">
                    <select
                      name="location"
                      value={filters.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Any Location</option>
                      <option value="remote">Remote</option>
                      <option value="bangalore">Bangalore</option>
                      <option value="mumbai">Mumbai</option>
                      <option value="delhi">Delhi</option>
                      <option value="hyderabad">Hyderabad</option>
                      <option value="others">Others</option>
                    </select>
                    {shouldShowCustomInput('location') && (
                      <input
                        type="text"
                        name="location"
                        value={customInputs.location}
                        onChange={handleCustomInputChange}
                        placeholder="Enter your custom location..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mt-2"
                      />
                    )}
                  </div>
                </div>
                
                {/* Work Mode Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Work Mode</label>
                  <div className="relative">
                    <select
                      name="workMode"
                      value={filters.workMode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Any Mode</option>
                      <option value="remote">Remote</option>
                      <option value="onsite">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Skills Filter */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Skills</label>
                <div className="relative" ref={skillsInputRef}>
                  <input
                    type="text"
                    name="skillsInput"
                    value={skillsInput}
                    onChange={handleInputChange}
                    placeholder="Search and add skills..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-12"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkillFromInput();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addSkillFromInput}
                    className="absolute right-3 top-3 text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Add
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-blue-600 hover:text-blue-800 ml-1 text-lg leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Search Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={searchInternships}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  🔍 Search Internships
                </button>
              </div>
            </div>

            {/* Results Section */}
            {showResults && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Search Results</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">{searchResults.length} internships found</span>
                    <select
                      value={sortBy}
                      onChange={handleSortChange}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="relevance">Sort by Relevance</option>
                      <option value="date">Latest First</option>
                      <option value="stipend">Highest Stipend</option>
                    </select>
                  </div>
                </div>
                
                {/* Internship Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedResults.map(internship => (
                    <div
                      key={internship.id}
                      className="internship-card bg-white rounded-xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{internship.title}</h3>
                          <p className="text-blue-600 font-semibold">{internship.company}</p>
                        </div>
                        <div className="flex space-x-1">
                          {internship.certificate && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Certificate</span>
                          )}
                          {internship.ppo && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">PPO</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          <span className="text-sm">{internship.location} • {internship.workMode}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span className="text-sm">{internship.duration}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                          </svg>
                          <span className="text-sm font-semibold text-green-600">{internship.stipend}</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {internship.skills.map(skill => (
                            <span key={skill} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Posted: {new Date(internship.datePosted).toLocaleDateString()}
                        </span>
                        <button
  onClick={() => applyToJob(internship.id)}
  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
    appliedJobIds.has(internship.id)
      ? 'bg-green-600 text-white cursor-not-allowed'
      : loading 
        ? 'bg-gray-400 text-white cursor-wait'
        : 'bg-blue-600 hover:bg-blue-700 text-white'
  }`}
  disabled={appliedJobIds.has(internship.id) || loading}
>
  {loading ? '🔄 Applying...' : 
   appliedJobIds.has(internship.id) ? '✅ Applied' : 'Apply Now'}
</button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Load More Button */}
                {displayedResults.length < searchResults.length && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMoreResults}
                      className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg font-semibold"
                    >
                      Load More Results
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Applied Jobs View */
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">My Applied Jobs</h2>
            
            {appliedJobs.length > 0 ? (
              <div className="space-y-6">
                {appliedJobs.map(application => (
                  <div key={application._id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {application.jobId?.title}
                        </h3>
                        <p className="text-blue-600 font-semibold mb-2">
                          {application.jobId?.company}
                        </p>
                        <p className="text-gray-600 text-sm mb-1">
                          📍 {application.jobId?.location}
                        </p>
                        <p className="text-gray-600 text-sm mb-1">
                          💼 {application.jobId?.experience}
                        </p>
                        {application.jobId?.salary && (
                          <p className="text-green-600 font-medium text-sm mb-2">
                            💰 {application.jobId.salary}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          application.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                          application.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {application.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-2">
                          Applied: {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <a
                        href={application.jobId?.applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Job Details →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-500 mb-4">Start by applying to some internships from the search page.</p>
                <button
                  onClick={() => setCurrentView('search')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Browse Jobs
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternHub;
