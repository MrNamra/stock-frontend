import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { X, Plus, Trash2, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { getAlertsUrl, getPositionsUrl } from '../config/config';
import apiClient from '../utils/axiosConfig';
import tokenManager from '../utils/tokenManager';

const StockTradingModal = ({ stock, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('position');
  const [position, setPosition] = useState({
    quantity: '',
    purchasePrice: '',
    totalInvestment: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({
    alertType: 'buy',
    condition: 'price_target',
    targetPrice: '',
    percentageChange: '',
    basePrice: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && stock) {
      fetchPosition();
      fetchAlerts();
    }
  }, [isOpen, stock]);

  const fetchPosition = async () => {
    try {
      const response = await apiClient.get(getPositionsUrl('GET_STOCK', stock.symbol));
      if (response.data.success && response.data.data) {
        setPosition({
          quantity: response.data.data.quantity.toString(),
          purchasePrice: response.data.data.purchasePrice.toString(),
          totalInvestment: response.data.data.totalInvestment
        });
      } else {
        setPosition({ quantity: '', purchasePrice: '', totalInvestment: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch position:', error);
      setPosition({ quantity: '', purchasePrice: '', totalInvestment: 0 });
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await apiClient.get(getAlertsUrl('GET_STOCK', stock.symbol));
      if (response.data.success) {
        setAlerts(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([]);
    }
  };

  const savePosition = async () => {
    if (!position.quantity || !position.purchasePrice) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const totalInvestment = parseFloat(position.quantity) * parseFloat(position.purchasePrice);
      const response = await apiClient.post(getPositionsUrl('CREATE_UPDATE'), {
        symbol: stock.symbol,
        quantity: parseInt(position.quantity),
        purchasePrice: parseFloat(position.purchasePrice),
        totalInvestment
      });

      if (response.data.success) {
        setMessage('Position saved successfully!');
        setPosition({ ...position, totalInvestment });
      }
    } catch (error) {
      setMessage('Failed to save position: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const addAlert = async () => {
    if (!newAlert.targetPrice && !newAlert.percentageChange) {
      setMessage('Please enter either target price or percentage change');
      return;
    }

    setLoading(true);
    try {
      const alertData = {
        symbol: stock.symbol,
        alertType: newAlert.alertType,
        condition: newAlert.condition,
        targetPrice: newAlert.targetPrice ? parseFloat(newAlert.targetPrice) : 0,
        percentageChange: newAlert.percentageChange ? parseFloat(newAlert.percentageChange) : 0,
        basePrice: newAlert.basePrice ? parseFloat(newAlert.basePrice) : stock.price
      };

      const response = await apiClient.post(getAlertsUrl('CREATE'), alertData);
      
      if (response.data.success) {
        setMessage('Alert created successfully!');
        setNewAlert({
          alertType: 'buy',
          condition: 'price_target',
          targetPrice: '',
          percentageChange: '',
          basePrice: ''
        });
        fetchAlerts(); // Refresh alerts list
      }
    } catch (error) {
      setMessage('Failed to create alert: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      const response = await apiClient.delete(getAlertsUrl('DELETE', alertId));
      if (response.data.success) {
        setMessage('Alert deleted successfully!');
        fetchAlerts(); // Refresh alerts list
      }
    } catch (error) {
      setMessage('Failed to delete alert: ' + (error.response?.data?.error || error.message));
    }
  };

  const getAlertTypeIcon = (alertType) => {
    switch (alertType) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stop_loss':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case 'take_profit':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertTypeColor = (alertType) => {
    switch (alertType) {
      case 'buy':
        return 'bg-green-100 text-green-800';
      case 'sell':
        return 'bg-red-100 text-red-800';
      case 'stop_loss':
        return 'bg-orange-100 text-orange-800';
      case 'take_profit':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !stock) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{stock.symbol} Trading & Alerts</h2>
            <p className="text-gray-600">Current Price: ₹{stock.price}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 mx-6 mt-4 rounded-lg ${
            message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="position">Position</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Position Tab */}
          <TabsContent value="position" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stock Position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity (Shares)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={position.quantity}
                      onChange={(e) => {
                        const quantity = e.target.value;
                        const purchasePrice = position.purchasePrice;
                        const totalInvestment = quantity && purchasePrice 
                          ? parseFloat(quantity) * parseFloat(purchasePrice) 
                          : 0;
                        setPosition({ ...position, quantity, totalInvestment });
                      }}
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      value={position.purchasePrice}
                      onChange={(e) => {
                        const purchasePrice = e.target.value;
                        const quantity = position.quantity;
                        const totalInvestment = quantity && purchasePrice 
                          ? parseFloat(quantity) * parseFloat(purchasePrice) 
                          : 0;
                        setPosition({ ...position, purchasePrice, totalInvestment });
                      }}
                      placeholder="Enter purchase price"
                    />
                  </div>
                </div>
                <div>
                  <Label>Total Investment</Label>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{position.totalInvestment.toFixed(2)}
                  </div>
                </div>
                <Button onClick={savePosition} disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Save Position'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {/* Create New Alert */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Alert</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alertType">Alert Type</Label>
                    <Select value={newAlert.alertType} onValueChange={(value) => setNewAlert({...newAlert, alertType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy Alert</SelectItem>
                        <SelectItem value="sell">Sell Alert</SelectItem>
                        <SelectItem value="stop_loss">Stop Loss</SelectItem>
                        <SelectItem value="take_profit">Take Profit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <Select value={newAlert.condition} onValueChange={(value) => setNewAlert({...newAlert, condition: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price_target">Price Target</SelectItem>
                        <SelectItem value="percentage_gain">Percentage Gain</SelectItem>
                        <SelectItem value="percentage_loss">Percentage Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newAlert.condition === 'price_target' ? (
                    <div>
                      <Label htmlFor="targetPrice">Target Price (₹)</Label>
                      <Input
                        id="targetPrice"
                        type="number"
                        step="0.01"
                        value={newAlert.targetPrice}
                        onChange={(e) => setNewAlert({...newAlert, targetPrice: e.target.value})}
                        placeholder="Enter target price"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="percentageChange">Percentage Change (%)</Label>
                      <Input
                        id="percentageChange"
                        type="number"
                        step="0.01"
                        value={newAlert.percentageChange}
                        onChange={(e) => setNewAlert({...newAlert, percentageChange: e.target.value})}
                        placeholder="Enter percentage"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="basePrice">Base Price (₹)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      value={newAlert.basePrice}
                      onChange={(e) => setNewAlert({...newAlert, basePrice: e.target.value})}
                      placeholder={stock.price.toString()}
                    />
                  </div>
                </div>

                <Button onClick={addAlert} disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Alert'}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts ({alerts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No alerts set for this stock</p>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getAlertTypeIcon(alert.alertType)}
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={getAlertTypeColor(alert.alertType)}>
                                {alert.alertType.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span className="font-medium">{alert.condition.replace('_', ' ')}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {alert.condition === 'price_target' 
                                ? `Target: ₹${alert.targetPrice}`
                                : `${alert.percentageChange}% change from ₹${alert.basePrice}`
                              }
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlert(alert._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StockTradingModal; 