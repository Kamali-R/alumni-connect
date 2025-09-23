// controllers/networkingController.js
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';

// Get all alumni for directory (excluding current user and existing connections)
// controllers/networkingController.js - Updated getAlumniDirectory function
// controllers/networkingController.js - Updated with debugging
export const getAlumniDirectory = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { page = 1, limit = 12, search = '', branch = '', graduationYear = '' } = req.query;

    console.log('🔍 Fetching alumni directory with filters:', {
      currentUserId,
      page,
      limit,
      search,
      branch,
      graduationYear
    });

    // Build search query for alumni profiles
    let alumniQuery = { 
  // Remove status filter or include multiple statuses
  $or: [
    { status: 'complete' },
    { status: 'draft' },
    { status: { $exists: false } } // Include profiles without status field
  ]
};
    // Exclude current user's profile
    const currentUserAlumniProfile = await Alumni.findOne({ userId: currentUserId });
    console.log('👤 Current user alumni profile:', currentUserAlumniProfile ? 'Found' : 'Not found');
    
    if (currentUserAlumniProfile) {
      alumniQuery._id = { $ne: currentUserAlumniProfile._id };
    }

    // Add search filters
    if (search) {
      alumniQuery.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { 'personalInfo.personalEmail': { $regex: search, $options: 'i' } },
        { 'academicInfo.collegeEmail': { $regex: search, $options: 'i' } },
        { 'academicInfo.branch': { $regex: search, $options: 'i' } },
        { 'careerDetails.companyName': { $regex: search, $options: 'i' } }
      ];
    }

    if (graduationYear) {
      alumniQuery['academicInfo.graduationYear'] = parseInt(graduationYear);
    }

    if (branch) {
  // Use case-insensitive regex and handle different formats
  alumniQuery['academicInfo.branch'] = { 
    $regex: branch.replace(/[-\s]/g, '.*'), // Handle spaces and dashes
    $options: 'i' 
  };
}

    console.log('📋 Final query:', JSON.stringify(alumniQuery, null, 2));

    // Get total count first
    const total = await Alumni.countDocuments(alumniQuery);
    console.log('📊 Total alumni found:', total);

    // Get alumni profiles with pagination
   const alumniProfiles = await Alumni.find(alumniQuery)
  .populate({
    path: 'userId',
    select: 'name email role graduationYear',
    // Use left join to include alumni even if userId is missing/invalid
    options: { allowNull: true }
  })
  .limit(limit * 1)
  .skip((page - 1) * limit)
  .sort({ createdAt: -1 });

// Modified processing to handle missing userId
const alumniWithConnections = await Promise.all(
  alumniProfiles.map(async (alumni) => {
    // If no userId, we can't establish connections but can still show profile
    if (!alumni.userId) {
      return {
        id: alumni._id, // Use alumni ID instead of user ID
        alumniProfileId: alumni._id,
        name: alumni.personalInfo.fullName || 'Alumni Member',
        email: alumni.personalInfo.personalEmail || 'No email',
        graduationYear: alumni.academicInfo.graduationYear,
        alumniProfile: alumni.toObject(),
        connectionStatus: 'not_connected', // Can't connect without userId
        type: 'alumni',
        profileImage: alumni.profileImage,
        profileImageUrl: alumni.profileImage ? `/uploads/${alumni.profileImage}` : null,
        noUserId: true // Flag to indicate no user account
      };
    }

        const connection = await Connection.findOne({
          $or: [
            { requesterId: currentUserId, recipientId: alumni.userId._id },
            { requesterId: alumni.userId._id, recipientId: currentUserId }
          ]
        });

        let connectionStatus = 'not_connected';
        if (connection) {
          if (connection.status === 'pending') {
            connectionStatus = connection.requesterId.toString() === currentUserId ? 'pending_sent' : 'pending_received';
          } else if (connection.status === 'accepted') {
            connectionStatus = 'connected';
          }
        }

        const alumniData = {
          id: alumni.userId._id,
          alumniProfileId: alumni._id,
          name: alumni.personalInfo.fullName || alumni.userId.name,
          email: alumni.personalInfo.personalEmail || alumni.userId.email,
          graduationYear: alumni.academicInfo.graduationYear,
          alumniProfile: alumni.toObject(),
          connectionStatus: connectionStatus,
          type: 'alumni',
          profileImage: alumni.profileImage,
          profileImageUrl: alumni.profileImage ? `/uploads/${alumni.profileImage}` : null
        };

        console.log('👤 Processed alumni:', alumniData.name, 'ID:', alumniData.id);
        return alumniData;
      })
    );

    // Filter out null values
    const filteredAlumni = alumniWithConnections.filter(alumni => alumni !== null);
    console.log('🎯 Final alumni count after filtering:', filteredAlumni.length);

    res.status(200).json({
      alumni: filteredAlumni,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('❌ Get alumni directory error:', error);
    res.status(500).json({ 
      message: 'Server error fetching alumni directory',
      error: error.message 
    });
  }
};
// Send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    // Check if recipient exists and is alumni
    const recipient = await User.findOne({ 
      _id: recipientId, 
      role: 'alumni' 
    });
    
    if (!recipient) {
      return res.status(404).json({ message: 'Alumni not found' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, recipientId: recipientId },
        { requesterId: recipientId, recipientId: currentUserId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ 
        message: 'Connection request already exists',
        status: existingConnection.status 
      });
    }

    // Create new connection request
    const connection = new Connection({
      requesterId: currentUserId,
      recipientId: recipientId,
      status: 'pending'
    });

    await connection.save();

    res.status(201).json({
      message: 'Connection request sent successfully',
      connection
    });

  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ 
      message: 'Server error sending connection request',
      error: error.message 
    });
  }
};

// Get connection requests (pending received)
export const getConnectionRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const pendingRequests = await Connection.find({
      recipientId: currentUserId,
      status: 'pending'
    })
    .populate('requesterId', 'name email graduationYear alumniProfile')
    .sort({ requestedAt: -1 });

    const formattedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        const alumniProfile = await Alumni.findOne({ userId: request.requesterId._id });
        return {
          id: request._id,
          person: {
            id: request.requesterId._id,
            name: request.requesterId.name,
            email: request.requesterId.email,
            graduationYear: request.requesterId.graduationYear,
            alumniProfile: alumniProfile,
            type: 'alumni'
          },
          requestedAt: request.requestedAt
        };
      })
    );

    res.status(200).json({
      pendingRequests: formattedRequests
    });

  } catch (error) {
    console.error('Get connection requests error:', error);
    res.status(500).json({ 
      message: 'Server error fetching connection requests',
      error: error.message 
    });
  }
};

// Get my connections (accepted)
export const getMyConnections = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const connections = await Connection.find({
      $or: [
        { requesterId: currentUserId, status: 'accepted' },
        { recipientId: currentUserId, status: 'accepted' }
      ]
    })
    .populate('requesterId', 'name email graduationYear')
    .populate('recipientId', 'name email graduationYear')
    .sort({ respondedAt: -1 });

    const formattedConnections = await Promise.all(
      connections.map(async (connection) => {
        // Determine which user is the other party (not current user)
        const otherUser = 
          connection.requesterId._id.toString() === currentUserId.toString() 
            ? connection.recipientId 
            : connection.requesterId;

        const alumniProfile = await Alumni.findOne({ userId: otherUser._id });

        return {
          id: connection._id,
          person: {
            id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            graduationYear: otherUser.graduationYear,
            alumniProfile: alumniProfile,
            type: 'alumni'
          },
          connectedSince: connection.respondedAt
        };
      })
    );

    res.status(200).json({
      connections: formattedConnections
    });

  } catch (error) {
    console.error('Get my connections error:', error);
    res.status(500).json({ 
      message: 'Server error fetching connections',
      error: error.message 
    });
  }
};

// Accept connection request
export const acceptConnection = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      recipientId: currentUserId,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    connection.status = 'accepted';
    connection.respondedAt = new Date();
    await connection.save();

    res.status(200).json({
      message: 'Connection request accepted',
      connection
    });

  } catch (error) {
    console.error('Accept connection error:', error);
    res.status(500).json({ 
      message: 'Server error accepting connection',
      error: error.message 
    });
  }
};

// Decline connection request
export const declineConnection = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      recipientId: currentUserId,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    connection.status = 'declined';
    connection.respondedAt = new Date();
    await connection.save();

    res.status(200).json({
      message: 'Connection request declined'
    });

  } catch (error) {
    console.error('Decline connection error:', error);
    res.status(500).json({ 
      message: 'Server error declining connection',
      error: error.message 
    });
  }
};

// Cancel connection request
export const cancelConnectionRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      requesterId: currentUserId,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    await Connection.deleteOne({ _id: connectionId });

    res.status(200).json({
      message: 'Connection request cancelled'
    });

  } catch (error) {
    console.error('Cancel connection error:', error);
    res.status(500).json({ 
      message: 'Server error cancelling connection',
      error: error.message 
    });
  }
};