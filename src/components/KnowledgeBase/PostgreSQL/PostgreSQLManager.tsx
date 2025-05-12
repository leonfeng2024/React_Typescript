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
  Select,
  Row,
  Col,
  Form,
  InputNumber,
  Modal
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined, 
  DatabaseOutlined,
  SearchOutlined,
  FileTextOutlined,
  ReloadOutlined,
  FileAddOutlined,
  FileExcelOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getTables, executeQuery, exportTable, PostgresTable, SqlQueryResponse } from '../../../services/postgresService';
import { uploadSqlFile, uploadExcelFile, getDocumentStatus, deleteDocument, KBDocument, ExcelUploadParams } from '../../../services/kbService';
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
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('1');
  
  // Excel upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelUploadModalVisible, setExcelUploadModalVisible] = useState<boolean>(false);
  const [excelUploadForm] = Form.useForm();
  const [excelUploading, setExcelUploading] = useState<boolean>(false);

  useEffect(() => {
    fetchTables();
    // If the active tab is KB Management, fetch the document list
    if (activeTab === '4') {
      fetchDocuments();
    }
  }, [activeTab]);

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

  // Fetch KB document status
  const fetchDocuments = async () => {
    try {
      setDocsLoading(true);
      console.log('Fetching document status...');
      const docsData = await getDocumentStatus();
      console.log('Document status fetched:', docsData);
      setDocuments(docsData);
      message.success('Document status refreshed successfully');
    } catch (error) {
      console.error('Error fetching document status:', error);
      message.error('Failed to fetch document status');
    } finally {
      setDocsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // If KB Management tab is selected, fetch document status
    if (key === '4') {
      fetchDocuments();
    }
  };

  // Handle Excel file before upload
  const handleExcelBeforeUpload = (file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
                    file.type === 'application/vnd.ms-excel'; // .xls
    const hasValidExt = /\.(xlsx|xls)$/.test(file.name.toLowerCase());
    
    if (!isExcel || !hasValidExt) {
      message.error('Only Excel files (.xlsx, .xls) are allowed');
      return Upload.LIST_IGNORE;
    }
    
    setExcelFile(file);
    setExcelUploadModalVisible(true);
    return false; // Prevent automatic upload
  };

  // Handle Excel upload modal submit
  const handleExcelUploadSubmit = async (values: any) => {
    if (!excelFile) {
      message.error('Please select an Excel file');
      return;
    }

    try {
      setExcelUploading(true);
      
      const params: ExcelUploadParams = {
        file: excelFile,
        uploader: values.uploader || 'kb_manager',
        sheetName: values.sheetName,
        headerRow: values.headerRow,
        tableColName: values.tableColName
      };
      
      const response = await uploadExcelFile(params);
      
      if (response.status === 'success') {
        message.success(`${excelFile.name} file uploaded successfully`);
        fetchDocuments(); // Refresh document list
        setExcelUploadModalVisible(false);
        setExcelFile(null);
        excelUploadForm.resetFields();
      } else {
        message.error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      message.error('Failed to upload Excel file');
    } finally {
      setExcelUploading(false);
    }
  };

  // Cancel Excel upload
  const handleExcelUploadCancel = () => {
    setExcelUploadModalVisible(false);
    setExcelFile(null);
    excelUploadForm.resetFields();
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentName: string) => {
    try {
      Modal.confirm({
        title: 'Confirm Deletion',
        content: `Are you sure you want to delete document "${documentName}"?`,
        okText: 'Yes, Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          try {
            setDocsLoading(true);
            const response = await deleteDocument(documentName);
            
            if (response.status === 'success') {
              message.success(`Document "${documentName}" has been deleted`);
              fetchDocuments(); // Refresh document list
            } else {
              message.error(response.message || 'Delete failed');
            }
          } catch (error) {
            console.error('Error deleting document:', error);
            message.error('Failed to delete document');
          } finally {
            setDocsLoading(false);
          }
        },
        onCancel: () => {
          // 不需要在这里设置loading状态，因为取消时不应该有loading状态
        },
      });
    } catch (error) {
      console.error('Error handling document deletion:', error);
      message.error('Failed to delete document');
      setDocsLoading(false);
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

  // Table columns for KB document status
  const documentColumns: ColumnsType<KBDocument> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Document Name',
      dataIndex: 'document_name',
      key: 'document_name',
    },
    {
      title: 'Document Type',
      dataIndex: 'document_type',
      key: 'document_type',
    },
    {
      title: 'Process Status',
      dataIndex: 'process_status',
      key: 'process_status',
      render: (status: string) => {
        let className = '';
        if (status === 'Completed') {
          className = 'pg-kb-status-completed';
        } else if (status === 'In Process') {
          className = 'pg-kb-status-processing';
        } else if (status === 'Failed') {
          className = 'pg-kb-status-failed';
        }
        return <span className={className}>{status}</span>;
      }
    },
    {
      title: 'Upload Date',
      dataIndex: 'upload_date',
      key: 'upload_date',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: 'Uploader',
      dataIndex: 'uploader',
      key: 'uploader',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 120,
      render: (_, record: KBDocument) => (
        <Space>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              // 阻止事件冒泡，确保点击事件不会传播
              if (e && e.stopPropagation) {
                e.stopPropagation();
              }
              
              console.log("Delete button clicked for document:", record.document_name, "ID:", record.id);
              
              // 调用删除API，绕过确认对话框直接删除
              setDocsLoading(true);
              message.loading(`Deleting document ${record.document_name}...`, 0);
              
              deleteDocument(record.document_name, record.id)
                .then(response => {
                  console.log("Delete response received:", response);
                  message.destroy(); // 清除所有消息
                  
                  if (response && response.status === 'success') {
                    message.success(`Document "${record.document_name}" has been deleted`);
                    console.log("Refreshing document list...");
                    fetchDocuments(); // 刷新列表
                  } else {
                    message.error(response?.message || 'Delete operation failed');
                    setDocsLoading(false);
                  }
                })
                .catch(error => {
                  console.error("Delete operation error:", error);
                  message.destroy(); // 清除所有消息
                  message.error(`Failed to delete document: ${error.message}`);
                  setDocsLoading(false);
                });
            }}
            size="small"
          >
            Delete
          </Button>
        </Space>
      )
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
    },
    {
      key: '4',
      label: (
        <span>
          <FileAddOutlined />
          KB Management
        </span>
      ),
      children: (
        <Card title="Knowledge Base Management" className="pg-card">
          <Space direction="vertical" size="large" className="pg-space">
            <div className="pg-section">
              <h3>Upload Files</h3>
              <Row gutter={24}>
                <Col span={12}>
                  <div className="pg-kb-upload-area">
                    <h4>SQL File Upload</h4>
                    <Upload
                      name="file"
                      action={getApiUrl(apiEndpoints.kb.sqlUpload)}
                      headers={{
                        authorization: `Bearer ${localStorage.getItem('access_token')}`,
                      }}
                      data={{ uploader: 'kb_manager' }}
                      beforeUpload={(file) => {
                        const isSqlFile = file.name.toLowerCase().endsWith('.sql');
                        if (!isSqlFile) {
                          message.error('Only SQL files (.sql) are allowed');
                        }
                        return isSqlFile || Upload.LIST_IGNORE;
                      }}
                      onChange={(info) => {
                        if (info.file.status === 'done') {
                          message.success(`${info.file.name} file uploaded successfully`);
                          fetchDocuments(); // Refresh document list after upload
                        } else if (info.file.status === 'error') {
                          message.error(`${info.file.name} file upload failed.`);
                        }
                      }}
                      accept=".sql"
                    >
                      <Button icon={<UploadOutlined />} className="pg-button">
                        Click to Upload SQL File
                      </Button>
                    </Upload>
                    <p className="pg-help-text">
                      Upload a SQL file (.sql) to the knowledge base. Example: ddl_test2.sql
                    </p>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="pg-kb-upload-area">
                    <h4>Excel File Upload</h4>
                    <Upload
                      name="file"
                      beforeUpload={handleExcelBeforeUpload}
                      showUploadList={false}
                      accept=".xlsx,.xls"
                    >
                      <Button icon={<FileExcelOutlined />} className="pg-button">
                        Click to Upload Excel File
                      </Button>
                    </Upload>
                    <p className="pg-help-text">
                      Upload an Excel file (.xlsx, .xls) to the knowledge base. Example: PD003_01マスタ_施設マスタ.xlsx
                    </p>
                  </div>
                </Col>
              </Row>
            </div>
            
            <div className="pg-section">
              <Card 
                title="SQL Document Status" 
                className="pg-card"
                extra={
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />} 
                    onClick={fetchDocuments}
                    loading={docsLoading}
                  >
                    Refresh
                  </Button>
                }
              >
                <Table
                  columns={documentColumns}
                  dataSource={documents}
                  rowKey="document_name"
                  loading={docsLoading}
                  pagination={{ pageSize: 10 }}
                  className="pg-table"
                />
              </Card>
            </div>
          </Space>
        </Card>
      )
    }
  ];

  return (
    <div className="pg-container">
      <Tabs defaultActiveKey="1" activeKey={activeTab} onChange={handleTabChange} items={tabItems} className="pg-tabs" />
      
      {/* Excel Upload Modal */}
      <Modal
        title="Excel File Upload Configuration"
        open={excelUploadModalVisible}
        onCancel={handleExcelUploadCancel}
        footer={null}
        maskClosable={false}
      >
        <Form
          form={excelUploadForm}
          layout="vertical"
          onFinish={handleExcelUploadSubmit}
          initialValues={{
            uploader: 'kb_manager',
            headerRow: 2,
            sheetName: '資材一覧',
            tableColName: 'テーブル名'
          }}
        >
          <Form.Item
            name="uploader"
            label="Uploader"
            rules={[{ required: true, message: 'Please input uploader name' }]}
          >
            <Input placeholder="Enter uploader name" />
          </Form.Item>
          
          <Form.Item
            name="sheetName"
            label="Sheet Name"
            rules={[{ required: true, message: 'Please input sheet name' }]}
          >
            <Input placeholder="Enter sheet name (e.g. 資材一覧)" />
          </Form.Item>
          
          <Form.Item
            name="headerRow"
            label="Header Row"
            rules={[{ required: true, message: 'Please input header row number' }]}
          >
            <InputNumber min={1} placeholder="Enter header row number" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="tableColName"
            label="Table Column Name"
            rules={[{ required: true, message: 'Please input table column name' }]}
          >
            <Input placeholder="Enter table column name (e.g. テーブル名)" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={excelUploading} style={{ marginRight: 8 }}>
              Upload
            </Button>
            <Button onClick={handleExcelUploadCancel}>
              Cancel
            </Button>
          </Form.Item>
          
          {excelFile && (
            <div className="pg-excel-file-info">
              <p><strong>Selected File:</strong> {excelFile.name}</p>
              <p><strong>Size:</strong> {Math.round(excelFile.size / 1024)} KB</p>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default PostgreSQLManager; 