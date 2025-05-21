import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Tabs,
  Slider,
  Row,
  Col,
  Divider,
  Modal
} from 'antd';
import { 
  UploadOutlined, 
  InfoCircleOutlined,
  DatabaseOutlined,
  SearchOutlined,
  LinkOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import * as d3 from 'd3';
import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';
import { apiEndpoints } from '../../../config';
import './Neo4jManager.css';
import { 
  fetchNeo4jDatabases, 
  executeNeo4jQuery, 
  executeNeo4jImport, 
  DatabaseInfo,
  Neo4jNode,
  Neo4jRelationship,
  Neo4jResult,
  ImportResponse
} from '../../../services/neo4jService';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// For upload action URL
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000' 
  : '';

// Response types still needed in the component
interface UploadStats {
  processed: number;
  created: number;
  errors: number;
}

interface RelationshipImportData {
  [key: string]: string;
}

interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  properties: Record<string, any>;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const Neo4jManager: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [jsonPreview, setJsonPreview] = useState<string>('');
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  
  // Relationship query state
  const [keyword, setKeyword] = useState<string>('');
  const [queryDepth, setQueryDepth] = useState<number>(1);
  const [queryResult, setQueryResult] = useState<Neo4jResult | null>(null);
  const [queryJson, setQueryJson] = useState<string>('');
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  
  // Relationship import state
  const [relationshipJson, setRelationshipJson] = useState<string>('');
  const [cypherQueries, setCypherQueries] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  
  // Manual connection state
  const [showManualConnect, setShowManualConnect] = useState<boolean>(false);
  const [manualDbName, setManualDbName] = useState<string>('');
  const [manualDbAddress, setManualDbAddress] = useState<string>('');
  const [manualDbUsername, setManualDbUsername] = useState<string>('neo4j');
  const [manualDbPassword, setManualDbPassword] = useState<string>('');
  
  // D3 visualization refs
  const svgRef = useRef<SVGSVGElement>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  // Get auth token for upload props
  const getAuthToken = (): string => {
    return process.env.NODE_ENV === 'development'
      ? 'DEVTOKEN'
      : localStorage.getItem('access_token') || '';
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (queryResult && svgRef.current) {
      renderGraph();
    }
  }, [queryResult]);

  // Fetch Neo4j databases
  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const data = await fetchNeo4jDatabases();
      
      if (data && Array.isArray(data) && data.length > 0) {
        setDatabases(data);
        
        // Set default database as selected if there are any
        const defaultDb = data.find((db: DatabaseInfo) => db.default);
        if (defaultDb) {
          setSelectedDb(defaultDb.name);
        } else {
          setSelectedDb(data[0].name);
        }
      } else {
        Modal.warning({
          title: '警告',
          content: '未找到Neo4j数据库',
          centered: true
        });
        setDatabases([]);
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
      
      // Display error in center modal
      Modal.error({
        title: '连接错误',
        content: '无法连接到Neo4j数据库服务',
        centered: true
      });
      
      setDatabases([]);
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
    action: `${API_BASE_URL}${apiEndpoints.neo4j.upload}`,
    data: { database: selectedDb },
    headers: {
      authorization: `Bearer ${getAuthToken()}`,
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

  // Handle relationship file upload
  const relationshipUploadProps: UploadProps = {
    name: 'file',
    accept: '.json',
    beforeUpload: (file) => {
      const isJSON = file.type === 'application/json';
      if (!isJSON) {
        message.error('You can only upload JSON files!');
        return false;
      }
      
      if (!selectedDb) {
        message.error('Please select a database first');
        return false;
      }
      
      // Read and parse the relationship JSON file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setRelationshipJson(content);
          
          // Parse JSON and generate Cypher queries
          const relationshipData = JSON.parse(content) as RelationshipImportData;
          const queries = generateCypherQueries(relationshipData);
          setCypherQueries(queries);
        } catch (error) {
          console.error('Error processing relationship file:', error);
          message.error('Failed to process relationship file');
          setRelationshipJson('');
          setCypherQueries([]);
        }
      };
      reader.readAsText(file);
      
      // Prevent default upload behavior
      return false;
    }
  };

  // Generate Cypher queries from relationship data
  const generateCypherQueries = (data: RelationshipImportData): string[] => {
    return Object.entries(data).map(([source, target]) => {
      const [sourceLabel, sourceProp] = source.split(".");
      const [targetLabel, targetProp] = target.split(".");
      
      return `
MATCH (a:${sourceLabel}), (b:${targetLabel})
WHERE a.${sourceProp} = b.${targetProp}
MERGE (a)-[:RELATES_TO]->(b)
      `.trim();
    });
  };

  // Execute relationship import
  const executeImport = async () => {
    if (!selectedDb || cypherQueries.length === 0) {
      message.error('Please select a database and upload a valid relationship file');
      return;
    }
    
    try {
      setImportLoading(true);
      
      const importResponse = await executeNeo4jImport(selectedDb, cypherQueries);
      
      message.success(`Successfully imported ${importResponse.created || 0} relationships in ${importResponse.elapsed || 0}ms`);
      setCypherQueries([]);
      setRelationshipJson('');
    } catch (error) {
      console.error('Error importing relationships:', error);
      message.error('Failed to import relationships');
    } finally {
      setImportLoading(false);
    }
  };

  // Execute relationship query
  const executeQuery = async () => {
    if (!selectedDb || !keyword) {
      message.error('Please select a database and enter a keyword');
      return;
    }
    
    try {
      setQueryLoading(true);
      
      const cypherQuery = `
MATCH path = (n)-[*1..${queryDepth}]-(m)
WHERE ANY(label IN labels(n) WHERE label CONTAINS '${keyword}') 
   OR ANY(label IN labels(m) WHERE label CONTAINS '${keyword}')
   OR ANY(prop IN keys(n) WHERE toString(n[prop]) CONTAINS '${keyword}')
   OR ANY(prop IN keys(m) WHERE toString(m[prop]) CONTAINS '${keyword}')
RETURN path
LIMIT 100
      `.trim();
      console.log('Cypher query:', cypherQuery);
      const result = await executeNeo4jQuery(selectedDb, cypherQuery);
      console.log('Query result:', result);
      if (result && (result.nodes || []).length > 0) {
        setQueryResult(result);
        setQueryJson(JSON.stringify(result, null, 2));
        message.success(`Query executed successfully: found ${result.nodes.length} nodes and ${result.relationships.length} relationships`);
      } else {
        message.info('No results found for the given query');
        setQueryResult(null);
        setQueryJson('');
      }
    } catch (error) {
      console.error('Error executing query:', error);
      message.error('Failed to execute relationship query');
      
      setQueryResult(null);
      setQueryJson('');
    } finally {
      setQueryLoading(false);
    }
  };

  // D3 drag behavior
  const drag = (simulation: d3.Simulation<GraphNode, undefined>) => {
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return d3.drag<SVGCircleElement, GraphNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  };

  // Render D3 force-directed graph
  const renderGraph = () => {
    if (!svgRef.current || !queryResult) return;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();
    
    const svg = d3.select(svgRef.current);
    const width = graphContainerRef.current?.clientWidth || 800;
    const height = 600;
    
    // Prepare data for D3 with proper typing
    const graphData: GraphData = {
      nodes: queryResult.nodes.map(node => ({
        id: node.id,
        label: node.labels[0] || 'Unknown',
        properties: node.properties,
        // Add required SimulationNodeDatum properties
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0
      })),
      links: queryResult.relationships.map(rel => ({
        source: rel.startNodeId,
        target: rel.endNodeId,
        type: rel.type
      }))
    };
    
    // Create simulation
    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));
    
    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);
    
    // Create link labels
    const linkText = svg.append('g')
      .selectAll('text')
      .data(graphData.links)
      .enter()
      .append('text')
      .text(d => d.type)
      .attr('font-size', '8px')
      .attr('text-anchor', 'middle')
      .attr('fill', '#666');
    
    // Create nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(graphData.nodes)
      .enter()
      .append('circle')
      .attr('r', 20)
      .attr('fill', d => nodeColor(d.label));

    // Apply drag behavior
    node.call(drag(simulation) as any);
    
    // Create node labels
    const nodeText = svg.append('g')
      .selectAll('text')
      .data(graphData.nodes)
      .enter()
      .append('text')
      .text(d => {
        // Display the specific name from properties instead of generic "Table" label
        if (d.label === 'Table' && d.properties && d.properties.name) {
          return d.properties.name;
        } else if (d.label === 'Procedure' && d.properties && d.properties.name) {
          return d.properties.name;
        } else if (d.label === 'View' && d.properties && d.properties.name) {
          return d.properties.name;
        }
        return d.label;
      })
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dy', 30);
    
    // Add tooltips on hover
    node.append('title')
      .text(d => {
        const nameProperty = d.properties.name ? `Name: ${d.properties.name}\n` : '';
        return nameProperty + Object.entries(d.properties)
          .filter(([key]) => key !== 'name') // Filter out name as it's already shown first
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      });
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);
      
      linkText
        .attr('x', d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);
      
      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);
      
      nodeText
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });
  };
  
  // Helper function for node colors
  const nodeColor = (label: string): string => {
    // Simple hash function for consistent colors
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
    return color;
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

  // Relationship JSON format example
  const relationshipJsonExample = `{
  "employees.employee_id": "departments.department_id",
  "employees.manager_id": "employees.employee_id",
  "departments.manager_id": "employees.employee_id",
  "job_history.employee_id": "employees.employee_id",
  "job_history.department_id": "departments.department_id",
  "job_history.job_id": "jobs.job_id"
}`;

  // Handle manual database connection
  const handleManualConnect = async () => {
    if (!manualDbName || !manualDbAddress) {
      message.error('Please provide both database name and address');
      return;
    }

    try {
      setLoading(true);

      // In a real implementation, this would typically be an API call to register a new Neo4j connection
      // For now, we're creating a local database entry
      const newDb: DatabaseInfo = {
        name: manualDbName,
        address: manualDbAddress,
        role: 'primary',
        status: 'online',
        default: databases.length === 0
      };

      // In a production environment, this would be an API call
      // Example: await axios.post(`${API_BASE_URL}/neo4j/register-database`, { ...newDb, username: manualDbUsername, password: manualDbPassword }, { headers: getAuthHeaders() });
      
      // Add the new database to the list
      const updatedDatabases = [...databases, newDb];
      setDatabases(updatedDatabases);
      setSelectedDb(newDb.name);
      
      // Hide the manual connection form
      setShowManualConnect(false);
      
      // Show success message
      message.success(`Successfully connected to ${manualDbName}`);
    } catch (error) {
      console.error('Error connecting to database:', error);
      message.error('Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neo-container">
      <Card title={
        <Space>
          <DatabaseOutlined />
          <span>Neo4j Database Information</span>
        </Space>
      } className="neo-card">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Table
            columns={databaseColumns}
            dataSource={databases}
            rowKey="name"
            loading={loading}
            pagination={false}
            className="neo-table"
          />
          
          <div style={{ textAlign: 'right' }}>
            <Button 
              type="link" 
              onClick={() => setShowManualConnect(!showManualConnect)}
            >
              {showManualConnect ? 'Hide' : 'Manual Connect'}
            </Button>
          </div>
          
          {showManualConnect && (
            <Card className="neo-manual-connect">
              <Form layout="vertical">
                <Form.Item label="Database Name" required>
                  <Input 
                    value={manualDbName} 
                    onChange={(e) => setManualDbName(e.target.value)}
                    placeholder="e.g., my_graph_db" 
                  />
                </Form.Item>
                <Form.Item label="Database Address" required>
                  <Input 
                    value={manualDbAddress} 
                    onChange={(e) => setManualDbAddress(e.target.value)}
                    placeholder="e.g., neo4j://localhost:7687" 
                  />
                </Form.Item>
                <Form.Item label="Username">
                  <Input 
                    value={manualDbUsername} 
                    onChange={(e) => setManualDbUsername(e.target.value)}
                    placeholder="Default: neo4j" 
                  />
                </Form.Item>
                <Form.Item label="Password">
                  <Input.Password 
                    value={manualDbPassword} 
                    onChange={(e) => setManualDbPassword(e.target.value)}
                    placeholder="Enter password" 
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" onClick={handleManualConnect}>
                    Connect
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}
        </Space>
      </Card>
      
      <Tabs defaultActiveKey="1" className="neo-tabs">
        <TabPane 
          tab={
            <span>
              <SearchOutlined />
              Relationship Query
            </span>
          } 
          key="1"
        >
          <Card className="neo-card">
            <Form layout="vertical" className="neo-form">
              <Form.Item 
                label="Select Database" 
                required
                help="Select the database to query"
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
                label="Keyword" 
                required
                help="Enter a keyword to search for nodes and relationships"
              >
                <Input 
                  placeholder="Enter search keyword" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="neo-input"
                />
              </Form.Item>
              
              <Form.Item 
                label="Relationship Depth" 
                help="Select the depth of relationships to explore (1-5)"
              >
                <Slider
                  min={1}
                  max={5}
                  value={queryDepth}
                  onChange={(value) => setQueryDepth(value)}
                  marks={{ 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }}
                />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={executeQuery}
                  loading={queryLoading}
                  disabled={!selectedDb || !keyword}
                >
                  Execute Query
                </Button>
                <span style={{ marginLeft: '10px', color: '#888' }}>
                  {queryLoading ? 'Querying Neo4j database...' : 
                   queryResult ? `Found ${queryResult.nodes.length} nodes and ${queryResult.relationships.length} relationships` : ''}
                </span>
              </Form.Item>
            </Form>
            
            {queryResult && (
              <>
                <Divider>Visualization</Divider>
                <div 
                  ref={graphContainerRef} 
                  className="neo-graph-container"
                >
                  <svg
                    ref={svgRef}
                    width="100%"
                    height="600"
                    className="neo-graph"
                  />
                </div>
                
                <Divider>Raw JSON Data</Divider>
                <TextArea
                  value={queryJson}
                  rows={10}
                  readOnly
                  className="neo-json-result"
                />
              </>
            )}
          </Card>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <LinkOutlined />
              Relationship Import
            </span>
          } 
          key="2"
        >
          <Card 
            title="Import Relationship Data" 
            className="neo-card"
            extra={
              <Tooltip title="Relationship JSON Format Example">
                <InfoCircleOutlined className="neo-info-icon" />
              </Tooltip>
            }
          >
            <Form layout="vertical" className="neo-form">
              <Form.Item 
                label="Select Target Database" 
                required
                help="Select the database where you want to create relationships"
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
                label="Upload Relationship JSON File"
                help="Upload a JSON file containing relationship definitions"
              >
                <Upload {...relationshipUploadProps} className="neo-upload">
                  <Button icon={<UploadOutlined />} className="neo-button">
                    Click to Upload Relationship JSON
                  </Button>
                </Upload>
              </Form.Item>
              
              <Form.Item label="Relationship JSON Format Example">
                <TextArea
                  value={relationshipJsonExample}
                  rows={8}
                  readOnly
                  className="neo-json-example"
                />
              </Form.Item>
              
              {relationshipJson && (
                <Form.Item label="Relationship JSON Preview">
                  <TextArea
                    value={relationshipJson}
                    rows={6}
                    readOnly
                    className="neo-preview"
                  />
                </Form.Item>
              )}
              
              {cypherQueries.length > 0 && (
                <>
                  <Form.Item label="Generated Cypher Queries">
                    <TextArea
                      value={cypherQueries.join('\n\n')}
                      rows={10}
                      readOnly
                      className="neo-cypher-preview"
                    />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button
                      type="primary"
                      onClick={executeImport}
                      loading={importLoading}
                      className="neo-button"
                    >
                      Execute Import
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Neo4jManager; 