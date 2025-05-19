import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { apiEndpoints } from '../config';
import neo4jDatabases from '../mock/neo4j/databases.json';
import neo4jUploadStats from '../mock/neo4j/upload-stats.json';

// Create a new mock instance
const mock = new MockAdapter(axios);

// Helper function to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize mock API endpoints
export const initMockAPI = () => {
  // Authentication APIs
  mock.onPost(apiEndpoints.auth.login).reply(async (config: AxiosRequestConfig) => {
    await delay(800);
    const { username, password } = JSON.parse(config.data as string);
    
    // Simple authentication with role selection
    if (username === 'admin' && password === 'admin123') {
      return [200, {
        access_token: 'mock-admin-token',
        refresh_token: 'mock-refresh-token',
        expired_date: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        uuid: 'admin-uuid'
      }];
    } else if (username === 'manager' && password === 'manager123') {
      return [200, {
        access_token: 'mock-manager-token',
        refresh_token: 'mock-refresh-token',
        expired_date: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        uuid: 'manager-uuid'
      }];
    } else if (username === 'user' && password === 'user123') {
      return [200, {
        access_token: 'mock-user-token',
        refresh_token: 'mock-refresh-token',
        expired_date: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        uuid: 'user-uuid'
      }];
    } else {
      return [401, { error: 'Invalid credentials' }];
    }
  });

  // Neo4j APIs
  mock.onGet(apiEndpoints.neo4j.databases).reply(async () => {
    await delay(600);
    return [200, neo4jDatabases];
  });

  mock.onPost(apiEndpoints.neo4j.upload).reply(async () => {
    await delay(1800);
    return [200, { 
      success: true, 
      message: 'JSON document processed successfully',
      stats: neo4jUploadStats.stats
    }];
  });
};

export default initMockAPI; 