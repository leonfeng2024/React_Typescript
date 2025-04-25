import { getApiUrl, apiEndpoints, apiTimeouts } from '../config';

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

// New interface for handling streaming step updates
export interface ChatStreamData {
  step: string;
  message: string;
  data?: any;
}

// New type to represent callbacks for stream updates
export type StreamCallbacks = {
  onStepUpdate: (stepData: ChatStreamData) => void;
  onComplete: (finalAnswer: string) => void;
  onError: (error: Error) => void;
};

export class ChatService {
  private static readonly TIMEOUT = apiTimeouts.chat; // 使用配置的超时时间
  
  // Modified method to handle streaming responses
  public static async sendMessageStream(
    query: string, 
    callbacks: StreamCallbacks
  ): Promise<void> {
    // Get token and UUID from localStorage
    const token = localStorage.getItem('access_token');
    const uuid = localStorage.getItem('uuid');
    
    if (!token || !uuid) {
      callbacks.onError(new Error('Authentication required. Please log in again.'));
      return;
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
      const response = await fetch(getApiUrl(apiEndpoints.chat.send), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      // Clear the timeout as the request started
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

      // Get the response body as a readable stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Process the stream
      const processStream = async (): Promise<void> => {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            // Process any remaining data in the buffer
            if (buffer.trim()) {
              try {
                const data = JSON.parse(buffer.trim()) as ChatStreamData;
                callbacks.onStepUpdate(data);
                
                // If this is the final answer, call onComplete
                if (data.step === 'final_answer') {
                  callbacks.onComplete(data.message);
                }
              } catch (e) {
                console.error('Error parsing final buffer:', e);
              }
            }
            return;
          }
          
          // Decode the chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Split by newlines and process each complete JSON object
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line.trim()) as ChatStreamData;
                callbacks.onStepUpdate(data);
                
                // If this is the final answer, call onComplete
                if (data.step === 'final_answer') {
                  callbacks.onComplete(data.message);
                }
              } catch (e) {
                console.error('Error parsing JSON:', e, 'Line:', line);
              }
            }
          }
          
          // Continue processing the stream
          return processStream();
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            callbacks.onError(error);
          }
        }
      };
      
      await processStream();
    } catch (error: unknown) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      
      // Check if the error is due to timeout
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          callbacks.onError(new Error('Request timed out after 5 minutes. Please try again.'));
        } else {
          callbacks.onError(error);
        }
      } else {
        callbacks.onError(new Error('Unknown error occurred'));
      }
    }
  }
  
  // Keep the original method for backward compatibility if needed
  public static async sendMessage(query: string): Promise<ChatResponse> {
    try {
      // Get token and UUID from localStorage
      const token = localStorage.getItem('access_token');
      const uuid = localStorage.getItem('uuid');
      
      if (!token || !uuid) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Return immediate response with loading message
      const loadingResponse: ChatResponse = {
        status: 'loading',
        username: 'system',
        message: 'ご相談を承りました。現在対応中ですので、少々お待ちください'
      };

      const request: ChatRequest = {
        username: localStorage.getItem('username') || 'user',
        query: query,
        uuid: uuid
      };

      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      try {
        const response = await fetch(getApiUrl(apiEndpoints.chat.send), {
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