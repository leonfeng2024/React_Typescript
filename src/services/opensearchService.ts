import { getApiUrl, apiEndpoints } from '../config';
import { getAuthHeaders } from './authService';

// OpenSearch索引信息接口
export interface IndexData {
  index: string;
  doc_count: number;
  status: string;
  health: string;
}

// 搜索结果接口
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
}

// API响应接口
export interface ApiResponse {
  success: boolean;
  message: string;
}

/**
 * 获取OpenSearch中的所有索引
 */
export const getIndices = async (): Promise<IndexData[]> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.opensearch.indices), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch indices: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching OpenSearch indices:', error);
    throw error;
  }
};

/**
 * 创建新索引
 * @param indexName 索引名称
 */
export const createIndex = async (indexName: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.opensearch.indices), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ index: indexName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create index: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating OpenSearch index:', error);
    throw error;
  }
};

/**
 * 删除索引
 * @param indexName 索引名称
 */
export const deleteIndex = async (indexName: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.opensearch.deleteIndex(indexName)), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete index: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting OpenSearch index ${indexName}:`, error);
    throw error;
  }
};

/**
 * 搜索索引
 * @param indexName 索引名称
 * @param query 搜索查询
 */
export const searchIndex = async (indexName: string, query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.opensearch.search), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ index: indexName, query }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search index: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching OpenSearch index:', error);
    throw error;
  }
};

/**
 * 获取上传API的URL
 */
export const getUploadUrl = (): string => {
  return getApiUrl(apiEndpoints.opensearch.upload);
};

/**
 * 获取授权头信息
 */
export const getUploadHeaders = (): { authorization: string } => {
  const token = localStorage.getItem('access_token');
  return {
    authorization: `Bearer ${token}`,
  };
}; 