import User from '../models/User.js';
import Alumni from '../models/Alumni.js';
import Student from '../models/Student.js';
import Event from '../models/Events.js';
import Job from '../models/Job.js';

/**
 * Get Skills & Technologies Overview
 * Returns aggregated skills data from all students and alumni
 */
export const getSkillsOverview = async (req, res) => {
  try {
    // Fetch skills overview

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

    // Return summary without verbose logging

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

    // Return results without logging

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
 * Get Dashboard Overview Stats
 * Returns counts for total users, active jobs, pending events, and system health
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Compute dashboard stats

    // Count total users with detailed logging
    const totalAlumni = await Alumni.countDocuments();
    
    const totalStudents = await Student.countDocuments();
    
    const totalUsers = totalAlumni + totalStudents;
    
    // Debug: Check sample alumni
    // Optional samples removed from logs
    
    // Debug: Check sample students
    // Optional samples removed from logs

    // Count active jobs (status is 'Open' with capital O in Job model)
    const activeJobs = await Job.countDocuments({ status: 'Open' });
    
    // Debug: Check all jobs and their statuses
    // Remove sample job logging
    
    // Count total jobs for comparison
    const totalJobs = await Job.countDocuments();

    // Count pending events
    const pendingEvents = await Event.countDocuments({ 
      status: 'pending' 
    });
    
    // Count total events
    const totalEvents = await Event.countDocuments();

    // System health is a placeholder value (could be enhanced with actual monitoring)
    const systemHealth = 98;

    // Return stats without verbose logging

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAlumni,
        totalStudents,
        activeJobs,
        pendingEvents,
        systemHealth
      }
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

/**
 * Get Users List for Admin
 */
export const getAdminUsers = async (req, res) => {
  try {
    // Fetch users list for admin

    // Pull primary records from User (authoritative for accounts)
    const users = await User.find({ role: { $in: ['student', 'alumni'] } })
      .select('name email role createdAt isVerified profileCompleted')
      .sort({ createdAt: -1 })
      .limit(200);

    // Enrich User records from Alumni/Student by userId
    const userIds = users.map(u => u._id);
    const alumniProfiles = await Alumni.find({ userId: { $in: userIds } })
      .select('userId personalInfo.fullName academicInfo.collegeEmail');
    const studentProfiles = await Student.find({ userId: { $in: userIds } })
      .select('userId personalInfo.fullName academicInfo.collegeEmail');

    const alumniMap = new Map(alumniProfiles.map(a => [a.userId.toString(), a]));
    const studentMap = new Map(studentProfiles.map(s => [s.userId.toString(), s]));

    const normalizedUsers = users.map(u => {
      const a = alumniMap.get(u._id.toString());
      const s = studentMap.get(u._id.toString());
      const role = u.role === 'alumni' ? 'Alumni' : 'Student';
      const name = a?.personalInfo?.fullName || s?.personalInfo?.fullName || u.name || 'N/A';
      const email = a?.academicInfo?.collegeEmail || s?.academicInfo?.collegeEmail || u.email || 'N/A';

      return {
        _id: u._id,
        name,
        email,
        type: role,
        status: u.isVerified ? 'Active' : 'Pending',
        joined: u.createdAt,
        profileCompleted: u.profileCompleted || false
      };
    });

    // Also include Alumni/Student profiles that don't have a linked User
    const alumniExtras = await Alumni.find({
      $or: [
        { userId: { $exists: false } },
        { userId: { $nin: userIds } }
      ]
    }).select('personalInfo.fullName academicInfo.collegeEmail createdAt');

    const studentExtras = await Student.find({
      $or: [
        { userId: { $exists: false } },
        { userId: { $nin: userIds } }
      ]
    }).select('personalInfo.fullName academicInfo.collegeEmail createdAt');

    // Deduplicate by email to avoid duplicates
    const seenEmails = new Set(
      normalizedUsers.map(u => (u.email || '').toLowerCase())
    );

    const extraAlumni = alumniExtras
      .filter(a => {
        const em = (a.academicInfo?.collegeEmail || '').toLowerCase();
        return !em || !seenEmails.has(em);
      })
      .map(a => {
        const em = a.academicInfo?.collegeEmail || 'N/A';
        seenEmails.add(em.toLowerCase());
        return {
          _id: a._id,
          name: a.personalInfo?.fullName || 'N/A',
          email: em,
          type: 'Alumni',
          status: 'Active',
          joined: a.createdAt,
          profileCompleted: false
        };
      });

    const extraStudents = studentExtras
      .filter(s => {
        const em = (s.academicInfo?.collegeEmail || '').toLowerCase();
        return !em || !seenEmails.has(em);
      })
      .map(s => {
        const em = s.academicInfo?.collegeEmail || 'N/A';
        seenEmails.add(em.toLowerCase());
        return {
          _id: s._id,
          name: s.personalInfo?.fullName || 'N/A',
          email: em,
          type: 'Student',
          status: 'Active',
          joined: s.createdAt,
          profileCompleted: false
        };
      });

    const combined = [...normalizedUsers, ...extraAlumni, ...extraStudents];

    res.status(200).json({
      success: true,
      users: combined,
      total: combined.length
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users list',
      error: error.message
    });
  }
};

/**
 * Update a user (alumni or student) basic details
 */
export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, email } = req.body || {};
    // First try updating the primary User record
    const user = await User.findById(id);
    if (user) {
      if (name) user.name = name;
      if (email) user.email = email;
      if (type && ['Alumni', 'Student'].includes(type)) {
        user.role = type === 'Alumni' ? 'alumni' : 'student';
      }
      await user.save();
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          name: name || user.name,
          email: email || user.email,
          type: user.role === 'alumni' ? 'Alumni' : 'Student',
          status: user.isVerified ? 'Active' : 'Pending',
          joined: user.createdAt,
          profileCompleted: user.profileCompleted || false
        }
      });
    }

    // Backwards compatibility: update Alumni/Student docs if User not found
    if (!type || !['Alumni', 'Student'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing user type' });
    }

    let doc = null;
    if (type === 'Alumni') {
      doc = await Alumni.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: 'Alumni not found' });
      if (name) doc.personalInfo.fullName = name;
      if (email) doc.academicInfo.collegeEmail = email;
      await doc.save();
    } else {
      doc = await Student.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: 'Student not found' });
      if (name) doc.personalInfo.fullName = name;
      if (email) doc.academicInfo.collegeEmail = email;
      await doc.save();
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: doc._id,
        name: doc.personalInfo?.fullName || 'N/A',
        email: doc.academicInfo?.collegeEmail || 'N/A',
        type,
        status: 'Active',
        joined: doc.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

/**
 * Remove a user (alumni or student)
 */
export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body || {};

    // If a User record exists, remove it and cascade to profile docs
    const user = await User.findById(id);
    if (user) {
      await User.findByIdAndDelete(id);
      await Alumni.deleteMany({ userId: id });
      await Student.deleteMany({ userId: id });
      return res.status(200).json({ success: true, message: 'User removed' });
    }

    if (!type || !['Alumni', 'Student'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing user type' });
    }

    let deleted = null;
    if (type === 'Alumni') {
      deleted = await Alumni.findByIdAndDelete(id);
    } else {
      deleted = await Student.findByIdAndDelete(id);
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: `${type} not found` });
    }

    return res.status(200).json({ success: true, message: `${type} removed` });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
  }
};

/**
 * Create a new user (admin quick add)
 */
export const createAdminUser = async (req, res) => {
  try {
    const { name, email, type } = req.body || {};

    if (!name || !email || !type || !['Alumni', 'Student'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Name, email, and valid type are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role: type === 'Alumni' ? 'alumni' : 'student',
      authProvider: 'google', // avoid password requirement for quick add
      isVerified: false,
      profileCompleted: false
    });

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        type,
        status: 'Pending',
        joined: user.createdAt,
        profileCompleted: false
      }
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};

/**
 * Get Events for Admin Dashboard
 */
export const getAdminEvents = async (req, res) => {
  try {
    // Fetch events for admin dashboard

    // Get pending events
    const pendingEvents = await Event.find({ status: 'pending' })
      .populate('postedBy', 'name')
      .limit(10);

    // Get approved upcoming events
    const approvedEvents = await Event.find({ 
      status: 'approved',
      date: { $gte: new Date() }
    })
      .populate('postedBy', 'name')
      .limit(10);

    // Get past events
    const pastEvents = await Event.find({ 
      date: { $lt: new Date() }
    })
      .populate('postedBy', 'name')
      .limit(10);

    // Format events data
    const formattedPendingEvents = pendingEvents.map(event => ({
      id: event._id,
      title: event.title,
      submitter: event.postedBy?.name || 'Unknown',
      date: event.date ? new Date(event.date).toLocaleDateString() : 'N/A',
      location: event.location || 'Online',
      description: event.description || '',
      status: 'pending'
    }));

    const formattedApprovedEvents = approvedEvents.map(event => ({
      id: event._id,
      title: event.title,
      date: event.date ? new Date(event.date).toLocaleDateString() : 'N/A',
      location: event.location || 'Online',
      registered: event.attendees?.length || 0,
      status: 'approved'
    }));

    const formattedPastEvents = pastEvents.map(event => ({
      id: event._id,
      title: event.title,
      date: event.date ? new Date(event.date).toLocaleDateString() : 'N/A',
      attended: event.attendees?.length || 0,
      status: 'past'
    }));

    // Return events without logging

    res.status(200).json({
      success: true,
      events: {
        pending: formattedPendingEvents,
        approved: formattedApprovedEvents,
        past: formattedPastEvents
      }
    });
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};
