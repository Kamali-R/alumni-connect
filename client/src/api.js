import axios from 'axios';

// Use Create React App environment variable syntax
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add auth token to requests
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

// In your api.js file, make sure the interceptor is working
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

// Events API
export const eventsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return api.get(`/events?${params}`);
  },
  
  getById: (id) => api.get(`/events/${id}`),
  
  create: (eventData) => api.post('/events', eventData),
  
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  
  delete: (id) => api.delete(`/events/${id}`),
  
  toggleAttendance: (id) => api.put(`/events/${id}/attendance`),
  
  // Updated: Get events for currently authenticated user
getUserEvents: () => api.get('/events/my-events'),
  
  // Alternative: Get events by user ID (if needed)
  getUserEventsById: (userId) => api.get(`/events/user/${userId}`),
};

// Job API - ADD THIS TO YOUR EXISTING api.js
export const jobAPI = {
  // Get current user's jobs
  getMyJobs: () => {
    return api.get('/jobs/my-jobs');
  },

  // Close job (update status to closed)
  close: (jobId) => {
    return api.patch(`/jobs/${jobId}/close`);
  },

  // Delete job completely
  delete: (jobId) => {
    return api.delete(`/jobs/${jobId}`);
  }
};

export default api;