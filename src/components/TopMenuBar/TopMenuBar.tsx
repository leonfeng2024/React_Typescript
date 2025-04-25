import React from 'react';
import '../../css/TopMenuBar/TopMenuBar.css';
import { useAuth } from '../../context/AuthContext';
import { Dropdown, Avatar, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

const TopMenuBar: React.FC = () => {
  const { logout, userInfo, userRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    // No need to navigate - the App component will handle rendering
    // the Login component based on isAuthenticated state
  };

  const items: MenuProps['items'] = [
    {
      key: 'userInfo',
      label: (
        <div className="user-info-container">
          <div><strong>Username:</strong> {userInfo?.username || 'Unknown'}</div>
          <div><strong>Role:</strong> {userRole || 'Unknown'}</div>
          {userInfo?.email && <div><strong>Email:</strong> {userInfo.email}</div>}
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      danger: true,
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <div className="tmb-container">
      <div className="tmb-logo">ChatBot</div>
      <div className="tmb-actions">
        <Dropdown menu={{ items }} trigger={['click']}>
          <div className="tmb-avatar">
            <Tooltip title="User Profile">
              <Avatar 
                icon={<UserOutlined />} 
                src="/images/user_profile.png"
                className="tmb-avatar-circle"
                style={{ cursor: 'pointer' }}
              />
            </Tooltip>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default TopMenuBar;