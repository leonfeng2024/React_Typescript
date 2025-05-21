// API Configuration
interface ApiConfig {
  protocol: string;
  host: string;
  port: number | null;
  basePath: string;
}

// environment configuration
const environments = {
  development: {
    protocol: 'http',
    host: 'bibot',
    port: 80,
    basePath: '/api'
  },
  production: {
    protocol: 'http',
    host: 'localhost',
    port: 80,
    basePath: '/api'
  },
  docker_deploy: {
    protocol: 'http',
    host: 'localhost',
    port: 8088,
    basePath: '/api'
  }
};

// determine the current environment
const currentEnv = 'development';
const config: ApiConfig = environments[currentEnv as keyof typeof environments];

// generate the complete API URL
export const getApiUrl = (path: string = ''): string => {
  const { protocol, host, port, basePath } = config;
  const portString = port ? `:${port}` : '';
  const baseUrl = `${protocol}://${host}${portString}${basePath}`;
  return path ? `${baseUrl}${path.startsWith('/') ? path : `/${path}`}` : baseUrl;
};

// API endpoints for each service
export const apiEndpoints = {
  auth: {
    login: '/token',
    logout: '/logout'
  },
  chat: {
    send: '/chat'
  },
  postgres: {
    tables: '/postgres/tables',
    execute: '/postgres/execute',
    import: '/postgres/import',
    export: (table: string) => `/postgres/export/${table}`
  },
  opensearch: {
    indices: '/opensearch/indices',
    search: '/opensearch/search',
    upload: '/opensearch/upload',
    deleteIndex: (index: string) => `/opensearch/indices/${index}`,
    status: '/kb/opensearch/status'
  },
  neo4j: {
    databases: '/neo4j/databases',
    upload: '/neo4j/upload',
    executeQuery: '/neo4j/execute-query',
    executeQueries: '/neo4j/execute-queries'
  },
  user: {
    profile: '/user/profile',
    list: '/admin/users',
    create: '/admin/users',
    update: (id: number | string) => `/admin/users/${id}`,
    delete: (id: number | string) => `/admin/users/${id}`
  },
  kb: {
    sqlUpload: '/kb/sql/upload',
    excelUpload: '/kb/excel/upload',
    docStatus: '/kb/doc/status',
    deleteDocument: '/kb/dataset/delete',
    opensearchUpload: '/kb/openserch/upload',
    opensearchDelete: '/kb/opensearch/delete'
  }
};

// API request timeout configuration (milliseconds)
export const apiTimeouts = {
  default: 30000, // 30 seconds
  chat: 5 * 60 * 1000, // 5 minutes
  upload: 2 * 60 * 1000 // 2 minutes
};

// export the default API configuration
export default {
  apiConfig: config,
  getApiUrl,
  apiEndpoints,
  apiTimeouts
}; 