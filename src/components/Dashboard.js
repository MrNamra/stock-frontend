import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LogOut, Search, TrendingUp, Filter, Star, StarOff, Settings, Plus, X } from 'lucide-react';
import { getFavoritesUrl, getCacheUrl, getSearchUrl, createAuthenticatedWebSocket } from '../config/config';
import apiClient from '../utils/axiosConfig';
import tokenManager from '../utils/tokenManager';
import StockChart from './StockChart';
import StockTradingModal from './StockTradingModal';
import StockSearch from './StockSearch';
import io from 'socket.io-client';

const Dashboard = ({ onLogout }) => {
  const [stocks, setStocks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [timeframe, setTimeframe] = useState('1d');

  // Default stocks to show
  const defaultStocks = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 
    'ICICIBANK.NS', 'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS'
  ];

  useEffect(() => {
    fetchFavorites();
    initializeSocket();
  }, []);

  const initializeSocket = () => {
    const token = tokenManager.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Create authenticated Socket.io connection
      const socket = createAuthenticatedWebSocket(token);
      
      socket.on('connect', () => {
        console.log('WebSocket connected, sending authentication...');
        setConnectionStatus('connecting');
        
        // Send authentication event with token
        socket.emit('auth', {
          token: socket._authToken
        });
      });

      socket.on('auth_success', (data) => {
        console.log('✅ WebSocket authentication successful');
        setConnectionStatus('connected');
      });

      socket.on('auth_error', (data) => {
        console.error('❌ WebSocket authentication failed:', data.message);
        setConnectionStatus('error');
        setLoading(false); // Set loading to false on auth error
      });

      socket.on('stockUpdate', (data) => {
        console.log('📊 Received stock update:', data);
        setStocks(data || []);
        setLoading(false); // Set loading to false when data is received
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionStatus('error');
        setLoading(false); // Set loading to false on connection error
      });

      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (loading) {
          console.log('⚠️ Loading timeout reached, showing dashboard anyway');
          setLoading(false);
        }
      }, 10000); // 10 seconds timeout

      return () => {
        clearTimeout(timeout);
        socket.disconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      setLoading(false); // Set loading to false on error
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await apiClient.get(getFavoritesUrl('GET_ALL'));
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const addToFavorites = async (symbol) => {
    try {
      await apiClient.post(getFavoritesUrl('ADD'), { symbol });
      await fetchFavorites();
    } catch (error) {
      console.error('Failed to add stock to favorites:', error);
    }
  };

  const removeFromFavorites = async (symbol) => {
    try {
      await apiClient.delete(getFavoritesUrl('DELETE', symbol));
      await fetchFavorites();
    } catch (error) {
      console.error('Failed to remove stock from favorites:', error);
    }
  };

  const handleToggleFavorite = (symbol) => {
    if (favorites.includes(symbol)) {
      removeFromFavorites(symbol);
    } else {
      addToFavorites(symbol);
    }
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const displayStocks = stocks.length > 0 ? stocks : defaultStocks.map(symbol => ({
    symbol,
    price: 'Loading...',
    change: '0.00',
    isPositive: true
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">StockTrade</span>
            </div>
            <Badge className={getConnectionStatusColor()}>
              {getConnectionStatusText()}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search stocks..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
              />
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Search Results */}
      {showSearch && (
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <StockSearch
            query={searchQuery}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onClose={() => setShowSearch(false)}
          />
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-semibold">Market Overview</span>
              </div>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="4h">4h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Favorites Section */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Favorites</h3>
              <div className="space-y-2">
                {favorites.map((symbol) => {
                  const stock = displayStocks.find(s => s.symbol === symbol);
                  return (
                    <div key={symbol} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="font-medium">{symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{stock?.price || 'N/A'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(symbol)}
                        >
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {favorites.length === 0 && (
                  <p className="text-sm text-slate-500">No favorites yet. Search and add stocks!</p>
                )}
              </div>
            </div>

            {/* All Stocks */}
            <div>
              <h3 className="font-semibold mb-2">All Stocks</h3>
              <div className="space-y-2">
                {displayStocks.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <span className="font-medium">{stock.symbol}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{stock.price}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(stock.symbol)}
                      >
                        {favorites.includes(stock.symbol) ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Welcome Message */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome to StockTrade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Real-time stock monitoring with advanced trading alerts and portfolio management.
                {connectionStatus !== 'connected' && (
                  <span className="text-red-500 ml-2">⚠️ Real-time updates may be limited</span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Stock Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayStocks.slice(0, 6).map((stock) => (
              <Card key={stock.symbol} className="relative">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {stock.symbol}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(stock.symbol)}
                      >
                        {favorites.includes(stock.symbol) ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>₹{stock.price}</span>
                      <span className={stock.isPositive ? 'text-green-600' : 'text-red-600'}>
                        {stock.isPositive ? '+' : ''}{stock.change}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStockClick(stock)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Trade
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <StockChart 
                      symbol={stock.symbol}
                      data={stock.detailedHistory || []}
                      timeframe={timeframe}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Trading Modal */}
      {selectedStock && (
        <StockTradingModal
          stock={selectedStock}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStock(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
