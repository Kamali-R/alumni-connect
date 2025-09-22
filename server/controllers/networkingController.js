// controllers/networkingController.js
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';

// Get all alumni for directory (excluding current user and existing connections)
export const getAlumniDirectory = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { page = 1, limit = 12, search = '', branch = '', graduationYear = '' } = req.query;

    // Build search query for alumni users
    let userQuery = { 
      role: 'alumni',
      _id: { $ne: currentUserId }, // Exclude current user
      profileCompleted: true // Only show alumni with completed profiles
    };

    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (graduationYear) {
      userQuery.graduationYear = parseInt(graduationYear);
    }

    // Get alumni users with pagination
    const users = await User.find(userQuery)
      .select('name email role graduationYear alumniProfile')
      .populate('alumniProfile')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    // Get connection status for each user and complete profile data
    const alumniWithConnections = await Promise.all(
      users.map(async (user) => {
        const connection = await Connection.findOne({
          $or: [
            { requesterId: currentUserId, recipientId: user._id },
            { requesterId: user._id, recipientId: currentUserId }
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

        // Get complete alumni profile
        const alumniProfile = await Alumni.findOne({ userId: user._id }).lean();

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          graduationYear: user.graduationYear,
          alumniProfile: alumniProfile,
          connectionStatus: connectionStatus,
          type: 'alumni'
        };
      })
    );

    // Filter by branch if specified
    let filteredAlumni = alumniWithConnections;
    if (branch) {
      filteredAlumni = alumniWithConnections.filter(alumni => 
        alumni.alumniProfile?.academicInfo?.branch?.toLowerCase().includes(branch.toLowerCase())
      );
    }

    const total = await User.countDocuments(userQuery);

    res.status(200).json({
      alumni: filteredAlumni,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get alumni directory error:', error);
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