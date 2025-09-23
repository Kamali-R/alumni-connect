import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AlumniNetworking = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    graduationYear: '',
    branch: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch alumni data
  const fetchAlumni = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const params = new URLSearchParams({
        page: page,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.graduationYear && { graduationYear: filters.graduationYear }),
        ...(filters.branch && { branch: filters.branch })
      });

      const response = await axios.get(`http://localhost:5000/api/alumni/all?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setAlumni(response.data.alumni || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(response.data.currentPage || 1);
      setError('');
    } catch (error) {
      console.error('Error fetching alumni:', error);
      setError('Failed to fetch alumni data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAlumni();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAlumni(1);
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  // Apply filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAlumni(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAlumni(page);
  };

  // Get current year for graduation year options
  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 50 }, (_, i) => currentYear - i);

  // Common branches
  const branches = [
    'Computer Science',
    'Information Technology',
    'Electronics and Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Business Administration',
    'Finance',
    'Marketing',
    'Other'
  ];

  if (loading && alumni.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alumni network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alumni Networking Hub</h1>
        <p className="text-gray-600">Connect with fellow alumni from your institution</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, company, or branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={filters.graduationYear}
                onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Graduation Years</option>
                {graduationYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <select
                value={filters.branch}
                onChange={(e) => handleFilterChange('branch', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Alumni Grid */}
      {alumni.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumni.map((alumnus) => (
              <div key={alumnus._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Profile Image */}
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    {alumnus.profileImage ? (
                      <img
                        src={`http://localhost:5000/uploads/${alumnus.profileImage}`}
                        alt={alumnus.personalInfo?.fullName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-xl">
                        {alumnus.personalInfo?.fullName
                          ?.split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase() || 'N/A'}
                      </span>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {alumnus.personalInfo?.fullName || 'Name not available'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Class of {alumnus.academicInfo?.graduationYear || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Branch:</span> {alumnus.academicInfo?.branch || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Degree:</span> {alumnus.academicInfo?.degree || 'Not specified'}
                  </p>
                </div>

                {/* Career Info */}
                <div className="mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Status:</span> {alumnus.careerStatus || 'Not specified'}
                  </p>
                  {alumnus.careerDetails?.companyName && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Company:</span> {alumnus.careerDetails.companyName}
                    </p>
                  )}
                  {alumnus.careerDetails?.jobTitle && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Role:</span> {alumnus.careerDetails.jobTitle}
                    </p>
                  )}
                </div>

                {/* Location */}
                {alumnus.personalInfo?.location && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Location:</span> {alumnus.personalInfo.location}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {alumnus.skills && alumnus.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {alumnus.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {alumnus.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{alumnus.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Connect Button */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Connect
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, currentPage - 2) + i;
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 border rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        !loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Alumni Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filters.graduationYear || filters.branch
                ? "No alumni match your search criteria. Try adjusting your filters."
                : "No alumni profiles are available yet."}
            </p>
            {(searchTerm || filters.graduationYear || filters.branch) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ graduationYear: '', branch: '' });
                  setCurrentPage(1);
                  fetchAlumni(1);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default AlumniNetworking;