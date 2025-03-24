import React from 'react';
import './App.css';
import TopMenuBar from './components/TopMenuBar/TopMenuBar';
import ChatWindow from './components/ChatWindow/ChatWindow';
import Login from './components/Login/Login';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated, login } = useAuth();

  const handleLoginSuccess = (token: string, uuid: string) => {
    login(token, uuid);
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <>
          <TopMenuBar />
          <ChatWindow />
        </>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
