import SuccessStory from '../models/SuccessStory.js';
import User from '../models/User.js';
import Alumni from '../models/Alumni.js';

// Create a new success story
export const createStory = async (req, res) => {
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

    // Create new story
    const story = new SuccessStory({
      title,
      content,
      author: authorId,
      category,
      tags: tags || []
    });

    await story.save();

    // Populate author details for response
    await story.populate('author', 'name email role graduationYear');

    res.status(201).json({
      success: true,
      message: 'Success story published successfully',
      story
    });

  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating story',
      error: error.message
    });
  }
};

// Get all success stories with pagination and filters - CORRECTED VERSION
// In successStoryController.js - FIXED getStories function
export const getStories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category = '',
      search = '',
      author = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { isPublished: true };

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

    if (author) {
      query.author = author;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const stories = await SuccessStory.find(query)
      .populate({
        path: 'author',
        select: 'name email role graduationYear profileImage alumniProfile',
        populate: {
          path: 'alumniProfile',
          select: 'profileImage personalInfo academicInfo careerStatus'
        }
      })
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await SuccessStory.countDocuments(query);

    // FIXED: Better debugging and error handling
    const userId = req.user?.id;
    console.log('🔍 Current user ID in getStories:', userId);
    console.log('🔍 req.user object:', req.user);
    
    // Convert stories to plain objects and add like information
    const storiesWithLikes = stories.map(story => {
      const storyObj = story.toObject ? story.toObject() : story;
      
      let isLiked = false;
      
      // Only check if we have a valid user ID
      if (userId && typeof userId === 'string' && userId.length > 0) {
        isLiked = story.likes && story.likes.length > 0
          ? story.likes.some(likeUserId => {
              const likeIdString = likeUserId.toString();
              const userIdString = userId.toString();
              const result = likeIdString === userIdString;
              console.log(`🔍 Comparing like: ${likeIdString} === ${userIdString} = ${result}`);
              return result;
            })
          : false;
      } else {
        console.log('⚠️  No valid user ID found, setting isLiked to false');
        isLiked = false;
      }
      
      console.log(`📖 Story: ${story.title}, isLiked: ${isLiked}, total likes: ${story.likes ? story.likes.length : 0}`);
      
      return {
        ...storyObj,
        likeCount: story.likes ? story.likes.length : 0,
        isLiked: isLiked
      };
    });

    res.status(200).json({
      success: true,
      stories: storiesWithLikes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalStories: total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stories',
      error: error.message
    });
  }
};
// Get single story by ID - CORRECTED VERSION
// In successStoryController.js - FIXED getStoryById function
export const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log('🔍 Single story - User ID:', userId);
    console.log('🔍 Single story - req.user:', req.user);

    const story = await SuccessStory.findById(id)
      .populate({
        path: 'author',
        select: 'name email role graduationYear profileImage alumniProfile',
        populate: {
          path: 'alumniProfile',
          select: 'profileImage personalInfo academicInfo careerStatus'
        }
      });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Increment view count
    story.views += 1;
    await story.save();

    let isLiked = false;
    
    // Only check if we have a valid user ID
    if (userId && typeof userId === 'string' && userId.length > 0) {
      isLiked = story.likes && story.likes.length > 0
        ? story.likes.some(likeUserId => {
            return likeUserId.toString() === userId.toString();
          })
        : false;
    }

    console.log(`📖 Single story: ${story.title}, isLiked: ${isLiked}, userId: ${userId}`);

    // Prepare response
    const storyResponse = {
      _id: story._id,
      title: story.title,
      content: story.content,
      category: story.category,
      tags: story.tags,
      views: story.views,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      author: story.author,
      likeCount: story.likes ? story.likes.length : 0,
      isLiked: isLiked
    };

    res.status(200).json({
      success: true,
      story: storyResponse
    });

  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching story',
      error: error.message
    });
  }
};

// Like/Unlike a story - CORRECTED VERSION
export const toggleLike = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    const story = await SuccessStory.findById(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // CORRECTED: Proper ObjectId comparison
    const isCurrentlyLiked = story.likes.some(likeUserId => 
      likeUserId.toString() === userId.toString()
    );
    
    let message = '';

    if (isCurrentlyLiked) {
      // Unlike the story - remove user from likes array
      story.likes = story.likes.filter(likeUserId => 
        likeUserId.toString() !== userId.toString()
      );
      message = 'Story unliked successfully';
    } else {
      // Like the story - add user to likes array
      story.likes.push(userId);
      message = 'Story liked successfully';
    }

    await story.save();

    console.log(`Toggle like result - Story: ${story.title}, isLiked: ${!isCurrentlyLiked}, likeCount: ${story.likes.length}`); // Debug log

    res.status(200).json({
      success: true,
      message,
      likeCount: story.likes.length,
      isLiked: !isCurrentlyLiked // Return the new state
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating like',
      error: error.message
    });
  }
};

// Get user's stories
export const getUserStories = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const stories = await SuccessStory.find({ author: userId })
      .populate('author', 'name email role graduationYear')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await SuccessStory.countDocuments({ author: userId });

    // Add like info for each story
    stories.forEach(story => {
      story.isLiked = story.likes.some(likeUserId => 
        likeUserId.toString() === userId.toString()
      );
      story.likeCount = story.likes.length;
      delete story.likes;
    });

    res.status(200).json({
      success: true,
      stories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalStories: total
      }
    });

  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user stories',
      error: error.message
    });
  }
};

// Update story
export const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content, category, tags } = req.body;

    const story = await SuccessStory.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if user is the author
    if (story.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own stories'
      });
    }

    // Update story
    if (title) story.title = title;
    if (content) story.content = content;
    if (category) story.category = category;
    if (tags) story.tags = tags;

    await story.save();
    await story.populate('author', 'name email role graduationYear');

    res.status(200).json({
      success: true,
      message: 'Story updated successfully',
      story
    });

  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating story',
      error: error.message
    });
  }
};

// Delete story
export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const story = await SuccessStory.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if user is the author
    if (story.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own stories'
      });
    }

    await SuccessStory.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully'
    });

  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting story',
      error: error.message
    });
  }
};