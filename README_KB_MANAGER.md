# Knowledge Base Management System

This module provides a comprehensive knowledge base management system with different user roles:

1. **User Role**: Access to chat interface for knowledge queries
2. **Knowledge Base Manager Role**: Access to knowledge base management tools
3. **Admin Role**: Access to user management for administering system users

## Features

### User (role: user)
- Chat interface for queries
- Standard user functionality

### Knowledge Base Manager (role: kb_manager)
- PostgreSQL management:
  - View table list
  - Execute SQL queries
  - Import SQL data
  - Export table data as CSV
- OpenSearch management:
  - View, create, and delete indices
  - Upload documents (Excel, Word, TXT)
  - Search within indices
- Neo4j management:
  - View database information
  - Upload JSON knowledge graph documents

### Admin (role: admin)
- User management:
  - View list of users
  - Create new users
  - Edit existing users
  - Delete users
  - Assign roles to users

## Usage

### Running the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Start the application:
   ```
   npm start
   ```

3. Login with one of the following test accounts:

   **Admin User:**
   - Username: `admin`
   - Password: `admin123`

   **Knowledge Base Manager:**
   - Username: `manager`
   - Password: `manager123`

   **Regular User:**
   - Username: `user`
   - Password: `user123`

The system will automatically detect the user's role and redirect to the appropriate interface.

## Mock Data

This implementation uses mock data for demonstration purposes. The mock data and API responses are stored in:

- `src/mock/postgres/` - PostgreSQL mock data
- `src/mock/opensearch/` - OpenSearch mock data
- `src/mock/neo4j/` - Neo4j mock data
- `src/mock/user-profiles.json` - Test user profiles with different roles

## API Documentation

See `api_doc.txt` for detailed API documentation. This document describes all the backend API endpoints required for this system.

## Implementation Details

- Built with React and TypeScript
- Uses Ant Design for UI components
- Each management component has isolated CSS with prefixed class names
- Role-based routing:
  - `user` role users are directed to the chat interface
  - `kb_manager` role users are directed to the knowledge base management interface
  - `admin` role users are directed to the user management interface

## Backend Integration

To connect this frontend to a real backend:

1. Remove the mock service initialization from `src/index.tsx`
2. Configure the axios requests in each component to point to your actual API endpoints
3. Implement the backend API according to the specifications in `api_doc.txt` 