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

// Response interceptor for error handling
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

// News API
export const newsAPI = {
  getAll: () => api.get('/news'),
  create: (newsData) => api.post('/news', newsData),
  delete: (id) => api.delete(`/news/${id}`),
};

// Add this to your achievementsAPI object
export const achievementsAPI = {
  getAll: () => api.get('/achievements'),
  create: (achievementData) => api.post('/achievements', achievementData),
  delete: (id) => api.delete(`/achievements/${id}`),
  congratulate: (id) => api.post(`/achievements/${id}/congratulate`),
  getCongratulations: (id) => api.get(`/achievements/${id}/congratulations`),
  getUserProfile: () => api.get('/user/profile'), // Add this to get user profile
};

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
  
  getUserEvents: () => api.get('/events/my-events'),
  
  getUserEventsById: (userId) => api.get(`/events/user/${userId}`),
};

// Test connection
export const testAPI = {
  test: () => api.get('/test'),
  health: () => api.get('/health'),
};



export default api;