import Alumni from '../models/Alumni.js';
import MentorProfile from '../models/MentorProfile.js';

// Get all mentors with filtering
export const getMentors = async (req, res) => {
  try {
    const {
      search,
      industry,
      experience,
      graduationYear,
      companySize,
      location,
      availability,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    let filter = { isMentor: true };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
        { expertise: { $in: [new RegExp(search, 'i')] } },
        { currentPosition: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (industry && industry !== 'All Industries') {
      filter.industry = industry;
    }
    
    if (experience && experience !== 'Experience Level') {
      filter.experience = experience;
    }
    
    if (graduationYear && graduationYear !== 'Graduation Year') {
      if (graduationYear === '2020-2024') {
        filter.graduationYear = { $regex: /202[0-4]/ };
      } else if (graduationYear === '2015-2019') {
        filter.graduationYear = { $regex: /201[5-9]/ };
      } else if (graduationYear === '2010-2014') {
        filter.graduationYear = { $regex: /201[0-4]/ };
      } else if (graduationYear === '2005-2009') {
        filter.graduationYear = { $regex: /200[5-9]/ };
      } else if (graduationYear === 'Before 2005') {
        filter.graduationYear = { $regex: /^(200[0-4]|19)/ };
      }
    }
    
    if (location && location !== 'Location') {
      filter.location = location;
    }
    
    if (availability && availability !== 'Availability') {
      filter.mentorshipAvailability = availability;
    }

    if (companySize && companySize !== 'Company Size') {
      filter.companySize = companySize;
    }

    const mentors = await Alumni.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Alumni.countDocuments(filter);
    
    res.json({
      mentors,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Become a mentor
export const becomeMentor = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      bio,
      expertise,
      mentorshipStyle,
      previousMentoringExperience,
      menteePreferences
    } = req.body;

    // Update alumni to be a mentor
    await Alumni.findByIdAndUpdate(userId, { isMentor: true });

    // Create or update mentor profile
    let mentorProfile = await MentorProfile.findOne({ alumniId: userId });
    
    if (mentorProfile) {
      mentorProfile.bio = bio;
      mentorProfile.expertise = expertise;
      mentorProfile.mentorshipStyle = mentorshipStyle;
      mentorProfile.previousMentoringExperience = previousMentoringExperience;
      mentorProfile.menteePreferences = menteePreferences;
    } else {
      mentorProfile = new MentorProfile({
        alumniId: userId,
        bio,
        expertise,
        mentorshipStyle,
        previousMentoringExperience,
        menteePreferences
      });
    }

    await mentorProfile.save();
    
    res.json({ message: 'You are now a mentor!', mentorProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get mentor profile
export const getMentorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const mentorProfile = await MentorProfile.findOne({ alumniId: userId })
      .populate('alumniId', 'name email graduationYear currentPosition company skills industry experience location');
    
    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }
    
    res.json(mentorProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
