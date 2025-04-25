import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import '../../css/ChatPanel/ChatPanel.css';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  progressStage?: number; // 0-5 (0: start, 1: analyze intent, 2: identify column, 3: process data, 4: generate document, 5: complete)
  progressPercent?: number; // 0-100
  currentStep?: string; // Backend step identifier
}

interface ChatPanelProps {
  messages: Message[];
}

// Map backend steps to UI progress stages
const stepToStageMap: Record<string, number> = {
  '_analyze_user_intent': 1,
  'identify_column': 2,
  'process_start': 3,
  'opensearch_retriever': 3,
  'postgresql_retriever': 3,
  'neo4j_retriever': 3,
  'docs_retrieved': 3,
  '_process_with_llm': 4,
  'llm_process_complete': 4,
  'generating_document': 4,
  'final_answer': 5
};

const ChatPanel: React.FC<ChatPanelProps> = ({ messages }) => {
  const getProgressStageLabel = (stage: number, currentStep?: string): string => {
    switch (stage) {
      case 1: return "語意識別中";
      case 2: return "字段識別中";
      case 3: return "データベース検索中";
      case 4: return "文書生成中";
      case 5: return "処理完了";
      default: return "処理開始";
    }
  };

  // Format the current step message for display
  const getStepMessage = (currentStep?: string): string => {
    if (!currentStep) return "";
    
    switch (currentStep) {
      case '_analyze_user_intent': return "語意識別中";
      case 'identify_column': return "字段識別中";
      case 'process_start': return "処理を開始しています";
      case 'opensearch_retriever': return "Opensearchデータベース検索中";
      case 'postgresql_retriever': return "Postgresqlデータベース検索中";
      case 'neo4j_retriever': return "Neo4jデータベース検索中";
      case 'docs_retrieved': return "検索完了";
      case '_process_with_llm': return "LLM処理中";
      case 'llm_process_complete': return "LLM処理完了";
      case 'generating_document': return "文書生成中";
      case 'final_answer': return "処理完了";
      default: return currentStep;
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
                        <div className="cp-stage-label">語意識別</div>
                      </div>
                      <div className={`cp-progress-stage ${message.progressStage! >= 2 ? 'active' : ''}`}>
                        <div className="cp-stage-dot" />
                        <div className="cp-stage-label">字段識別</div>
                      </div>
                      <div className={`cp-progress-stage ${message.progressStage! >= 3 ? 'active' : ''}`}>
                        <div className="cp-stage-dot" />
                        <div className="cp-stage-label">データベース検索</div>
                      </div>
                      <div className={`cp-progress-stage ${message.progressStage! >= 4 ? 'active' : ''}`}>
                        <div className="cp-stage-dot" />
                        <div className="cp-stage-label">文書生成</div>
                      </div>
                      <div className={`cp-progress-stage ${message.progressStage! >= 5 ? 'active' : ''}`}>
                        <div className="cp-stage-dot" />
                        <div className="cp-stage-label">完了</div>
                      </div>
                    </div>
                    <div className="cp-progress-status">
                      {message.currentStep 
                        ? getStepMessage(message.currentStep)
                        : getProgressStageLabel(message.progressStage!)} 
                      ({Math.round(message.progressPercent!)}%)
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