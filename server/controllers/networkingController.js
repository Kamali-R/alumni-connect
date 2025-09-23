import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';

// Get all alumni for directory (excluding current user and existing connections)
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
      status: 'complete',
      userId: { $ne: currentUserId } // Exclude current user
    };

    // Add search filters
    if (search && search.trim() !== '') {
      alumniQuery.$or = [
        { 'personalInfo.fullName': { $regex: search.trim(), $options: 'i' } },
        { 'personalInfo.personalEmail': { $regex: search.trim(), $options: 'i' } },
        { 'academicInfo.branch': { $regex: search.trim(), $options: 'i' } },
        { 'careerDetails.companyName': { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (graduationYear && graduationYear !== '') {
      alumniQuery['academicInfo.graduationYear'] = parseInt(graduationYear);
    }

    if (branch && branch !== '') {
      alumniQuery['academicInfo.branch'] = { 
        $regex: branch.replace(/[-\s]/g, '.*'), 
        $options: 'i' 
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get alumni profiles with pagination
    const alumniProfiles = await Alumni.find(alumniQuery)
      .populate('userId', 'name email role graduationYear')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Alumni.countDocuments(alumniQuery);

    // Get all connections for the current user
    const connections = await Connection.find({
      $or: [
        { requesterId: currentUserId },
        { recipientId: currentUserId }
      ]
    });

    // Create a map for quick connection lookup
    const connectionMap = {};
    connections.forEach(conn => {
      const otherUserId = conn.requesterId.toString() === currentUserId 
        ? conn.recipientId.toString() 
        : conn.requesterId.toString();
      
      connectionMap[otherUserId] = {
        id: conn._id,
        status: conn.status,
        isRequester: conn.requesterId.toString() === currentUserId
      };
    });

    // Process alumni profiles
    const alumniWithConnections = await Promise.all(
      alumniProfiles.map(async (alumni) => {
        if (!alumni.userId) {
          console.log('Alumni profile without userId:', alumni._id);
          return null;
        }

        const userId = alumni.userId._id.toString();
        const connection = connectionMap[userId];
        
        let connectionStatus = 'not_connected';
        if (connection) {
          if (connection.status === 'pending') {
            connectionStatus = connection.isRequester ? 'pending_sent' : 'pending_received';
          } else if (connection.status === 'accepted') {
            connectionStatus = 'connected';
          }
        }

        // Get complete alumni profile data
        const alumniData = alumni.toObject();
        
        return {
          id: userId,
          alumniProfileId: alumni._id,
          name: alumni.personalInfo?.fullName || alumni.userId?.name || 'Unknown',
          email: alumni.personalInfo?.personalEmail || alumni.userId?.email,
          graduationYear: alumni.academicInfo?.graduationYear,
          alumniProfile: alumniData,
          connectionStatus: connectionStatus,
          profileImageUrl: alumni.profileImage ? 
            `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${alumni.profileImage}` : 
            null
        };
      })
    );

    const filteredAlumni = alumniWithConnections.filter(Boolean);

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
// Enhanced sendConnectionRequest function
export const sendConnectionRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { recipientId } = req.body;

    console.log('🔗 [BACKEND] Connection request received:', {
      currentUserId,
      recipientId,
      body: req.body
    });

    // Validate recipientId
    if (!recipientId) {
      console.log('❌ [BACKEND] Recipient ID is required');
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (currentUserId === recipientId) {
      console.log('❌ [BACKEND] Cannot connect to self');
      return res.status(400).json({ message: 'Cannot send connection request to yourself' });
    }

    // Check if recipient exists as a User
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      console.log('❌ [BACKEND] Recipient user not found:', recipientId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if recipient has an alumni profile
    const recipientAlumniProfile = await Alumni.findOne({ userId: recipientId });
    if (!recipientAlumniProfile) {
      console.log('❌ [BACKEND] Recipient alumni profile not found');
      return res.status(404).json({ message: 'Alumni profile not found for this user' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, recipientId: recipientId },
        { requesterId: recipientId, recipientId: currentUserId }
      ]
    });

    if (existingConnection) {
      console.log('ℹ️ [BACKEND] Connection already exists:', existingConnection.status);
      return res.status(400).json({ 
        message: 'Connection already exists',
        status: existingConnection.status 
      });
    }

    // Create new connection request
    const connection = new Connection({
      requesterId: currentUserId,
      recipientId: recipientId,
      status: 'pending',
      requestedAt: new Date()
    });

    await connection.save();
    console.log('✅ [BACKEND] Connection request saved to database');

    // Populate the response for better debugging
    await connection.populate('requesterId', 'name email');
    await connection.populate('recipientId', 'name email');

    console.log('✅ [BACKEND] Connection request successful');
    
    res.status(201).json({
      message: 'Connection request sent successfully',
      connection: {
        id: connection._id,
        requester: connection.requesterId,
        recipient: connection.recipientId,
        status: connection.status,
        requestedAt: connection.requestedAt
      }
    });

  } catch (error) {
    console.error('❌ [BACKEND] Send connection request error:', error);
    res.status(500).json({ 
      message: 'Server error sending connection request',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
    .populate('requesterId', 'name email graduationYear')
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
            alumniProfile: alumniProfile || null
          },
          requestedAt: request.requestedAt
        };
      })
    );

    res.status(200).json({
      pendingRequests: formattedRequests
    });

  } catch (error) {
    console.error('❌ Get connection requests error:', error);
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
            alumniProfile: alumniProfile || null
          },
          connectedSince: connection.respondedAt
        };
      })
    );

    res.status(200).json({
      connections: formattedConnections
    });

  } catch (error) {
    console.error('❌ Get my connections error:', error);
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
    console.error('❌ Accept connection error:', error);
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
    console.error('❌ Decline connection error:', error);
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

    await Connection.findByIdAndDelete(connectionId);

    res.status(200).json({
      message: 'Connection request cancelled'
    });

  } catch (error) {
    console.error('❌ Cancel connection error:', error);
    res.status(500).json({ 
      message: 'Server error cancelling connection',
      error: error.message 
    });
  }
};

// Remove connection
export const removeConnection = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      status: 'accepted',
      $or: [
        { requesterId: currentUserId },
        { recipientId: currentUserId }
      ]
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.status(200).json({
      message: 'Connection removed successfully'
    });

  } catch (error) {
    console.error('❌ Remove connection error:', error);
    res.status(500).json({ 
      message: 'Server error removing connection',
      error: error.message 
    });
  }
};