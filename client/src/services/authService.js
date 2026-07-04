import api from './api.js';

/**
 * Authentication REST Service handlers.
 */
const authService = {
  /**
   * Register a new user account.
   * @param {Object} userData - Registration payload (name, username, email, password)
   * @returns {Promise<Object>} API Response JSON
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Log in user session.
   * @param {Object} credentials - Login payload (email, password)
   * @returns {Promise<Object>} API Response JSON
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Clear session and log out user.
   * @returns {Promise<Object>} API Response JSON
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Fetch current authenticated user profile.
   * @returns {Promise<Object>} API Response JSON
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;
