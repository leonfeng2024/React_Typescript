interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expired_date: number;
  uuid: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server returned ${response.status}: ${errorText}`);
      throw new Error(`Login failed with status: ${response.status}`);
    }
    
    let data;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error('Invalid server response');
      }
    } else {
      throw new Error('Empty response from server');
    }

    // Store the uuid in localStorage
    if (data.uuid) {
      localStorage.setItem('uuid', data.uuid);
    }
    
    // Store username for future api calls
    if (credentials.username) {
      localStorage.setItem('username', credentials.username);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const checkTokenValidity = (): boolean => {
  const expiredDate = localStorage.getItem('expired_date');
  
  if (!expiredDate) {
    return false;
  }
  
  const expiryTimestamp = parseInt(expiredDate, 10);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  return expiryTimestamp > currentTimestamp;
};

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const logout = async (): Promise<{ status: string; message: string }> => {
  try {
    const token = localStorage.getItem('access_token');
    const uuid = localStorage.getItem('uuid');
    
    if (!token || !uuid) {
      // If no token or uuid, just return success without calling API
      return { status: 'success', message: 'Logout successful' };
    }
    
    const response = await fetch('http://localhost:8088/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uuid })
    });
    
    // Even if the server returns an error, we'll still log out on the client side
    // But we'll log the error for debugging purposes
    if (!response.ok) {
      console.error(`Logout API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Logout error:', error);
    // Return success even if API call fails - we'll still clear local state
    return { status: 'success', message: 'Logged out locally' };
  }
}; 