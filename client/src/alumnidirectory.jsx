import React, { useState, useEffect, useRef, memo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaUser, 
  FaGraduationCap, 
  FaBriefcase, 
  FaTools, 
  FaHeart,
  FaInfoCircle, 
  FaGlobe, 
  FaLinkedin, 
  FaGithub, 
  FaFile,
  FaComments,
  FaPlus,
  FaThumbsUp,
  FaReply,
  FaEdit,
  FaTrash
} from 'react-icons/fa';

// Enhanced profile image URL function with better error handling
const getProfileImageUrl = (user, alumniProfile = null, studentProfile = null) => {
  if (!user) return null;
  
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  
  // Priority 1: Direct profileImageUrl (full URL)
  if (user?.profileImageUrl && user.profileImageUrl.startsWith('http')) {
    return user.profileImageUrl;
  }
  
  // Priority 2: Profile image from alumni profile
  const profileImageFromAlumni = alumniProfile?.profileImage || user?.alumniProfile?.profileImage;
  if (profileImageFromAlumni) {
    if (profileImageFromAlumni.startsWith('http')) {
      return profileImageFromAlumni;
    } else {
      return `${backendUrl}/uploads/${profileImageFromAlumni}`;
    }
  }
  
  // Priority 3: Profile image from student profile
  const profileImageFromStudent = studentProfile?.profileImage || user?.studentProfile?.profileImage;
  if (profileImageFromStudent) {
    if (profileImageFromStudent.startsWith('http')) {
      return profileImageFromStudent;
    } else {
      return `${backendUrl}/uploads/${profileImageFromStudent}`;
    }
  }
  
  // Priority 4: Profile image from user data (direct field)
  if (user?.profileImage) {
    if (user.profileImage.startsWith('http')) {
      return user.profileImage;
    } else {
      return `${backendUrl}/uploads/${user.profileImage}`;
    }
  }
  
  return null;
};

// Enhanced display name function
const getDisplayName = (user) => {
  return user?.name || user?.personalInfo?.fullName || 'Unknown User';
};

// Enhanced graduation year detection
const getGraduationYear = (user) => {
  console.log('Getting graduation year for user:', user?.name, {
    userGraduationYear: user?.graduationYear,
    fromAlumniProfile: user?.alumniProfile?.academicInfo?.graduationYear,
    fromStudentProfile: user?.studentProfile?.academicInfo?.graduationYear,
    fromAcademicInfo: user?.academicInfo?.graduationYear
  });

  // Priority 1: User model graduationYear
  if (user?.graduationYear) {
    return user.graduationYear;
  }
  
  // Priority 2: From academicInfo in alumniProfile
  if (user?.alumniProfile?.academicInfo?.graduationYear) {
    return user.alumniProfile.academicInfo.graduationYear;
  }
  
  // Priority 3: From academicInfo in studentProfile
  if (user?.studentProfile?.academicInfo?.graduationYear) {
    return user.studentProfile.academicInfo.graduationYear;
  }
  
  // Priority 4: From academicInfo directly
  if (user?.academicInfo?.graduationYear) {
    return user.academicInfo.graduationYear;
  }
  
  return null;
};

// Enhanced role detection function with better logic
const getRoleDisplay = (user) => {
  console.log('Getting role for user:', user.name, {
    role: user.role,
    hasAlumniProfile: !!user.alumniProfile,
    hasStudentProfile: !!user.studentProfile
  });

  // Priority 1: Use explicit role field
  if (user.role === 'alumni') {
    return 'Alumni';
  }
  
  if (user.role === 'student') {
    return 'Student';
  }
  
  // Priority 2: Check if user has alumniProfile
  if (user.alumniProfile) {
    return 'Alumni';
  }
  
  // Priority 3: Check if user has studentProfile
  if (user.studentProfile) {
    return 'Student';
  }
  
  // Fallback: Default based on context
  return 'User';
};

// Helper function to get current user ID
const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    }
  } catch (error) {
    console.error('Error decoding token:', error);
  }
  return null;
};

// Memoized DiscussionCard component
const DiscussionCard = memo(({ discussion, onOpen, onLike }) => {
  const categoryNames = {
    'career': 'Career Advice',
    'industry': 'Industry Insights',
    'networking': 'Networking',
    'education': 'Education',
    'technology': 'Technology',
    'general': 'General Discussion'
  };

  const author = discussion.author || {};
  const profileImageUrl = getProfileImageUrl(author);
  const displayName = getDisplayName(author);
  const roleDisplay = getRoleDisplay(author);
  const graduationYear = getGraduationYear(author);
  const isCurrentUser = author._id === getCurrentUserId();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onOpen(discussion._id)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="relative">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
            ) : (
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isCurrentUser ? 'You' : displayName}
            </h3>
            <p className="text-sm text-gray-600">
              {roleDisplay}
              {graduationYear && ` • Class of ${graduationYear}`}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(discussion.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {categoryNames[discussion.category] || 'Discussion'}
        </span>
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600">
        {discussion.title}
      </h2>
      
      <p className="text-gray-700 mb-4 line-clamp-3">
        {discussion.content.length > 200 ? `${discussion.content.substring(0, 200)}...` : discussion.content}
      </p>
      
      {discussion.tags && discussion.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {discussion.tags.map((tag, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onLike(discussion._id);
            }} 
            className={`flex items-center space-x-2 transition-colors ${
              discussion.isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaThumbsUp className={discussion.isLiked ? 'fill-current' : ''} />
            <span>{discussion.likeCount} likes</span>
          </button>
          <span className="flex items-center space-x-2 text-gray-600">
            <FaComments />
            <span>{discussion.replyCount || 0} replies</span>
          </span>
          <span className="text-sm text-gray-500">{discussion.views} views</span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpen(discussion._id);
          }} 
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Join Discussion →
        </button>
      </div>
    </div>
  );
});

// Memoized DiscussionDetail component
const DiscussionDetail = memo(({ discussionData, onBack, onLike, onReplyLike, onAddReply }) => {
  const discussion = discussionData.discussion;
  const replies = discussionData.replies || [];
  
  const categoryNames = {
    'career': 'Career Advice',
    'industry': 'Industry Insights',
    'networking': 'Networking',
    'education': 'Education',
    'technology': 'Technology',
    'general': 'General Discussion'
  };

  const author = discussion.author || {};
  const profileImageUrl = getProfileImageUrl(author);
  const displayName = getDisplayName(author);
  const roleDisplay = getRoleDisplay(author);
  const graduationYear = getGraduationYear(author);
  const isCurrentUser = author._id === getCurrentUserId();

  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    const success = await onAddReply(
      discussion._id, 
      replyContent, 
      replyingTo
    );
    
    if (success) {
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const renderReplies = (repliesList, parentId = null, depth = 0) => {
    const threadReplies = repliesList.filter(reply => 
      (reply.parentReply?._id || null) === parentId
    );

    return threadReplies.map((reply) => {
      const replyAuthor = reply.author || {};
      const replyProfileImageUrl = getProfileImageUrl(replyAuthor);
      const replyDisplayName = getDisplayName(replyAuthor);
      const replyRoleDisplay = getRoleDisplay(replyAuthor);
      const replyGraduationYear = getGraduationYear(replyAuthor);
      const isReplyCurrentUser = replyAuthor._id === getCurrentUserId();

      return (
        <div key={reply._id} className={`ml-${depth * 6} mt-4`}>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="relative">
                  {replyProfileImageUrl ? (
                    <img 
                      src={replyProfileImageUrl} 
                      alt={replyDisplayName}
                      className="w-8 h-8 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      <span className="text-green-600 font-semibold text-sm">
                        {replyDisplayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {isReplyCurrentUser ? 'You' : replyDisplayName}
                    {reply.parentReply && (
                      <span className="text-gray-500 text-sm ml-2">
                        → replying to {reply.parentReply.author?.name}
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {replyRoleDisplay}
                    {replyGraduationYear && ` • Class of ${replyGraduationYear}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => onReplyLike(reply._id)}
                className={`flex items-center space-x-1 ${
                  reply.isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <FaThumbsUp className={reply.isLiked ? 'fill-current' : ''} size={14} />
                <span className="text-sm">{reply.likeCount}</span>
              </button>
            </div>
            
            <p className="text-gray-700 ml-11">{reply.content}</p>
            
            <div className="flex justify-end mt-2">
              <button 
                onClick={() => setReplyingTo(reply._id)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <FaReply className="mr-1" size={12} />
                Reply
              </button>
            </div>
          </div>
          
          {renderReplies(repliesList, reply._id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Discussion</h2>
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium">
          ← Back to Discussions
        </button>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {categoryNames[discussion.category] || 'Discussion'}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(discussion.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-start mb-6">
          <div className="relative">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover mr-4"
              />
            ) : (
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold text-xl">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{discussion.title}</h1>
            <div className="flex items-center text-gray-600">
              <span className="font-medium">{isCurrentUser ? 'You' : displayName}</span>
              <span className="mx-2">•</span>
              <span>{roleDisplay}</span>
              {graduationYear && (
                <>
                  <span className="mx-2">•</span>
                  <span>Class of {graduationYear}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="prose max-w-none mb-6">
          <div className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
            {discussion.content}
          </div>
        </div>
        
        {discussion.tags && discussion.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {discussion.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-6 border-t">
          <button 
            onClick={() => onLike(discussion._id)}
            className={`flex items-center space-x-2 transition-colors ${
              discussion.isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaThumbsUp className={discussion.isLiked ? 'fill-current' : ''} />
            <span className="font-medium">
              {discussion.likeCount} {discussion.likeCount === 1 ? 'like' : 'likes'}
            </span>
          </button>
          
          <div className="flex space-x-4">
            <span className="text-gray-500">{discussion.views} views</span>
            <span className="text-gray-500">{replies.length} replies</span>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Replies ({replies.length})
        </h3>
        <div className="space-y-4">
          {replies.length > 0 ? (
            renderReplies(replies)
          ) : (
            <p className="text-gray-500 text-center py-8">No replies yet. Be the first to reply!</p>
          )}
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {replyingTo ? 'Reply to Comment' : 'Add a Reply'}
        </h3>
        <form onSubmit={handleReplySubmit}>
          <textarea
            ref={textareaRef}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={replyingTo ? 'Write your reply...' : 'Share your thoughts...'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            rows="4"
            required
          />
          <div className="flex justify-between">
            {replyingTo && (
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel Reply
              </button>
            )}
            <div className="flex space-x-3 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Post Reply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

const AlumniDirectory = () => {
  const [activeSection, setActiveSection] = useState('directory');
  const [directoryType, setDirectoryType] = useState('alumni'); // 'alumni' or 'students'
  const [alumniData, setAlumniData] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    year: '',
    branch: '',
    careerStatus: '',
    skills: '',
    interests: '',
    company: '',
    location: '',
    experience: '',
    connectionStatus: '', 
    page: 1,
    limit: 12
  });

  // Success Stories states
  const [successStories, setSuccessStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyFilters, setStoryFilters] = useState({
    category: '',
    search: ''
  });
  const [storyPagination, setStoryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [storyLoading, setStoryLoading] = useState(false);

  const [discussions, setDiscussions] = useState([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [showDiscussionForm, setShowDiscussionForm] = useState(false);
  const [discussionFilters, setDiscussionFilters] = useState({
    category: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [discussionPagination, setDiscussionPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  // Navigation items
  const navItems = [
    { id: 'directory', label: 'Directory', icon: '👥' },
    { id: 'connections', label: 'My Connections', icon: '🔗' },
    { id: 'stories', label: 'Success Stories', icon: '🌟' },
    { id: 'discussions', label: 'Discussion Forum', icon: '💬' }
  ];

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const getConnectionStatus = (user, pendingRequests, myConnections) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId || !user) return 'not_connected';
    const userId = user.id || user._id;
    if (!userId) return 'not_connected';

    // Check if already connected
    const isConnected = myConnections.some(conn => {
      const connectionUserId = conn.person?.id || conn.person?._id;
      return connectionUserId && connectionUserId.toString() === userId.toString();
    });
    if (isConnected) return 'connected';

    // Check if request sent by current user (should NOT show in sender's pendingRequests)
    const isRequestSent = pendingRequests.some(req => {
      // Only show requests where current user is requester and user is recipient
      const recipientId = req.person?.id || req.person?._id;
      return recipientId && recipientId.toString() === userId.toString();
    });
    if (isRequestSent) return 'pending_sent';

    // Check if request received from this user (current user is recipient)
    const isRequestReceived = pendingRequests.some(req => {
      const requesterId = req.person?.id || req.person?._id;
      return requesterId && requesterId.toString() === userId.toString();
    });
    if (isRequestReceived) return 'pending_received';

    return 'not_connected';
  };

  // Enhanced data processing
  const processUserData = (userArray, pendingRequests = [], myConnections = []) => {
    return userArray.map(user => {
      const graduationYear = getGraduationYear(user);
      const role = getRoleDisplay(user);
      const connectionStatus = getConnectionStatus(user, pendingRequests, myConnections);
      
      console.log('Processing user:', user.name, {
        originalRole: user.role,
        processedRole: role,
        originalGradYear: user.graduationYear,
        processedGradYear: graduationYear,
        connectionStatus: connectionStatus
      });
      
      return {
        ...user,
        profileImageUrl: getProfileImageUrl(user, user.alumniProfile, user.studentProfile),
        role: role,
        graduationYear: graduationYear,
        connectionStatus: connectionStatus
      };
    });
  };

  // Fetch alumni directory from backend
  const fetchAlumniDirectory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.year && { graduationYear: filters.year }),
        ...(filters.branch && { branch: filters.branch })
      });

      const response = await fetch(`http://localhost:5000/api/alumni-directory?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const processedAlumni = processUserData(data.alumni);
        setAlumniData(processedAlumni);
        if (directoryType === 'alumni') {
          setFilteredData(processedAlumni);
        }
      } else {
        throw new Error(data.message || 'Failed to load alumni directory');
      }
    } catch (error) {
      console.error('Error fetching alumni directory:', error);
      toast.error('Failed to load alumni directory.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student directory from backend
  const fetchStudentDirectory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.year && { graduationYear: filters.year }),
        ...(filters.branch && { branch: filters.branch })
      });

      const response = await fetch(`http://localhost:5000/api/student-directory?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const processedStudents = processUserData(data.students);
        setStudentData(processedStudents);
        if (directoryType === 'students') {
          setFilteredData(processedStudents);
        }
      } else {
        throw new Error(data.message || 'Failed to load student directory');
      }
    } catch (error) {
      console.error('Error fetching student directory:', error);
      toast.error('Failed to load student directory.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile for viewing
  const fetchUserProfile = async (userId, userType) => {
    try {
      const endpoint = userType === 'alumni' 
        ? `http://localhost:5000/api/alumni/profile/${userId}`
        : `http://localhost:5000/api/student/profile/${userId}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profileData = await response.json();
      setSelectedProfile({...profileData, userType});
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  // Enhanced fetchConnectionRequests function
  const fetchConnectionRequests = async () => {
    try {
      console.log('📥 Fetching connection requests...');
      const response = await fetch('http://localhost:5000/api/connection-requests', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch connection requests: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('📋 Connection requests response:', data);
      
      if (data.success) {
        const processedRequests = (data.pendingRequests || []).map(request => ({
          ...request,
          id: request._id || request.id,
          person: {
            ...request.person,
            id: request.person._id || request.person.id,
            role: getRoleDisplay(request.person),
            graduationYear: getGraduationYear(request.person)
          }
        }));
        
        console.log('✅ Processed connection requests:', processedRequests);
        setPendingRequests(processedRequests);
        
        // Update data with new connection status
        if (alumniData.length > 0 || studentData.length > 0) {
          const updatedAlumni = processUserData(alumniData, processedRequests, myConnections);
          const updatedStudents = processUserData(studentData, processedRequests, myConnections);
          setAlumniData(updatedAlumni);
          setStudentData(updatedStudents);
          
          if (directoryType === 'alumni') {
            setFilteredData(updatedAlumni);
          } else {
            setFilteredData(updatedStudents);
          }
        }
      } else {
        throw new Error(data.message || 'Failed to load connection requests');
      }
    } catch (error) {
      console.error('❌ Error fetching connection requests:', error);
      toast.error('Failed to load connection requests');
    }
  };

  // Enhanced fetchMyConnections function
  const fetchMyConnections = async () => {
    try {
      console.log('🔗 Fetching my connections...');
      const response = await fetch('http://localhost:5000/api/my-connections', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('🤝 My connections response:', data);
      
      if (data.success) {
        const processedConnections = (data.connections || []).map(connection => ({
          ...connection,
          id: connection._id || connection.id,
          person: {
            ...connection.person,
            id: connection.person._id || connection.person.id,
            profileImageUrl: getProfileImageUrl(connection.person),
            role: getRoleDisplay(connection.person),
            graduationYear: getGraduationYear(connection.person)
          }
        }));
        
        console.log('✅ Processed connections:', processedConnections);
        setMyConnections(processedConnections);
        
        // Update data with new connection status
        if (alumniData.length > 0 || studentData.length > 0) {
          const updatedAlumni = processUserData(alumniData, pendingRequests, processedConnections);
          const updatedStudents = processUserData(studentData, pendingRequests, processedConnections);
          setAlumniData(updatedAlumni);
          setStudentData(updatedStudents);
          
          if (directoryType === 'alumni') {
            setFilteredData(updatedAlumni);
          } else {
            setFilteredData(updatedStudents);
          }
        }
      } else {
        throw new Error(data.message || 'Failed to load connections');
      }
    } catch (error) {
      console.error('❌ Error fetching connections:', error);
      toast.error('Failed to load connections');
    }
  };

  // Fixed fetchSuccessStories function
  const fetchSuccessStories = async (page = 1, filters = {}) => {
    setStoryLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await fetch(`http://localhost:5000/api/stories?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch success stories');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccessStories(data.stories);
        setFilteredStories(data.stories);
        setStoryPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching success stories:', error);
      toast.error('Failed to load success stories');
    } finally {
      setStoryLoading(false);
    }
  };

  // Fixed toggleStoryLike function
  const toggleStoryLike = async (storyId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update stories in both lists
        const updateStoryInList = (story) => {
          if (story._id === storyId) {
            return {
              ...story,
              likeCount: data.likeCount,
              isLiked: data.isLiked
            };
          }
          return story;
        };

        setSuccessStories(prev => prev.map(updateStoryInList));
        setFilteredStories(prev => prev.map(updateStoryInList));
        
        // Update selected story if it's currently open
        if (selectedStory && selectedStory._id === storyId) {
          setSelectedStory(prev => ({
            ...prev,
            likeCount: data.likeCount,
            isLiked: data.isLiked
          }));
        }
        
        // Show appropriate toast message
        if (data.isLiked) {
          toast.success('Story liked! ❤️');
        } else {
          toast.success('Story unliked! 💔');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const fetchStoryById = async (storyId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/stories/${storyId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch story');
      }

      const data = await response.json();
      
      if (data.success) {
        setSelectedStory(data.story);
      }
    } catch (error) {
      console.error('Error fetching story:', error);
      toast.error('Failed to load story');
    }
  };

  const fetchDiscussions = async (page = 1, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await fetch(`http://localhost:5000/api/discussions?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discussions');
      }

      const data = await response.json();
      
      if (data.success) {
        setDiscussions(data.discussions);
        setFilteredDiscussions(data.discussions);
        setDiscussionPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast.error('Failed to load discussions');
    }
  };

  const fetchDiscussionById = async (discussionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/${discussionId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discussion');
      }

      const data = await response.json();
      
      if (data.success) {
        setSelectedDiscussion(data);
      }
    } catch (error) {
      console.error('Error fetching discussion:', error);
      toast.error('Failed to load discussion');
    }
  };

  const createDiscussion = async (discussionData) => {
    try {
      const response = await fetch('http://localhost:5000/api/discussions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(discussionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create discussion');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Discussion started successfully!');
        setShowDiscussionForm(false);
        fetchDiscussions();
        return true;
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error(error.message || 'Failed to start discussion');
      return false;
    }
  };

  const addReplyToDiscussion = async (discussionId, content, parentReplyId = null) => {
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/${discussionId}/replies`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, parentReplyId })
      });

      if (!response.ok) {
        throw new Error('Failed to add reply');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Reply added successfully!');
        fetchDiscussionById(discussionId);
        return true;
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
      return false;
    }
  };

  const toggleDiscussionLike = async (discussionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/${discussionId}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      const data = await response.json();
      
      if (data.success) {
        const updateDiscussionInList = (discussion) => {
          if (discussion._id === discussionId) {
            return {
              ...discussion,
              likeCount: data.likeCount,
              isLiked: data.isLiked
            };
          }
          return discussion;
        };

        setDiscussions(prev => prev.map(updateDiscussionInList));
        setFilteredDiscussions(prev => prev.map(updateDiscussionInList));
        
        if (selectedDiscussion && selectedDiscussion.discussion._id === discussionId) {
          setSelectedDiscussion(prev => ({
            ...prev,
            discussion: {
              ...prev.discussion,
              likeCount: data.likeCount,
              isLiked: data.isLiked
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling discussion like:', error);
      toast.error('Failed to update like');
    }
  };

  const toggleReplyLike = async (replyId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/replies/${replyId}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to update reply like');
      }

      const data = await response.json();
      
      if (data.success && selectedDiscussion) {
        const updatedReplies = selectedDiscussion.replies.map(reply => {
          if (reply._id === replyId) {
            return {
              ...reply,
              likeCount: data.likeCount,
              isLiked: data.isLiked
            };
          }
          return reply;
        });

        setSelectedDiscussion(prev => ({
          ...prev,
          replies: updatedReplies
        }));
      }
    } catch (error) {
      console.error('Error toggling reply like:', error);
      toast.error('Failed to update like');
    }
  };

  // Discussion form submission
  const handleDiscussionSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const discussionData = {
      title: formData.get('title'),
      content: formData.get('content'),
      category: formData.get('category'),
      tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
    };

    const success = await createDiscussion(discussionData);
    if (success) {
      e.target.reset();
    }
  };

  // Navigation handler
  const handleNavClick = (section) => {
    setActiveSection(section);
  };

  // Directory type handler
  const handleDirectoryTypeChange = (type) => {
    setDirectoryType(type);
    if (type === 'alumni') {
      setFilteredData(alumniData);
    } else {
      setFilteredData(studentData);
    }
  };

  // UserCard Component (for both alumni and students)
  const UserCard = ({ user, onConnect, onViewProfile }) => {
    const profileImageUrl = getProfileImageUrl(user, user.alumniProfile, user.studentProfile);
    const displayName = getDisplayName(user);
    const roleDisplay = getRoleDisplay(user);
    const graduationYear = getGraduationYear(user);

    const getConnectionButton = () => {
      const buttonClass = "px-4 py-2 rounded-lg font-medium text-sm flex-1 transition-colors flex items-center justify-center";
      
      switch (user.connectionStatus) {
        case 'connected':
          return (
            <button 
              className={`${buttonClass} bg-green-600 text-white cursor-not-allowed`}
              disabled
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Connected
            </button>
          );
        case 'pending_sent':
          return (
            <button 
              className={`${buttonClass} bg-yellow-600 text-white cursor-not-allowed`}
              disabled
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Request Sent
            </button>
          );
        case 'pending_received':
          return (
            <button 
              onClick={() => {
                setActiveSection('connections');
                toast.info('Please go to Connections tab to respond');
              }}
              className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white`}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Respond
            </button>
          );
        default:
          return (
            <button 
              onClick={() => onConnect(user.id)}
              className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white`}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Connect
            </button>
          );
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="relative">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.parentNode.querySelector('.profile-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="profile-fallback bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-12 h-12 flex items-center justify-center mr-4"
                style={{ display: profileImageUrl ? 'none' : 'flex' }}
              >
                <span className="text-blue-600 font-semibold text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
              <p className="text-gray-600 text-sm">{user.email}</p>
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mt-1">
                {roleDisplay}
              </span>
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            user.connectionStatus === 'pending_sent' ? 'bg-yellow-100 text-yellow-800' :
            user.connectionStatus === 'pending_received' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {user.connectionStatus === 'connected' ? 'Connected' :
             user.connectionStatus === 'pending_sent' ? 'Request Sent' :
             user.connectionStatus === 'pending_received' ? 'Request Received' :
             'Not Connected'}
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          {graduationYear && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Batch:</span>
              <span>Class of {graduationYear}</span>
            </div>
          )}
          {user.alumniProfile?.academicInfo?.branch && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Branch:</span>
              <span className="capitalize">{user.alumniProfile.academicInfo.branch?.replace(/-/g, ' ')}</span>
            </div>
          )}
          {user.studentProfile?.academicInfo?.branch && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Branch:</span>
              <span className="capitalize">{user.studentProfile.academicInfo.branch?.replace(/-/g, ' ')}</span>
            </div>
          )}
          {user.alumniProfile?.careerDetails?.companyName && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Company:</span>
              <span>{user.alumniProfile.careerDetails.companyName}</span>
            </div>
          )}
          {user.alumniProfile?.careerDetails?.jobTitle && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Role:</span>
              <span>{user.alumniProfile.careerDetails.jobTitle}</span>
            </div>
          )}
          {user.alumniProfile?.careerDetails?.yearsOfExperience && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Experience:</span>
              <span>{user.alumniProfile.careerDetails.yearsOfExperience} years</span>
            </div>
          )}
          {user.alumniProfile?.personalInfo?.location && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Location:</span>
              <span>{user.alumniProfile.personalInfo.location}</span>
            </div>
          )}
          {user.studentProfile?.personalInfo?.location && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Location:</span>
              <span>{user.studentProfile.personalInfo.location}</span>
            </div>
          )}
        </div>

        {(user.alumniProfile?.skills || user.studentProfile?.skills) && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {(user.alumniProfile?.skills || user.studentProfile?.skills || []).slice(0, 3).map((skill, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {skill}
                </span>
              ))}
              {(user.alumniProfile?.skills || user.studentProfile?.skills || []).length > 3 && (
                <span className="text-gray-500 text-xs">+{(user.alumniProfile?.skills || user.studentProfile?.skills || []).length - 3} more</span>
              )}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          {getConnectionButton()}
          <button 
            onClick={() => onViewProfile(user.id, user.role)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            View Profile
          </button>
        </div>
      </div>
    );
  };

  // ProfileModal Component
  const ProfileModal = ({ profile, onClose }) => {
    if (!profile) return null;

    const profileImageUrl = getProfileImageUrl(profile);
    const displayName = getDisplayName(profile);
    const roleDisplay = profile.userType === 'alumni' ? 'Alumni' : 'Student';
    const graduationYear = getGraduationYear(profile);
    const isCurrentUser = profile._id === getCurrentUserId();

    const formatDate = (dateString) => {
      if (!dateString) return 'Not specified';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const getCareerInfo = () => {
      if (!profile.careerStatus) return null;
      
      switch (profile.careerStatus) {
        case 'working':
          return {
            title: 'Professional Information',
            details: [
              { label: 'Company', value: profile.careerDetails?.companyName },
              { label: 'Job Title', value: profile.careerDetails?.jobTitle },
              { label: 'Location', value: profile.careerDetails?.companyLocation },
              { label: 'Experience', value: profile.careerDetails?.yearsOfExperience }
            ]
          };
        case 'entrepreneur':
          return {
            title: 'Entrepreneurial Venture',
            details: [
              { label: 'Startup Name', value: profile.careerDetails?.startupName },
              { label: 'Industry', value: profile.careerDetails?.industry },
              { label: 'Role', value: profile.careerDetails?.roleInStartup },
              { label: 'Years Running', value: profile.careerDetails?.yearsRunning }
            ]
          };
        case 'studies':
          return {
            title: 'Educational Pursuit',
            details: [
              { label: 'Institution', value: profile.careerDetails?.institutionName },
              { label: 'Course', value: profile.careerDetails?.courseArea },
              { label: 'Location', value: profile.careerDetails?.institutionLocation },
              { label: 'Expected Graduation', value: profile.careerDetails?.expectedGraduationYear }
            ]
          };
        default:
          return null;
      }
    };

    const careerInfo = getCareerInfo();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.userType === 'alumni' ? 'Alumni' : 'Student'} Profile
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl p-2"
              >
                ×
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="relative">
                  {profileImageUrl ? (
                    <img 
                      src={profileImageUrl} 
                      alt={displayName}
                      className="w-20 h-20 rounded-full object-cover mr-6"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentNode.querySelector('.profile-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="profile-fallback bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mr-6"
                    style={{ display: profileImageUrl ? 'none' : 'flex' }}
                  >
                    <span className="text-blue-600 font-semibold text-2xl">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium">{isCurrentUser ? 'You' : displayName}</span>
                    <span className="mx-2">•</span>
                    <span>{roleDisplay}</span>
                    {graduationYear && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Class of {graduationYear}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaUser className="text-blue-600 mr-2" />
                  Personal Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{profile.personalInfo?.location || 'Not specified'}</span>
                  </div>
                  {profile.personalInfo?.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{profile.personalInfo.phone}</span>
                    </div>
                  )}
                  {profile.personalInfo?.gender && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium capitalize">{profile.personalInfo.gender}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaGraduationCap className="text-green-600 mr-2" />
                  Academic Background
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Degree:</span>
                    <span className="font-medium">{profile.academicInfo?.degree || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Branch:</span>
                    <span className="font-medium">{profile.academicInfo?.branch || 'Not specified'}</span>
                  </div>
                  {profile.academicInfo?.cgpa && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">CGPA:</span>
                      <span className="font-medium">{profile.academicInfo.cgpa}</span>
                    </div>
                  )}
                  {graduationYear && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Graduation Year:</span>
                      <span className="font-medium">{graduationYear}</span>
                    </div>
                  )}
                </div>
              </div>

              {careerInfo && (
                <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FaBriefcase className="text-purple-600 mr-2" />
                    {careerInfo.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {careerInfo.details.map((detail, index) => (
                      detail.value && (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-600">{detail.label}:</span>
                          <span className="font-medium">{detail.value}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FaTools className="text-yellow-600 mr-2" />
                    Skills & Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FaHeart className="text-red-600 mr-2" />
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.otherInfo?.bio && (
                <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FaInfoCircle className="text-indigo-600 mr-2" />
                    About
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{profile.otherInfo.bio}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaGlobe className="text-green-600 mr-2" />
                  Connect
                </h3>
                <div className="flex space-x-4">
                  {profile.otherInfo?.linkedin && (
                    <a 
                      href={profile.otherInfo.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <FaLinkedin className="mr-2" />
                      LinkedIn
                    </a>
                  )}
                  {profile.otherInfo?.github && (
                    <a 
                      href={profile.otherInfo.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 hover:text-gray-800"
                    >
                      <FaGithub className="mr-2" />
                      GitHub
                    </a>
                  )}
                  {profile.resumeUrl && (
                    <a 
                      href={profile.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-red-600 hover:text-red-800"
                    >
                      <FaFile className="mr-2" />
                      Resume
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
              <button 
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button 
                onClick={() => toast.info('Connection feature will be implemented soon')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // PendingRequestCard Component
  const PendingRequestCard = ({ request, onAccept, onDecline }) => {
    const profileImageUrl = getProfileImageUrl(request.person);
    const displayName = getDisplayName(request.person);
    const roleDisplay = getRoleDisplay(request.person);
    const graduationYear = getGraduationYear(request.person);

    return (
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex items-center">
          <div className="relative">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover mr-3"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.parentNode.querySelector('.profile-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="profile-fallback bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mr-3"
              style={{ display: profileImageUrl ? 'none' : 'flex' }}
            >
              <span className="text-blue-600 font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{displayName}</h4>
            <p className="text-sm text-gray-600">{request.person.email}</p>
            <p className="text-xs text-gray-500">{roleDisplay}</p>
            {graduationYear && (
              <p className="text-xs text-gray-500">Class of {graduationYear}</p>
            )}
            <p className="text-xs text-blue-500 mt-1">
              Requested on {new Date(request.requestedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => onAccept(request.id, request.person.id)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            Accept
          </button>
          <button 
            onClick={() => onDecline(request.id, request.person.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    );
  };

  // ConnectionCard Component
  const ConnectionCard = ({ connection, onMessage }) => {
    const profileImageUrl = getProfileImageUrl(connection.person);
    const displayName = getDisplayName(connection.person);
    const roleDisplay = getRoleDisplay(connection.person);
    const graduationYear = getGraduationYear(connection.person);

    return (
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex items-center flex-1">
          <div className="relative">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover mr-4"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.parentNode.querySelector('.profile-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="profile-fallback bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mr-4"
              style={{ display: profileImageUrl ? 'none' : 'flex' }}
            >
              <span className="text-green-600 font-semibold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{displayName}</h4>
            <p className="text-sm text-gray-600">{connection.person.email}</p>
            <p className="text-xs text-gray-500">{roleDisplay}</p>
            {graduationYear && (
              <p className="text-xs text-gray-500">Class of {graduationYear}</p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => onMessage(connection.person.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
            </svg>
            Message
          </button>
        </div>
      </div>
    );
  };

  // StoryCard Component
  const StoryCard = ({ story, onLike, onOpen }) => {
    const categoryNames = {
      'career': 'Career Growth',
      'entrepreneurship': 'Entrepreneurship',
      'education': 'Higher Education',
      'innovation': 'Innovation & Research',
      'leadership': 'Leadership',
      'social-impact': 'Social Impact'
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const author = story.author || {};
    const profileImageUrl = getProfileImageUrl(author);
    const displayName = getDisplayName(author);
    const roleDisplay = getRoleDisplay(author);
    const graduationYear = getGraduationYear(author);
    const isCurrentUser = author._id === getCurrentUserId();

    const isLiked = Boolean(story.isLiked);
    const likeCount = story.likeCount || 0;

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="relative">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
              ) : (
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-semibold text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{isCurrentUser ? 'You' : displayName}</h3>
              <p className="text-sm text-gray-600">
                {roleDisplay}
                {graduationYear && ` • Class of ${graduationYear}`}
              </p>
              <p className="text-xs text-gray-500">{formatDate(story.createdAt)}</p>
            </div>
          </div>
          
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {categoryNames[story.category] || 'Uncategorized'}
          </span>
        </div>
        
        <h2 
          className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 cursor-pointer"
          onClick={() => onOpen(story._id)}
        >
          {story.title}
        </h2>
        
        <p className="text-gray-700 mb-4 line-clamp-3">
          {story.content.length > 200 ? `${story.content.substring(0, 200)}...` : story.content}
        </p>
        
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {story.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onLike(story._id)} 
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {isLiked ? (
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ) : (

                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
              )}
              <span className={isLiked ? 'font-medium text-blue-600' : 'text-gray-600'}>
                {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              </span>
            </button>
            <span className="text-sm text-gray-500">{story.views || 0} views</span>
          </div>
          <button 
            onClick={() => onOpen(story._id)} 
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Read Full Story →
          </button>
        </div>
      </div>
    );
  };

  // StoryModal Component
  const StoryModal = ({ story, onClose, onLike }) => {
    const categoryNames = {
      'career': 'Career Growth',
      'entrepreneurship': 'Entrepreneurship',
      'education': 'Higher Education',
      'innovation': 'Innovation & Research',
      'leadership': 'Leadership',
      'social-impact': 'Social Impact'
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const author = story.author || {};
    const profileImageUrl = getProfileImageUrl(author);
    const displayName = getDisplayName(author);
    const roleDisplay = getRoleDisplay(author);
    const graduationYear = getGraduationYear(author);
    const isCurrentUser = author._id === getCurrentUserId();

    const getGraduationText = () => {
      if (!graduationYear) return '';
      return ` • Class of ${graduationYear}`;
    };

    const isLiked = story.isLiked === true;
    const likeCount = story.likeCount || 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Success Story</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl p-2">
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {categoryNames[story.category] || 'Uncategorized'}
                </span>
                <span className="text-sm text-gray-500">{formatDate(story.createdAt)}</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{story.title}</h1>
              
              <div className="flex items-center mb-6">
                <div className="relative">
                  {profileImageUrl ? (
                    <img 
                      src={profileImageUrl} 
                      alt={displayName}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentNode.querySelector('.author-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="author-fallback bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mr-4"
                    style={{ display: profileImageUrl ? 'none' : 'flex' }}
                  >
                    <span className="text-blue-600 font-semibold text-xl">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{isCurrentUser ? 'You' : displayName}</h3>
                  <p className="text-gray-600">
                    {roleDisplay}
                    {getGraduationText()}
                  </p>
                </div>
              </div>
              
              <div className="prose max-w-none mb-8">
                <div className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
                  {story.content}
                </div>
              </div>
              
              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {story.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-6 border-t">
                <button 
                  onClick={() => onLike(story._id)} 
                  className={`flex items-center space-x-2 transition-colors ${
                    isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {isLiked ? (
                    <svg 
                      className="w-6 h-6" 
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{ color: '#2563eb' }}
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  ) : (
                    <svg 
                      className="w-6 h-6" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ color: '#6b7280' }}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                      />
                    </svg>
                  )}
                  <span className={`font-medium ${isLiked ? 'text-blue-600' : 'text-gray-600'}`}>
                    {likeCount} people liked this story
                  </span>
                </button>
                
                <div className="flex space-x-4">
                  <span className="text-gray-500">{story.views || 0} views</span>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: story.title,
                          text: story.content.substring(0, 100) + '...',
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Story link copied to clipboard!');
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Share Story
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
              <button 
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  toast.info('Messaging feature will be implemented soon');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Author
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced filter function
  const applyFilters = () => {
    let filtered = directoryType === 'alumni' ? alumniData : studentData;
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.alumniProfile?.careerDetails?.companyName?.toLowerCase().includes(searchTerm) ||
        user.alumniProfile?.academicInfo?.branch?.toLowerCase().includes(searchTerm) ||
        user.studentProfile?.academicInfo?.branch?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.year) {
      filtered = filtered.filter(user => {
        const gradYear = getGraduationYear(user);
        return gradYear?.toString() === filters.year;
      });
    }
    
    if (filters.branch) {
      filtered = filtered.filter(user => 
        user.alumniProfile?.academicInfo?.branch?.toLowerCase().includes(filters.branch.toLowerCase()) ||
        user.studentProfile?.academicInfo?.branch?.toLowerCase().includes(filters.branch.toLowerCase())
      );
    }
    
    if (filters.careerStatus) {
      filtered = filtered.filter(user => 
        user.alumniProfile?.careerStatus?.toLowerCase() === filters.careerStatus.toLowerCase()
      );
    }
    
    if (filters.skills) {
      const skillsTerm = filters.skills.toLowerCase();
      filtered = filtered.filter(user => 
        user.alumniProfile?.skills?.some(skill => 
          skill.toLowerCase().includes(skillsTerm)
        ) ||
        user.studentProfile?.skills?.some(skill => 
          skill.toLowerCase().includes(skillsTerm)
        )
      );
    }
    
    if (filters.interests) {
      const interestsTerm = filters.interests.toLowerCase();
      filtered = filtered.filter(user => {
        const interests = user.alumniProfile?.interests || user.studentProfile?.interests || [];
        return interests.some(interest => 
          interest.toLowerCase().includes(interestsTerm)
        );
      });
    }
    
    if (filters.company) {
      const companyTerm = filters.company.toLowerCase();
      filtered = filtered.filter(user => 
        user.alumniProfile?.careerDetails?.companyName?.toLowerCase().includes(companyTerm)
      );
    }
    
    if (filters.location) {
      const locationTerm = filters.location.toLowerCase();
      filtered = filtered.filter(user => 
        user.alumniProfile?.personalInfo?.location?.toLowerCase().includes(locationTerm) ||
        user.alumniProfile?.careerDetails?.companyLocation?.toLowerCase().includes(locationTerm) ||
        user.studentProfile?.personalInfo?.location?.toLowerCase().includes(locationTerm)
      );
    }
    
    if (filters.experience) {
      filtered = filtered.filter(user => {
        const experience = user.alumniProfile?.careerDetails?.yearsOfExperience;
        if (!experience) return false;
        
        const expNum = parseInt(experience);
        switch (filters.experience) {
          case '0-2': return expNum <= 2;
          case '3-5': return expNum >= 3 && expNum <= 5;
          case '6-10': return expNum >= 6 && expNum <= 10;
          case '10+': return expNum > 10;
          default: return true;
        }
      });
    }
    
    if (filters.connectionStatus) {
      filtered = filtered.filter(user => 
        user.connectionStatus === filters.connectionStatus
      );
    }
    
    setFilteredData(filtered);
  };

  // Send connection request
  const sendConnectionRequest = async (userId) => {
    try {
      if (!userId) {
        toast.error('Invalid user ID');
        return;
      }

      const response = await fetch('http://localhost:5000/api/connection-request', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipientId: userId })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message.includes('already exists') || 
            data.message.includes('already sent') ||
            data.message.includes('pending request')) {
          updateUserConnectionStatus(userId, 'pending_sent');
          toast.info(data.message);
          return;
        }
        if (data.message.includes('connected')) {
          updateUserConnectionStatus(userId, 'connected');
          toast.info(data.message);
          return;
        }
        if (data.message.includes('previously declined') || 
            data.message.includes('cancelled')) {
          updateUserConnectionStatus(userId, 'not_connected');
          toast.info(data.message);
          return;
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      if (data.success) {
        updateUserConnectionStatus(userId, 'pending_sent');
        toast.success('Connection request sent successfully!');
        
        if (activeSection === 'connections') {
          await fetchConnectionRequests();
        }
      } else {
        throw new Error(data.message || 'Request failed');
      }
      
    } catch (error) {
      console.error('Connection request failed:', error);
      
      if (error.message.includes('Invalid recipient ID') || error.message.includes('not found')) {
        toast.error('Invalid user selected');
      } else if (error.message.includes('cannot connect to yourself')) {
        toast.error('Cannot connect to yourself');
      } else if (error.message.includes('duplicate key')) {
        toast.error('Connection already exists. Please refresh the page.');
      } else {
        toast.error(error.message || 'Failed to send connection request');
      }
    }
  };

  // Helper function to update user connection status
  const updateUserConnectionStatus = (userId, status) => {
    const updateStatus = (user) => 
      user.id === userId 
        ? { ...user, connectionStatus: status }
        : user;

    if (directoryType === 'alumni') {
      setAlumniData(prev => prev.map(updateStatus));
      setFilteredData(prev => prev.map(updateStatus));
    } else {
      setStudentData(prev => prev.map(updateStatus));
      setFilteredData(prev => prev.map(updateStatus));
    }
  };

  // Accept connection request
  const acceptConnection = async (connectionId, userId) => {
    try {
      const response = await fetch('http://localhost:5000/api/accept-connection', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ connectionId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.json();

      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      updateUserConnectionStatus(userId, 'connected');

      await fetchMyConnections();
      
      toast.success('Connection request accepted!');
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection request');
    }
  };

  // Decline connection request
  const declineConnection = async (connectionId, userId) => {
    try {
      const response = await fetch('http://localhost:5000/api/decline-connection', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ connectionId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      updateUserConnectionStatus(userId, 'not_connected');

      toast.info('Connection request declined');
    } catch (error) {
      console.error('Error declining connection:', error);
      toast.error('Failed to decline connection request');
    }
  };

  // View profile handler
  const handleViewProfile = async (userId, userType) => {
    await fetchUserProfile(userId, userType);
  };

  // Close profile modal
  const handleCloseProfile = () => {
    setSelectedProfile(null);
  };

  // Filter handlers
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ 
      ...prev, 
      [filterName]: value,
      page: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      year: '',
      branch: '',
      careerStatus: '',
      skills: '',
      interests: '',
      company: '',
      location: '',
      experience: '',
      connectionStatus: '',
      page: 1,
      limit: 12
    });
  };

  // Render Directory
  const renderDirectory = () => (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {directoryType === 'alumni' ? 'Alumni Directory' : 'Student Directory'}
        </h2>
        <p className="text-gray-600">
          Connect with fellow {directoryType === 'alumni' ? 'alumni' : 'students'} from your institution
        </p>
      </div>
      
      {/* Directory Type Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => handleDirectoryTypeChange('alumni')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              directoryType === 'alumni'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alumni Directory
          </button>
          <button
            onClick={() => handleDirectoryTypeChange('students')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              directoryType === 'students'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Student Directory
          </button>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search (Name, Email, Company)</label>
            <input 
              type="text" 
              placeholder="Search by name, email, company..." 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
            >
              <option value="">All Years</option>
              {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.branch}
              onChange={(e) => handleFilterChange('branch', e.target.value)}
            >
              <option value="">All Branches</option>
              <option value="computer-science">Computer Science</option>
              <option value="information-technology">Information Technology</option>
              <option value="electrical-engineering">Electrical Engineering</option>
              <option value="electronics-communication">Electronics & Communication</option>
              <option value="mechanical-engineering">Mechanical Engineering</option>
              <option value="civil-engineering">Civil Engineering</option>
              <option value="chemical-engineering">Chemical Engineering</option>
              <option value="biotechnology">Biotechnology</option>
              <option value="business-administration">Business Administration</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {directoryType === 'alumni' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Career Status</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.careerStatus}
                onChange={(e) => handleFilterChange('careerStatus', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="working">Working</option>
                <option value="entrepreneur">Entrepreneur</option>
                <option value="studies">Higher Studies</option>
                <option value="not-working">Not Working</option>
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <input 
              type="text" 
              placeholder="e.g., JavaScript, React" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.skills}
              onChange={(e) => handleFilterChange('skills', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
            <input 
              type="text" 
              placeholder="e.g., AI, Startups" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.interests}
              onChange={(e) => handleFilterChange('interests', e.target.value)}
            />
          </div>
          
          {directoryType === 'alumni' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <input 
                type="text" 
                placeholder="Company name" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input 
              type="text" 
              placeholder="City or country" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>
          
          {directoryType === 'alumni' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
              >
                <option value="">All Experience</option>
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Connection Status</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.connectionStatus}
              onChange={(e) => handleFilterChange('connectionStatus', e.target.value)}
            >
              <option value="">All Connections</option>
              <option value="connected">Connected</option>
              <option value="pending_sent">Request Sent</option>
              <option value="pending_received">Request Received</option>
              <option value="not_connected">Not Connected</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <button onClick={clearFilters} className="text-blue-600 hover:text-blue-800 font-medium">
            Clear All Filters
          </button>
          <span className="text-sm text-gray-500">
            Showing {filteredData.length} of {directoryType === 'alumni' ? alumniData.length : studentData.length} {directoryType}
          </span>
        </div>
      </div>
      
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map(user => (
            <UserCard 
              key={user.id} 
              user={user} 
              onConnect={sendConnectionRequest}
              onViewProfile={handleViewProfile}
            />
          ))}
        </div>
      )}
      
      {!loading && filteredData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No {directoryType} found matching your criteria.</p>
        </div>
      )}
    </div>
  );

  // Render Connections
  const renderConnections = () => {
    const handleMessage = (userId) => {
      toast.info(`Messaging feature for user ${userId} will be implemented soon`);
    };

    return (
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Connections</h2>
          <p className="text-gray-600">Manage your professional network</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Pending Requests ({pendingRequests.length})
            </h3>
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending requests</p>
              ) : (
                pendingRequests.map(request => (
                  <PendingRequestCard 
                    key={request.id} 
                    request={request} 
                    onAccept={acceptConnection}
                    onDecline={declineConnection}
                  />
                ))
              )
              }
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              My Network ({myConnections.length})
            </h3>
            <div className="space-y-4">
              {myConnections.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No connections yet</p>
              ) : (
                myConnections.map(connection => (
                  <ConnectionCard 
                    key={connection.id} 
                    connection={connection} 
                    onMessage={handleMessage}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Success Stories
  const renderSuccessStories = () => (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Success Stories</h2>
        <p className="text-gray-600">Get inspired by alumni achievements and career journeys</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filter by category:</label>
          <select 
            value={storyFilters.category}
            onChange={(e) => setStoryFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="career">Career Growth</option>
            <option value="entrepreneurship">Entrepreneurship</option>
            <option value="education">Higher Education</option>
            <option value="innovation">Innovation & Research</option>
            <option value="leadership">Leadership</option>
            <option value="social-impact">Social Impact</option>
          </select>
          
          <input 
            type="text" 
            value={storyFilters.search}
            onChange={(e) => setStoryFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search stories..." 
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          
          <button 
            onClick={() => setStoryFilters({ category: '', search: '' })}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {storyLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!storyLoading && (
        <>
          <div className="space-y-6">
            {filteredStories.map(story => (
              <StoryCard 
                key={story._id} 
                story={story} 
                onLike={toggleStoryLike} 
                onOpen={fetchStoryById} 
              />
            ))}
          </div>
          
          {filteredStories.length === 0 && !storyLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500">No success stories found matching your criteria.</p>
            </div>
          )}
        </>
      )}
      
      {storyPagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => fetchSuccessStories(storyPagination.currentPage - 1, storyFilters)}
            disabled={!storyPagination.hasPrev}
            className={`px-4 py-2 rounded-lg ${
              storyPagination.hasPrev 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Previous
          </button>
          
          <span className="text-gray-600">
            Page {storyPagination.currentPage} of {storyPagination.totalPages}
          </span>
          
          <button
            onClick={() => fetchSuccessStories(storyPagination.currentPage + 1, storyFilters)}
            disabled={!storyPagination.hasNext}
            className={`px-4 py-2 rounded-lg ${
              storyPagination.hasNext 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      )}
      
      {selectedStory && (
        <StoryModal 
          story={selectedStory} 
          onClose={() => setSelectedStory(null)} 
          onLike={toggleStoryLike} 
        />
      )}
    </div>
  );

  // Render Discussion Forum
  const renderDiscussionForum = () => (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Discussion Forum</h2>
        <p className="text-gray-600">Start conversations and engage with the community</p>
      </div>
      
      {!selectedDiscussion ? (
        <>
          {/* Discussion List View */}
          <div className="mb-6">
            <button 
              onClick={() => setShowDiscussionForm(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center"
            >
              <FaPlus className="mr-2" />
              Start New Discussion
            </button>
          </div>
          
          {/* Discussion Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <label className="text-sm font-medium text-gray-700">Filter by category:</label>
              <select 
                value={discussionFilters.category}
                onChange={(e) => setDiscussionFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="career">Career Advice</option>
                <option value="industry">Industry Insights</option>
                <option value="networking">Networking</option>
                <option value="education">Education</option>
                <option value="technology">Technology</option>
                <option value="general">General Discussion</option>
              </select>
              
              <input 
                type="text" 
                value={discussionFilters.search}
                onChange={(e) => setDiscussionFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search discussions..." 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
              
              <select 
                value={discussionFilters.sortBy}
                onChange={(e) => setDiscussionFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Newest</option>
                <option value="likeCount">Most Liked</option>
                <option value="replyCount">Most Active</option>
                <option value="views">Most Viewed</option>
              </select>
              
              <button 
                onClick={() => setDiscussionFilters({ category: '', search: '', sortBy: 'createdAt', sortOrder: 'desc' })}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Add Discussion Form */}
          {showDiscussionForm && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Start a New Discussion</h3>
              <form onSubmit={handleDiscussionSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discussion Title *</label>
                  <input 
                    type="text" 
                    name="title" 
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="What would you like to discuss?" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select 
                      name="category" 
                      required 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      <option value="career">Career Advice</option>
                      <option value="industry">Industry Insights</option>
                      <option value="networking">Networking</option>
                      <option value="education">Education</option>
                      <option value="technology">Technology</option>
                      <option value="general">General Discussion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      name="tags" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="e.g., career-growth, technology, advice" 
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Discussion *</label>
                  <textarea 
                    name="content" 
                    required 
                    rows="6" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Share your thoughts, questions, or insights..."
                  ></textarea>
                </div>
                
                <div className="flex space-x-4">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                    Start Discussion
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowDiscussionForm(false)} 
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Discussions List */}
          <div className="space-y-6">
            {filteredDiscussions.map(discussion => (
              <DiscussionCard 
                key={discussion._id} 
                discussion={discussion} 
                onOpen={fetchDiscussionById}
                onLike={toggleDiscussionLike}
              />
            ))}
          </div>
          
          {filteredDiscussions.length === 0 && (
            <div className="text-center py-8">
              <FaComments className="mx-auto text-gray-400 text-4xl mb-4" />
              <p className="text-gray-500">No discussions found matching your criteria.</p>
              <button 
                onClick={() => setShowDiscussionForm(true)} 
                className="text-blue-600 hover:text-blue-800 font-medium mt-2"
              >
                Start the first discussion!
              </button>
            </div>
          )}
          
          {/* Pagination */}
          {discussionPagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => fetchDiscussions(discussionPagination.currentPage - 1, discussionFilters)}
                disabled={!discussionPagination.hasPrev}
                className={`px-4 py-2 rounded-lg ${
                  discussionPagination.hasPrev 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              
              <span className="text-gray-600">
                Page {discussionPagination.currentPage} of {discussionPagination.totalPages}
              </span>
              
              <button
                onClick={() => fetchDiscussions(discussionPagination.currentPage + 1, discussionFilters)}
                disabled={!discussionPagination.hasNext}
                className={`px-4 py-2 rounded-lg ${
                  discussionPagination.hasNext 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        /* Discussion Detail View */
        <DiscussionDetail 
          discussionData={selectedDiscussion}
          onBack={() => setSelectedDiscussion(null)}
          onLike={toggleDiscussionLike}
          onReplyLike={toggleReplyLike}
          onAddReply={addReplyToDiscussion}
        />
      )}
    </div>
  );

  // UseEffects
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      return;
    }

    console.log(`🔄 Loading section: ${activeSection}`);

    if (activeSection === 'directory') {
      if (directoryType === 'alumni') {
        fetchAlumniDirectory();
      } else {
        fetchStudentDirectory();
      }
    } else if (activeSection === 'connections') {
      Promise.all([fetchConnectionRequests(), fetchMyConnections()])
        .then(() => {
          console.log('✅ Both connection requests and connections loaded');
        })
        .catch(error => {
          console.error('❌ Error loading connections data:', error);
        });
    } else if (activeSection === 'stories') {
      fetchSuccessStories();
    } else if (activeSection === 'discussions') {
      fetchDiscussions();
    }
  }, [activeSection, directoryType]);

  useEffect(() => {
    if (activeSection === 'discussions') {
      fetchDiscussions(1, discussionFilters);
    }
  }, [discussionFilters, activeSection]);

  useEffect(() => {
    if (activeSection === 'directory' && (alumniData.length > 0 || studentData.length > 0)) {
      applyFilters();
    }
  }, [
    filters.search, 
    filters.year, 
    filters.branch, 
    filters.careerStatus,
    filters.skills,
    filters.interests,
    filters.company,
    filters.location,
    filters.experience,
    filters.connectionStatus,
    alumniData, 
    studentData,
    directoryType,
    activeSection
  ]);

  useEffect(() => {
    if (activeSection === 'stories') {
      fetchSuccessStories(1, storyFilters);
    }
  }, [storyFilters, activeSection]);

  useEffect(() => {
    if (selectedStory) {
      const updatedStory = successStories.find(story => story._id === selectedStory._id);
      if (updatedStory) {
        if (updatedStory.isLiked !== selectedStory.isLiked || updatedStory.likeCount !== selectedStory.likeCount) {
          setSelectedStory(prev => ({
            ...prev,
            likeCount: updatedStory.likeCount || 0,
            isLiked: updatedStory.isLiked === true
          }));
        }
      }
    }
  }, [successStories, selectedStory]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === item.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-blue-600'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'directory' && renderDirectory()}
        {activeSection === 'connections' && renderConnections()}
        {activeSection === 'stories' && renderSuccessStories()}
        {activeSection === 'discussions' && renderDiscussionForum()}
      </div>

      <ProfileModal profile={selectedProfile} onClose={handleCloseProfile} />
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default AlumniDirectory;