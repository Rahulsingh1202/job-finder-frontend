import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  verifyGoogleToken: (token) => 
    api.post('/auth/google/verify', { token }),
  getCurrentUser: () => 
    api.get('/user/me'),
};

// Resume API
export const resumeAPI = {
  upload: (formData) => 
    api.post('/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getResume: (userEmail) => 
    api.get(`/resume/${userEmail}`),
  analyzeResume: (userEmail) => 
    api.post('/analyze-resume', { user_email: userEmail }),
};

// Jobs API
export const jobsAPI = {
  searchJobs: (data) => {
    // Convert skills string to array if needed
    const payload = {
      skills: typeof data.skills === 'string' 
        ? data.skills.split(',').map(s => s.trim()) 
        : data.skills,
      location: data.location || 'India',
      experience_years: data.experience_years || 0,
      max_jobs: data.max_jobs || 20
    };
    return api.post('/search-jobs', payload);
  },
  saveJob: (jobData) => 
    api.post('/save-job', jobData),
  getSavedJobs: (userEmail) => 
    api.get('/saved-jobs/me'), // Changed from /saved-jobs/${userEmail}
  deleteJob: (jobId) => 
    api.delete(`/saved-jobs/${jobId}`),
};


// Stats API (for dashboard data)
export const statsAPI = {
  getDashboardStats: (userEmail) => 
    api.get(`/stats/dashboard/${userEmail}`),
  getApplicationStats: (userEmail) => 
    api.get(`/stats/applications/${userEmail}`),
  getRecentActivity: (userEmail) => 
    api.get(`/activity/recent/${userEmail}`),
};

// Experience API
export const experienceAPI = {
  addExperience: (data) => 
    api.post('/add-experience', data),
  getExperience: (userEmail) => 
    api.get(`/experience/${userEmail}`),
};

export default api;
