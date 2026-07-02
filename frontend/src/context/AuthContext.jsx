import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state from localStorage on app boot
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('drrp_token');
        const storedUser = localStorage.getItem('drrp_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to parse user details from local storage:', error);
        localStorage.removeItem('drrp_token');
        localStorage.removeItem('drrp_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Step 1: Submit username and password
   * Returns temporary session ID on success
   */
  const loginStep1 = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });
      return response.data; // contains tempSessionId and success message
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login failed. Please check backend connection.';
      throw new Error(errMsg);
    }
  };

  /**
   * Step 2: Submit 6-digit OTP to complete authentication
   * Returns token and user data on success, commits state
   */
  const verify2FA = async (username, otp) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        username,
        otp,
      });

      const { token: jwtToken, user: userData } = response.data;

      // Commit to LocalStorage
      localStorage.setItem('drrp_token', jwtToken);
      localStorage.setItem('drrp_user', JSON.stringify(userData));

      // Commit to State
      setToken(jwtToken);
      setUser(userData);

      return userData;
    } catch (error) {
      const errMsg = error.response?.data?.message || 'OTP verification failed. Please try again.';
      throw new Error(errMsg);
    }
  };

  /**
   * Sign out: clear context and localStorage
   */
  const logout = () => {
    localStorage.removeItem('drrp_token');
    localStorage.removeItem('drrp_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    loginStep1,
    verify2FA,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume authentication context easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
