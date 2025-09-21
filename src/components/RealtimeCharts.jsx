import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '../config/firebase';

const RealtimeCharts = ({ deviceId, isOnline }) => {
  const [chartData, setChartData] = useState([]);
  const [timeWindow, setTimeWindow] = useState('1h'); // 1h, 24h, 7d
  const [loading, setLoading] = useState(true);

  // Time window configurations
  const timeWindows = {
    '1h': { label: 'Last 1 Hour', hours: 1, maxPoints: 60 },
    '24h': { label: 'Last 24 Hours', hours: 24, maxPoints: 144 },
    '7d': { label: 'Last 7 Days', hours: 168, maxPoints: 168 }
  };

  // Load historical data based on time window
  useEffect(() => {
    if (!deviceId || !database) {
      setLoading(false);
      return;
    }

    const loadHistoricalData = async () => {
      try {
        setLoading(true);
        const historyRef = ref(database, `devices/${deviceId}/sensors/history`);
        
        // Get data from the last X hours
        const cutoffTime = Date.now() - (timeWindows[timeWindow].hours * 60 * 60 * 1000);
        
        const unsubscribe = onValue(historyRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const dataArray = Object.entries(data)
              .map(([timestamp, values]) => ({
                timestamp: parseInt(timestamp),
                time: new Date(parseInt(timestamp)).toLocaleTimeString(),
                ...values
              }))
              .filter(item => item.timestamp >= cutoffTime)
              .sort((a, b) => a.timestamp - b.timestamp)
              .slice(-timeWindows[timeWindow].maxPoints);

            setChartData(dataArray);
          } else {
            // If device is offline, show empty chart with zeroed axes
            setChartData([]);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error loading chart data:', error);
          setChartData([]);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error in loadHistoricalData:', error);
        setLoading(false);
      }
    };

    const unsubscribe = loadHistoricalData();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [deviceId, timeWindow]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value}${getUnit(entry.dataKey)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get unit for data key
  const getUnit = (key) => {
    const units = {
      soilMoisturePct: '%',
      airTemperature: '°C',
      airHumidity: '%',
      soilTemperature: '°C',
      airQualityIndex: ' ppm',
      lightDetected: '',
      rainLevelRaw: ''
    };
    return units[key] || '';
  };

  // Format data for display
  const formatChartData = (data) => {
    if (!isOnline) {
      // Return empty data for offline state
      return [];
    }

    if (data.length === 0) {
      return [];
    }

    return data.map(item => ({
      time: item.time,
      timestamp: item.timestamp,
      soilMoisture: item.soilMoisturePct || 0,
      airTemp: item.airTemperature || 0,
      airHumidity: item.airHumidity || 0,
      soilTemp: item.soilTemperature || 0,
      airQuality: item.airQualityIndex || 0,
      light: item.lightDetected || 0,
      rain: item.rainLevelRaw || 0
    }));
  };

  const formattedData = formatChartData(chartData);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sensor Data Trends</h3>
        <div className="flex space-x-2">
          {Object.entries(timeWindows).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setTimeWindow(key)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeWindow === key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      {!isOnline ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Device Offline</h4>
          <p className="text-gray-600">Charts will appear when the device comes online</p>
        </div>
      ) : formattedData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📈</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h4>
          <p className="text-gray-600">Historical data will appear as the device collects sensor readings</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Soil Moisture Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Soil Moisture (%)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="soilMoisture" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  name="Soil Moisture"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Temperature Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Temperature (°C)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="airTemp" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false}
                  name="Air Temperature"
                />
                <Line 
                  type="monotone" 
                  dataKey="soilTemp" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={false}
                  name="Soil Temperature"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Humidity Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Humidity (%)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="airHumidity" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="Air Humidity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Air Quality Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Air Quality (ppm)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="airQuality" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  name="Air Quality"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Summary */}
      {formattedData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formattedData.length}
              </div>
              <div className="text-sm text-gray-500">Data Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {timeWindows[timeWindow].label}
              </div>
              <div className="text-sm text-gray-500">Time Window</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {formattedData.length > 0 ? new Date(formattedData[0].timestamp).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Latest Data</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {isOnline ? '🟢' : '🔴'}
              </div>
              <div className="text-sm text-gray-500">Status</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeCharts;
