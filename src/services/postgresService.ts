import { getApiUrl, apiEndpoints } from '../config';
import { getAuthHeaders } from './authService';

// PostgreSQL表信息接口
export interface PostgresTable {
  table_name: string;
  table_schema: string;
  table_type: string;
}

// SQL查询请求接口
export interface SqlQueryRequest {
  query: string;
}

// SQL查询响应接口
export interface SqlQueryResponse {
  rows: Record<string, any>[];
}

// 导入数据响应接口
export interface ImportResponse {
  success: boolean;
  message: string;
  tables_affected: number;
}

// 错误响应接口
export interface ErrorResponse {
  error: string;
}

/**
 * 获取PostgreSQL数据库中的所有表
 */
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

/**
 * 执行SQL查询
 * @param query SQL查询语句
 */
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

/**
 * 导入SQL数据文件
 * @param file SQL文件
 */
export const importData = async (file: File): Promise<ImportResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // 获取授权token
    const token = localStorage.getItem('access_token');

    const response = await fetch(getApiUrl(apiEndpoints.postgres.import), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // 注意：使用FormData时不要设置Content-Type，浏览器会自动设置
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

/**
 * 导出表数据为CSV
 * @param tableName 表名
 */
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

    // 返回CSV文件的Blob对象
    return await response.blob();
  } catch (error) {
    console.error(`Error exporting table ${tableName}:`, error);
    throw error;
  }
}; 