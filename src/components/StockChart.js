import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import config from '../config/config';

const StockChart = ({ stock, height = 300 }) => {
  const [chartType, setChartType] = useState('line');

  // Prepare chart data from stock's detailed history
  const chartData = useMemo(() => {
    if (!stock || !stock.detailedHistory || stock.detailedHistory.length === 0) {
      // If no detailed history, fallback to simple data
      if (stock && stock.last50daysAvg && stock.last50daysAvg.length > 0) {
        return stock.last50daysAvg.map((price, index) => {
          const date = new Date(Date.now() - (stock.last50daysAvg.length - index - 1) * 24 * 60 * 60 * 1000);
          return {
            day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: price,
            sma: stock.sma || 0,
            date: date.toLocaleDateString()
          };
        });
      }
      
      // If no historical data at all, create a simple chart with current price
      if (stock && stock.price) {
        const today = new Date();
        return [
          { 
            day: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
            price: stock.price, 
            sma: stock.sma || stock.price,
            date: today.toLocaleDateString() 
          }
        ];
      }
      return [];
    }

    return stock.detailedHistory.map((bar, index) => {
      const date = new Date(bar.date);
      return {
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: bar.close,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        volume: bar.volume,
        sma: bar.sma || 0,
        date: date.toLocaleDateString()
      };
    });
  }, [stock]);

  // Get reference prices for lines
  const referencePrices = useMemo(() => {
    if (!chartData || chartData.length === 0) return {};
    
    const currentDay = chartData[chartData.length - 1];
    const yesterday = chartData[chartData.length - 2];
    const twoDaysAgo = chartData[chartData.length - 3];
    
    return {
      currentOpen: currentDay?.open || currentDay?.price,
      yesterdayClose: yesterday?.price,
      twoDaysAgoClose: twoDaysAgo?.price
    };
  }, [chartData]);

  // Calculate price change
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return { value: 0, percentage: 0 };
    
    const currentPrice = chartData[chartData.length - 1]?.price || 0;
    const previousPrice = chartData[chartData.length - 2]?.price || 0;
    
    if (previousPrice === 0) return { value: 0, percentage: 0 };
    
    const change = currentPrice - previousPrice;
    const percentage = (change / previousPrice) * 100;
    
    return { value: change, percentage };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const priceData = payload.find(p => p.dataKey === 'price');
      const smaData = payload.find(p => p.dataKey === 'sma');
      const openData = payload.find(p => p.dataKey === 'open');
      
      return (
        <div style={{
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          color: '#f9fafb',
          minWidth: '200px'
        }}>
          <p style={{ 
            margin: '0 0 12px 0', 
            fontWeight: 'bold', 
            fontSize: '14px',
            color: '#ffffff',
            borderBottom: '1px solid #374151',
            paddingBottom: '8px'
          }}>
            {label}
          </p>
          {priceData && (
            <p style={{ margin: '0 0 6px 0', color: '#d1d5db', fontSize: '13px' }}>
              Close: <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>
                {config.STOCKS.CURRENCY}{priceData.value?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 })}
              </span>
            </p>
          )}
          {openData && (
            <p style={{ margin: '0 0 6px 0', color: '#d1d5db', fontSize: '13px' }}>
              Open: <span style={{ fontWeight: 'bold', color: '#a78bfa' }}>
                {config.STOCKS.CURRENCY}{openData.value?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 })}
              </span>
            </p>
          )}
          {smaData && (
            <p style={{ margin: '0 0 6px 0', color: '#d1d5db', fontSize: '13px' }}>
              SMA (50): <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>
                {config.STOCKS.CURRENCY}{smaData.value?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 })}
              </span>
            </p>
          )}
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            borderTop: '1px solid #374151',
            backgroundColor: '#111827',
            borderRadius: '6px',
            padding: '8px'
          }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#a78bfa' }}>
              Today's Open: {config.STOCKS.CURRENCY}{referencePrices.currentOpen?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 })}
            </p>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#22d3ee' }}>
              Yesterday Close: {config.STOCKS.CURRENCY}{referencePrices.yesterdayClose?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 })}
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#a3e635' }}>
              2 Days Ago Close: {config.STOCKS.CURRENCY}{referencePrices.twoDaysAgoClose?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get chart color based on price change
  const getChartColor = () => {
    return priceChange.value >= 0 ? config.UI.CHART.COLORS.POSITIVE : config.UI.CHART.COLORS.NEGATIVE;
  };

  // Render different chart types
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    // If only one data point (current price), show a simple bar with SMA line
    if (chartData.length === 1) {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="day" 
            stroke="#64748b" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `${config.STOCKS.CURRENCY}${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="price" 
            fill={getChartColor()}
            radius={[4, 4, 0, 0]}
            name="Price"
          />
          <Line 
            type="monotone" 
            dataKey="sma" 
            stroke="#f59e0b" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="SMA (50)"
          />
          {referencePrices.currentOpen && (
            <Line 
              type="monotone" 
              dataKey={() => referencePrices.currentOpen}
              stroke="#8b5cf6" 
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="Today's Open"
            />
          )}
          {referencePrices.yesterdayClose && (
            <Line 
              type="monotone" 
              dataKey={() => referencePrices.yesterdayClose}
              stroke="#06b6d4" 
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="Yesterday Close"
            />
          )}
          {referencePrices.twoDaysAgoClose && (
            <Line 
              type="monotone" 
              dataKey={() => referencePrices.twoDaysAgoClose}
              stroke="#84cc16" 
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="2 Days Ago Close"
            />
          )}
        </BarChart>
      );
    }

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="day" 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${config.STOCKS.CURRENCY}${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={getChartColor()} 
              fill={getChartColor()}
              fillOpacity={0.3}
              strokeWidth={2}
              name="Price"
            />
            <Line 
              type="monotone" 
              dataKey="sma" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="SMA (50)"
            />
            {referencePrices.currentOpen && (
              <Line 
                type="monotone" 
                dataKey={() => referencePrices.currentOpen}
                stroke="#8b5cf6" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Today's Open"
              />
            )}
            {referencePrices.yesterdayClose && (
              <Line 
                type="monotone" 
                dataKey={() => referencePrices.yesterdayClose}
                stroke="#06b6d4" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Yesterday Close"
              />
            )}
            {referencePrices.twoDaysAgoClose && (
              <Line 
                type="monotone" 
                dataKey={() => referencePrices.twoDaysAgoClose}
                stroke="#84cc16" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="2 Days Ago Close"
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="day" 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${config.STOCKS.CURRENCY}${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="price" 
              fill={getChartColor()}
              radius={[4, 4, 0, 0]}
              name="Price"
            />
            <Line 
              type="monotone" 
              dataKey="sma" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="SMA (50)"
            />
            {referencePrices.currentOpen && (
              <Line 
                type="monotone" 
                dataKey={() => referencePrices.currentOpen}
                stroke="#8b5cf6" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Today's Open"
              />
            )}
            {referencePrices.yesterdayClose && (
              <Line 
                type="monotone" 
                dataKey={() => referencePrices.yesterdayClose}
                stroke="#06b6d4" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Yesterday Close"
              />
            )}
            {referencePrices.twoDaysAgoClose && (
              <Line 
                type="monotone" 
                dataKey={() => referencePrices.twoDaysAgoClose}
                stroke="#84cc16" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="2 Days Ago Close"
              />
            )}
          </BarChart>
        );

      default: // line chart
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="day" 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${config.STOCKS.CURRENCY}${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={getChartColor()} 
              strokeWidth={3}
              dot={{ fill: getChartColor(), strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: getChartColor() }}
              name="Price"
            />
            <Line 
              type="monotone" 
              dataKey="sma" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="SMA (50)"
            />
            {referencePrices.currentOpen && (
              <Line 
                type="monotone" 
                dataKey={() => referencePrices.currentOpen}
                stroke="#8b5cf6" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Today's Open"
              />
            )}
            {referencePrices.yesterdayClose && (
              <Line 
                type="monotone" 
                dataKey={() => referencePrices.yesterdayClose}
                stroke="#06b6d4" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Yesterday Close"
              />
            )}
            {referencePrices.twoDaysAgoClose && (
              <Line 
                type="monotone" 
                dataKey={() => referencePrices.twoDaysAgoClose}
                stroke="#84cc16" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="2 Days Ago Close"
              />
            )}
          </LineChart>
        );
    }
  };

  if (!stock || (!stock.price && (!stock.last50daysAvg || stock.last50daysAvg.length === 0))) {
    return (
      <div style={{
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <p style={{ color: '#64748b', margin: 0 }}>No price data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: height }}>
      {/* Chart Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '0 8px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '600' }}>
            {stock.symbol} Price History
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Current: {config.STOCKS.CURRENCY}{stock.price?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 }) || 'N/A'}
            </span>
            {chartData.length > 1 && (
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: priceChange.value >= 0 ? config.UI.CHART.COLORS.POSITIVE : config.UI.CHART.COLORS.NEGATIVE
              }}>
                {priceChange.value >= 0 ? '+' : ''}{priceChange.value.toFixed(2)} ({priceChange.percentage >= 0 ? '+' : ''}{priceChange.percentage.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>

        {/* Chart Type Selector */}
        {chartData.length > 1 && (
          <div style={{ 
            display: 'flex', 
            gap: '4px',
            flexWrap: 'wrap'
          }}>
            {config.UI.CHART.TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: chartType === type ? '#2563eb' : 'white',
                  color: chartType === type ? 'white' : '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  minWidth: '60px'
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        height: 'calc(100% - 80px)'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div style={{
        marginTop: '12px',
        padding: '0 8px',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        <p style={{ margin: 0 }}>
          {chartData.length > 1 
            ? `Showing last ${chartData.length} days of price data • SMA (50): ${config.STOCKS.CURRENCY}${stock.sma?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 }) || 'N/A'}`
            : 'Current price only - historical data not available'
          }
        </p>
        {chartData.length > 1 && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '0.7rem', 
            color: '#64748b',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'flex-start',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#8b5cf6' }}>●</span>
              <span>Open: {config.STOCKS.CURRENCY}{referencePrices.currentOpen?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 }) || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#06b6d4' }}>●</span>
              <span>Yest: {config.STOCKS.CURRENCY}{referencePrices.yesterdayClose?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 }) || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#84cc16' }}>●</span>
              <span>2D: {config.STOCKS.CURRENCY}{referencePrices.twoDaysAgoClose?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 }) || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#f59e0b' }}>●</span>
              <span>SMA: {config.STOCKS.CURRENCY}{stock.sma?.toLocaleString(config.STOCKS.LOCALE, { minimumFractionDigits: 2 }) || 'N/A'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockChart; 