import React, { useState, useEffect } from 'react';

const CampusAnnouncements = ({ userType = 'student' }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to truncate text to first 2 lines
  const truncateToTwoLines = (text = '', lines = 2) => {
    const safe = typeof text === 'string' ? text : String(text || '');
    const textLines = safe.split('\n');
    if (textLines.length > lines) {
      return textLines.slice(0, lines).join('\n') + '...';
    }
    return safe;
  };

  // Fetch announcements based on user type
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        let endpoint = '/api/announcements/student/announcements';
        
        // Determine user type from localStorage if not provided
        let actualUserType = userType;
        if (!actualUserType || actualUserType === 'student') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            actualUserType = userData.role || 'student';
          }
        }

        // Choose the appropriate endpoint
        if (actualUserType === 'alumni') {
          endpoint = '/api/announcements/alumni/announcements';
        }

        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          // Transform to include formatted timestamp
          const formatted = data.map(ann => ({
            ...ann,
            timestamp: new Date(ann.createdAt).toLocaleDateString()
          }));
          setAnnouncements(formatted);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [userType]);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Announcements</h1>
        <p className="text-gray-600">Stay updated with the latest announcements from the campus</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <p>Loading announcements...</p>
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{announcement.subject}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                      {announcement.category || 'General'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{truncateToTwoLines(announcement.message || '')}</p>
                  <div className="text-sm text-gray-500 mt-2">Audience: {announcement.audience}</div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded ml-4 whitespace-nowrap">
                  {announcement.timestamp}
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setSelectedAnnouncement(announcement)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                  </svg>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-600">No announcements at this time.</p>
        </div>
      )}

      {/* Modal for viewing full announcement details */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">{selectedAnnouncement.subject}</h2>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Category:</span> {selectedAnnouncement.category || 'General'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Audience:</span> {selectedAnnouncement.audience}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Posted:</span> {selectedAnnouncement.timestamp}
                </p>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Message</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedAnnouncement.message || 'No message provided.'}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusAnnouncements;
