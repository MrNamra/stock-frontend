class NotificationService {
  constructor() {
    this.permission = 'default';
    this.init();
  }

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      
      if (this.permission === 'default') {
        // Request permission when user first interacts
        document.addEventListener('click', () => {
          this.requestPermission();
        }, { once: true });
      }
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async showNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission denied');
        return false;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options
      });

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  async showStockAlert(alert) {
    const { symbol, alertType, targetPrice, message } = alert;
    
    const title = `📈 ${alertType.toUpperCase()} Alert: ${symbol}`;
    const body = `${message}\nTarget Price: ₹${targetPrice.toLocaleString()}`;
    
    return this.showNotification(title, {
      body,
      tag: `stock-alert-${symbol}-${alertType}`,
      data: { alert }
    });
  }

  async showPriceAlert(symbol, currentPrice, targetPrice, alertType) {
    const title = `💰 Price Alert: ${symbol}`;
    const body = `${alertType === 'buy' ? 'Buy' : 'Sell'} opportunity!\nCurrent: ₹${currentPrice.toLocaleString()}\nTarget: ₹${targetPrice.toLocaleString()}`;
    
    return this.showNotification(title, {
      body,
      tag: `price-alert-${symbol}`,
      data: { symbol, currentPrice, targetPrice, alertType }
    });
  }

  async showConnectionAlert(isConnected) {
    const title = isConnected ? '🟢 Connected' : '🔴 Disconnected';
    const body = isConnected 
      ? 'Stock data connection restored'
      : 'Lost connection to stock server';
    
    return this.showNotification(title, {
      body,
      tag: 'connection-status',
      requireInteraction: false
    });
  }

  // Check if notifications are supported and enabled
  isSupported() {
    return 'Notification' in window;
  }

  isEnabled() {
    return this.permission === 'granted';
  }

  // Get current permission status
  getPermissionStatus() {
    return this.permission;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService; 