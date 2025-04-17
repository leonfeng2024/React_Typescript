import React, { useState, useRef, useEffect } from 'react';
import '../../css/ChatWindow/ChatWindow.css';
import ChatPanel from '../ChatPanel/ChatPanel';
import { ChatService } from '../../services/ChatService';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  progressStage?: number; // 0-4 (0: start, 1: user intent, 2: knowledge base, 3: relationship graph, 4: document generation)
  progressPercent?: number; // 0-100
  sourceDocuments?: {
    document_id: string;
    content: string;
    relevance_score: number;
  }[];
}

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');

    try {
      const loadingId = Date.now().toString();
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
      
      // Start progress animation
      simulateProgress(loadingId);
      
      const response = await ChatService.sendMessage(inputValue);
      
      // Complete the progress immediately when the response arrives
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === loadingId 
            ? { ...msg, progressPercent: 100, progressStage: 4 } 
            : msg
        )
      );
      
      // Add small delay before showing the final message
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.message,
          isUser: false,
          timestamp: new Date(),
          sourceDocuments: response.source_documents
        };
        
        // Remove loading message and add real response
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== loadingId).concat(botMessage)
        );
      }, 500);
      
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : 'Failed to send message',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prevMessages => {
        // Remove loading message and add error message
        return prevMessages.filter(msg => !msg.isLoading).concat(errorMessage);
      });
      console.error('Failed to get bot response:', error);
    }
  };
  
  const simulateProgress = (loadingId: string) => {
    // Random duration between 30-40 seconds
    const totalDuration = Math.floor(Math.random() * 10000) + 30000;
    
    // Define key progress points
    const stage1 = totalDuration * 0.05; // User intent recognition ~5%
    const stage2 = totalDuration * 0.10; // Knowledge base query ~10% 
    const stage3 = totalDuration * 0.60; // Generate relationship graph ~60%
    const stage4 = totalDuration * 0.90; // Document generation ~90%
    
    let startTime = Date.now();
    let elapsed = 0;
    
    const updateProgress = () => {
      elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / totalDuration) * 100, 99); // Cap at 99% until actual response
      
      // Determine the current stage
      let currentStage = 0;
      if (elapsed >= stage4) {
        currentStage = 4;
      } else if (elapsed >= stage3) {
        currentStage = 3;
      } else if (elapsed >= stage2) {
        currentStage = 2;
      } else if (elapsed >= stage1) {
        currentStage = 1;
      }
      
      // Update the message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === loadingId 
            ? { ...msg, progressPercent: progress, progressStage: currentStage } 
            : msg
        )
      );
      
      // Continue updating progress if we haven't reached the end
      if (elapsed < totalDuration) {
        progressTimerRef.current = setTimeout(updateProgress, 50);
      }
    };
    
    // Start progress updates
    progressTimerRef.current = setTimeout(updateProgress, 50);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        id: Date.now().toString(),
        content: result.status === 'success' 
          ? `File "${file.name}" uploaded successfully` 
          : `Failed to upload file: ${result.message}`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, systemMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
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
        />
        <div className="cw-button-group">
          <input
            type="file"
            ref={fileInputRef}
            className="cw-file-input"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <button 
            className={`cw-upload-button ${isUploading ? 'uploading' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
          <button 
            className="cw-send-button"
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;