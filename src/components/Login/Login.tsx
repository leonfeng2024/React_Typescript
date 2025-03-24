import React, { useState } from 'react';
import './Login.css';
import { login as loginService } from '../../services/authService';

interface LoginProps {
  onLoginSuccess: (token: string, uuid: string) => void;
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
      // 直接使用fetch发送请求，进行调试
      console.log('Attempting login with:', { username, password });
      
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let data;
      try {
        if (responseText) {
          data = JSON.parse(responseText);
        } else {
          throw new Error('Empty response');
        }
      } catch (e) {
        console.error('JSON parse error:', e);
        setError('Server response format error');
        setIsLoading(false);
        return;
      }

      if (data && data.access_token) {
        // Store token in localStorage for future requests
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('uuid', data.uuid);
        localStorage.setItem('expired_date', data.expired_date.toString());
        
        // Call the callback with token information
        onLoginSuccess(data.access_token, data.uuid);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError(`Login failed: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Login error:', err);
    } finally {
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