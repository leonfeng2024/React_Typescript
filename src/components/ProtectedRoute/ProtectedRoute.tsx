import React, { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import Login from '../Login/Login';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, login } = useAuth();

  const handleLoginSuccess = (token: string, uuid: string) => {
    login(token, uuid);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 