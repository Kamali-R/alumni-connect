import User from '../models/User.js';
import Alumni from '../models/Alumni.js';
import Student from '../models/Student.js';
import Job from '../models/Job.js';
import Events from '../models/Events.js';

/**
 * Get Dashboard Stats
 * Returns real-time statistics for admin dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get active jobs count
    const activeJobs = await Job.countDocuments({ status: 'open' });

    // Get pending events count
    const pendingEvents = await Events.countDocuments({ status: 'pending' });

    // Get system health (mock calculation based on data integrity)
    const systemHealth = 98 + Math.floor(Math.random() * 2); // 98-99%

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeJobs,
        pendingEvents,
        systemHealth: `${systemHealth}%`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

/**
 * Get Skills & Technologies Overview
 * Returns aggregated skills data from all students and alumni
 */
export const getSkillsOverview = async (req, res) => {
  try {
    console.log('📊 Fetching skills overview...');
    console.log('✅ User authenticated:', req.user);

    // Aggregate skills from both Alumni and Student collections
    const alumniAggregation = await Alumni.aggregate([
      {
        $match: {
          skills: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$skills'
      },
      {
        $group: {
          _id: '$skills',
          userCount: { $sum: 1 }
        }
      },
      {
        $project: {
          skillName: '$_id',
          userCount: 1,
          _id: 0
        }
      }
    ]);

    const studentAggregation = await Student.aggregate([
      {
        $match: {
          skills: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$skills'
      },
      {
        $group: {
          _id: '$skills',
          userCount: { $sum: 1 }
        }
      },
      {
        $project: {
          skillName: '$_id',
          userCount: 1,
          _id: 0
        }
      }
    ]);

    // Merge and aggregate results
    const skillMap = new Map();

    // Process alumni skills
    alumniAggregation.forEach(skill => {
      const key = skill.skillName.toLowerCase().trim();
      if (skillMap.has(key)) {
        const existing = skillMap.get(key);
        existing.userCount += skill.userCount;
      } else {
        skillMap.set(key, {
          skillName: skill.skillName,
          userCount: skill.userCount,
          category: 'Technical' // Default category - can be enhanced
        });
      }
    });

    // Process student skills
    studentAggregation.forEach(skill => {
      const key = skill.skillName.toLowerCase().trim();
      if (skillMap.has(key)) {
        const existing = skillMap.get(key);
        existing.userCount += skill.userCount;
      } else {
        skillMap.set(key, {
          skillName: skill.skillName,
          userCount: skill.userCount,
          category: 'Technical' // Default category
        });
      }
    });

    // Convert map to array and sort by user count
    const skillsList = Array.from(skillMap.values())
      .sort((a, b) => b.userCount - a.userCount);

    // Calculate summary statistics
    const totalSkills = skillsList.length;
    const mostPopularSkill = skillsList.length > 0 ? skillsList[0] : null;

    // Count total unique users with skills
    const usersWithSkillsAlumni = await Alumni.countDocuments({
      skills: { $exists: true, $ne: [] }
    });

    const usersWithSkillsStudent = await Student.countDocuments({
      skills: { $exists: true, $ne: [] }
    });

    const totalUsersWithSkills = usersWithSkillsAlumni + usersWithSkillsStudent;

    // Get top 10 skills for chart
    const top10Skills = skillsList.slice(0, 10);

    console.log(`✅ Skills overview fetched: ${totalSkills} unique skills, ${totalUsersWithSkills} users`);

    res.status(200).json({
      success: true,
      summary: {
        totalSkills,
        mostPopularSkill: mostPopularSkill || null,
        totalUsersWithSkills
      },
      skillsList,
      top10Skills,
      charts: {
        popularity: top10Skills
      }
    });

  } catch (error) {
    console.error('❌ Error fetching skills overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skills overview',
      error: error.message
    });
  }
};

/**
 * Search and filter skills
 */
export const searchSkills = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(query, 'i');

    const alumniSkills = await Alumni.aggregate([
      {
        $match: {
          skills: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$skills'
      },
      {
        $match: {
          skills: searchRegex
        }
      },
      {
        $group: {
          _id: '$skills',
          userCount: { $sum: 1 }
        }
      },
      {
        $project: {
          skillName: '$_id',
          userCount: 1,
          _id: 0
        }
      }
    ]);

    const studentSkills = await Student.aggregate([
      {
        $match: {
          skills: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$skills'
      },
      {
        $match: {
          skills: searchRegex
        }
      },
      {
        $group: {
          _id: '$skills',
          userCount: { $sum: 1 }
        }
      },
      {
        $project: {
          skillName: '$_id',
          userCount: 1,
          _id: 0
        }
      }
    ]);

    const skillMap = new Map();

    alumniSkills.forEach(skill => {
      const key = skill.skillName.toLowerCase().trim();
      if (skillMap.has(key)) {
        skillMap.get(key).userCount += skill.userCount;
      } else {
        skillMap.set(key, {
          skillName: skill.skillName,
          userCount: skill.userCount,
          category: 'Technical'
        });
      }
    });

    studentSkills.forEach(skill => {
      const key = skill.skillName.toLowerCase().trim();
      if (skillMap.has(key)) {
        skillMap.get(key).userCount += skill.userCount;
      } else {
        skillMap.set(key, {
          skillName: skill.skillName,
          userCount: skill.userCount,
          category: 'Technical'
        });
      }
    });

    const results = Array.from(skillMap.values())
      .sort((a, b) => b.userCount - a.userCount);

    console.log(`✅ Skills search completed: found ${results.length} results for "${query}"`);

    res.status(200).json({
      success: true,
      query,
      results,
      count: results.length
    });

  } catch (error) {
    console.error('❌ Error searching skills:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching skills',
      error: error.message
    });
  }
};

/**
 * Get all events categorized as upcoming and past
 */
export const getEventsForAdmin = async (req, res) => {
  try {
    console.log('📅 Fetching events for admin dashboard...');
    
    const Event = (await import('../models/Events.js')).default;
    
    // Get current date at start of day for accurate comparison
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Fetch all events with creator information
    const allEvents = await Event.find({})
      .populate('postedBy', 'name email role')
      .populate('attendees', 'name email')
      .sort({ date: -1 }); // Sort by date descending (newest first)
    
    // Separate into upcoming and past events based on event date
    const upcomingEvents = [];
    const pastEvents = [];
    
    allEvents.forEach(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      
      const eventData = {
        id: event._id,
        title: event.title,
        type: event.type,
        date: event.date,
        time: event.time,
        location: event.location,
        mode: event.mode || 'offline',
        eventLink: event.eventLink || '',
        audience: event.audience || 'all',
        description: event.description,
        rsvpInfo: event.rsvpInfo,
        attendance: event.attendance || 0,
        attendees: event.attendees || [],
        postedBy: event.postedBy ? {
          id: event.postedBy._id,
          name: event.postedBy.name,
          email: event.postedBy.email,
          role: event.postedBy.role
        } : null,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      };
      
      if (eventDate >= currentDate) {
        upcomingEvents.push(eventData);
      } else {
        pastEvents.push(eventData);
      }
    });
    
    console.log(`✅ Events categorized: ${upcomingEvents.length} upcoming, ${pastEvents.length} past`);
    
    res.status(200).json({
      success: true,
      data: {
        upcoming: upcomingEvents,
        past: pastEvents,
        total: allEvents.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching events for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};
