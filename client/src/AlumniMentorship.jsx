import React, { useState, useEffect } from 'react';
import { mentorshipAPI } from './api';

const AlumniMentorshipPlatform = () => {
  const [activeSection, setActiveSection] = useState('find-mentor');
  const [mentorshipTab, setMentorshipTab] = useState('as-mentee');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [requestedMentors, setRequestedMentors] = useState([]);
  const [isMentor, setIsMentor] = useState(false);
  const [requests, setRequests] = useState([]);
  const [myMentorships, setMyMentorships] = useState({ asMentee: [], asMentor: [] });

  // Form state for Become a Mentor
  const [mentorForm, setMentorForm] = useState({
    name: '',
    graduationYear: '',
    position: '',
    company: '',
    expertise: [],
    bio: '',
    availability: '1-2 hours per month',
    industry: '',
    location: ''
  });

  // Mentors list will be declared later (uses local `allMentors` fallback)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [selectedExperience, setSelectedExperience] = useState('Experience Level');
  const [selectedGraduation, setSelectedGraduation] = useState('Graduation Year');
  const [selectedCompanySize, setSelectedCompanySize] = useState('Company Size');
  const [selectedLocation, setSelectedLocation] = useState('Location');
  const [selectedAvailability, setSelectedAvailability] = useState('Availability');
  
  // Mock data with more alumni
  const allMentors = [
    {
      id: 1,
      name: 'Sarah Johnson',
      initials: 'SJ',
      position: 'Senior Product Manager',
      company: 'Google',
      graduationYear: 'Class of 2015',
      expertise: ['Product Strategy', 'Leadership'],
      description: 'Specializes in product development and team leadership in tech startups.',
      color: 'from-blue-500 to-purple-600',
      industry: 'Technology',
      experience: '10-15 years',
      companySize: 'Large (500+)',
      location: 'San Francisco',
      availability: '3-4 hours/month'
    },
    {
      id: 2,
      name: 'Michael Chen',
      initials: 'MC',
      position: 'Investment Director',
      company: 'Goldman Sachs',
      graduationYear: 'Class of 2012',
      expertise: ['Finance', 'Investment'],
      description: 'Expert in financial markets and investment strategies with 10+ years experience.',
      color: 'from-green-500 to-teal-600',
      industry: 'Finance',
      experience: '10-15 years',
      companySize: 'Large (500+)',
      location: 'New York',
      availability: '1-2 hours/month'
    },
    {
      id: 3,
      name: 'Amanda Rodriguez',
      initials: 'AR',
      position: 'Marketing Director',
      company: 'Nike',
      graduationYear: 'Class of 2013',
      expertise: ['Digital Marketing', 'Brand Strategy'],
      description: 'Specializes in digital marketing campaigns and brand development.',
      color: 'from-pink-500 to-red-600',
      industry: 'Marketing',
      experience: '5-10 years',
      companySize: 'Large (500+)',
      location: 'London',
      availability: '3-4 hours/month'
    },
    {
      id: 4,
      name: 'Robert Williams',
      initials: 'RW',
      position: 'CTO',
      company: 'TechStart Inc.',
      graduationYear: 'Class of 2010',
      expertise: ['Technology', 'Entrepreneurship'],
      description: 'Founded three successful tech startups and expert in scaling businesses.',
      color: 'from-purple-500 to-indigo-600',
      industry: 'Technology',
      experience: '15+ years',
      companySize: 'Medium (51-500)',
      location: 'Remote',
      availability: '5+ hours/month'
    },
    {
      id: 5,
      name: 'Jennifer Kim',
      initials: 'JK',
      position: 'Senior Healthcare Consultant',
      company: 'McKinsey & Company',
      graduationYear: 'Class of 2014',
      expertise: ['Healthcare', 'Consulting'],
      description: 'Specializes in healthcare strategy and digital transformation in the medical sector.',
      color: 'from-teal-500 to-green-600',
      industry: 'Healthcare',
      experience: '5-10 years',
      companySize: 'Large (500+)',
      location: 'Boston',
      availability: '1-2 hours/month'
    },
    {
      id: 6,
      name: 'David Thompson',
      initials: 'DT',
      position: 'Engineering Director',
      company: 'SpaceX',
      graduationYear: 'Class of 2008',
      expertise: ['Engineering', 'Leadership'],
      description: 'Leading aerospace engineering projects with 15+ years of experience.',
      color: 'from-blue-500 to-cyan-600',
      industry: 'Engineering',
      experience: '15+ years',
      companySize: 'Large (500+)',
      location: 'Los Angeles',
      availability: '3-4 hours/month'
    },
    {
      id: 7,
      name: 'Lisa Chen',
      initials: 'LC',
      position: 'VP of Education',
      company: 'Khan Academy',
      graduationYear: 'Class of 2011',
      expertise: ['Education', 'Leadership'],
      description: 'Passionate about educational technology and making learning accessible to all.',
      color: 'from-yellow-500 to-orange-600',
      industry: 'Education',
      experience: '10-15 years',
      companySize: 'Medium (51-500)',
      location: 'Remote',
      availability: '5+ hours/month'
    },
    {
      id: 8,
      name: 'James Wilson',
      initials: 'JW',
      position: 'Senior Software Engineer',
      company: 'Microsoft',
      graduationYear: 'Class of 2016',
      expertise: ['Technology', 'Product Development'],
      description: 'Expert in cloud computing and distributed systems with experience at top tech companies.',
      color: 'from-indigo-500 to-blue-600',
      industry: 'Technology',
      experience: '3-5 years',
      companySize: 'Large (500+)',
      location: 'Seattle',
      availability: '1-2 hours/month'
    },
    {
      id: 9,
      name: 'Michelle Garcia',
      initials: 'MG',
      position: 'Finance Manager',
      company: 'J.P. Morgan',
      graduationYear: 'Class of 2013',
      expertise: ['Finance', 'Investment Banking'],
      description: 'Specializes in corporate finance and investment strategies for high-net-worth clients.',
      color: 'from-green-500 to-emerald-600',
      industry: 'Finance',
      experience: '5-10 years',
      companySize: 'Large (500+)',
      location: 'New York',
      availability: '3-4 hours/month'
    }
  ];

  const [mentors, setMentors] = useState(allMentors);

  // Apply filters when any filter value changes
  useEffect(() => {
    let filtered = allMentors;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(mentor => 
        mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.expertise.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Industry filter
    if (selectedIndustry !== 'All Industries') {
      filtered = filtered.filter(mentor => mentor.industry === selectedIndustry);
    }

    // Experience filter
    if (selectedExperience !== 'Experience Level') {
      filtered = filtered.filter(mentor => mentor.experience === selectedExperience);
    }

    // Graduation year filter
    if (selectedGraduation !== 'Graduation Year') {
      filtered = filtered.filter(mentor => {
        const year = mentor.graduationYear.replace('Class of ', '');
        if (selectedGraduation === '2020-2024') {
          return year >= '2020' && year <= '2024';
        } else if (selectedGraduation === '2015-2019') {
          return year >= '2015' && year <= '2019';
        } else if (selectedGraduation === '2010-2014') {
          return year >= '2010' && year <= '2014';
        } else if (selectedGraduation === '2005-2009') {
          return year >= '2005' && year <= '2009';
        } else if (selectedGraduation === 'Before 2005') {
          return year < '2005';
        }
        return true;
      });
    }

    // Company size filter
    if (selectedCompanySize !== 'Company Size') {
      filtered = filtered.filter(mentor => mentor.companySize === selectedCompanySize);
    }

    // Location filter
    if (selectedLocation !== 'Location') {
      filtered = filtered.filter(mentor => mentor.location === selectedLocation);
    }

    // Availability filter
    if (selectedAvailability !== 'Availability') {
      filtered = filtered.filter(mentor => mentor.availability === selectedAvailability);
    }

    setMentors(filtered);
  }, [searchTerm, selectedIndustry, selectedExperience, selectedGraduation, selectedCompanySize, selectedLocation, selectedAvailability, allMentors]);

  // Function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedIndustry('All Industries');
    setSelectedExperience('Experience Level');
    setSelectedGraduation('Graduation Year');
    setSelectedCompanySize('Company Size');
    setSelectedLocation('Location');
    setSelectedAvailability('Availability');
  };

  // Check if any filter is active
  const isFilterActive = () => {
    return searchTerm !== '' || 
           selectedIndustry !== 'All Industries' || 
           selectedExperience !== 'Experience Level' || 
           selectedGraduation !== 'Graduation Year' || 
           selectedCompanySize !== 'Company Size' || 
           selectedLocation !== 'Location' || 
           selectedAvailability !== 'Availability';
  };

  const stats = [
    { title: 'Active Mentorships', value: '3', color: 'text-blue-600' }
  ];
  const navItems = [
    { id: 'find-mentor', label: 'Find a Mentor', icon: '🔍' },
    { id: 'become-mentor', label: 'Become a Mentor', icon: '🎯' },
    { id: 'my-mentorships', label: 'My Mentorships', icon: '📋' },
    { id: 'requests', label: 'Requests', icon: '📨' }
  ];
  const handleConnectMentor = async (mentorId) => {
    try {
      await mentorshipAPI.requestMentor(mentorId, { message: '' });
      setRequestedMentors(prev => [...prev, mentorId]);
      await fetchRequests();
    } catch (err) {
      console.error('Request mentor failed:', err?.response?.data || err.message || err);
    }
  };

  const handleMentorApplication = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: mentorForm.name,
        position: mentorForm.position,
        company: mentorForm.company,
        bio: mentorForm.bio,
        expertise: mentorForm.expertise,
        availability: mentorForm.availability,
        industry: mentorForm.industry,
        location: mentorForm.location
      };

      const res = await mentorshipAPI.becomeMentor(payload);
      if (res.data && res.data.success) {
        setIsMentor(true);
        setModalContent({ title: 'You are now a Mentor!', message: 'Thank you for becoming a mentor. Your profile will be visible to students seeking mentorship.' });
        setShowModal(true);
        await fetchMentors();
      }
    } catch (err) {
      console.error('Become mentor failed:', err?.response?.data || err.message || err);
    }
  };

  const handleRequest = async (action, studentName, requestId) => {
    try {
      await mentorshipAPI.respondToRequest(requestId, action);
      await fetchRequests();
      await fetchMyMentorships();
    } catch (err) {
      console.error('Respond to request failed:', err?.response?.data || err.message || err);
    }
  };

  // Fetch helpers
  const fetchMentors = async () => {
    try {
      const res = await mentorshipAPI.getMentors();
      setMentors(res.data.data || allMentors);
    } catch (err) {
      console.error('Failed to fetch mentors:', err?.response?.data || err.message || err);
      setMentors(allMentors);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await mentorshipAPI.getRequests();
      const data = res.data || {};
      setRequests(data.incoming || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err?.response?.data || err.message || err);
    }
  };

  const fetchMyMentorships = async () => {
    try {
      const res = await mentorshipAPI.getMyMentorships();
      const d = res.data || {};
      setMyMentorships({ asMentee: d.asMentee || [], asMentor: d.asMentor || [] });
    } catch (err) {
      console.error('Failed to fetch my mentorships:', err?.response?.data || err.message || err);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchMentors();
    fetchRequests();
    fetchMyMentorships();
  }, []);
  const renderFindMentor = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Find Your Perfect Mentor</h2>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Search by name or expertise..." 
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
          >
            <option>All Industries</option>
            <option>Technology</option>
            <option>Finance</option>
            <option>Healthcare</option>
            <option>Marketing</option>
            <option>Consulting</option>
            <option>Education</option>
            <option>Engineering</option>
          </select>
          <select 
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={selectedExperience}
            onChange={(e) => setSelectedExperience(e.target.value)}
          >
            <option>Experience Level</option>
            <option>3-5 years</option>
            <option>5-10 years</option>
            <option>10-15 years</option>
            <option>15+ years</option>
          </select>
          <select 
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={selectedGraduation}
            onChange={(e) => setSelectedGraduation(e.target.value)}
          >
            <option>Graduation Year</option>
            <option>2020-2024</option>
            <option>2015-2019</option>
            <option>2010-2014</option>
            <option>2005-2009</option>
            <option>Before 2005</option>
          </select>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <select 
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={selectedCompanySize}
            onChange={(e) => setSelectedCompanySize(e.target.value)}
          >
            <option>Company Size</option>
            <option>Startup (1-50)</option>
            <option>Medium (51-500)</option>
            <option>Large (500+)</option>
          </select>
          <select 
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option>Location</option>
            <option>San Francisco</option>
            <option>New York</option>
            <option>London</option>
            <option>Boston</option>
            <option>Los Angeles</option>
            <option>Seattle</option>
            <option>Remote</option>
          </select>
          <select 
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
          >
            <option>Availability</option>
            <option>1-2 hours/month</option>
            <option>3-4 hours/month</option>
            <option>5+ hours/month</option>
          </select>
          <div className="flex items-end">
                    <button 
        onClick={clearAllFilters}
        disabled={!isFilterActive()}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
            isFilterActive()
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        >
        Clear Filters
        </button>
          </div>
        </div>
      </div>
      
      {/* Results count */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {mentors.length} of {allMentors.length} mentors
        </div>
        {isFilterActive() && (
          <div className="text-sm text-blue-600">
            Filters applied
          </div>
        )}
      </div>
      
      {/* Mentor Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map(mentor => (
          <div key={mentor.id} className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {mentor.initials}
              </div>
              <div className="ml-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">{mentor.name}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Alumni</span>
                </div>
                <p className="text-sm text-gray-600">{mentor.position}</p>
                <p className="text-xs text-blue-600">{mentor.company} • {mentor.graduationYear}</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {mentor.expertise.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600">{mentor.description}</p>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => handleConnectMentor(mentor.id)}
                disabled={requestedMentors.includes(mentor.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  requestedMentors.includes(mentor.id)
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {requestedMentors.includes(mentor.id) ? 'Requested' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {mentors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No mentors match your search criteria. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
  const renderBecomeMentor = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Share Your Expertise</h2>
      
      <div className="bg-white rounded-xl shadow-sm p-8">
        {isMentor ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-2xl mx-auto mb-6">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">You are now a Mentor!</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Thank you for becoming a mentor. Your profile will be visible to students seeking mentorship opportunities.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                🎓
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Become a Mentor Today</h3>
              <p className="text-gray-600">Help fellow alumni grow their careers while building meaningful connections</p>
            </div>
            <form className="max-w-2xl mx-auto space-y-6" onSubmit={handleMentorApplication}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={mentorForm.name}
                    onChange={(e) => setMentorForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                  <input 
                    type="text" 
                    name="graduationYear"
                    value={mentorForm.graduationYear}
                    onChange={(e) => setMentorForm(prev => ({ ...prev, graduationYear: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="e.g., 2015"
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Position</label>
                  <input 
                    type="text" 
                    name="position"
                    value={mentorForm.position}
                    onChange={(e) => setMentorForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Your current job title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input 
                    type="text" 
                    name="company"
                    value={mentorForm.company}
                    onChange={(e) => setMentorForm(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Current company"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Expertise</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Technology', 'Finance', 'Marketing', 'Healthcare', 'Leadership', 'Entrepreneurship', 'Consulting', 'Other'].map((area, index) => (
                    <label key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={mentorForm.expertise.includes(area)}
                        onChange={() => setMentorForm(prev => ({
                          ...prev,
                          expertise: prev.expertise.includes(area) ? prev.expertise.filter(e => e !== area) : [...prev.expertise, area]
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio & Experience</label>
                <textarea 
                  rows="4" 
                  name="bio"
                  value={mentorForm.bio}
                  onChange={(e) => setMentorForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Tell us about your professional journey and what you can offer as a mentor..."
                  required
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select
                  name="availability"
                  value={mentorForm.availability}
                  onChange={(e) => setMentorForm(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option>1-2 hours per month</option>
                  <option>3-4 hours per month</option>
                  <option>5+ hours per month</option>
                </select>
              </div>
              <div className="text-center">
                <button 
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
  const renderMyMentorships = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">My Mentorships</h2>
      
      {/* Stats Cards */}
      <div className="grid md:grid-cols-1 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className={`text-3xl font-bold ${stat.color} mb-2`}>{myMentorships.asMentor.length}</div>
            <div className="text-gray-600">{stat.title}</div>
          </div>
        ))}
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button 
              onClick={() => setMentorshipTab('as-mentee')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                mentorshipTab === 'as-mentee' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              As Mentee ({myMentorships.asMentee.length})
            </button>
            <button 
              onClick={() => setMentorshipTab('as-mentor')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                mentorshipTab === 'as-mentor' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              As Mentor ({myMentorships.asMentor.length})
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {mentorshipTab === 'as-mentee' ? (
            <div className="space-y-4">
              {myMentorships.asMentee.map(mentorship => (
                <div key={mentorship.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-gradient-to-r ${mentorship.color} rounded-full flex items-center justify-center text-white font-bold`}>
                        {mentorship.initials}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-800">{mentorship.name}</h4>
                        <p className="text-sm text-gray-600">{mentorship.expertise} • Next session: {mentorship.nextSession}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {myMentorships.asMentor.map(mentorship => (
                <div key={mentorship.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-gradient-to-r ${mentorship.color} rounded-full flex items-center justify-center text-white font-bold`}>
                        {mentorship.initials}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-800">{mentorship.name}</h4>
                        <p className="text-sm text-gray-600">{mentorship.expertise} • Next session: {mentorship.nextSession}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const renderRequests = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Mentorship Requests</h2>
      
      {/* Pending Requests */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Requests from Students</h3>
        
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No pending requests at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
                      {request.initials}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{request.name}</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Student</span>
                      </div>
                      <p className="text-sm text-gray-600">{request.major} • {request.graduationYear}</p>
                      <p className="text-xs text-gray-500">Interested in: {request.interests.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleRequest('decline', request.name, request.id)}
                      className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => handleRequest('accept', request.name, request.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                </div>
                <div className="mt-3 pl-16">
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    "{request.message}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center space-x-8 py-4">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeSection === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeSection === 'find-mentor' && renderFindMentor()}
        {activeSection === 'become-mentor' && renderBecomeMentor()}
        {activeSection === 'my-mentorships' && renderMyMentorships()}
        {activeSection === 'requests' && renderRequests()}
      </main>
      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{modalContent.title}</h3>
            <p className="text-gray-600 mb-6">{modalContent.message}</p>
            <button 
              onClick={() => setShowModal(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniMentorshipPlatform;