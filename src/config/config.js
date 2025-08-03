// Global Configuration for Stock Market App
const config = {
  // API Configuration
  API: {
    BASE_URL: 'http://localhost:3001',
    ENDPOINTS: {
      AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        CHECK: '/api/auth/check'
      },
      FAVORITES: {
        GET: '/api/favorites',
        ADD: '/api/favorites/add',
        DELETE: (symbol) => `/api/favorites/remove/${symbol}`
      },
      CACHE: {
        HEALTH: '/api/cache/health',
        STATS: '/api/cache/stats',
        STOCKS: '/api/cache/stocks',
        UPDATE: (symbol) => `/api/cache/update/${symbol}`,
        CLEAR: '/api/cache/clear'
      },
      POSITIONS: {
        GET: '/api/positions',
        GET_SYMBOL: (symbol) => `/api/positions/${symbol}`,
        CREATE: '/api/positions',
        DELETE: (symbol) => `/api/positions/${symbol}`,
        SUMMARY: '/api/positions/summary'
      },
        ALERTS: {
    GET: '/api/alerts',
    GET_STOCK: (symbol) => `/api/alerts/stock/${symbol}`,
    CREATE: '/api/alerts',
    UPDATE: (alertId) => `/api/alerts/${alertId}`,
    DELETE: (alertId) => `/api/alerts/${alertId}`,
    NOTIFY: (alertId) => `/api/alerts/${alertId}/notify`
  },
      SEARCH: {
        SEARCH: '/api/search/search',
        DETAILS: (symbol) => `/api/search/details/${symbol}`,
        VALIDATE: (symbol) => `/api/search/validate/${symbol}`
      }
    }
  },

  // WebSocket Configuration
  WEBSOCKET: {
    URL: 'http://localhost:3001',
    OPTIONS: {
      transports: ['websocket'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    }
  },

  // App Configuration
  APP: {
    NAME: 'Stock Market Dashboard',
    VERSION: '1.0.0',
    DESCRIPTION: 'Real-time Indian Stock Market Dashboard with Global Cache',
    AUTHOR: 'Stock Market Team'
  },

  // Stock Configuration
  STOCKS: {
    DEFAULT_SYMBOLS: [
      'RELIANCE.NS',
      'TCS.NS', 
      'INFY.NS',
      'HDFCBANK.NS',
      'ICICIBANK.NS',
      'HINDUNILVR.NS',
      'SBIN.NS',
      'BHARTIARTL.NS',
      'ITC.NS',
      'LT.NS'
    ],
    CURRENCY: '₹',
    LOCALE: 'en-IN',
    UPDATE_INTERVAL: 5000, // 5 seconds
    CHART_HEIGHT: 250
  },

  // UI Configuration
  UI: {
    THEME: {
      PRIMARY_COLOR: '#2563eb',
      SUCCESS_COLOR: '#10b981',
      ERROR_COLOR: '#ef4444',
      WARNING_COLOR: '#f59e0b',
      BACKGROUND_GRADIENT: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    CHART: {
      COLORS: {
        POSITIVE: '#10b981',
        NEGATIVE: '#ef4444',
        NEUTRAL: '#6b7280'
      },
      TYPES: ['line', 'area', 'bar']
    }
  },

  // Development Configuration
  DEV: {
    DEBUG: process.env.NODE_ENV === 'development',
    LOG_LEVEL: 'info',
    ENABLE_MOCK_DATA: false
  }
};

// Helper functions for API URLs
export const getApiUrl = (endpoint) => {
  return `${config.API.BASE_URL}${endpoint}`;
};

export const getAuthUrl = (endpoint) => {
  return getApiUrl(config.API.ENDPOINTS.AUTH[endpoint]);
};

export const getFavoritesUrl = (endpoint, symbol = null) => {
  const baseEndpoint = config.API.ENDPOINTS.FAVORITES[endpoint];
  if (typeof baseEndpoint === 'function') {
    return getApiUrl(baseEndpoint(symbol));
  }
  return getApiUrl(baseEndpoint);
};

export const getCacheUrl = (endpoint, symbol = null) => {
  const baseEndpoint = config.API.ENDPOINTS.CACHE[endpoint];
  if (typeof baseEndpoint === 'function') {
    return getApiUrl(baseEndpoint(symbol));
  }
  return getApiUrl(baseEndpoint);
};

export const getPositionsUrl = (endpoint, symbol = null) => {
  const baseEndpoint = config.API.ENDPOINTS.POSITIONS[endpoint];
  if (typeof baseEndpoint === 'function') {
    return getApiUrl(baseEndpoint(symbol));
  }
  return getApiUrl(baseEndpoint);
};

export const getAlertsUrl = (endpoint, alertId = null) => {
  const baseEndpoint = config.API.ENDPOINTS.ALERTS[endpoint];
  if (typeof baseEndpoint === 'function') {
    return getApiUrl(baseEndpoint(alertId));
  }
  return getApiUrl(baseEndpoint);
};

export const getSearchUrl = (endpoint, symbol = null) => {
  const baseEndpoint = config.API.ENDPOINTS.SEARCH[endpoint];
  if (typeof baseEndpoint === 'function') {
    return getApiUrl(baseEndpoint(symbol));
  }
  return getApiUrl(baseEndpoint);
};

export default config; 