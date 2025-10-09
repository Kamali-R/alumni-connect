// Fixed successStoryController.js

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

    // FIXED: Populate author details with alumni profile
    await story.populate({
      path: 'author',
      select: 'name email role graduationYear profileImage',
      populate: {
        path: 'alumniProfile',
        select: 'profileImage personalInfo academicInfo'
      }
    });

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

// FIXED: Get all success stories with proper population
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

    // In getStories function, replace the existing search logic with:
if (search) {
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  query.$or = [
    { title: { $regex: escapedSearch, $options: 'i' } },
    { content: { $regex: escapedSearch, $options: 'i' } },
    { tags: { $regex: escapedSearch, $options: 'i' } }
  ];
}

    if (author) {
      query.author = author;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // FIXED: Proper population with alumni profile
    const stories = await SuccessStory.find(query)
      .populate({
        path: 'author',
        select: 'name email role graduationYear profileImage',
        populate: {
          path: 'alumniProfile',
          select: 'profileImage personalInfo academicInfo careerStatus'
        }
      })
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await SuccessStory.countDocuments(query);

    const userId = req.user?.id;
    
    // FIXED: Enhanced stories with proper graduation year resolution
    const storiesWithLikes = stories.map(story => {
      const storyObj = story.toObject ? story.toObject() : story;
      
      // Enhanced author data processing
      if (storyObj.author) {
        // Resolve graduation year from multiple sources
        const graduationYear = storyObj.author.alumniProfile?.academicInfo?.graduationYear ||
                              storyObj.author.graduationYear ||
                              null;
        
        // Resolve role properly
        const role = storyObj.author.role === 'alumni' || storyObj.author.alumniProfile 
                    ? 'alumni' 
                    : storyObj.author.role || 'student';

        // Enhanced profile image handling
        const profileImage = storyObj.author.alumniProfile?.profileImage || 
                            storyObj.author.profileImage ||
                            null;

        // Update author object with resolved data
        storyObj.author = {
          ...storyObj.author,
          graduationYear: graduationYear,
          role: role,
          profileImage: profileImage
        };
      }
      
      let isLiked = false;
      
      if (userId && typeof userId === 'string' && userId.length > 0) {
        isLiked = story.likes && story.likes.length > 0
          ? story.likes.some(likeUserId => {
              return likeUserId.toString() === userId.toString();
            })
          : false;
      }
      
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

// FIXED: Get single story by ID with proper population
export const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // FIXED: Proper population with alumni profile
    const story = await SuccessStory.findById(id)
      .populate({
        path: 'author',
        select: 'name email role graduationYear profileImage',
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
    
    if (userId && typeof userId === 'string' && userId.length > 0) {
      isLiked = story.likes && story.likes.length > 0
        ? story.likes.some(likeUserId => {
            return likeUserId.toString() === userId.toString();
          })
        : false;
    }

    // FIXED: Enhanced author data processing
    let processedAuthor = story.author;
    if (story.author) {
      const graduationYear = story.author.alumniProfile?.academicInfo?.graduationYear ||
                            story.author.graduationYear ||
                            null;
      
      const role = story.author.role === 'alumni' || story.author.alumniProfile 
                  ? 'alumni' 
                  : story.author.role || 'student';

      const profileImage = story.author.alumniProfile?.profileImage || 
                          story.author.profileImage ||
                          null;

      processedAuthor = {
        ...story.author.toObject(),
        graduationYear: graduationYear,
        role: role,
        profileImage: profileImage
      };
    }

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
      author: processedAuthor,
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

// Like/Unlike a story
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

    const isCurrentlyLiked = story.likes.some(likeUserId => 
      likeUserId.toString() === userId.toString()
    );
    
    let message = '';

    if (isCurrentlyLiked) {
      story.likes = story.likes.filter(likeUserId => 
        likeUserId.toString() !== userId.toString()
      );
      message = 'Story unliked successfully';
    } else {
      story.likes.push(userId);
      message = 'Story liked successfully';
    }

    await story.save();

    res.status(200).json({
      success: true,
      message,
      likeCount: story.likes.length,
      isLiked: !isCurrentlyLiked
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

    const total = await SuccessStory.countDocuments({ author: userId });

    stories.forEach(story => {
      // Process author data
      if (story.author) {
        story.author.graduationYear = story.author.alumniProfile?.academicInfo?.graduationYear ||
                                     story.author.graduationYear ||
                                     null;
        story.author.role = story.author.role === 'alumni' || story.author.alumniProfile 
                           ? 'alumni' 
                           : story.author.role || 'student';
      }
      
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

    if (story.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own stories'
      });
    }

    if (title) story.title = title;
    if (content) story.content = content;
    if (category) story.category = category;
    if (tags) story.tags = tags;

    await story.save();
    await story.populate({
      path: 'author',
      select: 'name email role graduationYear',
      populate: {
        path: 'alumniProfile',
        select: 'personalInfo academicInfo'
      }
    });

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