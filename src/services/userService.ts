import { getApiUrl, apiEndpoints } from '../config';
import { getAuthHeaders } from './authService';

export interface UserProfile {
  id: number | string;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface CreateUserResponse extends ApiResponse {
  user: UserProfile;
}

export interface UpdateUserResponse extends ApiResponse {
  user: UserProfile;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.user.profile), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.user.list), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const createUser = async (userData: Omit<UserProfile, 'id' | 'created_at'>): Promise<UserProfile> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.user.create), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.status}`);
    }

    const data: CreateUserResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create user');
    }
    
    return data.user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId: number | string, userData: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.user.update(userId)), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.status}`);
    }

    const data: UpdateUserResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update user');
    }
    
    return data.user;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

export const deleteUser = async (userId: number | string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.user.delete(userId)), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
}; 