import React from 'react';
import './App.css';
import TopMenuBar from './components/TopMenuBar/TopMenuBar';
import ChatWindow from './components/ChatWindow/ChatWindow';
import Login from './components/Login/Login';
import KnowledgeBase from './components/KnowledgeBase/KnowledgeBase';
import UserManagement from './components/UserManagement/UserManagement';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated, login, userRole } = useAuth();

  const handleLoginSuccess = (token: string, uuid: string, role: string, userData: any) => {
    login(token, uuid, role, userData);
  };

  // Render the appropriate component based on authentication status and role
  const renderContent = () => {
    if (!isAuthenticated) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    console.log('Current user role:', userRole);

    // Handle different roles
    switch (userRole) {
      case 'admin':
        return (
          <>
            <TopMenuBar />
            <UserManagement />
          </>
        );
      case 'kb_manager':
        return (
          <>
            <TopMenuBar />
            <KnowledgeBase />
          </>
        );
      case 'user':
      default:
        return (
          <>
            <TopMenuBar />
            <ChatWindow />
          </>
        );
    }
  };

  return (
    <div className="App">
      {renderContent()}
    </div>
  );
}

export default App;
