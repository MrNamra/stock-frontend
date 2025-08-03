// Token Management Utility
class TokenManager {
  constructor() {
    this.storageKey = 'stock_market_token';
    this.userKey = 'stock_market_user';
  }

  // Simple encryption key (in production, use environment variables)
  getEncryptionKey() {
    return 'stock-market-secure-key-2024';
  }

  // Simple encryption (for demo purposes - use proper encryption in production)
  encrypt(data) {
    try {
      const encoded = btoa(JSON.stringify(data));
      return encoded;
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  // Simple decryption (for demo purposes - use proper decryption in production)
  decrypt(encryptedData) {
    try {
      const decoded = atob(encryptedData);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  // Store token securely
  setToken(token) {
    try {
      const encrypted = this.encrypt(token);
      if (encrypted) {
        localStorage.setItem(this.storageKey, encrypted);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to store token:', error);
      return false;
    }
  }

  // Get token securely
  getToken() {
    try {
      const encrypted = localStorage.getItem(this.storageKey);
      if (encrypted) {
        return this.decrypt(encrypted);
      }
      return null;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  // Store user data
  setUser(user) {
    try {
      const encrypted = this.encrypt(user);
      if (encrypted) {
        localStorage.setItem(this.userKey, encrypted);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to store user:', error);
      return false;
    }
  }

  // Get user data
  getUser() {
    try {
      const encrypted = localStorage.getItem(this.userKey);
      if (encrypted) {
        return this.decrypt(encrypted);
      }
      return null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  // Clear all stored data
  clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.userKey);
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  // Check if token exists and is valid
  hasValidToken() {
    const token = this.getToken();
    return token && typeof token === 'string' && token.length > 0;
  }

  // Get token age (for checking expiration)
  getTokenAge() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      // Extract timestamp from JWT token (if available)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        return Date.now() - (payload.exp * 1000);
      }
    } catch (error) {
      // If we can't parse the token, assume it's valid
      return 0;
    }
    
    return 0;
  }

  // Check if token is expired (24 hours)
  isTokenExpired() {
    const age = this.getTokenAge();
    if (age === null) return true;
    
    // Consider token expired after 24 hours
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return age > maxAge;
  }
}

// Create singleton instance
const tokenManager = new TokenManager();

export default tokenManager; 