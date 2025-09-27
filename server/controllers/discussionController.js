import Discussion from '../models/Discussion.js';
import DiscussionReply from '../models/DiscussionReply.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';

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

    // Populate author details for response
    await discussion.populate({
      path: 'author',
      select: 'name email role graduationYear profileImage alumniProfile',
      populate: {
        path: 'alumniProfile',
        select: 'profileImage personalInfo academicInfo'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      discussion
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

// Get all discussions with pagination and filters
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

    const discussions = await Discussion.find(query)
      .populate({
        path: 'author',
        select: 'name email role graduationYear profileImage alumniProfile',
        populate: {
          path: 'alumniProfile',
          select: 'profileImage personalInfo academicInfo'
        }
      })
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Discussion.countDocuments(query);

    // Add like information and reply count for each discussion
    const discussionsWithDetails = await Promise.all(
      discussions.map(async (discussion) => {
        const replyCount = await DiscussionReply.countDocuments({ 
          discussion: discussion._id 
        });
        
        const isLiked = discussion.likes.some(likeUserId => 
          likeUserId.toString() === userId.toString()
        );

        return {
          ...discussion,
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

// Get single discussion by ID
export const getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const discussion = await Discussion.findById(id)
      .populate({
        path: 'author',
        select: 'name email role graduationYear profileImage alumniProfile',
        populate: {
          path: 'alumniProfile',
          select: 'profileImage personalInfo academicInfo'
        }
      });

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Increment view count
    discussion.views += 1;
    await discussion.save();

    // Get replies for this discussion
    const replies = await DiscussionReply.find({ discussion: id })
      .populate({
        path: 'author',
        select: 'name email role graduationYear profileImage alumniProfile',
        populate: {
          path: 'alumniProfile',
          select: 'profileImage personalInfo academicInfo'
        }
      })
      .populate({
        path: 'parentReply',
        populate: {
          path: 'author',
          select: 'name'
        }
      })
      .sort({ createdAt: 1 })
      .lean();

    // Add like information to replies
    const repliesWithLikes = replies.map(reply => ({
      ...reply,
      likeCount: reply.likes.length,
      isLiked: reply.likes.some(likeUserId => 
        likeUserId.toString() === userId.toString()
      )
    }));

    const isLiked = discussion.likes.some(likeUserId => 
      likeUserId.toString() === userId.toString()
    );

    const replyCount = await DiscussionReply.countDocuments({ discussion: id });

    res.status(200).json({
      success: true,
      discussion: {
        ...discussion.toObject(),
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
      // Unlike the discussion
      discussion.likes = discussion.likes.filter(likeUserId => 
        likeUserId.toString() !== userId.toString()
      );
      message = 'Discussion unliked successfully';
    } else {
      // Like the discussion
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

// Add reply to discussion
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

    // Populate author details for response
    await reply.populate({
      path: 'author',
      select: 'name email role graduationYear profileImage alumniProfile',
      populate: {
        path: 'alumniProfile',
        select: 'profileImage personalInfo academicInfo'
      }
    });

    if (parentReplyId) {
      await reply.populate({
        path: 'parentReply',
        populate: {
          path: 'author',
          select: 'name'
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply
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
      // Unlike the reply
      reply.likes = reply.likes.filter(likeUserId => 
        likeUserId.toString() !== userId.toString()
      );
      message = 'Reply unliked successfully';
    } else {
      // Like the reply
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
      .populate({
        path: 'author',
        select: 'name email role graduationYear'
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Discussion.countDocuments({ author: userId });

    // Add reply count for each discussion
    const discussionsWithCounts = await Promise.all(
      discussions.map(async (discussion) => {
        const replyCount = await DiscussionReply.countDocuments({ 
          discussion: discussion._id 
        });
        
        return {
          ...discussion,
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
    await discussion.populate({
      path: 'author',
      select: 'name email role graduationYear'
    });

    res.status(200).json({
      success: true,
      message: 'Discussion updated successfully',
      discussion
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