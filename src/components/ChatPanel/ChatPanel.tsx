import React from 'react';
import '../../css/ChatPanel/ChatPanel.css';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatPanelProps {
  messages: Message[];
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages }) => {
  return (
    <div className="cp-container">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`cp-message-wrapper ${message.isUser ? 'cp-user-wrapper' : ''}`}
        >
          <div className="cp-avatar">
            <img
              src={message.isUser ? '/v6/images/user_profile.png' : '/v6/images/bot_profile.png'}
              alt={message.isUser ? 'User Avatar' : 'Bot Avatar'}
            />
          </div>
          <div className={`cp-message ${message.isUser ? 'cp-user' : 'cp-bot'}`}>
            <div className="cp-message-content">{message.content}</div>
            <div className="cp-message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatPanel;