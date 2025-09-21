import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const TrendCharts = ({ deviceId, isOnline }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 30d

  useEffect(() => {
    if (!deviceId || !isOnline) {
      setLoading(false);
      return;
    }

    console.log('📈 Setting up trend charts for device:', deviceId);

    const historyRef = ref(database, `devices/${deviceId}/sensors/history`);
    
    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const historyArray = Object.values(data || {})
          .map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            date: new Date(item.timestamp).toLocaleDateString(),
            timestamp: item.timestamp,
            soilMoisture: item.soilMoisturePct || 0,
            airTemperature: item.airTemperature || 0,
            airHumidity: item.airHumidity || 0,
            soilTemperature: item.soilTemperature || 0,
            airQuality: item.airQualityIndex || 0,
            rainLevel: item.rainLevelRaw || 0,
            relayStatus: item.relayStatus === 'on' ? 1 : 0
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        // Filter data based on time range
        const filteredData = filterDataByTimeRange(historyArray, timeRange);
        setHistoryData(filteredData);
      } else {
        setHistoryData([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('❌ Error in history subscription:', error);
      setLoading(false);
    });

    return () => {
      off(historyRef, 'value', unsubscribe);
    };
  }, [deviceId, isOnline, timeRange]);

  const filterDataByTimeRange = (data, range) => {
    const now = Date.now();
    let cutoffTime;

    switch (range) {
      case '24h':
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = now - (24 * 60 * 60 * 1000);
    }

    return data.filter(item => item.timestamp >= cutoffTime);
  };

  const formatTooltipValue = (value, name) => {
    switch (name) {
      case 'soilMoisture':
        return [`${value}%`, 'Soil Moisture'];
      case 'airTemperature':
      case 'soilTemperature':
        return [`${value}°C`, name === 'airTemperature' ? 'Air Temperature' : 'Soil Temperature'];
      case 'airHumidity':
        return [`${value}%`, 'Air Humidity'];
      case 'airQuality':
        return [`${value}`, 'Air Quality'];
      case 'rainLevel':
        return [`${value}%`, 'Rain Level'];
      case 'relayStatus':
        return [value ? 'ON' : 'OFF', 'Pump Status'];
      default:
        return [value, name];
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isOnline || historyData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Charts</h3>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500">
            {!isOnline ? 'Device offline - all data shows 0' : 'No historical data available'}
          </p>
          {!isOnline && (
            <p className="text-sm text-red-600 mt-2">
              When device is offline, all sensor readings show 0
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Trend Analysis</h3>
          <div className="flex space-x-2">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Showing {historyData.length} data points over the last {timeRange}
        </p>
      </div>

      {/* Temperature & Humidity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperature & Humidity Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="time" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#F9FAFB', 
                border: '1px solid #E5E7EB', 
                borderRadius: '8px' 
              }}
              formatter={formatTooltipValue}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="airTemperature" 
              stroke="#F59E0B" 
              strokeWidth={2} 
              name="Air Temperature" 
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="soilTemperature" 
              stroke="#EF4444" 
              strokeWidth={2} 
              name="Soil Temperature" 
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="airHumidity" 
              stroke="#3B82F6" 
              strokeWidth={2} 
              name="Air Humidity" 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Soil Moisture & Air Quality Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Soil Moisture & Air Quality</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="time" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#F9FAFB', 
                border: '1px solid #E5E7EB', 
                borderRadius: '8px' 
              }}
              formatter={formatTooltipValue}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="soilMoisture" 
              stroke="#10B981" 
              fill="#10B981"
              fillOpacity={0.3}
              strokeWidth={2} 
              name="Soil Moisture" 
            />
            <Area 
              type="monotone" 
              dataKey="airQuality" 
              stroke="#8B5CF6" 
              fill="#8B5CF6"
              fillOpacity={0.3}
              strokeWidth={2} 
              name="Air Quality" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Irrigation Activity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Irrigation Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="time" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#F9FAFB', 
                border: '1px solid #E5E7EB', 
                borderRadius: '8px' 
              }}
              formatter={formatTooltipValue}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="soilMoisture" 
              stroke="#10B981" 
              strokeWidth={2} 
              name="Soil Moisture" 
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="relayStatus" 
              stroke="#EF4444" 
              strokeWidth={3} 
              name="Pump Status" 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Environmental Conditions Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental Conditions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="time" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#F9FAFB', 
                border: '1px solid #E5E7EB', 
                borderRadius: '8px' 
              }}
              formatter={formatTooltipValue}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="rainLevel" 
              stroke="#3B82F6" 
              strokeWidth={2} 
              name="Rain Level" 
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="airQuality" 
              stroke="#8B5CF6" 
              strokeWidth={2} 
              name="Air Quality" 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendCharts;
