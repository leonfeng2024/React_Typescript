import React, { useState } from 'react';
import './Login.css';
import { login as loginService } from '../../services/authService';
import { getUserProfile } from '../../services/userService';

interface LoginProps {
  onLoginSuccess: (token: string, uuid: string, role: string, userData: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with:', { username, password });
      
      // 使用authService中的login方法
      const data = await loginService({ username, password });
      
      if (data && data.access_token) {
        // Store token in localStorage for future requests
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('uuid', data.uuid);
        localStorage.setItem('expired_date', data.expired_date.toString());
        
        // 获取用户详细信息，使用userService
        try {
          const userProfile = await getUserProfile();
          
          if (userProfile && userProfile.role) {
            console.log('User details retrieved:', userProfile);
            
            // 创建完整的用户信息对象，合并用户配置文件
            const userData = {
              ...userProfile
            };
            
            // 调用成功回调，传递用户角色和信息
            onLoginSuccess(data.access_token, data.uuid, userProfile.role, userData);
          } else {
            console.error('User profile response missing role:', userProfile);
            
            // 如果缺少角色信息，使用mock数据（根据用户名判断角色）
            const mockRole = getMockRole(username);
            const mockUserData = {
              username: username,
              role: mockRole,
              email: `${username}@example.com`
            };
            
            console.log('Using mock user data:', mockUserData);
            onLoginSuccess(data.access_token, data.uuid, mockRole, mockUserData);
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          
          // 当获取用户资料失败时，使用mock数据
          const mockRole = getMockRole(username);
          const mockUserData = {
            username: username,
            role: mockRole,
            email: `${username}@example.com`
          };
          
          console.log('Using mock user data due to error:', mockUserData);
          onLoginSuccess(data.access_token, data.uuid, mockRole, mockUserData);
        }
      } else {
        setError('Invalid username or password');
        setIsLoading(false);
      }
    } catch (err) {
      setError(`Login failed: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Login error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

// 根据用户名确定模拟角色
const getMockRole = (username: string): string => {
  const lowerUsername = username.toLowerCase();
  if (lowerUsername.includes('admin')) {
    return 'admin';
  } else if (lowerUsername.includes('kb') || lowerUsername.includes('manager')) {
    return 'kb_manager';
  } else {
    return 'user';
  }
};

export default Login; 