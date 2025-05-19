import { getApiUrl, apiEndpoints } from '../config';
import { getAuthHeaders } from './authService';

export interface PostgresTable {
  table_name: string;
  table_schema: string;
  table_type: string;
}

export interface SqlQueryRequest {
  query: string;
}

export interface SqlQueryResponse {
  rows: Record<string, any>[];
}

export interface ImportResponse {
  success: boolean;
  message: string;
  tables_affected: number;
}

export interface ErrorResponse {
  error: string;
}

export const getTables = async (): Promise<PostgresTable[]> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.postgres.tables), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tables: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching postgres tables:', error);
    throw error;
  }
};

export const executeQuery = async (query: string): Promise<SqlQueryResponse> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.postgres.execute), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to execute query: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing SQL query:', error);
    throw error;
  }
};

export const importData = async (file: File): Promise<ImportResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('access_token');

    const response = await fetch(getApiUrl(apiEndpoints.postgres.import), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to import data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error importing SQL data:', error);
    throw error;
  }
};

export const exportTable = async (tableName: string): Promise<Blob> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.postgres.export(tableName)), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to export table: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error(`Error exporting table ${tableName}:`, error);
    throw error;
  }
}; 