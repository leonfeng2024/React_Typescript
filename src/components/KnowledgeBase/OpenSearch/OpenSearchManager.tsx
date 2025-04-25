import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Upload, 
  message, 
  Input, 
  Table, 
  Tabs, 
  Space,
  Form,
  Modal,
  List,
  Select
} from 'antd';
import { 
  UploadOutlined, 
  SearchOutlined, 
  PlusOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import './OpenSearchManager.css';
import { 
  getIndices, 
  createIndex, 
  deleteIndex, 
  searchIndex, 
  getUploadUrl, 
  getUploadHeaders,
  IndexData,
  SearchResult
} from '../../../services/opensearchService';

const { TextArea } = Input;

const OpenSearchManager: React.FC = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [newIndexName, setNewIndexName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchIndexName, setSearchIndexName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    fetchIndices();
  }, []);

  // Fetch OpenSearch indices
  const fetchIndices = async () => {
    console.log("###fetchIndices###")
    try {
      setLoading(true);
      const data = await getIndices();
      setIndices(data);
    } catch (error) {
      console.error('Error fetching indices:', error);
      message.error('Failed to fetch OpenSearch indices');
    } finally {
      setLoading(false);
    }
  };

  // Create new index
  const handleCreateIndex = async () => {
    if (!newIndexName.trim()) {
      message.warning('Please enter an index name');
      return;
    }

    try {
      setLoading(true);
      const response = await createIndex(newIndexName);
      
      if (response.success) {
        message.success(`Index "${newIndexName}" created successfully`);
        setIsModalVisible(false);
        setNewIndexName('');
        fetchIndices(); // Refresh indices list
      } else {
        message.error(response.message || 'Failed to create index');
      }
    } catch (error) {
      console.error('Error creating index:', error);
      message.error('Failed to create index');
    } finally {
      setLoading(false);
    }
  };

  // Delete index
  const handleDeleteIndex = async (indexName: string) => {
    try {
      setLoading(true);
      const response = await deleteIndex(indexName);
      
      if (response.success) {
        message.success(`Index "${indexName}" deleted successfully`);
        fetchIndices(); // Refresh indices list
      } else {
        message.error(response.message || 'Failed to delete index');
      }
    } catch (error) {
      console.error('Error deleting index:', error);
      message.error('Failed to delete index');
    } finally {
      setLoading(false);
    }
  };

  // Upload files to an index
  const uploadProps: UploadProps = {
    name: 'file',
    action: getUploadUrl(),
    data: { index: searchIndexName },
    headers: getUploadHeaders(),
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded and indexed successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    beforeUpload(file) {
      if (!searchIndexName) {
        message.warning('Please select an index first');
        return false;
      }
      return true;
    }
  };

  // Search in an index
  const handleSearch = async () => {
    if (!searchIndexName) {
      message.warning('Please select an index to search');
      return;
    }

    if (!searchQuery.trim()) {
      message.warning('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      const results = await searchIndex(searchIndexName, searchQuery);
      
      setSearchResults(results);
      
      if (results.length === 0) {
        message.info('No results found for your query');
      }
    } catch (error) {
      console.error('Error searching index:', error);
      message.error('Failed to perform search');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Format the search result content
  const formatContent = (content: string) => {
    if (content.length > 300) {
      return content.substring(0, 300) + '...';
    }
    return content;
  };

  // Index columns for the table
  const indexColumns: ColumnsType<IndexData> = [
    {
      title: 'Index Name',
      dataIndex: 'index',
      key: 'index',
    },
    {
      title: 'Document Count',
      dataIndex: 'doc_count',
      key: 'doc_count',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Health',
      dataIndex: 'health',
      key: 'health',
      render: (health: string) => (
        <span style={{ 
          color: health === 'green' ? 'green' : health === 'yellow' ? 'orange' : 'red' 
        }}>
          {health}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteIndex(record.index)}
          className="os-button-delete"
        >
          Delete
        </Button>
      ),
    },
  ];

  // 定义Tabs的items配置
  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <FileTextOutlined />
          Indices Management
        </span>
      ),
      children: (
        <Card title="OpenSearch Indices" className="os-card">
          <div className="os-header-actions">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
              className="os-button"
            >
              Create New Index
            </Button>
          </div>
          
          <Table
            columns={indexColumns}
            dataSource={indices}
            rowKey="index"
            loading={loading}
            pagination={{ pageSize: 10 }}
            className="os-table"
          />
        </Card>
      )
    },
    {
      key: '2',
      label: (
        <span>
          <UploadOutlined />
          Document Upload
        </span>
      ),
      children: (
        <Card title="Upload Knowledge Base Documents" className="os-card">
          <Form layout="vertical" className="os-form">
            <Form.Item 
              label="Select Target Index" 
              required
              help="Select the index where you want to upload documents"
            >
              <Select
                placeholder="Select an index"
                style={{ width: '100%' }}
                onChange={(value) => setSearchIndexName(value)}
                className="os-select"
              >
                {indices.map(index => (
                  <Select.Option key={index.index} value={index.index}>
                    {index.index}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item label="Upload Files">
              <Upload {...uploadProps} className="os-upload">
                <Button icon={<UploadOutlined />} className="os-button">
                  Click to Upload
                </Button>
              </Upload>
              
              <div className="os-help-section">
                <h4>Supported File Types:</h4>
                <p><FileExcelOutlined /> Excel (.xlsx)</p>
                <p><FileWordOutlined /> Word (.docx)</p>
                <p><FileTextOutlined /> Text files (.txt)</p>
              </div>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: '3',
      label: (
        <span>
          <SearchOutlined />
          Search
        </span>
      ),
      children: (
        <Card title="Search OpenSearch Index" className="os-card">
          <Form layout="vertical" className="os-form">
            <Form.Item 
              label="Select Index to Search" 
              required
            >
              <Select
                placeholder="Select an index"
                style={{ width: '100%' }}
                onChange={(value) => setSearchIndexName(value)}
                className="os-select"
              >
                {indices.map(index => (
                  <Select.Option key={index.index} value={index.index}>
                    {index.index}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item label="Search Query">
              <Input
                placeholder="Enter search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="os-input"
              />
            </Form.Item>
            
            <Form.Item>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
                className="os-button"
              >
                Search
              </Button>
            </Form.Item>
            
            {searchResults.length > 0 && (
              <div className="os-search-results">
                <h3>Search Results</h3>
                <List
                  bordered
                  dataSource={searchResults}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.title || `Document ${item.id}`}
                        description={formatContent(item.content)}
                      />
                      <div>Score: {item.score.toFixed(2)}</div>
                    </List.Item>
                  )}
                  pagination={{ pageSize: 5 }}
                />
              </div>
            )}
          </Form>
        </Card>
      )
    }
  ];

  return (
    <div className="os-container">
      <Tabs defaultActiveKey="1" items={tabItems} className="os-tabs" />
      
      <Modal
        title="Create New Index"
        open={isModalVisible}
        onOk={handleCreateIndex}
        onCancel={() => setIsModalVisible(false)}
        okButtonProps={{ loading: loading }}
      >
        <Input
          placeholder="Enter new index name"
          value={newIndexName}
          onChange={(e) => setNewIndexName(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default OpenSearchManager; 