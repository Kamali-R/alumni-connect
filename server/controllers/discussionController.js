// controllers/discussionController.js
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

    // FIXED: Populate author details with alumni profile
    await discussion.populate({
      path: 'author',
      select: 'name email role graduationYear profileImage',
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

// FIXED: Get all discussions with proper population
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

    // FIXED: Proper population with alumni profile
    const discussions = await Discussion.find(query)
      .populate({
        path: 'author',
        select: 'name email role graduationYear profileImage',
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

    // FIXED: Add like information and reply count with proper author data processing
    const discussionsWithDetails = await Promise.all(
      discussions.map(async (discussion) => {
        const replyCount = await DiscussionReply.countDocuments({ 
          discussion: discussion._id 
        });
        
        const isLiked = discussion.likes.some(likeUserId => 
          likeUserId.toString() === userId.toString()
        );

        // FIXED: Enhanced author data processing
        if (discussion.author) {
          const graduationYear = discussion.author.alumniProfile?.academicInfo?.graduationYear ||
                                discussion.author.graduationYear ||
                                null;
          
          const role = discussion.author.role === 'alumni' || discussion.author.alumniProfile 
                      ? 'alumni' 
                      : discussion.author.role || 'student';

          const profileImage = discussion.author.alumniProfile?.profileImage || 
                              discussion.author.profileImage ||
                              null;

          discussion.author = {
            ...discussion.author,
            graduationYear: graduationYear,
            role: role,
            profileImage: profileImage
          };
        }

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

// FIXED: Get single discussion by ID with proper population
export const getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // FIXED: Proper population with alumni profile
    const discussion = await Discussion.findById(id)
      .populate({
        path: 'author',
        select: 'name email role graduationYear profileImage',
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

    // FIXED: Get replies with proper population
    const replies = await DiscussionReply.find({ discussion: id })
      .populate({
        path: 'author',
        select: 'name email role graduationYear profileImage',
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

    // FIXED: Process replies with enhanced author data
    const repliesWithLikes = replies.map(reply => {
      // Enhanced author data processing for replies
      if (reply.author) {
        const graduationYear = reply.author.alumniProfile?.academicInfo?.graduationYear ||
                              reply.author.graduationYear ||
                              null;
        
        const role = reply.author.role === 'alumni' || reply.author.alumniProfile 
                    ? 'alumni' 
                    : reply.author.role || 'student';

        const profileImage = reply.author.alumniProfile?.profileImage || 
                            reply.author.profileImage ||
                            null;

        reply.author = {
          ...reply.author,
          graduationYear: graduationYear,
          role: role,
          profileImage: profileImage
        };
      }

      return {
        ...reply,
        likeCount: reply.likes.length,
        isLiked: reply.likes.some(likeUserId => 
          likeUserId.toString() === userId.toString()
        )
      };
    });

    const isLiked = discussion.likes.some(likeUserId => 
      likeUserId.toString() === userId.toString()
    );

    const replyCount = await DiscussionReply.countDocuments({ discussion: id });

    // FIXED: Enhanced author data processing for main discussion
    let processedDiscussion = discussion.toObject();
    if (processedDiscussion.author) {
      const graduationYear = processedDiscussion.author.alumniProfile?.academicInfo?.graduationYear ||
                            processedDiscussion.author.graduationYear ||
                            null;
      
      const role = processedDiscussion.author.role === 'alumni' || processedDiscussion.author.alumniProfile 
                  ? 'alumni' 
                  : processedDiscussion.author.role || 'student';

      const profileImage = processedDiscussion.author.alumniProfile?.profileImage || 
                          processedDiscussion.author.profileImage ||
                          null;

      processedDiscussion.author = {
        ...processedDiscussion.author,
        graduationYear: graduationYear,
        role: role,
        profileImage: profileImage
      };
    }

    res.status(200).json({
      success: true,
      discussion: {
        ...processedDiscussion,
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

// FIXED: Add reply to discussion with proper population
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

    // FIXED: Populate author details with alumni profile
    await reply.populate({
      path: 'author',
      select: 'name email role graduationYear profileImage',
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

    // FIXED: Process reply author data
    let processedReply = reply.toObject();
    if (processedReply.author) {
      const graduationYear = processedReply.author.alumniProfile?.academicInfo?.graduationYear ||
                            processedReply.author.graduationYear ||
                            null;
      
      const role = processedReply.author.role === 'alumni' || processedReply.author.alumniProfile 
                  ? 'alumni' 
                  : processedReply.author.role || 'student';

      const profileImage = processedReply.author.alumniProfile?.profileImage || 
                          processedReply.author.profileImage ||
                          null;

      processedReply.author = {
        ...processedReply.author,
        graduationYear: graduationYear,
        role: role,
        profileImage: profileImage
      };
    }

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply: processedReply
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
      .populate({
        path: 'author',
        select: 'name email role graduationYear',
        populate: {
          path: 'alumniProfile',
          select: 'personalInfo academicInfo'
        }
      })
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
        
        // Process author data
        if (discussion.author) {
          discussion.author.graduationYear = discussion.author.alumniProfile?.academicInfo?.graduationYear ||
                                           discussion.author.graduationYear ||
                                           null;
          discussion.author.role = discussion.author.role === 'alumni' || discussion.author.alumniProfile 
                                 ? 'alumni' 
                                 : discussion.author.role || 'student';
        }
        
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
      select: 'name email role graduationYear',
      populate: {
        path: 'alumniProfile',
        select: 'personalInfo academicInfo'
      }
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