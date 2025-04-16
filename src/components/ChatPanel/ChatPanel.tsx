import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import '../../css/ChatPanel/ChatPanel.css';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  progressStage?: number; // 0-3 (0: start, 1: user intent, 2: knowledge base, 3: document generation)
  progressPercent?: number; // 0-100
}

interface ChatPanelProps {
  messages: Message[];
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages }) => {
  const getProgressStageLabel = (stage: number): string => {
    switch (stage) {
      case 1: return "ユーザー意図識別中";
      case 2: return "知識ベース検索中";
      case 3: return "回答文書生成中";
      default: return "処理開始";
    }
  };

  return (
    <div className="cp-container">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`cp-message-wrapper ${message.isUser ? 'cp-user-wrapper' : ''}`}
        >
          <div className="cp-avatar">
            <img
              src={message.isUser ? '/images/user_profile.png' : '/images/bot_profile.png'}
              alt={message.isUser ? 'User Avatar' : 'Bot Avatar'}
            />
          </div>
          <div className={`cp-message ${message.isUser ? 'cp-user' : 'cp-bot'}`}>
            <div className="cp-message-content">
              {message.isUser ? (
                message.content
              ) : message.isLoading ? (
                <>
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {message.content}
                  </ReactMarkdown>
                  <div className="cp-progress-container">
                    <div 
                      className="cp-progress-bar" 
                      style={{ width: `${message.progressPercent}%` }}
                    />
                    <div className="cp-progress-stages">
                      <div className={`cp-progress-stage ${message.progressStage! >= 1 ? 'active' : ''}`}>
                        <div className="cp-stage-dot" />
                        <div className="cp-stage-label">ユーザー意図識別</div>
                      </div>
                      <div className={`cp-progress-stage ${message.progressStage! >= 2 ? 'active' : ''}`}>
                        <div className="cp-stage-dot" />
                        <div className="cp-stage-label">知識ベース検索</div>
                      </div>
                      <div className={`cp-progress-stage ${message.progressStage! >= 3 ? 'active' : ''}`}>
                        <div className="cp-stage-dot" />
                        <div className="cp-stage-label">回答文書生成</div>
                      </div>
                    </div>
                    <div className="cp-progress-status">
                      {getProgressStageLabel(message.progressStage!)} ({Math.round(message.progressPercent!)}%)
                    </div>
                  </div>
                </>
              ) : (
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
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