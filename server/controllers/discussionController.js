// controllers/discussionController.js
import Discussion from '../models/Discussion.js';
import DiscussionReply from '../models/DiscussionReply.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';

// Helper function to get fresh author data with proper graduation year resolution
const getFreshAuthorData = async (authorId) => {
  try {
    // Fetch fresh user data
    const freshUser = await User.findById(authorId)
      .select('name email role graduationYear profileImage')
      .lean();
    
    if (!freshUser) return null;
    
    // Fetch alumni profile
    const alumniProfile = await Alumni.findOne({ userId: authorId })
      .select('profileImage personalInfo academicInfo')
      .lean();
    
    // Resolve graduation year with proper priority
    const graduationYear = alumniProfile?.academicInfo?.graduationYear || 
                          freshUser.graduationYear || 
                          null;
    
    // Resolve role
    const role = freshUser.role === 'alumni' || alumniProfile ? 'alumni' : freshUser.role || 'student';
    
    // Resolve profile image
    const profileImage = alumniProfile?.profileImage || 
                         freshUser.profileImage || 
                         null;
    
    return {
      ...freshUser,
      graduationYear,
      role,
      profileImage,
      alumniProfile
    };
  } catch (error) {
    console.error('Error fetching fresh author data:', error);
    return null;
  }
};

// Create a new discussion
export const createDiscussion = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const authorId = req.user.id;

    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and category are required'
      });
    }

    // Create new discussion
    const discussion = new Discussion({
      title,
      content,
      author: authorId,
      category,
      tags: tags || []
    });

    await discussion.save();

    // Get fresh author data
    const authorData = await getFreshAuthorData(authorId);
    
    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      discussion: {
        ...discussion.toObject(),
        author: authorData
      }
    });

  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating discussion',
      error: error.message
    });
  }
};

// Get all discussions with proper population
export const getDiscussions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category = '',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user.id;

    // Build query
    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get discussions
    const discussions = await Discussion.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Discussion.countDocuments(query);

    // Process discussions with fresh author data
    const discussionsWithDetails = await Promise.all(
      discussions.map(async (discussion) => {
        const replyCount = await DiscussionReply.countDocuments({ 
          discussion: discussion._id 
        });
        
        const isLiked = discussion.likes.some(likeUserId => 
          likeUserId.toString() === userId.toString()
        );

        // Get fresh author data
        const authorData = await getFreshAuthorData(discussion.author);

        return {
          ...discussion,
          author: authorData,
          replyCount,
          likeCount: discussion.likes.length,
          isLiked
        };
      })
    );

    res.status(200).json({
      success: true,
      discussions: discussionsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDiscussions: total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching discussions',
      error: error.message
    });
  }
};

// Get single discussion by ID with proper population
export const getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get discussion
    const discussion = await Discussion.findById(id).lean();

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Increment view count
    await Discussion.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Get fresh author data for discussion
    const discussionAuthorData = await getFreshAuthorData(discussion.author);

    // Get replies
    const replies = await DiscussionReply.find({ discussion: id })
      .populate({
        path: 'parentReply',
        populate: {
          path: 'author',
          select: 'name'
        }
      })
      .sort({ createdAt: 1 })
      .lean();

    // Process replies with fresh author data
    const repliesWithLikes = await Promise.all(
      replies.map(async (reply) => {
        // Get fresh author data for reply
        const replyAuthorData = await getFreshAuthorData(reply.author);

        return {
          ...reply,
          author: replyAuthorData,
          likeCount: reply.likes.length,
          isLiked: reply.likes.some(likeUserId => 
            likeUserId.toString() === userId.toString()
          )
        };
      })
    );

    const isLiked = discussion.likes.some(likeUserId => 
      likeUserId.toString() === userId.toString()
    );

    const replyCount = await DiscussionReply.countDocuments({ discussion: id });

    res.status(200).json({
      success: true,
      discussion: {
        ...discussion,
        author: discussionAuthorData,
        replyCount,
        likeCount: discussion.likes.length,
        isLiked
      },
      replies: repliesWithLikes
    });

  } catch (error) {
    console.error('Get discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching discussion',
      error: error.message
    });
  }
};

// Like/Unlike a discussion
export const toggleDiscussionLike = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const userId = req.user.id;

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    const isCurrentlyLiked = discussion.likes.some(likeUserId => 
      likeUserId.toString() === userId.toString()
    );

    let message = '';

    if (isCurrentlyLiked) {
      discussion.likes = discussion.likes.filter(likeUserId => 
        likeUserId.toString() !== userId.toString()
      );
      message = 'Discussion unliked successfully';
    } else {
      discussion.likes.push(userId);
      message = 'Discussion liked successfully';
    }

    await discussion.save();

    res.status(200).json({
      success: true,
      message,
      likeCount: discussion.likes.length,
      isLiked: !isCurrentlyLiked
    });

  } catch (error) {
    console.error('Toggle discussion like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating like',
      error: error.message
    });
  }
};

// Add reply to discussion with proper population
export const addReply = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content, parentReplyId } = req.body;
    const authorId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    // Check if discussion exists
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Create new reply
    const reply = new DiscussionReply({
      content,
      author: authorId,
      discussion: discussionId,
      parentReply: parentReplyId || null
    });

    await reply.save();

    // Get fresh author data
    const authorData = await getFreshAuthorData(authorId);

    // Get parent reply info if needed
    let parentReplyInfo = null;
    if (parentReplyId) {
      parentReplyInfo = await DiscussionReply.findById(parentReplyId)
        .populate({
          path: 'author',
          select: 'name'
        })
        .lean();
    }

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply: {
        ...reply.toObject(),
        author: authorData,
        parentReply: parentReplyInfo
      }
    });

  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding reply',
      error: error.message
    });
  }
};

// Like/Unlike a reply
export const toggleReplyLike = async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    const reply = await DiscussionReply.findById(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    const isCurrentlyLiked = reply.likes.some(likeUserId => 
      likeUserId.toString() === userId.toString()
    );

    let message = '';

    if (isCurrentlyLiked) {
      reply.likes = reply.likes.filter(likeUserId => 
        likeUserId.toString() !== userId.toString()
      );
      message = 'Reply unliked successfully';
    } else {
      reply.likes.push(userId);
      message = 'Reply liked successfully';
    }

    await reply.save();

    res.status(200).json({
      success: true,
      message,
      likeCount: reply.likes.length,
      isLiked: !isCurrentlyLiked
    });

  } catch (error) {
    console.error('Toggle reply like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating reply like',
      error: error.message
    });
  }
};

// Get user's discussions
export const getUserDiscussions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const discussions = await Discussion.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Discussion.countDocuments({ author: userId });

    // Add reply count and process author data for each discussion
    const discussionsWithCounts = await Promise.all(
      discussions.map(async (discussion) => {
        const replyCount = await DiscussionReply.countDocuments({ 
          discussion: discussion._id 
        });
        
        // Get fresh author data
        const authorData = await getFreshAuthorData(discussion.author);
        
        return {
          ...discussion,
          author: authorData,
          replyCount,
          likeCount: discussion.likes.length
        };
      })
    );

    res.status(200).json({
      success: true,
      discussions: discussionsWithCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDiscussions: total
      }
    });

  } catch (error) {
    console.error('Get user discussions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user discussions',
      error: error.message
    });
  }
};

// Update discussion
export const updateDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content, category, tags } = req.body;

    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Check if user is the author
    if (discussion.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own discussions'
      });
    }

    // Update discussion
    if (title) discussion.title = title;
    if (content) discussion.content = content;
    if (category) discussion.category = category;
    if (tags) discussion.tags = tags;

    await discussion.save();

    // Get fresh author data
    const authorData = await getFreshAuthorData(discussion.author);

    res.status(200).json({
      success: true,
      message: 'Discussion updated successfully',
      discussion: {
        ...discussion.toObject(),
        author: authorData
      }
    });

  } catch (error) {
    console.error('Update discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating discussion',
      error: error.message
    });
  }
};

// Delete discussion
export const deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Check if user is the author
    if (discussion.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own discussions'
      });
    }

    // Delete all replies first
    await DiscussionReply.deleteMany({ discussion: id });

    // Delete the discussion
    await Discussion.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Discussion deleted successfully'
    });

  } catch (error) {
    console.error('Delete discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting discussion',
      error: error.message
    });
  }
};