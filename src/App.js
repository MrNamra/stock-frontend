import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import tokenManager from './utils/tokenManager';
import config, { getAuthUrl } from './config/config';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a valid token
        if (tokenManager.hasValidToken() && !tokenManager.isTokenExpired()) {
          const token = tokenManager.getToken();
          
          // Set default authorization header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Try to validate token with server
          try {
            const response = await axios.get(getAuthUrl('CHECK'));
            setUser(response.data.user);
            // Update stored user data
            tokenManager.setUser(response.data.user);
          } catch (serverError) {
            console.error('Server validation failed:', serverError);
            // Token might be invalid, clear everything
            tokenManager.clearAll();
            delete axios.defaults.headers.common['Authorization'];
          }
        } else {
          // Token is expired or invalid, clear everything
          tokenManager.clearAll();
          delete axios.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        tokenManager.clearAll();
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Update axios headers when user changes
  useEffect(() => {
    if (user) {
      const token = tokenManager.getToken();
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  const handleLogin = (userData, token) => {
    setUser(userData);
    tokenManager.setToken(token);
    tokenManager.setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    setUser(null);
    tokenManager.clearAll();
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: config.UI.THEME.BACKGROUND_GRADIENT
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '12px', 
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2>🔄 Loading...</h2>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} setUser={setUser} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;