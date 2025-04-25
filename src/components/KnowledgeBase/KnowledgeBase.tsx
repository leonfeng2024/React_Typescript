import React, { useState } from 'react';
import { Tabs } from 'antd';
import './KnowledgeBase.css';
import PostgreSQLManager from './PostgreSQL/PostgreSQLManager';
import OpenSearchManager from './OpenSearch/OpenSearchManager';
import Neo4jManager from './Neo4j/Neo4jManager';

const KnowledgeBase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('1');

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 定义Tabs的items配置
  const tabItems = [
    {
      key: '1',
      label: 'PostgreSQL Management',
      children: <PostgreSQLManager />
    },
    {
      key: '2',
      label: 'OpenSearch Management',
      children: <OpenSearchManager />
    },
    {
      key: '3',
      label: 'Neo4j Management',
      children: <Neo4jManager />
    }
  ];

  return (
    <div className="kb-container">
      <h1 className="kb-title">Knowledge Base Management</h1>
      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange} 
        className="kb-tabs"
        style={{ width: '100%' }}
        items={tabItems}
      />
    </div>
  );
};

export default KnowledgeBase; 