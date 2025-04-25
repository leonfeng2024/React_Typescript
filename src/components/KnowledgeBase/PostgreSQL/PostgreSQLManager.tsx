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
  Select
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined, 
  DatabaseOutlined,
  SearchOutlined,
  FileTextOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getTables, executeQuery, exportTable, PostgresTable, SqlQueryResponse } from '../../../services/postgresService';
import { getApiUrl, apiEndpoints } from '../../../config';
import './PostgreSQLManager.css';

const { TextArea } = Input;
const { Option } = Select;

const PostgreSQLManager: React.FC = () => {
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [queryColumns, setQueryColumns] = useState<ColumnsType<any>>([]);
  const [tables, setTables] = useState<PostgresTable[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<string>('');

  useEffect(() => {
    fetchTables();
  }, []);

  // Fetch tables from PostgreSQL
  const fetchTables = async () => {
    try {
      setLoading(true);
      const tablesData = await getTables();
      setTables(tablesData);
      message.success('Tables refreshed successfully');
    } catch (error) {
      console.error('Error fetching tables:', error);
      message.error('Failed to fetch database tables');
    } finally {
      setLoading(false);
    }
  };

  // Handle SQL query execution
  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) {
      message.warning('Please enter a SQL query');
      return;
    }

    try {
      setLoading(true);
      const response = await executeQuery(sqlQuery);

      // Process response data
      if (response && response.rows) {
        setQueryResult(response.rows);
        
        // Generate columns for table display
        if (response.rows.length > 0) {
          const firstRow = response.rows[0];
          const columns = Object.keys(firstRow).map(key => ({
            title: key,
            dataIndex: key,
            key: key,
            render: (text: any) => <span>{JSON.stringify(text)}</span>
          }));
          setQueryColumns(columns);
        } else {
          setQueryColumns([]);
        }
        
        message.success('Query executed successfully');
      } else {
        setQueryResult([]);
        setQueryColumns([]);
        message.info('Query executed with no results');
      }
    } catch (error) {
      console.error('Error executing query:', error);
      message.error('Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload for importing data
  const uploadProps: UploadProps = {
    name: 'file',
    action: getApiUrl(apiEndpoints.postgres.import),
    headers: {
      authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        fetchTables(); // Refresh tables after import
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  // Handle export of table data
  const handleExportTable = async () => {
    if (!selectedTable) {
      message.warning('Please select a table to export');
      return;
    }

    try {
      setLoading(true);
      const blobData = await exportTable(selectedTable);

      // Create download link
      const url = window.URL.createObjectURL(blobData);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTable}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success(`Exported ${selectedTable} successfully`);
    } catch (error) {
      console.error('Error exporting table:', error);
      message.error('Failed to export table');
    } finally {
      setLoading(false);
    }
  };

  // Table columns for the tables list
  const tableColumns: ColumnsType<PostgresTable> = [
    {
      title: 'Table Name',
      dataIndex: 'table_name',
      key: 'table_name',
    },
    {
      title: 'Schema',
      dataIndex: 'table_schema',
      key: 'table_schema',
    },
    {
      title: 'Type',
      dataIndex: 'table_type',
      key: 'table_type',
    }
  ];

  // 定义Tabs的items配置
  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <DatabaseOutlined />
          Table List
        </span>
      ),
      children: (
        <Card 
          title="PostgreSQL Tables" 
          className="pg-card"
          extra={
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={fetchTables}
              loading={loading}
            >
              Refresh
            </Button>
          }
        >
          <Table
            columns={tableColumns}
            dataSource={tables}
            rowKey="table_name"
            loading={loading}
            pagination={{ pageSize: 10 }}
            className="pg-table"
          />
        </Card>
      )
    },
    {
      key: '2',
      label: (
        <span>
          <FileTextOutlined />
          Execute SQL
        </span>
      ),
      children: (
        <Card title="Execute SQL Query" className="pg-card">
          <TextArea
            rows={12}
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="pg-textarea"
          />
          <Button
            type="primary"
            onClick={handleExecuteQuery}
            loading={loading}
            icon={<SearchOutlined />}
            className="pg-button"
          >
            Execute
          </Button>
          
          {queryResult.length > 0 && (
            <div className="pg-result">
              <h3>Query Results</h3>
              <Table
                columns={queryColumns}
                dataSource={queryResult}
                rowKey={(record, index) => index !== undefined ? index.toString() : '0'}
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 10 }}
              />
            </div>
          )}
        </Card>
      )
    },
    {
      key: '3',
      label: (
        <span>
          <UploadOutlined />
          Import/Export
        </span>
      ),
      children: (
        <Card title="Import/Export PostgreSQL Data" className="pg-card">
          <Space direction="vertical" size="large" className="pg-space">
            <div className="pg-section">
              <h3>Import SQL Data</h3>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} className="pg-button">
                  Click to Upload SQL File
                </Button>
              </Upload>
              <p className="pg-help-text">
                Upload a SQL file to import data into your database.
              </p>
            </div>
            
            <div className="pg-section">
              <h3>Export Table Data</h3>
              <Space>
                <Select
                  placeholder="Select a table to export"
                  style={{ width: 300 }}
                  onChange={(value) => setSelectedTable(value)}
                  className="pg-select"
                >
                  {tables.map(table => (
                    <Option key={table.table_name} value={table.table_name}>
                      {table.table_name}
                    </Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExportTable}
                  loading={loading}
                  disabled={!selectedTable}
                  className="pg-button"
                >
                  Export as CSV
                </Button>
              </Space>
              <p className="pg-help-text">
                Select a table and export its data as a CSV file.
              </p>
            </div>
          </Space>
        </Card>
      )
    }
  ];

  return (
    <div className="pg-container">
      <Tabs defaultActiveKey="1" items={tabItems} className="pg-tabs" />
    </div>
  );
};

export default PostgreSQLManager; 