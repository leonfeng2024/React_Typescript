import { getApiUrl, apiEndpoints } from '../config';

// Types
export interface DatabaseInfo {
  name: string;
  address: string;
  role: string;
  status: string;
  default: boolean;
}

export interface Neo4jNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface Neo4jRelationship {
  id: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  properties: Record<string, any>;
}

export interface Neo4jResult {
  nodes: Neo4jNode[];
  relationships: Neo4jRelationship[];
}

export interface ImportResponse {
  created: number;
  elapsed: number;
  status: string;
}

// Get auth headers
const getAuthHeaders = () => {
  const token = process.env.NODE_ENV === 'development' 
    ? 'DEVTOKEN' 
    : localStorage.getItem('access_token') || '';
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': '*/*'
  };
};

/**
 * Fetch Neo4j databases
 */
export const fetchNeo4jDatabases = async (): Promise<DatabaseInfo[]> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.neo4j.databases), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Neo4j databases: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Neo4j databases:', error);
    throw error;
  }
};

/**
 * Execute Neo4j relationship query
 */
export const executeNeo4jQuery = async (
  database: string, 
  query: string
): Promise<Neo4jResult> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.neo4j.executeQuery), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ database, query })
    });

    if (!response.ok) {
      throw new Error(`Failed to execute Neo4j query: ${response.status}`);
    }
    
    // Read the response body only once
    const result = await response.json();
    console.log('Neo4j query response:', result);
    return result;
  } catch (error) {
    console.error('Error executing Neo4j query:', error);
    throw error;
  }
};

/**
 * Execute Neo4j relationship import queries
 */
export const executeNeo4jImport = async (
  database: string, 
  queries: string[]
): Promise<ImportResponse> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.neo4j.executeQueries), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ database, queries })
    });

    if (!response.ok) {
      throw new Error(`Failed to execute Neo4j import: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing Neo4j import:', error);
    throw error;
  }
}; 