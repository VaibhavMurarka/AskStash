import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(undefined);

/**
 * Custom hook to use the authentication context.
 * @returns {object} The authentication context value.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Provides authentication state and functions to its children components.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const guestMode = localStorage.getItem('guestMode');
    
    if (guestMode === 'true') {
      setIsGuestMode(true);
      setUser({
        id: -1,
        email: 'guest@example.com',
        full_name: 'Guest User'
      });
    } else if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email, password, full_name) => {
    try {
      const response = await authAPI.register(email, password, full_name);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const enterGuestMode = () => {
    localStorage.setItem('guestMode', 'true');
    setIsGuestMode(true);
    setUser({
      id: -1,
      email: 'guest@example.com',
      full_name: 'Guest User'
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guestMode');
    // Clear all guest data
    localStorage.removeItem('guestDocuments');
    localStorage.removeItem('guestChatHistory');
    setUser(null);
    setIsGuestMode(false);
  };

  const value = {
    user,
    isGuestMode,
    login,
    register,
    enterGuestMode,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};