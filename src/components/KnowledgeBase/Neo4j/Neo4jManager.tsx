import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Upload, 
  message, 
  Input, 
  Table, 
  Space,
  Form,
  Select,
  Tooltip
} from 'antd';
import { 
  UploadOutlined, 
  InfoCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import './Neo4jManager.css';

const { TextArea } = Input;
const { Option } = Select;

interface DatabaseInfo {
  name: string;
  address: string;
  role: string;
  status: string;
  default: boolean;
}

interface UploadStats {
  processed: number;
  created: number;
  errors: number;
}

const Neo4jManager: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [jsonPreview, setJsonPreview] = useState<string>('');
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);

  useEffect(() => {
    fetchDatabases();
  }, []);

  // Fetch Neo4j databases
  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/neo4j/databases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setDatabases(response.data);
      
      // Set default database as selected if there are any
      if (response.data.length > 0) {
        const defaultDb = response.data.find((db: DatabaseInfo) => db.default);
        if (defaultDb) {
          setSelectedDb(defaultDb.name);
        } else {
          setSelectedDb(response.data[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
      message.error('Failed to fetch Neo4j databases');
    } finally {
      setLoading(false);
    }
  };

  // Database columns for the table
  const databaseColumns: ColumnsType<DatabaseInfo> = [
    {
      title: 'Database Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ 
          color: status === 'online' ? 'green' : 'red' 
        }}>
          {status}
        </span>
      )
    },
    {
      title: 'Default',
      dataIndex: 'default',
      key: 'default',
      render: (isDefault: boolean) => (
        isDefault ? 'Yes' : 'No'
      )
    }
  ];

  // Handle file upload for JSON data
  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.json',
    action: `/api/neo4j/upload`,
    data: { database: selectedDb },
    headers: {
      authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    beforeUpload: (file) => {
      const isJSON = file.type === 'application/json';
      if (!isJSON) {
        message.error('You can only upload JSON files!');
      }
      
      if (!selectedDb) {
        message.error('Please select a database first');
        return false;
      }
      
      // Read and preview the JSON file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Display truncated preview
          setJsonPreview(content.length > 500 ? content.substring(0, 500) + '...' : content);
        } catch (error) {
          console.error('Error reading file:', error);
          setJsonPreview('');
        }
      };
      reader.readAsText(file);
      
      return isJSON;
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        
        // Update upload stats if available in response
        if (info.file.response && info.file.response.stats) {
          setUploadStats(info.file.response.stats);
        }
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
        setUploadStats(null);
      }
    },
  };

  // JSON format example for tooltip
  const jsonFormatExample = `{
  "nodes": [
    { "id": "1", "labels": ["Person"], "properties": { "name": "John", "age": 30 } },
    { "id": "2", "labels": ["Movie"], "properties": { "title": "Example Movie", "year": 2023 } }
  ],
  "relationships": [
    { "id": "1", "startNode": "1", "endNode": "2", "type": "ACTED_IN", "properties": { "role": "Main Character" } }
  ]
}`;

  return (
    <div className="neo-container">
      <Card title={
        <Space>
          <DatabaseOutlined />
          <span>Neo4j Database Information</span>
        </Space>
      } className="neo-card">
        <Table
          columns={databaseColumns}
          dataSource={databases}
          rowKey="name"
          loading={loading}
          pagination={false}
          className="neo-table"
        />
      </Card>
      
      <Card 
        title="Upload Knowledge Base JSON Document" 
        className="neo-card"
        extra={
          <Tooltip title="JSON Format Example">
            <InfoCircleOutlined className="neo-info-icon" />
          </Tooltip>
        }
      >
        <Form layout="vertical" className="neo-form">
          <Form.Item 
            label="Select Target Database" 
            required
            help="Select the database where you want to upload your knowledge graph data"
          >
            <Select
              placeholder="Select a database"
              value={selectedDb}
              onChange={(value) => setSelectedDb(value)}
              className="neo-select"
            >
              {databases.map(db => (
                <Option key={db.name} value={db.name}>
                  {db.name} {db.default ? ' (Default)' : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            label="Upload JSON File"
            help="Upload a JSON file containing nodes and relationships data"
          >
            <Upload {...uploadProps} className="neo-upload">
              <Button icon={<UploadOutlined />} className="neo-button">
                Click to Upload JSON
              </Button>
            </Upload>
          </Form.Item>
          
          <Form.Item label="JSON Format Example">
            <TextArea
              value={jsonFormatExample}
              rows={10}
              readOnly
              className="neo-json-example"
            />
          </Form.Item>
          
          {jsonPreview && (
            <Form.Item label="File Preview">
              <TextArea
                value={jsonPreview}
                rows={6}
                readOnly
                className="neo-preview"
              />
            </Form.Item>
          )}
          
          {uploadStats && (
            <div className="neo-stats">
              <h3>Upload Statistics</h3>
              <p>Processed: {uploadStats.processed} items</p>
              <p>Created: {uploadStats.created} nodes/relationships</p>
              <p>Errors: {uploadStats.errors}</p>
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default Neo4jManager; 