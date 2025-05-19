import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { checkTokenValidity, logout as logoutApi } from '../services/authService';
import Cookies from 'js-cookie';

interface UserInfo {
  username: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  uuid: string | null;
  userRole: string | null;
  userInfo: UserInfo | null;
  login: (token: string, uuid: string, role: string, userData: UserInfo) => void;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const storedToken = localStorage.getItem('access_token');
    const storedUuid = localStorage.getItem('uuid');
    const storedRole = Cookies.get('userRole');
    const storedUserInfo = Cookies.get('userInfo');
    
    if (storedToken && storedUuid && checkTokenValidity()) {
      setToken(storedToken);
      setUuid(storedUuid);
      setIsAuthenticated(true);
      
      if (storedRole) {
        setUserRole(storedRole);
        console.log('Restored user role from cookie:', storedRole);
      }
      
      if (storedUserInfo) {
        try {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          setUserInfo(parsedUserInfo);
          console.log('Restored user info from cookie:', parsedUserInfo);
        } catch (e) {
          console.error('Failed to parse user info from cookie:', e);
        }
      }
    } else {
      // Token expired or invalid, clean up
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('uuid');
      localStorage.removeItem('expired_date');
      Cookies.remove('userRole');
      Cookies.remove('userInfo');
    }
  }, []);

  const login = (newToken: string, newUuid: string, role: string, userData: UserInfo) => {
    setToken(newToken);
    setUuid(newUuid);
    setUserRole(role);
    setUserInfo(userData);
    setIsAuthenticated(true);
    
    Cookies.set('userRole', role, { expires: 1 });
    Cookies.set('userInfo', JSON.stringify(userData), { expires: 1 });
    console.log('Saved to cookies - Role:', role, 'User info:', userData);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear authentication state regardless of API success/failure
      setToken(null);
      setUuid(null);
      setUserRole(null);
      setUserInfo(null);
      setIsAuthenticated(false);
      
      // Remove from localStorage and cookies
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('uuid');
      localStorage.removeItem('expired_date');
      localStorage.removeItem('username');
      Cookies.remove('userRole');
      Cookies.remove('userInfo');
    }
  };

  const value = {
    isAuthenticated,
    token,
    uuid,
    userRole,
    userInfo,
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