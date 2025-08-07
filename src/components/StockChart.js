import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const StockChart = ({ symbol, data, timeframe }) => {
  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">📈</div>
          <p className="text-gray-600 text-sm">Chart for {symbol}</p>
          <p className="text-gray-500 text-xs">Timeframe: {timeframe}</p>
        </div>
      </div>
    );
  }

  // Process data for chart
  const chartData = data.map((item, index) => ({
    date: item.date || `Day ${index + 1}`,
    price: item.close || item.price || 0,
    open: item.open || 0,
    high: item.high || 0,
    low: item.low || 0,
    volume: item.volume || 0,
    sma: item.sma || 0
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ₹{entry.value?.toFixed(2) || 'N/A'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Price Line */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Price"
          />
          
          {/* SMA Line */}
          <Line
            type="monotone"
            dataKey="sma"
            stroke="#f59e0b"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="SMA (50)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart; 