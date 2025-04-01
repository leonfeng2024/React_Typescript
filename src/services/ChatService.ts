interface ChatRequest {
  username: string;
  query: string;
  uuid: string;
}

interface SourceDocument {
  document_id: string;
  content: string;
  relevance_score: number;
}

interface ChatResponse {
  status: string;
  username: string;
  message: string;
  source_documents?: SourceDocument[];
}

export class ChatService {
  private static readonly API_URL = 'http://localhost:8088/api/chat';
  private static readonly TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  public static async sendMessage(query: string): Promise<ChatResponse> {
    try {
      // Get token and UUID from localStorage
      const token = localStorage.getItem('access_token');
      const uuid = localStorage.getItem('uuid');
      
      if (!token || !uuid) {
        throw new Error('Authentication required. Please log in again.');
      }

      const request: ChatRequest = {
        username: localStorage.getItem('username') || 'user',
        query: query,
        uuid: uuid
      };

      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      try {
        const response = await fetch(this.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(request),
          signal: controller.signal
        });

        // Clear the timeout as the request completed
        clearTimeout(timeoutId);

        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        
        if (response.status === 403) {
          throw new Error('Access denied. UUID mismatch.');
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ChatResponse = await response.json();
        if (data.status !== 'success') {
          throw new Error(data.message || 'Unknown error occurred');
        }

        return data;
      } catch (error: unknown) {
        // Clear the timeout in case of error
        clearTimeout(timeoutId);
        
        // Check if the error is due to timeout
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out after 5 minutes. Please try again.');
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}