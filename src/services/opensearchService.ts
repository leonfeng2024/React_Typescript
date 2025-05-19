import { getApiUrl, apiEndpoints } from '../config';
import { getAuthHeaders } from './authService';

export interface IndexData {
  index: string;
  doc_count: number;
  status: string;
  health: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface SearchSource {
  procedure_name?: string;
  sql_content?: string;
  sql_embedding?: any[];
  table_name?: string[];
  view_name?: string[];
  [key: string]: any;
}

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

export interface KBDocumentStatus {
  id: number;
  document_name: string;
  document_type: string;
  process_status: string;
  upload_date: string;
  uploader: string;
  index_name: string;
}

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
    
    if (data.hits && Array.isArray(data.hits)) {
      return data.hits.map((hit: any) => ({
        id: hit.id,
        index: hit.index,
        score: hit.score,
        title: hit.source?.procedure_name || '',
        content: hit.source?.sql_content || '',
        source: hit.source
      }));
    }
    
    return data;
  } catch (error) {
    console.error('Error searching OpenSearch index:', error);
    throw error;
  }
};

export const getUploadUrl = (): string => {
  return getApiUrl(apiEndpoints.opensearch.upload);
};

export const getUploadHeaders = (): { authorization: string } => {
  const token = localStorage.getItem('access_token');
  return {
    authorization: `Bearer ${token}`,
  };
};

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