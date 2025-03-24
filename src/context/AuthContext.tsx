import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { checkTokenValidity, logout as logoutApi } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  uuid: string | null;
  login: (token: string, uuid: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [uuid, setUuid] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const storedToken = localStorage.getItem('access_token');
    const storedUuid = localStorage.getItem('uuid');
    
    if (storedToken && storedUuid && checkTokenValidity()) {
      setToken(storedToken);
      setUuid(storedUuid);
      setIsAuthenticated(true);
    } else {
      // Token expired or invalid, clean up
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('uuid');
      localStorage.removeItem('expired_date');
    }
  }, []);

  const login = (newToken: string, newUuid: string) => {
    setToken(newToken);
    setUuid(newUuid);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Call the logout API
      await logoutApi();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear authentication state regardless of API success/failure
      setToken(null);
      setUuid(null);
      setIsAuthenticated(false);
      
      // Remove from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('uuid');
      localStorage.removeItem('expired_date');
      localStorage.removeItem('username');
    }
  };

  const value = {
    isAuthenticated,
    token,
    uuid,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 