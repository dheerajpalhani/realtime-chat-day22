import { create } from 'zustand';
import authService from '../services/authService.js';

export const useAuthStore = create((set, get) => {
  // Listen for global 401 intercepts to clear states
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-unauthorized', () => {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    });
  }

  return {
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    initialized: false, // Tracks if initial profile check is complete

    /**
     * Register a new user account.
     */
    register: async (userData) => {
      set({ loading: true });
      try {
        const response = await authService.register(userData);
        
        // If registration returns a token in cookie/headers, we fetch profile
        set({
          user: response.user,
          isAuthenticated: true,
          loading: false,
        });
        return response;
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    /**
     * Authenticate and log in user.
     */
    login: async (credentials) => {
      set({ loading: true });
      try {
        const response = await authService.login(credentials);
        const token = response.token;
        
        if (token) {
          localStorage.setItem('token', token);
        }
        
        set({
          user: response.user,
          token: token || null,
          isAuthenticated: true,
          loading: false,
        });
        return response;
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    /**
     * Authenticate and log in user using Google Credential Token.
     */
    loginWithGoogle: async (googleToken) => {
      set({ loading: true });
      try {
        const response = await authService.loginWithGoogle(googleToken);
        const token = response.token;
        
        if (token) {
          localStorage.setItem('token', token);
        }
        
        set({
          user: response.user,
          token: token || null,
          isAuthenticated: true,
          loading: false,
        });
        return response;
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    /**
     * End user session and clear credentials.
     */
    logout: async () => {
      set({ loading: true });
      try {
        await authService.logout();
      } catch (error) {
        // Allow logout to proceed locally even if API fails
      } finally {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
      }
    },

    /**
     * Retrieve current session user details from the database.
     */
    fetchCurrentUser: async () => {
      set({ loading: true });
      try {
        const response = await authService.getMe();
        set({
          user: response.user,
          isAuthenticated: true,
          loading: false,
          initialized: true,
        });
        return response.user;
      } catch (error) {
        // If token fails, clear it
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          initialized: true,
        });
        return null;
      }
    },
  };
});
