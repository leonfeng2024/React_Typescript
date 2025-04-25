import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import 'antd/dist/reset.css';
import initMockAPI from './services/mockService';
import AntdCompatProvider from './antd-compat';

// Initialize mock API endpoints
initMockAPI();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AntdCompatProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AntdCompatProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
