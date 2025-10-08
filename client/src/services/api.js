import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  
  register: (userData) => api.post('/auth/register', userData),
  
  sendOtp: (email, purpose) => api.post('/auth/send-otp', { email, purpose }),
  
  verifyOtp: (otpData) => api.post('/auth/verify-otp', otpData),
  
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  resetPassword: (passwordData) => api.post('/auth/reset-password', passwordData),
  
  checkUser: (email) => api.get(`/auth/check-user?email=${email}`),
};

// Alumni Profile API calls
export const alumniAPI = {
  getProfile: () => api.get('/alumni/profile'),
  
  saveProfile: (profileData) => {
    const formData = new FormData();
    
    // Append JSON data
    Object.keys(profileData).forEach(key => {
      if (key !== 'profileImage' && key !== 'resume' && profileData[key]) {
        if (typeof profileData[key] === 'object') {
          formData.append(key, JSON.stringify(profileData[key]));
        } else {
          formData.append(key, profileData[key]);
        }
      }
    });
    
    // Append files
    if (profileData.profileImage) {
      formData.append('profileImage', profileData.profileImage);
    }
    if (profileData.resume) {
      formData.append('resume', profileData.resume);
    }
    
    return api.post('/alumni/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  updateProfile: (profileData) => {
    const formData = new FormData();
    
    Object.keys(profileData).forEach(key => {
      if (key !== 'profileImage' && key !== 'resume' && profileData[key]) {
        if (typeof profileData[key] === 'object') {
          formData.append(key, JSON.stringify(profileData[key]));
        } else {
          formData.append(key, profileData[key]);
        }
      }
    });
    
    if (profileData.profileImage) {
      formData.append('profileImage', profileData.profileImage);
    }
    if (profileData.resume) {
      formData.append('resume', profileData.resume);
    }
    
    return api.put('/alumni/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  getAllAlumni: (params = {}) => api.get('/alumni/all', { params }),
};

// Mentors API calls
export const mentorsAPI = {
  getMentors: (filters = {}) => api.get('/mentors', { params: filters }),
  
  becomeMentor: (mentorData) => api.post('/mentors/become-mentor', mentorData),
  
  getMentorProfile: () => api.get('/mentors/profile'),
};

// Mentorship API calls
export const mentorshipAPI = {
  sendRequest: (mentorId, message) => 
    api.post('/mentorship/request', { mentorId, message }),
  
  getRequests: (type, status) => 
    api.get('/mentorship/requests', { params: { type, status } }),
  
  updateRequest: (requestId, status) => 
    api.put(`/mentorship/requests/${requestId}`, { status }),
  
  getMentorships: () => api.get('/mentorship/mentorships'),
};

// Messages API calls
export const messagesAPI = {
  getMessages: (mentorshipId) => api.get(`/messages/${mentorshipId}`),
  
  sendMessage: (messageData) => api.post('/messages', messageData),
  
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;