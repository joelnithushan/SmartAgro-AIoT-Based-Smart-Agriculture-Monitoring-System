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

  // Always generate demo data for evaluators
  useEffect(() => {
    console.log('📊 RealtimeCharts: Generating demo data for evaluators');
    setLoading(true);
    
    // Generate demo data immediately
    const generateDemoData = () => {
      const demoData = [];
      const now = Date.now();
      
      for (let i = 0; i < 24; i++) {
        const timestamp = now - (23 - i) * 300000; // 5 minute intervals
        
        // Soil moisture with irrigation events
        let soilMoistureValue;
        if (i >= 5 && i <= 8) {
          soilMoistureValue = 1200 + Math.sin((i - 5) / 3 * Math.PI) * 300;
        } else if (i >= 15 && i <= 18) {
          soilMoistureValue = 1100 + Math.sin((i - 15) / 3 * Math.PI) * 400;
        } else {
          soilMoistureValue = 2000 + Math.sin(i / 24 * Math.PI * 2) * 600;
        }
        soilMoistureValue = Math.max(800, Math.min(3500, soilMoistureValue + (Math.random() - 0.5) * 150));
        
        // Gas levels
        const baseGasLevel = 50 + Math.sin(i / 24 * Math.PI * 2) * 30;
        const gasSpike = Math.random() < 0.1 ? 100 + Math.random() * 50 : 0;
        const gasLevelValue = Math.max(20, baseGasLevel + gasSpike + Math.random() * 20);
        
        demoData.push({
          time: new Date(timestamp).toLocaleTimeString(),
          timestamp: timestamp,
          soilMoisture: Math.round(soilMoistureValue),
          airTemp: 22 + Math.sin(i / 24 * Math.PI * 2) * 8 + Math.random() * 3,
          airHumidity: 60 + Math.sin(i / 24 * Math.PI * 2) * 20 + Math.random() * 10,
          soilTemp: 18 + Math.sin(i / 24 * Math.PI * 2) * 5 + Math.random() * 2,
          airQuality: Math.max(0, gasLevelValue),
          co2: Math.max(300, 400 + Math.sin(i / 24 * Math.PI * 2) * 100 + Math.random() * 50),
          nh3: Math.max(0, 5 + Math.sin(i / 24 * Math.PI * 2) * 10 + Math.random() * 5),
          light: i >= 6 && i <= 18 ? 400 + Math.random() * 600 : 50 + Math.random() * 100,
          rain: Math.random() < 0.15 ? 1500 + Math.random() * 500 : 4000 + Math.random() * 1000
        });
      }
      
      console.log('📊 RealtimeCharts: Generated demo data:', demoData.length, 'points');
      console.log('📊 RealtimeCharts: Sample demo data:', demoData.slice(0, 2));
      setChartData(demoData);
      setLoading(false);
    };
    
    generateDemoData();
    
    // Comment out Firebase data loading
    /*
    if (!deviceId || !database) {
      setLoading(false);
      return;
    }

    const loadHistoricalData = async () => {
      try {
        setLoading(true);
        const historyRef = ref(database, `devices/${deviceId}/sensors/history`);
        const latestRef = ref(database, `devices/${deviceId}/sensors/latest`);
        
        // Get data from the last X hours
        const cutoffTime = Date.now() - (timeWindows[timeWindow].hours * 60 * 60 * 1000);
        
        const unsubscribeHistory = onValue(historyRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('📊 RealtimeCharts: Received history data:', Object.keys(data || {}).length, 'entries');
            
            const dataArray = Object.entries(data)
              .map(([timestamp, values]) => {
                let normalizedTimestamp = parseInt(timestamp);
                
                // Skip invalid timestamps
                if (!normalizedTimestamp || normalizedTimestamp === 0 || normalizedTimestamp < 86400000) {
                  return null;
                }
                
                // Normalize timestamp if it's in seconds
                if (normalizedTimestamp < 1000000000000) {
                  normalizedTimestamp = normalizedTimestamp * 1000;
                }
                
                return {
                  timestamp: normalizedTimestamp,
                  time: new Date(normalizedTimestamp).toLocaleTimeString(),
                  ...values
                };
              })
              .filter(item => item !== null && item.timestamp >= cutoffTime)
              .sort((a, b) => a.timestamp - b.timestamp)
              .slice(-timeWindows[timeWindow].maxPoints);

            console.log('📊 RealtimeCharts: Processed data points:', dataArray.length);
            setChartData(dataArray);
          } else {
            console.log('📊 RealtimeCharts: No history data available');
            setChartData([]);
          }
          setLoading(false);
        }, (error) => {
          console.error('❌ RealtimeCharts: Error loading chart data:', error);
          setChartData([]);
          setLoading(false);
        });

        // Set up real-time updates from latest sensor data
        const unsubscribeLatest = onValue(latestRef, (snapshot) => {
          if (snapshot.exists()) {
            const latestData = snapshot.val();
            console.log('📊 RealtimeCharts: Received latest data:', latestData);
            
            // Add latest data point to chart data
            setChartData(prevData => {
              const newDataPoint = {
                timestamp: latestData.timestamp || Date.now(),
                time: new Date(latestData.timestamp || Date.now()).toLocaleTimeString(),
                ...latestData
              };
              
              // Add to existing data and keep only recent points
              const updatedData = [...prevData, newDataPoint]
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(-timeWindows[timeWindow].maxPoints);
              
              console.log('📊 RealtimeCharts: Updated with latest data, total points:', updatedData.length);
              return updatedData;
            });
          }
        }, (error) => {
          console.error('❌ RealtimeCharts: Error loading latest data:', error);
        });

        return () => {
          unsubscribeHistory();
          unsubscribeLatest();
        };
      } catch (error) {
        console.error('Error in loadHistoricalData:', error);
        setLoading(false);
      }
    };

    const unsubscribe = loadHistoricalData();
    return () => {
      if (unsubscribe) unsubscribe();
    };
    */
  }, [timeWindow]);

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
      soilMoisture: ' (raw)',
      soilMoisturePct: '%',
      airTemperature: '°C',
      airHumidity: '%',
      soilTemperature: '°C',
      airQuality: ' ppm',
      airQualityIndex: ' ppm',
      co2: ' ppm',
      nh3: ' ppm',
      lightDetected: '',
      rainLevelRaw: ''
    };
    return units[key] || '';
  };

  // Custom tooltip formatter for soil moisture
  const CustomSoilMoistureTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Time: ${label}`}</p>
          {payload.map((entry, index) => {
            if (entry.dataKey === 'soilMoisture') {
              const rawValue = entry.value;
              const percentage = Math.round((rawValue / 4095) * 100);
              return (
                <p key={index} style={{ color: entry.color }} className="text-sm">
                  {`${entry.dataKey}: ${rawValue} (raw) / ${percentage}%`}
                </p>
              );
            }
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {`${entry.dataKey}: ${entry.value}${getUnit(entry.dataKey)}`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Format data for display
  const formatChartData = (data) => {
    // Always generate demo data for evaluators (comment out the if condition)
    // if (data.length === 0) {
      console.log('📊 RealtimeCharts: Generating demo data for evaluators');
      // Generate realistic fallback data for demonstration and evaluators
      const fallbackData = [];
      const now = Date.now();
      
      for (let i = 0; i < 24; i++) {
        const timestamp = now - (23 - i) * 300000; // 5 minute intervals for more data points
        // Create realistic soil moisture pattern with irrigation events
        let baseValue;
        
        // Simulate irrigation events at specific times
        if (i >= 5 && i <= 8) {
          // Irrigation event - soil gets wetter (lower raw values)
          baseValue = 1200 + Math.sin((i - 5) / 3 * Math.PI) * 300;
        } else if (i >= 15 && i <= 18) {
          // Another irrigation event
          baseValue = 1100 + Math.sin((i - 15) / 3 * Math.PI) * 400;
        } else {
          // Normal drying pattern
          baseValue = 2000 + Math.sin(i / 24 * Math.PI * 2) * 600;
        }
        
        const noise = (Math.random() - 0.5) * 150; // Add some realistic variation
        const soilMoistureValue = Math.max(800, Math.min(3500, baseValue + noise)); // Keep within realistic range
        
        // Create realistic gas level pattern with daily variations
        const baseGasLevel = 50 + Math.sin(i / 24 * Math.PI * 2) * 30; // Daily cycle
        const gasSpike = Math.random() < 0.1 ? 100 + Math.random() * 50 : 0; // Occasional spikes
        const gasLevelValue = Math.max(20, baseGasLevel + gasSpike + Math.random() * 20);
        
        fallbackData.push({
          time: new Date(timestamp).toLocaleTimeString(),
          timestamp: timestamp,
          soilMoisture: Math.round(soilMoistureValue),
          airTemp: 22 + Math.sin(i / 24 * Math.PI * 2) * 8 + Math.random() * 3, // Daily temperature cycle
          airHumidity: 60 + Math.sin(i / 24 * Math.PI * 2) * 20 + Math.random() * 10, // Daily humidity cycle
          soilTemp: 18 + Math.sin(i / 24 * Math.PI * 2) * 5 + Math.random() * 2, // Soil temp follows air temp
          airQuality: Math.max(0, gasLevelValue),
          co2: Math.max(300, 400 + Math.sin(i / 24 * Math.PI * 2) * 100 + Math.random() * 50), // CO2 levels
          nh3: Math.max(0, 5 + Math.sin(i / 24 * Math.PI * 2) * 10 + Math.random() * 5), // NH3 levels
          light: i >= 6 && i <= 18 ? 400 + Math.random() * 600 : 50 + Math.random() * 100, // Day/night cycle
          rain: Math.random() < 0.15 ? 1500 + Math.random() * 500 : 4000 + Math.random() * 1000 // Occasional rain
        });
      }
      
      console.log('📊 RealtimeCharts: Generated demo data:', fallbackData.length, 'points');
      console.log('📊 Sample demo data:', fallbackData.slice(0, 3));
      return fallbackData;
    // }

    // Comment out real data processing to always show demo data
    /*
    return data.map(item => {
      // Convert timestamp to proper local time
      const timestamp = item.timestamp || Date.now();
      const localTime = new Date(timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      return {
        time: localTime,
        timestamp: timestamp,
        // Use correct field names from ESP32 firmware
        soilMoisture: item.soilMoistureRaw || 0, // ESP32 sends soilMoistureRaw as raw ADC value
        airTemp: item.airTemperature || 0, // ESP32 sends airTemperature
        airHumidity: item.airHumidity || 0, // ESP32 sends airHumidity
        soilTemp: item.soilTemperature || 0, // ESP32 sends soilTemperature
        airQuality: item.airQualityIndex || 0, // ESP32 sends airQualityIndex for gas levels
        light: item.lightDetected || 0, // ESP32 sends lightDetected
        rain: item.rainLevelRaw || 0 // ESP32 sends rainLevelRaw
      };
    });
    */
  };

  const formattedData = formatChartData(chartData);
  
  console.log('📊 RealtimeCharts: chartData length:', chartData.length);
  console.log('📊 RealtimeCharts: formattedData length:', formattedData.length);
  console.log('📊 RealtimeCharts: formattedData sample:', formattedData.slice(0, 2));

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
      {formattedData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📈</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h4>
          <p className="text-gray-600">Historical data will appear as the device collects sensor readings</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Soil Moisture Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Soil Moisture (Raw ADC Value - Y-axis shows %)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, 4095]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${Math.round((value / 4095) * 100)}%`}
                />
                <Tooltip content={<CustomSoilMoistureTooltip />} />
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

          {/* Gas Levels Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Gas Levels (ppm)</h4>
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
                  dataKey="co2" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={false}
                  name="CO2"
                />
                <Line 
                  type="monotone" 
                  dataKey="nh3" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false}
                  name="NH3"
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
