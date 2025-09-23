import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';

// Get all alumni for directory (excluding current user and including connection status)
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

    // Get all connections for the current user to determine connection status
    const connections = await Connection.find({
      $or: [
        { requesterId: currentUserId },
        { recipientId: currentUserId }
      ]
    }).lean();

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

    // Process alumni profiles and add connection status
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

        return {
          id: userId,
          alumniProfileId: alumni._id,
          name: alumni.personalInfo?.fullName || alumni.userId?.name || 'Unknown',
          email: alumni.personalInfo?.personalEmail || alumni.userId?.email,
          graduationYear: alumni.academicInfo?.graduationYear,
          alumniProfile: alumni.toObject(),
          connectionStatus: connectionStatus,
          profileImageUrl: alumni.profileImage ? 
            `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${alumni.profileImage}` : 
            null
        };
      })
    );

    const filteredAlumni = alumniWithConnections.filter(Boolean);

    console.log(`✅ Found ${filteredAlumni.length} alumni profiles`);

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

    console.log('🔗 Processing connection request:', { 
      currentUserId, 
      recipientId,
      userRole: req.user.role 
    });

    // Validation
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (currentUserId === recipientId) {
      return res.status(400).json({ message: 'Cannot send connection request to yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, recipientId: recipientId },
        { requesterId: recipientId, recipientId: currentUserId }
      ]
    });

    if (existingConnection) {
      let message = 'Connection already exists';
      if (existingConnection.status === 'pending') {
        const isRequester = existingConnection.requesterId.toString() === currentUserId;
        message = isRequester ? 'Connection request already sent' : 'You have a pending request from this user';
      } else if (existingConnection.status === 'accepted') {
        message = 'Already connected with this user';
      } else if (existingConnection.status === 'declined') {
        message = 'Connection request was previously declined';
      }
      
      return res.status(400).json({ 
        message,
        status: existingConnection.status,
        connectionId: existingConnection._id
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
    console.log('✅ Connection request created:', connection._id);

    // Populate the response with user details
    await connection.populate('requesterId', 'name email');
    await connection.populate('recipientId', 'name email');

    res.status(201).json({
      message: 'Connection request sent successfully',
      connection: {
        id: connection._id,
        requester: {
          id: connection.requesterId._id,
          name: connection.requesterId.name,
          email: connection.requesterId.email
        },
        recipient: {
          id: connection.recipientId._id,
          name: connection.recipientId.name,
          email: connection.recipientId.email
        },
        status: connection.status,
        requestedAt: connection.requestedAt
      }
    });

  } catch (error) {
    console.error('❌ Send connection request error:', error);
    res.status(500).json({ 
      message: 'Server error sending connection request',
      error: error.message 
    });
  }
};

// Get connection requests (pending received by current user)
export const getConnectionRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    console.log('📥 Fetching connection requests for user:', currentUserId);

    const pendingRequests = await Connection.find({
      recipientId: currentUserId,
      status: 'pending'
    })
    .populate('requesterId', 'name email graduationYear')
    .sort({ requestedAt: -1 })
    .lean();

    console.log(`Found ${pendingRequests.length} pending requests`);

    const formattedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        // Get alumni profile for additional details
        const alumniProfile = await Alumni.findOne({ userId: request.requesterId._id }).lean();
        
        return {
          id: request._id,
          person: {
            id: request.requesterId._id,
            name: request.requesterId.name,
            email: request.requesterId.email,
            graduationYear: request.requesterId.graduationYear,
            alumniProfile: alumniProfile || null
          },
          requestedAt: request.requestedAt,
          message: request.message || null
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

// Get my connections (accepted connections)
export const getMyConnections = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    console.log('🤝 Fetching connections for user:', currentUserId);

    const connections = await Connection.find({
      $or: [
        { requesterId: currentUserId, status: 'accepted' },
        { recipientId: currentUserId, status: 'accepted' }
      ]
    })
    .populate('requesterId', 'name email graduationYear')
    .populate('recipientId', 'name email graduationYear')
    .sort({ respondedAt: -1 })
    .lean();

    console.log(`Found ${connections.length} accepted connections`);

    const formattedConnections = await Promise.all(
      connections.map(async (connection) => {
        // Determine which user is the "other" person
        const otherUser = 
          connection.requesterId._id.toString() === currentUserId.toString() 
            ? connection.recipientId 
            : connection.requesterId;

        // Get alumni profile for additional details
        const alumniProfile = await Alumni.findOne({ userId: otherUser._id }).lean();

        return {
          id: connection._id,
          person: {
            id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            graduationYear: otherUser.graduationYear,
            alumniProfile: alumniProfile || null
          },
          connectedSince: connection.respondedAt,
          connectionType: connection.requesterId._id.toString() === currentUserId ? 'sent' : 'received'
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

    console.log('✅ Accepting connection:', { currentUserId, connectionId });

    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }

    // Find the connection request
    const connection = await Connection.findOne({
      _id: connectionId,
      recipientId: currentUserId,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ 
        message: 'Connection request not found or already processed' 
      });
    }

    // Update connection status
    connection.status = 'accepted';
    connection.respondedAt = new Date();
    await connection.save();

    console.log('✅ Connection accepted successfully');

    // Populate user details for response
    await connection.populate('requesterId', 'name email');
    await connection.populate('recipientId', 'name email');

    res.status(200).json({
      message: 'Connection request accepted successfully',
      connection: {
        id: connection._id,
        requester: {
          id: connection.requesterId._id,
          name: connection.requesterId.name,
          email: connection.requesterId.email
        },
        recipient: {
          id: connection.recipientId._id,
          name: connection.recipientId.name,
          email: connection.recipientId.email
        },
        status: connection.status,
        connectedAt: connection.respondedAt
      }
    });

  } catch (error) {
    console.error('❌ Accept connection error:', error);
    res.status(500).json({ 
      message: 'Server error accepting connection request',
      error: error.message 
    });
  }
};

// Decline connection request
export const declineConnection = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { connectionId } = req.body;

    console.log('❌ Declining connection:', { currentUserId, connectionId });

    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }

    // Find the connection request
    const connection = await Connection.findOne({
      _id: connectionId,
      recipientId: currentUserId,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ 
        message: 'Connection request not found or already processed' 
      });
    }

    // Update connection status
    connection.status = 'declined';
    connection.respondedAt = new Date();
    await connection.save();

    console.log('✅ Connection declined successfully');

    res.status(200).json({
      message: 'Connection request declined successfully',
      connectionId: connection._id
    });

  } catch (error) {
    console.error('❌ Decline connection error:', error);
    res.status(500).json({ 
      message: 'Server error declining connection request',
      error: error.message 
    });
  }
};

// Cancel connection request (for requester to cancel their own request)
export const cancelConnectionRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { connectionId } = req.body;

    console.log('🚫 Cancelling connection request:', { currentUserId, connectionId });

    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }

    // Find the connection request that the current user sent
    const connection = await Connection.findOne({
      _id: connectionId,
      requesterId: currentUserId,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ 
        message: 'Connection request not found or cannot be cancelled' 
      });
    }

    // Delete the connection request
    await Connection.findByIdAndDelete(connectionId);

    console.log('✅ Connection request cancelled successfully');

    res.status(200).json({
      message: 'Connection request cancelled successfully',
      connectionId: connectionId
    });

  } catch (error) {
    console.error('❌ Cancel connection request error:', error);
    res.status(500).json({ 
      message: 'Server error cancelling connection request',
      error: error.message 
    });
  }
};

// Remove existing connection (for users to disconnect)
export const removeConnection = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { connectionId } = req.body;

    console.log('🗑️ Removing connection:', { currentUserId, connectionId });

    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }

    // Find the accepted connection
    const connection = await Connection.findOne({
      _id: connectionId,
      status: 'accepted',
      $or: [
        { requesterId: currentUserId },
        { recipientId: currentUserId }
      ]
    });

    if (!connection) {
      return res.status(404).json({ 
        message: 'Connection not found or access denied' 
      });
    }

    // Delete the connection
    await Connection.findByIdAndDelete(connectionId);

    console.log('✅ Connection removed successfully');

    res.status(200).json({
      message: 'Connection removed successfully',
      connectionId: connectionId
    });

  } catch (error) {
    console.error('❌ Remove connection error:', error);
    res.status(500).json({ 
      message: 'Server error removing connection',
      error: error.message 
    });
  }
};