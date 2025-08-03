import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config, { getPositionsUrl, getAlertsUrl } from '../config/config';
import tokenManager from '../utils/tokenManager';

const StockTradingModal = ({ stock, isOpen, onClose, onPositionUpdate }) => {
  const [activeTab, setActiveTab] = useState('position');
  const [position, setPosition] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Position form state
  const [positionForm, setPositionForm] = useState({
    quantity: '',
    purchasePrice: ''
  });

  // Alert form state
  const [alertForm, setAlertForm] = useState({
    alertType: 'buy',
    targetPrice: '',
    percentageChange: ''
  });

  useEffect(() => {
    if (isOpen && stock) {
      fetchPosition();
      fetchAlerts();
    }
  }, [isOpen, stock]);

  const fetchPosition = async () => {
    try {
      const token = tokenManager.getToken();
      const response = await axios.get(getPositionsUrl('GET_SYMBOL', stock.symbol), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosition(response.data.data);
      if (response.data.data) {
        setPositionForm({
          quantity: response.data.data.quantity.toString(),
          purchasePrice: response.data.data.purchasePrice.toString()
        });
      }
    } catch (error) {
      console.error('Error fetching position:', error);
      setPosition(null);
    }
  };

  const fetchAlerts = async () => {
    try {
      const token = tokenManager.getToken();
      const response = await axios.get(getAlertsUrl('GET_STOCK', stock.symbol), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    }
  };

  const handlePositionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = tokenManager.getToken();
      const response = await axios.post(getPositionsUrl('CREATE'), {
        symbol: stock.symbol,
        quantity: parseFloat(positionForm.quantity),
        purchasePrice: parseFloat(positionForm.purchasePrice)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPosition(response.data.data);
      onPositionUpdate && onPositionUpdate(response.data.data);
      setError('');
    } catch (error) {
      console.error('Error updating position:', error);
      setError(error.response?.data?.error || 'Failed to update position');
    } finally {
      setLoading(false);
    }
  };

  const handleAlertSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = tokenManager.getToken();
      const response = await axios.post(getAlertsUrl('CREATE'), {
        symbol: stock.symbol,
        alertType: alertForm.alertType,
        targetPrice: parseFloat(alertForm.targetPrice),
        percentageChange: alertForm.percentageChange ? parseFloat(alertForm.percentageChange) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAlerts([response.data.data, ...alerts]);
      setAlertForm({
        alertType: 'buy',
        targetPrice: '',
        percentageChange: ''
      });
      setError('');
    } catch (error) {
      console.error('Error creating alert:', error);
      setError(error.response?.data?.error || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      const token = tokenManager.getToken();
      await axios.delete(getAlertsUrl('DELETE', alertId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(alerts.filter(alert => alert._id !== alertId));
    } catch (error) {
      console.error('Error deleting alert:', error);
      setError('Failed to delete alert');
    }
  };

  const deletePosition = async () => {
    if (!window.confirm('Are you sure you want to delete this position?')) return;

    try {
      const token = tokenManager.getToken();
      await axios.delete(getPositionsUrl('DELETE', stock.symbol), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosition(null);
      setPositionForm({ quantity: '', purchasePrice: '' });
      onPositionUpdate && onPositionUpdate(null);
    } catch (error) {
      console.error('Error deleting position:', error);
      setError('Failed to delete position');
    }
  };

  const calculateProfitLoss = () => {
    if (!position || !stock.price) return { profitLoss: 0, percentage: 0 };
    
    const currentValue = position.quantity * stock.price;
    const profitLoss = currentValue - position.totalInvestment;
    const percentage = (profitLoss / position.totalInvestment) * 100;
    
    return { profitLoss, percentage };
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `${config.STOCKS.CURRENCY}${price.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 })}`;
  };

  if (!isOpen) return null;

  const { profitLoss, percentage } = calculateProfitLoss();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📈 {stock.symbol} - Trading</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'position' ? 'active' : ''}`}
            onClick={() => setActiveTab('position')}
          >
            💼 Position
          </button>
          <button 
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            🔔 Alerts
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {activeTab === 'position' && (
          <div className="modal-body">
            <div className="stock-info">
              <h3>{stock.name}</h3>
              <p className="current-price">Current Price: {formatPrice(stock.price)}</p>
            </div>

            {position ? (
              <div className="position-details">
                <h4>Your Position</h4>
                <div className="position-stats">
                  <div className="stat">
                    <span>Quantity:</span>
                    <span>{position.quantity}</span>
                  </div>
                  <div className="stat">
                    <span>Purchase Price:</span>
                    <span>{formatPrice(position.purchasePrice)}</span>
                  </div>
                  <div className="stat">
                    <span>Total Investment:</span>
                    <span>{formatPrice(position.totalInvestment)}</span>
                  </div>
                  <div className="stat">
                    <span>Current Value:</span>
                    <span>{formatPrice(position.quantity * stock.price)}</span>
                  </div>
                  <div className={`stat ${profitLoss >= 0 ? 'positive' : 'negative'}`}>
                    <span>Profit/Loss:</span>
                    <span>{formatPrice(profitLoss)} ({percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)</span>
                  </div>
                </div>
                <button 
                  className="btn btn-danger"
                  onClick={deletePosition}
                  style={{ marginTop: '16px' }}
                >
                  🗑️ Delete Position
                </button>
              </div>
            ) : (
              <div className="no-position">
                <p>You don't have a position in this stock yet.</p>
              </div>
            )}

            <form onSubmit={handlePositionSubmit} className="position-form">
              <h4>{position ? 'Update Position' : 'Add Position'}</h4>
              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  value={positionForm.quantity}
                  onChange={(e) => setPositionForm({...positionForm, quantity: e.target.value})}
                  placeholder="Enter quantity"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Purchase Price per Share:</label>
                <input
                  type="number"
                  value={positionForm.purchasePrice}
                  onChange={(e) => setPositionForm({...positionForm, purchasePrice: e.target.value})}
                  placeholder="Enter purchase price"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '🔄 Saving...' : (position ? 'Update Position' : 'Add Position')}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="modal-body">
            <div className="alerts-section">
              <h4>Create New Alert</h4>
              <form onSubmit={handleAlertSubmit} className="alert-form">
                <div className="form-group">
                  <label>Alert Type:</label>
                  <select
                    value={alertForm.alertType}
                    onChange={(e) => setAlertForm({...alertForm, alertType: e.target.value})}
                  >
                    <option value="buy">Buy Alert</option>
                    <option value="sell">Sell Alert</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Price:</label>
                  <input
                    type="number"
                    value={alertForm.targetPrice}
                    onChange={(e) => setAlertForm({...alertForm, targetPrice: e.target.value})}
                    placeholder="Enter target price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Percentage Change (Optional):</label>
                  <input
                    type="number"
                    value={alertForm.percentageChange}
                    onChange={(e) => setAlertForm({...alertForm, percentageChange: e.target.value})}
                    placeholder="Enter percentage"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '🔄 Creating...' : 'Create Alert'}
                </button>
              </form>
            </div>

            <div className="alerts-list">
              <h4>Your Alerts</h4>
              {alerts.length === 0 ? (
                <p>No alerts set for this stock.</p>
              ) : (
                alerts.map(alert => (
                  <div key={alert._id} className="alert-item">
                    <div className="alert-info">
                      <div className={`alert-type ${alert.alertType}`}>
                        {alert.alertType === 'buy' ? '🟢 Buy' : '🔴 Sell'}
                      </div>
                      <div className="alert-details">
                        <span>Target: {formatPrice(alert.targetPrice)}</span>
                        {alert.percentageChange && (
                          <span>({alert.percentageChange}%)</span>
                        )}
                      </div>
                      <div className="alert-status">
                        {alert.isTriggered ? '✅ Triggered' : '⏳ Active'}
                      </div>
                    </div>
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => deleteAlert(alert._id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTradingModal; 