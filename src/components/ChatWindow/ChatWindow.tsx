import React, { useState, useRef, useEffect } from 'react';
import '../../css/ChatWindow/ChatWindow.css';
import ChatPanel from '../ChatPanel/ChatPanel';
import { ChatService } from '../../services/ChatService';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const response = await ChatService.sendMessage(inputValue);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        sourceDocuments: response.source_documents
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : 'Failed to send message',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      console.error('Failed to get bot response:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost/api/file/upload', {
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