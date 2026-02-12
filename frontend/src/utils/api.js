import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
};

// Tasks API
export const tasksAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  getTaskStats: () => api.get('/tasks/stats/summary'),
  createTask: (data) => api.post('/tasks', data),
};

// Submissions API
export const submissionsAPI = {
  submitTask: (data) => api.post('/submissions', data),
  getSubmissions: (params) => api.get('/submissions', { params }),
  getSubmissionById: (id) => api.get(`/submissions/${id}`),
  getSubmissionStats: () => api.get('/submissions/stats/summary'),
};

// Payments API
export const paymentsAPI = {
  getBalance: () => api.get('/payments/balance'),
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
  requestWithdrawal: (data) => api.post('/payments/withdraw', data),
  getEarningsBreakdown: () => api.get('/payments/earnings-breakdown'),
  setupPaymentMethod: (data) => api.post('/payments/setup-payment-method', data),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getStats: () => api.get('/users/stats'),
  getLeaderboard: (params) => api.get('/users/leaderboard', { params }),
};

// Clients API
export const clientsAPI = {
  getDashboard: () => api.get('/clients/dashboard'),
  getTasks: (params) => api.get('/clients/tasks', { params }),
  getTaskSubmissions: (taskId, params) => 
    api.get(`/clients/tasks/${taskId}/submissions`, { params }),
  reviewSubmission: (submissionId, data) => 
    api.put(`/clients/submissions/${submissionId}/review`, data),
};

export default api;
