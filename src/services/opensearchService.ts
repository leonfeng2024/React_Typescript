import { getApiUrl, apiEndpoints } from '../config';
import { getAuthHeaders } from './authService';

// OpenSearch索引信息接口
export interface IndexData {
  index: string;
  doc_count: number;
  status: string;
  health: string;
}

// API响应接口
export interface ApiResponse {
  success: boolean;
  message: string;
}

// 搜索结果中的 source 对象接口
export interface SearchSource {
  procedure_name?: string;
  sql_content?: string;
  sql_embedding?: any[];
  table_name?: string[];
  view_name?: string[];
  [key: string]: any;
}

// 搜索结果接口
export interface SearchResult {
  id: string;
  index?: string;
  title?: string;
  content: string;
  score: number;
  sql_content?: string;
  sqlContent?: string;
  sql?: string;
  source?: SearchSource;
  original_content?: string;
  [key: string]: any;
}

// KB文档状态接口
export interface KBDocumentStatus {
  id: number;
  document_name: string;
  document_type: string;
  process_status: string;
  upload_date: string;
  uploader: string;
  index_name: string;
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

    const data = await response.json();
    
    // 检查是否返回了 hits 数组格式
    if (data.hits && Array.isArray(data.hits)) {
      // 将 hits 中的每个元素转换为 SearchResult 格式
      return data.hits.map((hit: any) => ({
        id: hit.id,
        index: hit.index,
        score: hit.score,
        // 从 source 对象中提取必要信息
        title: hit.source?.procedure_name || '',
        content: hit.source?.sql_content || '',
        // 保留原始的 source 对象，以便在界面上访问
        source: hit.source
      }));
    }
    
    // 如果不是 hits 格式，则返回原始响应（向后兼容）
    return data;
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

/**
 * 获取知识库文档状态
 */
export const getKBDocumentStatus = async (): Promise<KBDocumentStatus[]> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.opensearch.status), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch KB document status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching KB document status:', error);
    throw error;
  }
};

/**
 * 删除知识库文档
 * @param documentId 文档ID
 * @param documentName 文档名称
 */
export const deleteKBDocument = async (documentId: number, documentName: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.kb.opensearchDelete), {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: documentId.toString(),
        document_name: documentName
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to delete KB document: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting KB document ${documentId}:`, error);
    throw error;
  }
}; 