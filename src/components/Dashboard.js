import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import tokenManager from '../utils/tokenManager';
import StockChart from './StockChart';
import StockTradingModal from './StockTradingModal';
import StockSearch from './StockSearch';
import notificationService from '../utils/notificationService';
import config, { getFavoritesUrl, getAlertsUrl } from '../config/config';

const Dashboard = ({ user }) => {
  const [stockData, setStockData] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [lastConnectionStatus, setLastConnectionStatus] = useState('disconnected');
  const socketRef = useRef(null);

  // Fetch user favorites
  const fetchFavorites = async () => {
    try {
      const response = await axios.get(getFavoritesUrl('GET'));
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  // Add stock to favorites
  const addToFavorites = async (symbol) => {
    try {
      await axios.post(getFavoritesUrl('ADD'), { symbol });
      await fetchFavorites();
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  };

  // Remove stock from favorites
  const removeFromFavorites = async (symbol) => {
    try {
      await axios.delete(getFavoritesUrl('DELETE', symbol));
      await fetchFavorites();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  // Handle stock added from search
  const handleStockAdded = async (symbol) => {
    await fetchFavorites();
    setShowSearch(false);
  };



  useEffect(() => {
    const token = tokenManager.getToken();
    if (!token) return;

    // Fetch initial favorites
    fetchFavorites();

    // Connect to WebSocket with token
    socketRef.current = io(config.WEBSOCKET.URL, {
      auth: { token },
      ...config.WEBSOCKET.OPTIONS
    });

    // On connect
    socketRef.current.on('connect', () => {
      console.log('✅ Connected to stock server');
      setConnectionStatus('connected');
      setError(null); // Clear any previous error messages
      setLoading(false);
      
      // Show connection notification if status changed
      if (lastConnectionStatus !== 'connected') {
        notificationService.showConnectionAlert(true);
      }
      setLastConnectionStatus('connected');
    });

    // Receive live stock data
    socketRef.current.on('stockUpdate', (data) => {
      console.log('📈 New stock update:', data.length, 'stocks');
      console.log('📊 Stock data sample:', data[0]); // Debug: log first stock data
      setStockData(data);
      setLoading(false);
      
      // Clear error message if we receive data successfully
      if (error) {
        setError(null);
      }

      // Check alerts with current prices
      const currentPrices = {};
      data.forEach(stock => {
        if (stock.price) {
          currentPrices[stock.symbol] = stock.price;
        }
      });
      
      // Alerts are now checked automatically by the backend service
      // No need for manual checking here
    });

    // On disconnect
    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from stock server');
      setConnectionStatus('disconnected');
      setError('Connection lost. Attempting to reconnect...');
      
      // Show disconnection notification
      if (lastConnectionStatus === 'connected') {
        notificationService.showConnectionAlert(false);
      }
      setLastConnectionStatus('disconnected');
    });

    // On reconnect attempt
    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      setConnectionStatus('connecting');
      setError(`Connection lost. Reconnecting... (Attempt ${attemptNumber})`);
    });

    // On reconnect
    socketRef.current.on('reconnect', () => {
      console.log('🔄 Reconnected to stock server');
      setConnectionStatus('connected');
      setError(null); // Clear error message on successful reconnect
    });

    // On connection error
    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionStatus('error');
      setError('Failed to connect to stock server');
      setLoading(false);
    });

    // Listen for notifications from server
    socketRef.current.on('notification', (notification) => {
      console.log('📢 Received notification:', notification);
      
      if (notification.type === 'stock_alert') {
        notificationService.showNotification(
          notification.title,
          notification.message
        );
      } else if (notification.type === 'connection_status') {
        notificationService.showConnectionAlert(notification.data.isConnected);
      } else {
        notificationService.showNotification(
          notification.title,
          notification.message
        );
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `${config.STOCKS.CURRENCY}${price.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChange = (current, previous) => {
    if (!current || !previous) return { value: 0, percentage: 0 };
    const change = current - previous;
    const percentage = (change / previous) * 100;
    return { value: change, percentage };
  };

  const getStockChange = (stock) => {
    if (!stock.last50daysAvg || stock.last50daysAvg.length < 2) {
      return { value: 0, percentage: 0 };
    }
    const current = stock.price;
    const previous = stock.last50daysAvg[stock.last50daysAvg.length - 2];
    return formatChange(current, previous);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <h2>🔄 Loading Stock Data...</h2>
          <p>Connecting to global cache server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📈 Stock Market Dashboard</h1>
        <div className="user-info">
          <p>Welcome, <strong>{user?.name || user?.email}</strong></p>
          <div className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' && '🟢 Live'}
            {connectionStatus === 'connecting' && '🟡 Connecting...'}
            {connectionStatus === 'disconnected' && '🔴 Offline'}
            {connectionStatus === 'error' && '🔴 Error'}
          </div>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? '📊 Hide Search' : '🔍 Search Stocks'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          {connectionStatus === 'error' && (
            <button 
              onClick={() => {
                if (socketRef.current) {
                  socketRef.current.disconnect();
                  socketRef.current.connect();
                }
              }}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              🔄 Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Stock Search Section */}
      {showSearch && (
        <div className="search-section">
          <StockSearch 
            onStockAdded={handleStockAdded} 
            favorites={favorites}
            onToggleFavorite={(symbol, isAdding) => {
              if (isAdding) {
                addToFavorites(symbol);
              } else {
                removeFromFavorites(symbol);
              }
            }}
          />
        </div>
      )}

      <div className="stock-grid">
        {stockData.map((stock) => {
          const change = getStockChange(stock);
          const isFavorite = favorites.includes(stock.symbol);
          
          return (
            <div key={stock.symbol} className={`stock-card ${change.value >= 0 ? 'positive' : 'negative'}`}>
              <div className="stock-header">
                <div className="stock-info">
                  <h3>{stock.symbol}</h3>
                  <p className="stock-name">{stock.name}</p>
                </div>
                <button
                  className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                  onClick={() => isFavorite ? removeFromFavorites(stock.symbol) : addToFavorites(stock.symbol)}
                >
                  {isFavorite ? '★' : '☆'}
                </button>
              </div>
              
              <div className="stock-price">
                <span className="price">{formatPrice(stock.price)}</span>
                <div className={`change ${change.value >= 0 ? 'positive' : 'negative'}`}>
                  {change.value >= 0 ? '+' : ''}{formatPrice(change.value)} ({change.percentage >= 0 ? '+' : ''}{change.percentage.toFixed(2)}%)
                </div>
              </div>

              <div className="stock-details">
                <div className="detail">
                  <span>SMA (50):</span>
                  <span>{formatPrice(stock.sma)}</span>
                </div>
              </div>

              {/* Trading Button */}
              <div className="trading-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedStock(stock);
                    setIsModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '12px',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  💼 Trade & Alerts
                </button>
              </div>

              {/* Stock Chart */}
              <div style={{ marginTop: '20px' }}>
                <StockChart stock={stock} height={config.STOCKS.CHART_HEIGHT} />
              </div>
            </div>
          );
        })}
      </div>

      {stockData.length === 0 && !loading && (
        <div className="no-data">
          <h3>No stock data available</h3>
          <p>Please check your connection or try refreshing the page.</p>
        </div>
      )}

      {/* Stock Trading Modal */}
      {selectedStock && (
        <StockTradingModal
          stock={selectedStock}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStock(null);
          }}
          onPositionUpdate={(position) => {
            // Handle position update if needed
            console.log('Position updated:', position);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
