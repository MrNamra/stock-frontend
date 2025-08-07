// Example Configuration for Different Environments
// Copy this file and modify the values for your environment

const config = {
  // Development Environment
  DEV: {
    API: {
      BASE_URL: 'https://stock.happybilling.serv00.net',
    },
    WEBSOCKET: {
      URL: 'https://stock.happybilling.serv00.net',
    }
  },

  // Production Environment
  PROD: {
    API: {
      BASE_URL: 'https://stock.happybilling.serv00.net',
    },
    WEBSOCKET: {
      URL: 'https://stock.happybilling.serv00.net',
    }
  },

  // Staging Environment
  STAGING: {
    API: {
      BASE_URL: 'https://stock.happybilling.serv00.net',
    },
    WEBSOCKET: {
      URL: 'https://stock.happybilling.serv00.net',
    }
  }
};

// Usage Example:
// 1. Change the BASE_URL in config.js to your server URL
// 2. All components will automatically use the new URL
// 3. No need to update individual files

export default config; 