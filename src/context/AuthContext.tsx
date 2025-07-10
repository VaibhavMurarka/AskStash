import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  isGuestMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  enterGuestMode: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
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

  const login = async (email: string, password: string): Promise<void> => {
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

  const register = async (email: string, password: string, full_name: string): Promise<void> => {
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

  const enterGuestMode = (): void => {
    localStorage.setItem('guestMode', 'true');
    setIsGuestMode(true);
    setUser({
      id: -1,
      email: 'guest@example.com',
      full_name: 'Guest User'
    });
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guestMode');
    // Clear all guest data
    localStorage.removeItem('guestDocuments');
    localStorage.removeItem('guestChatHistory');
    setUser(null);
    setIsGuestMode(false);
  };

  const value: AuthContextType = {
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