import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, apiHelpers } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      return apiHelpers.handleError(error);
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true, user: newUser };
    } catch (error) {
      return apiHelpers.handleError(error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const updateUser = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (error) {
      return apiHelpers.handleError(error);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;