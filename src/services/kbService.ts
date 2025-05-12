import { getApiUrl, apiEndpoints } from '../config';
import { getAuthHeaders } from './authService';

// KB document interface
export interface KBDocument {
  id: number;
  document_name: string;
  document_type: string;
  process_status: string;
  upload_date: string;
  uploader: string;
}

// Upload response interface
export interface UploadResponse {
  status: string;
  message: string;
}

// Excel upload parameters
export interface ExcelUploadParams {
  file: File;
  uploader: string;
  sheetName: string;
  headerRow: number;
  tableColName: string;
}

/**
 * Upload an SQL file to KB management
 * @param file SQL file to upload
 * @param uploader Uploader name
 */
export const uploadSqlFile = async (file: File, uploader: string = 'kb_manager'): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploader', uploader);
    
    const token = localStorage.getItem('access_token');

    const response = await fetch(getApiUrl(apiEndpoints.kb.sqlUpload), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to upload SQL file: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading SQL file:', error);
    throw error;
  }
};

/**
 * Upload an Excel file to KB management
 * @param params Excel upload parameters
 */
export const uploadExcelFile = async (params: ExcelUploadParams): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('uploader', params.uploader);
    formData.append('sheet_name', params.sheetName);
    formData.append('header_row', params.headerRow.toString());
    formData.append('table_col_name', params.tableColName);
    
    const token = localStorage.getItem('access_token');

    const response = await fetch(getApiUrl(apiEndpoints.kb.excelUpload), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to upload Excel file: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading Excel file:', error);
    throw error;
  }
};

/**
 * Get the status of KB documents
 */
export const getDocumentStatus = async (): Promise<KBDocument[]> => {
  try {
    const response = await fetch(getApiUrl(apiEndpoints.kb.docStatus), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching document status:', error);
    throw error;
  }
};

/**
 * Delete a KB document by name
 * @param documentName Name of the document to delete
 * @param documentId Document ID
 */
export const deleteDocument = async (documentName: string, documentId?: string | number): Promise<UploadResponse> => {
  try {
    console.log(`Attempting to delete document: ${documentName}, ID: ${documentId}`);
    
    // 使用API端点
    const url = getApiUrl('/kb/dataset/delete');
    console.log(`Making POST request to: ${url}`);
    
    // 准备请求体
    const requestBody = {
      document_name: documentName,
      id: documentId || ""
    };
    console.log('Request body:', requestBody);
    
    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    };
    console.log('Request headers:', headers);
    
    // 使用POST请求
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMessage = `Failed to delete document: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    let result;
    try {
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (responseText) {
        result = JSON.parse(responseText);
      } else {
        // 如果响应为空，创建一个默认的成功响应
        result = { status: 'success', message: 'Document deleted successfully' };
      }
    } catch (e) {
      console.error('Error parsing success response:', e);
      // 如果解析JSON失败，创建一个默认的成功响应
      result = { status: 'success', message: 'Document deleted successfully' };
    }
    
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}; 