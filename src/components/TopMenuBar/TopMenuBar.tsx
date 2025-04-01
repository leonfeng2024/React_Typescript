import React from 'react';
import '../../css/TopMenuBar/TopMenuBar.css';
import { useAuth } from '../../context/AuthContext';

const TopMenuBar: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // No need to navigate - the App component will handle rendering
    // the Login component based on isAuthenticated state
  };

  return (
    <div className="tmb-container">
      <div className="tmb-logo">ChatBot</div>
      <div className="tmb-actions">
        <button className="tmb-logout-button" onClick={handleLogout}>
          Logout
        </button>
        <div className="tmb-avatar">
          <img
            src="/images/user_profile.png"
            alt="User Avatar"
            className="tmb-avatar-circle"
          />
        </div>
      </div>
    </div>
  );
};

export default TopMenuBar;