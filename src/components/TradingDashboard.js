import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LogOut, Search, TrendingUp, Filter, Star, StarOff, Settings } from 'lucide-react';
import tokenManager from '../utils/tokenManager';
import { getFavoritesUrl, getCacheUrl } from '../config/config';
import apiClient from '../utils/axiosConfig';
import StockTradingModal from './StockTradingModal';
import io from 'socket.io-client';

const TradingDashboard = ({ onLogout }) => {
  const [selectedStocks, setSelectedStocks] = useState(['RELIANCE.NS']);
  const [timeframe, setTimeframe] = useState('1h');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tradingStocks = [
    'RELIANCE.NS',
    'TCS.NS',
    'HDFCBANK.NS',
    'INFY.NS',
    'ICICIBANK.NS',
    'HINDUNILVR.NS',
    'ITC.NS',
    'SBIN.NS',
    'BHARTIARTL.NS',
    'KOTAKBANK.NS',
  ];

  const filteredStocks = tradingStocks.filter((stock) => 
    stock.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStockToggle = (stock) => {
    setSelectedStocks((prev) => 
      prev.includes(stock) ? prev.filter((s) => s !== stock) : [...prev, stock]
    );
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

  const fetchStockData = async (symbol) => {
    try {
      const response = await apiClient.get(getCacheUrl('GET_STOCK', symbol));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      return null;
    }
  };

  const fetchAllStockData = async () => {
    const data = {};
    for (const stock of selectedStocks) {
      const stockInfo = await fetchStockData(stock);
      if (stockInfo) {
        data[stock] = stockInfo;
      }
    }
    setStockData(data);
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const token = tokenManager.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Create Socket.io connection
    // const socket = io('http://localhost:3001/', {
    const socket = io('https://stock.happybilling.serv00.net/', {
      transports: ['websocket'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setSocketConnected(true);
      // Send authentication
      socket.emit('auth', {
        token: token
      });
    });

    socket.on('auth_success', (data) => {
      console.log('✅ WebSocket authentication successful');
      setSocketConnected(true);
    });

    socket.on('auth_error', (data) => {
      console.error('❌ WebSocket authentication failed:', data.message);
      setSocketConnected(false);
      setLoading(false); // Set loading to false on auth error
    });

    socket.on('stockUpdate', (data) => {
      console.log('📊 Received stock update:', data);
      // Handle stock updates
      if (Array.isArray(data)) {
        const newStockData = {};
        data.forEach(stock => {
          newStockData[stock.symbol] = stock;
        });
        setStockData(newStockData);
        setLoading(false); // Set loading to false when data is received
      }
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket error:', error);
      setSocketConnected(false);
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
  }, []);

  // Fetch initial data and favorites
  useEffect(() => {
    const initializeData = async () => {
      await fetchFavorites();
      // Don't set loading to false here, let the socket handle it
      // await fetchAllStockData();
      // setLoading(false);
    };
    initializeData();
  }, []);

  // Refetch data when selected stocks change
  useEffect(() => {
    if (selectedStocks.length > 0) {
      fetchAllStockData();
    }
  }, [selectedStocks]);

  const getStockDisplayData = (symbol) => {
    const data = stockData[symbol];
    if (!data) {
      return {
        symbol,
        open: 'N/A',
        close: 'N/A',
        sma: 'N/A',
        change: '0.00',
        isPositive: true,
        price: 'N/A'
      };
    }

    const currentPrice = data.regularMarketPrice || data.price || 0;
    const openPrice = data.regularMarketOpen || data.open || currentPrice;
    const previousClose = data.regularMarketPreviousClose || data.previousClose || openPrice;
    const change = ((currentPrice - previousClose) / previousClose) * 100;
    const sma = data.sma50 || data.fiftyDayAverage || currentPrice;

    return {
      symbol,
      open: openPrice.toFixed(2),
      close: currentPrice.toFixed(2),
      sma: sma.toFixed(2),
      change: change.toFixed(2),
      isPositive: change >= 0,
      price: currentPrice.toFixed(2)
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading trading dashboard...</p>
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
            <Badge variant="secondary">Pro Trader</Badge>
            <Badge variant={socketConnected ? "default" : "destructive"}>
              {socketConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search stocks..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-semibold">Trading Stocks</span>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedStocks(filteredStocks.slice(0, 5))}
                >
                  Select 5
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedStocks([])}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {filteredStocks.map((stock) => (
                <Button
                  key={stock}
                  variant={selectedStocks.includes(stock) ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => handleStockToggle(stock)}
                >
                  <span>{stock}</span>
                  {selectedStocks.includes(stock) && (
                    <Badge variant="secondary" className="ml-2">
                      ✓
                    </Badge>
                  )}
                </Button>
              ))}
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
                Select stocks from the sidebar to view their charts and trading information.
                {!socketConnected && (
                  <span className="text-red-500 ml-2">⚠️ Real-time updates disconnected</span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div
            className={`gap-6 ${
              selectedStocks.length === 1 ? "grid grid-cols-1" : "grid grid-cols-1 lg:grid-cols-2"
            }`}
          >
            {selectedStocks.map((stock) => {
              const stockData = getStockDisplayData(stock);
              return (
                <Card key={stock} className={selectedStocks.length === 1 ? "w-full" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {stock} Chart
                      {selectedStocks.length === 1 && (
                        <Badge variant="outline" className="text-xs">
                          Full View
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(stock)}
                        className="ml-2"
                      >
                        {favorites.includes(stock) ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="w-32">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStock(stockData);
                          setIsModalOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      {selectedStocks.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStocks((prev) => prev.filter((s) => s !== stock))}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Stock Data Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm text-slate-600">Open</div>
                        <div className="text-lg font-semibold">₹{stockData.open}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-slate-600">Close</div>
                        <div className="text-lg font-semibold">₹{stockData.close}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-slate-600">SMA (50)</div>
                        <div className="text-lg font-semibold">₹{stockData.sma}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-slate-600">Change</div>
                        <div className={`text-lg font-semibold ${stockData.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {stockData.isPositive ? '+' : ''}{stockData.change}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Chart Placeholder */}
                    <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-500">Chart for {stock}</p>
                        <p className="text-sm text-slate-400">Timeframe: {timeframe}</p>
                        <div className="mt-2 text-xs text-slate-400">
                          <div>Open: ₹{stockData.open} • Close: ₹{stockData.close}</div>
                          <div>SMA (50): ₹{stockData.sma} • Change: {stockData.change}%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

export default TradingDashboard; 