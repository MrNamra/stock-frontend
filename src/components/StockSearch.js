import React, { useState } from 'react';
import axios from 'axios';
import config, { getFavoritesUrl, getSearchUrl } from '../config/config';
import tokenManager from '../utils/tokenManager';

const StockSearch = ({ onStockAdded, favorites = [], onToggleFavorite }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchStocks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Search using Yahoo Finance API
      const response = await axios.get(getSearchUrl('SEARCH'), {
        params: { q: query },
        headers: { 
          Authorization: `Bearer ${tokenManager.getToken()}` 
        }
      });

      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setError('Failed to search stocks. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchStocks(searchQuery);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear results if input is empty
    if (!value.trim()) {
      setSearchResults([]);
      setError('');
    }
  };

  const toggleFavorite = async (symbol) => {
    try {
      const isCurrentlyFavorite = favorites.includes(symbol);
      
      if (isCurrentlyFavorite) {
        // Remove from favorites
        await axios.delete(getFavoritesUrl('DELETE', symbol), {
          headers: { 
            Authorization: `Bearer ${tokenManager.getToken()}` 
          }
        });
      } else {
        // Add to favorites
        await axios.post(getFavoritesUrl('ADD'), { symbol }, {
          headers: { 
            Authorization: `Bearer ${tokenManager.getToken()}` 
          }
        });
      }
      
      // Notify parent component
      onToggleFavorite && onToggleFavorite(symbol, !isCurrentlyFavorite);
      
      // Show success message
      setError('');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError('Failed to update favorites. Please try again.');
    }
  };

  const isInFavorites = (symbol) => {
    return favorites.includes(symbol);
  };

  return (
    <div className="stock-search">
      <div className="search-header">
        <h3>🔍 Search Stocks</h3>
        <p>Search for stocks by name or symbol and toggle them in your favorites</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search stocks (e.g., Apple, AAPL, Reliance, RELIANCE.NS)"
            className="search-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="search-btn"
            disabled={loading || !searchQuery.trim()}
          >
            {loading ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>Search Results ({searchResults.length})</h4>
          <div className="results-grid">
            {searchResults.map((stock) => (
              <div key={stock.symbol} className="result-card">
                <div className="stock-info">
                  <h5>{stock.symbol}</h5>
                  <p className="stock-name">{stock.name}</p>
                  {stock.price && (
                    <p className="stock-price">
                      {config.STOCKS.CURRENCY}{stock.price.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <div className="stock-actions">
                  <button
                    onClick={() => toggleFavorite(stock.symbol)}
                    className={`favorite-btn ${isInFavorites(stock.symbol) ? 'active' : ''}`}
                  >
                    {isInFavorites(stock.symbol) ? '★' : '☆'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchQuery && !loading && searchResults.length === 0 && !error && (
        <div className="no-results">
          <p>No stocks found for "{searchQuery}"</p>
          <p className="search-tips">
            <strong>Search tips:</strong>
            <br />• Try searching by company name (e.g., "Apple", "Reliance")
            <br />• Try searching by symbol (e.g., "AAPL", "RELIANCE.NS")
            <br />• For Indian stocks, add ".NS" suffix (e.g., "RELIANCE.NS")
            <br />• For US stocks, use symbol directly (e.g., "AAPL", "GOOGL")
          </p>
        </div>
      )}
    </div>
  );
};

export default StockSearch; 