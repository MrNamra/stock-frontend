import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Star, StarOff, X, TrendingUp, TrendingDown } from 'lucide-react';
import { getSearchUrl } from '../config/config';
import apiClient from '../utils/axiosConfig';

const StockSearch = ({ query, favorites, onToggleFavorite, onClose }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query && query.length >= 2) {
      searchStocks(query);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  const searchStocks = async (searchTerm) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.get(getSearchUrl('SEARCH', searchTerm));
      
      if (response.data.success) {
        setSearchResults(response.data.data || []);
      } else {
        setError('No results found');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search stocks');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (symbol) => {
    onToggleFavorite(symbol);
  };

  const getChangeColor = (change) => {
    if (!change) return 'text-gray-600';
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change) => {
    if (!change) return null;
    return change >= 0 ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Search Stocks</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Searching...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((stock) => (
            <Card key={stock.symbol} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{stock.symbol}</CardTitle>
                    <p className="text-sm text-gray-600">{stock.name}</p>
                  </div>
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
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-semibold">₹{stock.price || 'N/A'}</span>
                  </div>
                  {stock.change && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Change:</span>
                      <div className="flex items-center gap-1">
                        {getChangeIcon(stock.change)}
                        <span className={`font-semibold ${getChangeColor(stock.change)}`}>
                          {stock.change >= 0 ? '+' : ''}{stock.change}%
                        </span>
                      </div>
                    </div>
                  )}
                  {stock.marketCap && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Market Cap:</span>
                      <span className="text-sm">{stock.marketCap}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && query && query.length >= 2 && searchResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No stocks found for "{query}"</p>
          <p className="text-sm text-gray-500 mt-1">Try searching for a different term</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Start typing to search for stocks</p>
          <p className="text-sm text-gray-500 mt-1">Search by symbol or company name</p>
        </div>
      )}
    </div>
  );
};

export default StockSearch; 