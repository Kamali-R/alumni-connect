import Connection from '../models/Connection.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Enhanced sendConnectionRequest - allows bidirectional connections
export const sendConnectionRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { recipientId } = req.body;

    console.log('🔗 Sending connection request:', { 
      currentUserId, 
      recipientId 
    });

    // Validation
    if (!recipientId) {
      return res.status(400).json({ 
        success: false,
        message: 'Recipient ID is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid recipient ID format' 
      });
    }

    if (currentUserId === recipientId) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot send connection request to yourself' 
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipient not found' 
      });
    }

    // Get current user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ 
        success: false,
        message: 'Current user not found' 
      });
    }

    // Check for existing connection
    const existingConnection = await Connection.findConnection(currentUserId, recipientId);
    
    if (existingConnection) {
      let message = 'Connection already exists';
      
      if (existingConnection.status === 'pending') {
        if (existingConnection.requesterId.toString() === currentUserId) {
          message = 'Connection request already sent';
        } else {
          message = 'You have a pending request from this user';
        }
      } else if (existingConnection.status === 'accepted') {
        message = 'Already connected with this user';
      } else if (existingConnection.status === 'declined') {
        message = 'Connection request was previously declined';
      }
      
      return res.status(400).json({ 
        success: false,
        message,
        existingStatus: existingConnection.status 
      });
    }

    // Create new connection with role tracking
    const connection = new Connection({
      requesterId: currentUserId,
      recipientId: recipientId,
      requesterRole: currentUser.role, // 'student' or 'alumni'
      recipientRole: recipient.role,   // 'student' or 'alumni'
      status: 'pending',
      requestedAt: new Date()
    });

    await connection.save();
    
    console.log('✅ Connection request created successfully:', {
      connectionId: connection._id,
      requester: { id: currentUserId, role: currentUser.role },
      recipient: { id: recipientId, role: recipient.role },
      status: connection.status
    });

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      connection: {
        id: connection._id,
        status: connection.status,
        requestedAt: connection.requestedAt
      }
    });

  } catch (error) {
    console.error('❌ Send connection request error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Connection request already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error sending connection request',
      error: error.message
    });
  }
};

// Enhanced getConnectionRequests - shows requests from both students and alumni
export const getConnectionRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    console.log('📥 Fetching connection requests for user:', currentUserId);

    // Get pending requests where current user is recipient
    const pendingRequests = await Connection.find({
      recipientId: currentUserId,
      status: 'pending'
    })
    .populate({
      path: 'requesterId',
      select: 'name email graduationYear role',
      populate: [
        {
          path: 'alumniProfile',
          select: 'profileImage personalInfo academicInfo careerDetails',
          strictPopulate: false
        },
        {
          path: 'studentProfile',
          select: 'profileImage personalInfo academicInfo',
          strictPopulate: false
        }
      ],
      strictPopulate: false
    })
    .sort({ requestedAt: -1 })
    .lean();

    console.log(`📋 Found ${pendingRequests.length} pending requests`);

    // Format the response
    const formattedRequests = pendingRequests.map(request => {
      const requester = request.requesterId;

      // Defensive: if requester was populated as null/deleted, skip this request
      if (!requester) {
        console.warn('⚠️ Skipping pending request with missing requester:', request._id);
        return null;
      }

      // Determine which profile to use based on role (guard role)
      const role = requester?.role || request.requesterRole || 'unknown';
      const userProfile = role === 'alumni' ? requester?.alumniProfile : requester?.studentProfile;

      // Enhanced graduation year resolution
      const graduationYear = userProfile?.academicInfo?.graduationYear ||
                            requester.graduationYear ||
                            null;

      // Get profile image URL
      const profileImageUrl = userProfile?.profileImage 
        ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${userProfile.profileImage}`
        : null;

      return {
        id: request._id,
        person: {
          id: requester._id,
          name: requester.name || 'Unknown User',
          email: requester.email || null,
          role: role,
          graduationYear: graduationYear,
          profileImageUrl: profileImageUrl,
          // Include both profiles for compatibility
          alumniProfile: requester.alumniProfile,
          studentProfile: requester.studentProfile
        },
        requestedAt: request.requestedAt,
        status: request.status,
        requesterRole: request.requesterRole
      };
    }).filter(r => r !== null);

    res.status(200).json({
      success: true,
      pendingRequests: formattedRequests
    });

  } catch (error) {
    console.error('❌ Get connection requests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching connection requests',
      error: error.message 
    });
  }
};

// Enhanced getMyConnections - shows connections with both students and alumni
export const getMyConnections = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    console.log('🔗 Fetching connections for user:', currentUserId);

    // Get accepted connections where current user is either requester or recipient
    const connections = await Connection.find({
      $or: [
        { requesterId: currentUserId },
        { recipientId: currentUserId }
      ],
      status: 'accepted'
    })
    .populate({
      path: 'requesterId',
      select: 'name email graduationYear role',
      populate: [
        {
          path: 'alumniProfile',
          select: 'profileImage personalInfo academicInfo careerDetails',
          strictPopulate: false
        },
        {
          path: 'studentProfile',
          select: 'profileImage personalInfo academicInfo',
          strictPopulate: false
        }
      ],
      strictPopulate: false
    })
    .populate({
      path: 'recipientId',
      select: 'name email graduationYear role',
      populate: [
        {
          path: 'alumniProfile',
          select: 'profileImage personalInfo academicInfo careerDetails',
          strictPopulate: false
        },
        {
          path: 'studentProfile',
          select: 'profileImage personalInfo academicInfo',
          strictPopulate: false
        }
      ],
      strictPopulate: false
    })
    .sort({ respondedAt: -1 });

    console.log(`🤝 Found ${connections.length} connections`);

    // Format the response to show the other person in the connection
    // In getMyConnections function, update the formattedConnections part:

const formattedConnections = connections.map(connection => {
  const isRequester = connection.requesterId && connection.requesterId._id && connection.requesterId._id.toString() === currentUserId;
  const otherPerson = isRequester ? connection.recipientId : connection.requesterId;

  if (!otherPerson || !otherPerson._id) {
    console.warn('⚠️ Other person is null or missing _id in connection:', connection._id);
    return null;
  }

  // Enhanced role detection for connections
  let userRole = otherPerson?.role;

  // If role is not set in user model, use connection roles
  if (!userRole) {
    userRole = isRequester ? connection.recipientRole : connection.requesterRole;
  }

  // Determine which profile to use based on role
  const userProfile = userRole === 'alumni' ? 
    otherPerson.alumniProfile : otherPerson.studentProfile;

  // Enhanced graduation year resolution
  const graduationYear = userProfile?.academicInfo?.graduationYear ||
                        otherPerson.graduationYear ||
                        null;

  // Get profile image URL
  const profileImageUrl = userProfile?.profileImage 
    ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${userProfile.profileImage}`
    : null;

  return {
    id: connection._id,
    person: {
      id: otherPerson._id,
      name: otherPerson.name || 'Unknown User',
      email: otherPerson.email || 'No email',
      role: userRole, // Use the properly detected role
      graduationYear: graduationYear,
      profileImageUrl: profileImageUrl,
      // Include both profiles for compatibility
      alumniProfile: otherPerson.alumniProfile,
      studentProfile: otherPerson.studentProfile
    },
    connectedSince: connection.respondedAt,
    status: connection.status,
    initiatedByMe: isRequester,
    connectionType: `${connection.requesterRole}-${connection.recipientRole}`
  };
}).filter(connection => connection !== null);
    console.log(`✅ Returning ${formattedConnections.length} valid connections`);

    res.status(200).json({
      success: true,
      connections: formattedConnections
    });

  } catch (error) {
    console.error('❌ Get my connections error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching connections',
      error: error.message 
    });
  }
};

// Enhanced acceptConnection
export const acceptConnection = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { connectionId } = req.body;

    console.log('✅ Accepting connection request:', { currentUserId, connectionId });

    if (!connectionId) {
      return res.status(400).json({ 
        success: false,
        message: 'Connection ID is required' 
      });
    }

    // Find and update the connection
    const connection = await Connection.findOneAndUpdate(
      {
        _id: connectionId,
        recipientId: currentUserId,
        status: 'pending'
      },
      {
        status: 'accepted',
        respondedAt: new Date()
      },
      { new: true }
    ).populate('requesterId', 'name email role')
     .populate('recipientId', 'name email role');

    if (!connection) {
      return res.status(404).json({ 
        success: false,
        message: 'Connection request not found or already processed' 
      });
    }

    console.log('✅ Connection accepted successfully:', {
      connectionId: connection._id,
      requester: connection.requesterId.name,
      recipient: connection.recipientId.name,
      type: `${connection.requesterRole}-${connection.recipientRole}`
    });

    res.status(200).json({
      success: true,
      message: 'Connection request accepted successfully',
      connection: {
        id: connection._id,
        status: connection.status,
        connectedAt: connection.respondedAt,
        connectionType: `${connection.requesterRole}-${connection.recipientRole}`
      }
    });

  } catch (error) {
    console.error('❌ Accept connection error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error accepting connection request',
      error: error.message 
    });
  }
};

// Enhanced declineConnection
export const declineConnection = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { connectionId } = req.body;

    console.log('❌ Declining connection:', { currentUserId, connectionId });

    if (!connectionId) {
      return res.status(400).json({ 
        success: false,
        message: 'Connection ID is required' 
      });
    }

    // Find and update the connection
    const connection = await Connection.findOneAndUpdate(
      {
        _id: connectionId,
        recipientId: currentUserId,
        status: 'pending'
      },
      {
        status: 'declined',
        respondedAt: new Date()
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ 
        success: false,
        message: 'Connection request not found or already processed' 
      });
    }

    console.log('✅ Connection declined successfully:', connection._id);

    res.status(200).json({
      success: true,
      message: 'Connection request declined successfully',
      connectionId: connection._id
    });

  } catch (error) {
    console.error('❌ Decline connection error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error declining connection request',
      error: error.message 
    });
  }
};

// Cancel connection request
export const cancelConnectionRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { connectionId } = req.body;

    console.log('🗑️ Cancelling connection request:', { currentUserId, connectionId });

    if (!connectionId) {
      return res.status(400).json({ 
        success: false,
        message: 'Connection ID is required' 
      });
    }

    // Find and update the connection (only if current user is the requester)
    const connection = await Connection.findOneAndUpdate(
      {
        _id: connectionId,
        requesterId: currentUserId,
        status: 'pending'
      },
      {
        status: 'cancelled',
        respondedAt: new Date()
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ 
        success: false,
        message: 'Connection request not found or you are not the requester' 
      });
    }

    console.log('✅ Connection request cancelled successfully:', connection._id);

    res.status(200).json({
      success: true,
      message: 'Connection request cancelled successfully',
      connectionId: connection._id
    });

  } catch (error) {
    console.error('❌ Cancel connection error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error cancelling connection request',
      error: error.message 
    });
  }
};

// Get alumni directory
export const getAlumniDirectory = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { 
      page = 1, 
      limit = 12, 
      search = '', 
      graduationYear = '', 
      branch = '' 
    } = req.query;

    console.log('📋 Fetching alumni directory with filters:', {
      page, limit, search, graduationYear, branch
    });

    // Build base query
    let matchStage = {
      role: 'alumni',
      _id: { $ne: new mongoose.Types.ObjectId(currentUserId) }
    };

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      matchStage.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { 'alumniProfile.careerDetails.companyName': searchRegex }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'alumnis',
          localField: '_id',
          foreignField: 'userId',
          as: 'alumniProfile'
        }
      },
      {
        $unwind: {
          path: '$alumniProfile',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Add filters
    if (graduationYear && graduationYear !== '') {
      pipeline.push({
        $match: {
          $or: [
            { graduationYear: parseInt(graduationYear) },
            { 'alumniProfile.academicInfo.graduationYear': parseInt(graduationYear) }
          ]
        }
      });
    }

    if (branch && branch.trim() !== '') {
      pipeline.push({
        $match: {
          'alumniProfile.academicInfo.branch': { 
            $regex: branch.trim(), 
            $options: 'i' 
          }
        }
      });
    }

    // Add pagination
    pipeline.push(
      { $sort: { name: 1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    );

    const users = await User.aggregate(pipeline);
    
    // Get connection status for each user
    const alumniWithConnections = await Promise.all(
      users.map(async (user) => {
        const connection = await Connection.findOne({
          $or: [
            { requesterId: currentUserId, recipientId: user._id },
            { requesterId: user._id, recipientId: currentUserId }
          ],
          status: { $in: ['pending', 'accepted'] }
        });

        let connectionStatus = 'not_connected';
        if (connection) {
          if (connection.status === 'accepted') {
            connectionStatus = 'connected';
          } else if (connection.status === 'pending') {
            connectionStatus = connection.requesterId.toString() === currentUserId 
              ? 'pending_sent' 
              : 'pending_received';
          }
        }

        // Enhanced data resolution
        const graduationYear = user.alumniProfile?.academicInfo?.graduationYear || 
                              user.graduationYear || 
                              null;

        const profileImageUrl = user.alumniProfile?.profileImage 
          ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${user.alumniProfile.profileImage}`
          : null;

        return {
          id: user._id,
          userId: user._id,
          name: user.name,
          email: user.email,
          role: 'alumni',
          graduationYear: graduationYear,
          alumniProfile: user.alumniProfile,
          profileImageUrl: profileImageUrl,
          connectionStatus,
          branch: user.alumniProfile?.academicInfo?.branch,
          company: user.alumniProfile?.careerDetails?.companyName,
          jobTitle: user.alumniProfile?.careerDetails?.jobTitle
        };
      })
    );

    res.status(200).json({
      success: true,
      alumni: alumniWithConnections,
      totalPages: Math.ceil(users.length / parseInt(limit)),
      currentPage: parseInt(page),
      total: users.length
    });

  } catch (error) {
    console.error('❌ Get alumni directory error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching alumni directory',
      error: error.message 
    });
  }
};

// Get student directory
// Enhanced getStudentDirectory function
// Enhanced getStudentDirectory function
export const getStudentDirectory = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { 
      page = 1, 
      limit = 12, 
      search = '', 
      graduationYear = '', 
      branch = '' 
    } = req.query;

    console.log('📋 Fetching student directory with filters:', {
      page, limit, search, graduationYear, branch
    });

    // Build base query for students - ensure we're only getting students
    let matchStage = {
      role: 'student', // Explicitly filter by role
      _id: { $ne: new mongoose.Types.ObjectId(currentUserId) }
    };

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      matchStage.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { 'studentProfile.personalInfo.location': searchRegex }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'userId',
          as: 'studentProfile'
        }
      },
      {
        $unwind: {
          path: '$studentProfile',
          preserveNullAndEmptyArrays: false // Only include users with student profiles
        }
      }
    ];

    // Add graduation year filter
    if (graduationYear && graduationYear !== '') {
      pipeline.push({
        $match: {
          $or: [
            { graduationYear: parseInt(graduationYear) },
            { 'studentProfile.academicInfo.graduationYear': parseInt(graduationYear) }
          ]
        }
      });
    }

    // Add branch filter
    if (branch && branch.trim() !== '') {
      pipeline.push({
        $match: {
          'studentProfile.academicInfo.branch': { 
            $regex: branch.trim(), 
            $options: 'i' 
          }
        }
      });
    }

    // Add pagination
    pipeline.push(
      { $sort: { name: 1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    );

    const users = await User.aggregate(pipeline);
    
    console.log(`📊 Found ${users.length} student profiles`);

    // Get connection status for each user
    const studentsWithConnections = await Promise.all(
      users.map(async (user) => {
        const connection = await Connection.findOne({
          $or: [
            { requesterId: currentUserId, recipientId: user._id },
            { requesterId: user._id, recipientId: currentUserId }
          ],
          status: { $in: ['pending', 'accepted'] }
        });

        let connectionStatus = 'not_connected';
        if (connection) {
          if (connection.status === 'accepted') {
            connectionStatus = 'connected';
          } else if (connection.status === 'pending') {
            connectionStatus = connection.requesterId.toString() === currentUserId 
              ? 'pending_sent' 
              : 'pending_received';
          }
        }

        // Enhanced data resolution for students
        const graduationYear = user.studentProfile?.academicInfo?.graduationYear || 
                              user.graduationYear || 
                              null;

        const profileImageUrl = user.studentProfile?.profileImage 
          ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${user.studentProfile.profileImage}`
          : null;

        return {
          id: user._id,
          userId: user._id,
          name: user.name,
          email: user.email,
          role: 'student', // Explicitly set role
          graduationYear: graduationYear,
          studentProfile: user.studentProfile,
          profileImageUrl: profileImageUrl,
          connectionStatus,
          branch: user.studentProfile?.academicInfo?.branch,
          currentYear: user.studentProfile?.academicInfo?.currentYear,
          location: user.studentProfile?.personalInfo?.location
        };
      })
    );

    res.status(200).json({
      success: true,
      students: studentsWithConnections,
      totalPages: Math.ceil(studentsWithConnections.length / parseInt(limit)),
      currentPage: parseInt(page),
      total: studentsWithConnections.length
    });

  } catch (error) {
    console.error('❌ Get student directory error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching student directory',
      error: error.message 
    });
  }
};