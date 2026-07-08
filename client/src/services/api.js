import axios from 'axios';

// Create a reusable Axios instance pointing to the backend REST API
const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Send HTTP cookies automatically
});

// Request Interceptor: Inject JWT token into Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors and auto-logout on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401 Unauthorized, dispatch auth event to trigger store cleanup
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Emit a global event to alert the Zustand store without creating circular imports
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    
    // Process default error message formatting
    const message = error.response?.data?.message || 'Something went wrong';
    error.message = message;
    
    return Promise.reject(error);
  }
);

export default api;
