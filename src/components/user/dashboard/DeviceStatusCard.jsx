import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../services/firebase/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DeviceStatusCard = ({ device }) => {
  const [sensorData, setSensorData] = useState({
    soilMoisture: 0,
    soilTemperature: 0,
    airTemperature: 0,
    humidity: 0,
    gasLevel: 0,
    rainSensor: 0,
    rainLevel: 0,
    lightSensor: 0,
    lightLevel: 0,
    waterPump: false,
    timestamp: new Date().toISOString()
  });
  const [historyData, setHistoryData] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!device?.deviceId) return;

    console.log('📡 Setting up device status for:', device.deviceId);

    // Real-time sensor data
    const latestRef = ref(database, `devices/${device.deviceId}/sensors/latest`);
    const historyRef = ref(database, `devices/${device.deviceId}/sensors/history`);
    const lastSeenRef = ref(database, `devices/${device.deviceId}/meta/lastSeen`);

    const unsubscribeLatest = onValue(latestRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const processedData = {
          soilMoisture: data.soilMoisture || data.soil_moisture || 0,
          soilTemperature: data.soilTemperature || data.soil_temperature || data.ds18b20 || 0,
          airTemperature: data.airTemperature || data.air_temperature || data.dht11_temp || 0,
          humidity: data.humidity || data.dht11_humidity || 0,
          gasLevel: data.gasLevel || data.gas_level || data.mq135 || 0,
          rainSensor: data.rainSensor || data.rain_sensor || data.rain || 0,
          rainLevel: data.rainLevel || data.rain_level || 0,
          lightSensor: data.lightSensor || data.ldr || data.light_detection || 0,
          lightLevel: data.lightLevel || data.light_level || 0,
          waterPump: data.waterPump || data.pump || data.relay || false,
          timestamp: new Date().toISOString()
        };
        setSensorData(processedData);
        // Don't automatically set online - let the lastSeen listener handle this
        setLoading(false);
      } else {
        setIsOnline(false);
        setLoading(false);
      }
    });

    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const historyArray = Object.values(data || {}).map(item => ({
          time: new Date(item.timestamp).toLocaleTimeString(),
          soilMoisture: item.soilMoisture || item.soil_moisture || 0,
          airTemperature: item.airTemperature || item.air_temperature || item.dht11_temp || 0,
          soilTemperature: item.soilTemperature || item.soil_temperature || item.ds18b20 || 0,
          humidity: item.humidity || item.dht11_humidity || 0,
          gasLevel: item.gasLevel || item.gas_level || item.mq135 || 0
        }));
        setHistoryData(historyArray.slice(-10)); // Keep last 10 records
      }
    });

    // Listen to lastSeen for proper online/offline detection
    const unsubscribeLastSeen = onValue(lastSeenRef, (snapshot) => {
      if (snapshot.exists()) {
        const lastSeen = snapshot.val();
        const currentTime = Date.now();
        
        // Handle different timestamp formats
        let normalizedLastSeen = lastSeen;
        
        // If timestamp is very small (< 1000000000), it's likely millis() from ESP32
        if (lastSeen < 1000000000) {
          // For ESP32 millis(), check if we're receiving regular updates
          const isOnline = window.lastESP32UpdateTime && (currentTime - window.lastESP32UpdateTime) < 20000;
          console.log(`🕐 DeviceStatusCard ESP32: lastSeen=${lastSeen}, time since update=${Math.round((currentTime - (window.lastESP32UpdateTime || 0))/1000)}s, online=${isOnline}`);
          setIsOnline(isOnline);
          return;
        }
        
        // Handle Unix timestamps
        if (lastSeen < 1000000000000) {
          normalizedLastSeen = lastSeen * 1000;
        }
        
        const timeSinceLastSeen = currentTime - normalizedLastSeen;
        const isDeviceOnline = timeSinceLastSeen < 20000; // 20 seconds threshold
        
        console.log(`🕐 DeviceStatusCard: lastSeen=${lastSeen}, age=${Math.round(timeSinceLastSeen/1000)}s, online=${isDeviceOnline}`);
        setIsOnline(isDeviceOnline);
      } else {
        setIsOnline(false);
      }
    });

    return () => {
      unsubscribeLatest();
      unsubscribeHistory();
      unsubscribeLastSeen();
    };
  }, [device?.deviceId]);

  const getStatusColor = (value, type) => {
    switch (type) {
      case 'moisture':
        if (value < 30) return 'text-red-600';
        if (value < 60) return 'text-yellow-600';
        return 'text-green-600';
      case 'airTemperature':
        if (value < 10 || value > 35) return 'text-red-600';
        return 'text-green-600';
      case 'soilTemperature':
        if (value < 5 || value > 30) return 'text-red-600';
        return 'text-green-600';
      case 'humidity':
        if (value < 30 || value > 80) return 'text-yellow-600';
        return 'text-green-600';
      case 'gasLevel':
        if (value > 1000) return 'text-red-600';
        if (value > 500) return 'text-yellow-600';
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (value, type) => {
    switch (type) {
      case 'moisture':
        if (value < 30) return 'Dry';
        if (value < 60) return 'Moderate';
        return 'Optimal';
      case 'airTemperature':
        if (value < 10) return 'Too Cold';
        if (value > 35) return 'Too Hot';
        return 'Optimal';
      case 'soilTemperature':
        if (value < 5) return 'Too Cold';
        if (value > 30) return 'Too Hot';
        return 'Optimal';
      case 'humidity':
        if (value < 30) return 'Low';
        if (value > 80) return 'High';
        return 'Optimal';
      case 'gasLevel':
        if (value > 1000) return 'Poor';
        if (value > 500) return 'Moderate';
        return 'Good';
      default:
        return 'Normal';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Device Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {device.deviceId}
          </h3>
          <p className="text-sm text-gray-500">
            {device.farmInfo?.farmName || 'Smart Farm Device'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Real-time Sensor Data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Soil Moisture Sensor */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {sensorData.soilMoisture}%
          </div>
          <div className="text-xs text-gray-500">Soil Moisture</div>
          <div className={`text-xs ${getStatusColor(sensorData.soilMoisture, 'moisture')}`}>
            {getStatusText(sensorData.soilMoisture, 'moisture')}
          </div>
        </div>
        
        {/* DHT11 - Air Temperature */}
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {sensorData.airTemperature}°C
          </div>
          <div className="text-xs text-gray-500">Air Temperature</div>
          <div className={`text-xs ${getStatusColor(sensorData.airTemperature, 'airTemperature')}`}>
            {getStatusText(sensorData.airTemperature, 'airTemperature')}
          </div>
        </div>
        
        {/* DHT11 - Humidity */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {sensorData.humidity}%
          </div>
          <div className="text-xs text-gray-500">Air Humidity</div>
          <div className={`text-xs ${getStatusColor(sensorData.humidity, 'humidity')}`}>
            {getStatusText(sensorData.humidity, 'humidity')}
          </div>
        </div>
        
        {/* DS18B20 - Soil Temperature */}
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {sensorData.soilTemperature}°C
          </div>
          <div className="text-xs text-gray-500">Soil Temperature</div>
          <div className={`text-xs ${getStatusColor(sensorData.soilTemperature, 'soilTemperature')}`}>
            {getStatusText(sensorData.soilTemperature, 'soilTemperature')}
          </div>
        </div>
      </div>

      {/* Chart */}
      {historyData.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Last 24 Hours Trend</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="soilMoisture" stroke="#3B82F6" strokeWidth={2} name="Soil Moisture %" />
                <Line type="monotone" dataKey="airTemperature" stroke="#F97316" strokeWidth={2} name="Air Temp °C" />
                <Line type="monotone" dataKey="soilTemperature" stroke="#EF4444" strokeWidth={2} name="Soil Temp °C" />
                <Line type="monotone" dataKey="humidity" stroke="#10B981" strokeWidth={2} name="Humidity %" />
                <Line type="monotone" dataKey="gasLevel" stroke="#8B5CF6" strokeWidth={2} name="Gas Level" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Additional Sensors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {/* MQ135 - Air Quality / Gas Level */}
        <div>
          <div className={`text-lg font-semibold ${getStatusColor(sensorData.gasLevel, 'gasLevel')}`}>
            {sensorData.gasLevel}
          </div>
          <div className="text-xs text-gray-500">Air Quality</div>
          <div className={`text-xs ${getStatusColor(sensorData.gasLevel, 'gasLevel')}`}>
            {getStatusText(sensorData.gasLevel, 'gasLevel')}
          </div>
        </div>
        
        {/* Rain Sensor */}
        <div>
          <div className={`text-lg font-semibold ${sensorData.rainSensor ? 'text-blue-600' : 'text-gray-600'}`}>
            {sensorData.rainSensor ? 'Rain' : 'Clear'}
          </div>
          <div className="text-xs text-gray-500">Rain Detection</div>
          {sensorData.rainLevel > 0 && (
            <div className="text-xs text-blue-600">
              Level: {sensorData.rainLevel}
            </div>
          )}
        </div>
        
        {/* LDR - Light Sensor */}
        <div>
          <div className={`text-lg font-semibold ${sensorData.lightSensor ? 'text-yellow-600' : 'text-gray-600'}`}>
            {sensorData.lightSensor ? 'On' : 'Off'}
          </div>
          <div className="text-xs text-gray-500">Light Detection</div>
          {sensorData.lightLevel > 0 && (
            <div className="text-xs text-yellow-600">
              Level: {sensorData.lightLevel}%
            </div>
          )}
        </div>
        
        {/* 5V Relay - Water Pump Control */}
        <div>
          <div className={`text-lg font-semibold ${sensorData.waterPump ? 'text-green-600' : 'text-gray-600'}`}>
            {sensorData.waterPump ? 'On' : 'Off'}
          </div>
          <div className="text-xs text-gray-500">Water Pump</div>
          <div className={`text-xs ${sensorData.waterPump ? 'text-green-600' : 'text-gray-600'}`}>
            {sensorData.waterPump ? 'Running' : 'Stopped'}
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {sensorData.timestamp && sensorData.timestamp !== 0 
            ? new Date(sensorData.timestamp).toLocaleString() 
            : 'No data'}
        </p>
      </div>
    </div>
  );
};

export default DeviceStatusCard;
