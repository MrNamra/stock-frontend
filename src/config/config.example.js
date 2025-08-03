// Example Configuration for Different Environments
// Copy this file and modify the values for your environment

const config = {
  // Development Environment
  DEV: {
    API: {
      BASE_URL: 'http://localhost:3001',
    },
    WEBSOCKET: {
      URL: 'http://localhost:3001',
    }
  },

  // Production Environment
  PROD: {
    API: {
      BASE_URL: 'https://your-production-server.com',
    },
    WEBSOCKET: {
      URL: 'https://your-production-server.com',
    }
  },

  // Staging Environment
  STAGING: {
    API: {
      BASE_URL: 'https://your-staging-server.com',
    },
    WEBSOCKET: {
      URL: 'https://your-staging-server.com',
    }
  }
};

// Usage Example:
// 1. Change the BASE_URL in config.js to your server URL
// 2. All components will automatically use the new URL
// 3. No need to update individual files

export default config; 