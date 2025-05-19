import React, { useState, useRef, useEffect } from 'react';
import '../../css/ChatWindow/ChatWindow.css';
import ChatPanel from '../ChatPanel/ChatPanel';
import { ChatService, ChatStreamData } from '../../services/ChatService';

// Add a counter to ensure unique IDs even when generated in rapid succession
let messageIdCounter = 0;

// Function to generate unique message IDs
const generateUniqueId = (): string => {
  messageIdCounter += 1;
  return `${Date.now()}-${messageIdCounter}`;
};

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  progressStage?: number; // 0-5 (0: start, 1: analyze intent, 2: identify column, 3: process data, 4: generate document, 5: complete)
  progressPercent?: number; // 0-100
  currentStep?: string; // Backend step identifier
  sourceDocuments?: {
    document_id: string;
    content: string;
    relevance_score: number;
  }[];
}

// Map backend steps to UI progress stages and percentages
const stepToProgressMap: Record<string, { stage: number; percent: number }> = {
  '_analyze_user_intent': { stage: 1, percent: 20 },
  'identify_column': { stage: 2, percent: 40 },
  'process_start': { stage: 3, percent: 50 },
  'opensearch_retriever': { stage: 3, percent: 60 },
  'postgresql_retriever': { stage: 3, percent: 70 },
  'neo4j_retriever': { stage: 3, percent: 80 },
  'docs_retrieved': { stage: 3, percent: 85 },
  '_process_with_llm': { stage: 4, percent: 90 },
  'llm_process_complete': { stage: 4, percent: 95 },
  'generating_document': { stage: 4, percent: 98 },
  'final_answer': { stage: 5, percent: 100 }
};

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const finalAnswerRef = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isWaitingResponse) return;

    const userMessage: Message = {
      id: generateUniqueId(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsWaitingResponse(true);

    // Create a loading message with initial progress state
    const loadingId = generateUniqueId();
    const loadingMessage: Message = {
      id: loadingId,
      content: 'ご相談を承りました。現在対応中ですので、少々お待ちください...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
      progressStage: 0,
      progressPercent: 0
    };
    
    setMessages(prevMessages => [...prevMessages, loadingMessage]);

    finalAnswerRef.current = '';

    // Use the new streaming API
    await ChatService.sendMessageStream(
      inputValue, 
      {
        onStepUpdate: (stepData: ChatStreamData) => {
          // Update loading message with progress information from the backend
          const progress = stepToProgressMap[stepData.step] || { stage: 0, percent: 10 };
          
          // 如果是最终回答，保存到引用中而不是立即显示
          if (stepData.step === 'final_answer') {
            finalAnswerRef.current = stepData.message;
          }
          
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === loadingId 
                ? { 
                    ...msg, 
                    progressStage: progress.stage, 
                    progressPercent: progress.percent,
                    currentStep: stepData.step,
                  } 
                : msg
            )
          );
        },
        onComplete: (finalAnswer: string) => {
          const responseToUse = finalAnswerRef.current || finalAnswer;
          
          // Create final message and remove loading message after a small delay
          setTimeout(() => {
            const botMessage: Message = {
              id: generateUniqueId(),
              content: responseToUse,
              isUser: false,
              timestamp: new Date(),
            };
            
            // Remove loading message and add real response
            setMessages(prevMessages => 
              prevMessages.filter(msg => msg.id !== loadingId).concat(botMessage)
            );
            
            setIsWaitingResponse(false);
          }, 500);
        },
        onError: (error: Error) => {
          // Handle error case
          const errorMessage: Message = {
            id: generateUniqueId(),
            content: error.message || 'Failed to send message',
            isUser: false,
            timestamp: new Date()
          };
          
          setMessages(prevMessages => {
            // Remove loading message and add error message
            return prevMessages.filter(msg => !msg.isLoading).concat(errorMessage);
          });
          
          console.error('Failed to get bot response:', error);
          setIsWaitingResponse(false);
        }
      }
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isWaitingResponse) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8088/api/file/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      const systemMessage: Message = {
        id: generateUniqueId(),
        content: result.status === 'success' 
          ? `File "${file.name}" uploaded successfully` 
          : `Failed to upload file: ${result.message}`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, systemMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="cw-container">
      <div className="cw-messages">
        <ChatPanel messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      <div className="cw-input-area">
        <textarea
          className="cw-input"
          placeholder="Please input your question..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isWaitingResponse}
        />
        <div className="cw-button-group">
          <input
            type="file"
            ref={fileInputRef}
            className="cw-file-input"
            onChange={handleFileUpload}
            disabled={isUploading || isWaitingResponse}
          />
          <button 
            className={`cw-upload-button ${isUploading ? 'uploading' : ''} ${isWaitingResponse ? 'disabled' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isWaitingResponse}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
          <button 
            className={`cw-send-button ${isWaitingResponse ? 'disabled' : ''}`}
            onClick={handleSendMessage}
            disabled={isWaitingResponse}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;