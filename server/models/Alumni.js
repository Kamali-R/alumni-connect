// models/Alumni.js
import mongoose from 'mongoose';

const AlumniSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  
  // Personal Information
  personalInfo: {
    fullName: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: Date, required: true },
    personalEmail: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String, required: true }
  },
  
  // Academic Information
  academicInfo: {
    collegeEmail: { type: String, required: true },
    enrollmentNumber: { type: String, required: true },
    degree: { type: String, required: true },
    branch: { type: String, required: true },
    graduationYear: { type: Number, required: true },
    cgpa: { type: String }
  },
  
  // Professional Information
  professionalInfo: {
    employmentStatus: { type: String },
    salaryRange: { type: String }
  },
  
  // Career Status
  careerStatus: { type: String, required: true },
  
  // Career Details
  careerDetails: {
    // Working
    companyName: { type: String },
    jobTitle: { type: String },
    companyLocation: { type: String },
    yearsOfExperience: { type: String },
    
    // Entrepreneur
    startupName: { type: String },
    industry: { type: String },
    roleInStartup: { type: String },
    yearsRunning: { type: String },
    
    // Studies
    institutionName: { type: String },
    courseArea: { type: String },
    institutionLocation: { type: String },
    expectedGraduationYear: { type: String },
    
    // Not Working
    careerGoal: { type: String }
  },
  
  // Experiences
  experiences: [{
    id: { type: Number },
    company: { type: String },
    title: { type: String },
    location: { type: String },
    duration: { type: String },
    description: { type: String }
  }],
  
  // Skills & Interests
  skills: [{ type: String }],
  interests: [{ type: String }],
  
  // Achievements, Awards & Recognitions - FIXED SECTION
  achievements: [{
    id: { type: Number },
    title: { type: String, required: true },
    description: { type: String },
    year: { type: String, required: true }
  }],
  
  awards: [{
    id: { type: Number },
    title: { type: String, required: true },
    organization: { type: String, required: true },
    year: { type: String, required: true }
  }],
  
  recognitions: [{
    id: { type: Number },
    title: { type: String, required: true },
    description: { type: String },
    year: { type: String, required: true }
  }],
  
  // Other Information
  otherInfo: {
    bio: { type: String },
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String },
    emailConsent: { type: Boolean, default: false }
  },
  
  // File uploads
  profileImage: { type: String },
  resumeFileName: { type: String },
  resumeFile: { type: String },
  
  status: { 
    type: String, 
    enum: ['draft', 'complete'], 
    default: 'draft' 
  }
}, { 
  timestamps: true 
});

// Add indexes for better query performance
// AlumniSchema.index({ userId: 1 }); // Removed duplicate index definition; 'unique: true' in schema is sufficient
AlumniSchema.index({ 'personalInfo.personalEmail': 1 });
AlumniSchema.index({ 'academicInfo.collegeEmail': 1 });

export default mongoose.model('Alumni', AlumniSchema);