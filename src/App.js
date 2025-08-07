import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import tokenManager from './utils/tokenManager';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = tokenManager.getToken();
    if (token && tokenManager.hasValidToken()) {
      // You could verify the token with the backend here
      setUser({ token }); // For now, just set a basic user object
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    tokenManager.setToken(token);
    setUser(userData);
  };

  const handleLogout = () => {
    tokenManager.clearAll();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              user ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/login" 
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <Register />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;