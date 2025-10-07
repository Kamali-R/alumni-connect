// models/Student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  personalInfo: {
    fullName: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
    dob: { type: Date },
    personalEmail: { type: String },
    phone: { type: String },
    location: { type: String }
  },
  academicInfo: {
    rollNumber: { type: String, required: true },
    collegeEmail: { type: String, required: true },
    degree: { 
      type: String, 
      enum: [
        'B.Tech', 'B.Tech / B.E.', 'M.Tech', 'M.Tech / M.E.', 'BCA', 'MCA', 
        'BSc', 'MSc', 'BBA', 'MBA', 'PhD', 'Other',
        'btech', 'be', 'bsc', 'ba', 'bcom', 'bba', 'bca',
        'mtech', 'me', 'msc', 'ma', 'mcom', 'mba', 'mca', 'phd'
      ],
      required: true
    },
    otherDegree: { type: String },
    branch: { type: String, required: true },
    currentYear: { 
      type: String, 
      enum: ['1', '2', '3', '4', '5'],
      required: true
    },
    graduationYear: { type: String, required: true },
    cgpa: { type: String }
  },
  professionalInfo: {
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String }
  },
  skills: [{ type: String }],
  interests: [{ type: String }],
  careerGoals: { type: String },
  profileImage: { type: String },
  resumeFile: { type: String },
  resumeFileName: { type: String },
  status: {
    type: String,
    enum: ['incomplete', 'complete'],
    default: 'incomplete'
  }
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);