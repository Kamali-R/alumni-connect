import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';
import mongoose from 'mongoose';

// Send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { recipientId } = req.body;

    console.log('🔗 Sending connection request:', { 
      currentUserId, 
      recipientId,
      timestamp: new Date().toISOString()
    });

    // Enhanced validation
    if (!recipientId) {
      return res.status(400).json({ 
        success: false,
        message: 'Recipient ID is required' 
      });
    }

    // Validate ObjectId format
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

    // Check if recipient exists and is an alumni
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipient not found' 
      });
    }

    if (recipient.role !== 'alumni') {
      return res.status(400).json({ 
        success: false,
        message: 'Can only connect with alumni users' 
      });
    }

    // Check for existing connection
    const existingConnection = await Connection.findConnection(currentUserId, recipientId);
    
    if (existingConnection) {
      let message = 'Connection already exists';
      let existingStatus = existingConnection.status;
      
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
      } else if (existingConnection.status === 'cancelled') {
        message = 'Connection request was cancelled';
      }
      
      console.log('ℹ️ Connection exists:', { message, existingStatus });
      
      return res.status(400).json({ 
        success: false,
        message,
        existingStatus 
      });
    }

    // Create new connection
    const connection = new Connection({
      requesterId: currentUserId,
      recipientId: recipientId,
      status: 'pending',
      requestedAt: new Date()
    });

    // Validate before saving
    try {
      await connection.validate();
    } catch (validationError) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid connection data',
        error: validationError.message 
      });
    }

    await connection.save();
    
    console.log('✅ Connection request created successfully:', {
      connectionId: connection._id,
      requester: currentUserId,
      recipient: recipientId,
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
        message: 'Connection request already exists (duplicate key)',
        error: error.message 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid connection data',
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error sending connection request',
      error: error.message,
      code: error.code
    });
  }
};

// Get connection requests
// Fixed getConnectionRequests function in networkingController.js
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
      populate: {
        path: 'alumniProfile',
        select: 'profileImage personalInfo academicInfo'
      }
    })
    .sort({ requestedAt: -1 })
    .lean();

    console.log(`📋 Found ${pendingRequests.length} pending requests`);

    // Format the response
    const formattedRequests = pendingRequests.map(request => {
      const requester = request.requesterId;
      
      // FIXED: Enhanced graduation year resolution
      const graduationYear = requester.alumniProfile?.academicInfo?.graduationYear ||
                            requester.graduationYear ||
                            null;

      // Get profile image URL
      const profileImageUrl = requester.alumniProfile?.profileImage 
        ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${requester.alumniProfile.profileImage}`
        : null;

      return {
        id: request._id,
        person: {
          id: requester._id,
          name: requester.name,
          email: requester.email,
          role: requester.role || 'alumni', // FIXED: Properly set role
          graduationYear: graduationYear, // FIXED: Use resolved graduation year
          profileImageUrl: profileImageUrl,
          profileImage: requester.alumniProfile?.profileImage,
          // Add alumni profile reference for compatibility
          alumniProfile: requester.alumniProfile
        },
        requestedAt: request.requestedAt,
        status: request.status
      };
    });

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
// Accept connection request
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
    ).populate('requesterId', 'name email')
     .populate('recipientId', 'name email');

    if (!connection) {
      return res.status(404).json({ 
        success: false,
        message: 'Connection request not found or already processed' 
      });
    }

    console.log('✅ Connection accepted successfully:', connection._id);

    res.status(200).json({
      success: true,
      message: 'Connection request accepted successfully',
      connection: {
        id: connection._id,
        status: connection.status,
        connectedAt: connection.respondedAt
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

// Decline connection request
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
// Fixed getAlumniDirectory function in networkingController.js
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

    // FIXED: Get users with alumni profiles using proper aggregation
    let matchStage = {
      role: 'alumni',
      _id: { $ne: new mongoose.Types.ObjectId(currentUserId) }
    };

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      matchStage.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'alumnis', // Collection name for Alumni model
          localField: '_id',
          foreignField: 'userId',
          as: 'alumniProfile'
        }
      },
      {
        $unwind: {
          path: '$alumniProfile',
          preserveNullAndEmptyArrays: false // Only include users with alumni profiles
        }
      }
    ];

    // Add graduation year filter if specified
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

    // Add branch filter if specified
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

    // Execute aggregation
    const users = await User.aggregate(pipeline);
    
    // Get total count for pagination
    const countPipeline = [...pipeline];
    countPipeline.pop(); // Remove limit
    countPipeline.pop(); // Remove skip
    countPipeline.pop(); // Remove sort
    countPipeline.push({ $count: "total" });
    
    const countResult = await User.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Get connection status for each user
    const alumniWithConnections = await Promise.all(
      users.map(async (user) => {
        const connection = await Connection.findConnection(currentUserId, user._id);
        
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

        // FIXED: Enhanced graduation year resolution
        const graduationYear = user.alumniProfile?.academicInfo?.graduationYear || 
                              user.graduationYear || 
                              null;

        // FIXED: Enhanced profile image URL handling
        const profileImageUrl = user.alumniProfile?.profileImage 
          ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${user.alumniProfile.profileImage}`
          : null;

        return {
          id: user._id,
          userId: user._id,
          name: user.name,
          email: user.email,
          role: 'alumni', // Explicitly set since we filtered for alumni
          graduationYear: graduationYear, // This should now show the updated value
          alumniProfile: user.alumniProfile,
          profileImageUrl: profileImageUrl,
          connectionStatus,
          branch: user.alumniProfile?.academicInfo?.branch,
          company: user.alumniProfile?.careerDetails?.companyName,
          jobTitle: user.alumniProfile?.careerDetails?.jobTitle
        };
      })
    );

    console.log(`📊 Found ${alumniWithConnections.length} alumni profiles`);

    res.status(200).json({
      success: true,
      alumni: alumniWithConnections,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total,
      hasMore: (parseInt(page) - 1) * parseInt(limit) + alumniWithConnections.length < total
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
// Get my connections
// Enhanced getMyConnections function in networkingController.js
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
      populate: {
        path: 'alumniProfile',
        select: 'profileImage personalInfo academicInfo'
      }
    })
    .populate({
      path: 'recipientId', 
      select: 'name email graduationYear role',
      populate: {
        path: 'alumniProfile',
        select: 'profileImage personalInfo academicInfo'
      }
    })
    .sort({ respondedAt: -1 });

    console.log(`🤝 Found ${connections.length} connections`);

    // Format the response to show the other person in the connection
    const formattedConnections = connections.map(connection => {
      const isRequester = connection.requesterId._id.toString() === currentUserId;
      const otherPerson = isRequester ? connection.recipientId : connection.requesterId;

      // FIXED: Enhanced graduation year resolution
      const graduationYear = otherPerson.alumniProfile?.academicInfo?.graduationYear ||
                            otherPerson.graduationYear ||
                            null;

      // Get profile image URL
      const profileImageUrl = otherPerson.alumniProfile?.profileImage 
        ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${otherPerson.alumniProfile.profileImage}`
        : null;

      return {
        id: connection._id,
        person: {
          id: otherPerson._id,
          name: otherPerson.name,
          email: otherPerson.email,
          role: otherPerson.role || 'alumni', // FIXED: Properly set role
          graduationYear: graduationYear, // FIXED: Use resolved graduation year
          profileImageUrl: profileImageUrl,
          profileImage: otherPerson.alumniProfile?.profileImage,
          // Add alumni profile reference for compatibility
          alumniProfile: otherPerson.alumniProfile
        },
        connectedSince: connection.respondedAt,
        status: connection.status,
        initiatedByMe: isRequester
      };
    });

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