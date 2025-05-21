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
            
            const userData = {
              ...userProfile
            };
            
            onLoginSuccess(data.access_token, data.uuid, userProfile.role, userData);
          } else {
            console.error('User profile response missing role:', userProfile);
            setError('Error retrieving user profile: Missing role information');
            setIsLoading(false);
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError(`Error fetching user profile: ${profileError instanceof Error ? profileError.message : String(profileError)}`);
          setIsLoading(false);
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

export default Login; 