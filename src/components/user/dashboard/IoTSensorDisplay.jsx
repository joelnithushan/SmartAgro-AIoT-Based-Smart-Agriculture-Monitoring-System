import React, { useState, useEffect } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { database } from '../../../services/firebase/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const IoTSensorDisplay = ({ deviceId }) => {
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
  const [irrigationStatus, setIrrigationStatus] = useState({
    autoMode: false,
    pumpStatus: 'off',
    lastWatered: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;

    console.log('📡 Setting up IoT sensor display for device:', deviceId);

    // Real-time sensor data
    const latestRef = ref(database, `devices/${deviceId}/sensors/latest`);
    const historyRef = ref(database, `devices/${deviceId}/sensors/history`);
    const irrigationRef = ref(database, `devices/${deviceId}/irrigation`);

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
        setHistoryData(historyArray.slice(-20)); // Keep last 20 records
      }
    });

    const unsubscribeIrrigation = onValue(irrigationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setIrrigationStatus({
          autoMode: data.autoMode || false,
          pumpStatus: data.pumpStatus || 'off',
          lastWatered: data.lastWatered || null
        });
      }
    });

    return () => {
      unsubscribeLatest();
      unsubscribeHistory();
      unsubscribeIrrigation();
    };
  }, [deviceId]);

  const toggleIrrigation = async (action) => {
    try {
      if (action === 'pump') {
        const newPumpStatus = irrigationStatus.pumpStatus === 'on' ? 'off' : 'on';
        
        // First, write to the path ESP32 is monitoring (plural "controls")
        // ESP32 reads from: devices/${DEVICE_ID}/controls/relayCommand
        const relayCommandRef = ref(database, `devices/${deviceId}/controls/relayCommand`);
        await update(relayCommandRef, newPumpStatus); // ESP32 expects simple string "on" or "off"
        console.log(`✅ Relay command sent to ESP32: ${newPumpStatus}`);
        
        // Also update other paths for UI consistency
        const irrigationRef = ref(database, `devices/${deviceId}/irrigation`);
        const pumpRef = ref(database, `devices/${deviceId}/sensors/latest`);
        
        await update(irrigationRef, {
          pumpStatus: newPumpStatus,
          lastUpdated: new Date().toISOString()
        });
        
        await update(pumpRef, {
          waterPump: newPumpStatus === 'on',
          relay: newPumpStatus === 'on',
          pump: newPumpStatus === 'on',
          relayStatus: newPumpStatus,
          timestamp: new Date().toISOString()
        });
        
        toast.success(`Water pump ${newPumpStatus === 'on' ? 'turned on' : 'turned off'}`);
      } else if (action === 'auto') {
        const newAutoStatus = !irrigationStatus.autoMode;
        
        await update(irrigationRef, {
          autoMode: newAutoStatus,
          lastUpdated: new Date().toISOString()
        });
        
        toast.success(`Auto irrigation ${newAutoStatus ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Error updating irrigation:', error);
      toast.error('Failed to update irrigation settings');
    }
  };

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Soil Moisture Sensor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Soil Moisture</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.soilMoisture, 'moisture')}`}>
                {sensorData.soilMoisture}%
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.soilMoisture, 'moisture')}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💧</span>
            </div>
          </div>
        </div>

        {/* DHT11 - Air Temperature */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Air Temperature</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.airTemperature, 'airTemperature')}`}>
                {sensorData.airTemperature}°C
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.airTemperature, 'airTemperature')}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌡️</span>
            </div>
          </div>
        </div>

        {/* DHT11 - Air Humidity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Air Humidity</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.humidity, 'humidity')}`}>
                {sensorData.humidity}%
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.humidity, 'humidity')}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💨</span>
            </div>
          </div>
        </div>

        {/* DS18B20 - Soil Temperature */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Soil Temperature</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.soilTemperature, 'soilTemperature')}`}>
                {sensorData.soilTemperature}°C
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.soilTemperature, 'soilTemperature')}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌡️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* MQ135 - Air Quality / Gas Level */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Air Quality</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.gasLevel, 'gasLevel')}`}>
                {sensorData.gasLevel}
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.gasLevel, 'gasLevel')}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        {/* Rain Sensor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rain Detection</p>
              <p className={`text-2xl font-bold ${sensorData.rainSensor ? 'text-blue-600' : 'text-gray-600'}`}>
                {sensorData.rainSensor ? 'Rain' : 'Clear'}
              </p>
              <p className="text-xs text-gray-500">
                {sensorData.rainLevel > 0 ? `Level: ${sensorData.rainLevel}` : 'No Rain'}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌧️</span>
            </div>
          </div>
        </div>

        {/* LDR - Light Sensor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Light Detection</p>
              <p className={`text-2xl font-bold ${sensorData.lightSensor ? 'text-yellow-600' : 'text-gray-600'}`}>
                {sensorData.lightSensor ? 'On' : 'Off'}
              </p>
              <p className="text-xs text-gray-500">
                {sensorData.lightLevel > 0 ? `Level: ${sensorData.lightLevel}%` : 'Dark'}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">☀️</span>
            </div>
          </div>
        </div>

        {/* 5V Relay - Water Pump Control */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Water Pump</p>
              <p className={`text-2xl font-bold ${sensorData.waterPump ? 'text-green-600' : 'text-gray-600'}`}>
                {sensorData.waterPump ? 'On' : 'Off'}
              </p>
              <p className="text-xs text-gray-500">
                {sensorData.waterPump ? 'Running' : 'Stopped'}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💧</span>
            </div>
          </div>
        </div>
      </div>

      {/* Water Pump Control Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Pump Control</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Pump Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Water Pump</h4>
              <p className="text-sm text-gray-600">
                {sensorData.waterPump ? 'Currently running' : 'Currently stopped'}
              </p>
            </div>
            <button
              onClick={() => toggleIrrigation('pump')}
              className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                sensorData.waterPump
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {sensorData.waterPump ? 'Turn OFF' : 'Turn ON'}
            </button>
          </div>
          
          {/* Auto Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Auto Mode</h4>
              <p className="text-sm text-gray-600">
                {irrigationStatus.autoMode ? 'Automatic irrigation enabled' : 'Manual control only'}
              </p>
            </div>
            <button
              onClick={() => toggleIrrigation('auto')}
              className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                irrigationStatus.autoMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {irrigationStatus.autoMode ? 'Auto ON' : 'Auto OFF'}
            </button>
          </div>
        </div>
        
        {/* Status Information */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p><strong>Last Watered:</strong> {irrigationStatus.lastWatered ? new Date(irrigationStatus.lastWatered).toLocaleString() : 'Never'}</p>
            </div>
            <div>
              <p><strong>Pump Status:</strong> {sensorData.waterPump ? 'Running' : 'Stopped'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Data Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature & Humidity Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperature & Humidity Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="timestamp" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="airTemperature" stroke="#F59E0B" strokeWidth={2} name="Air Temp (°C)" />
              <Line type="monotone" dataKey="soilTemperature" stroke="#EF4444" strokeWidth={2} name="Soil Temp (°C)" />
              <Line type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={2} name="Humidity (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Soil Moisture & Air Quality Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Soil Moisture & Air Quality</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="soilMoisture" stroke="#10B981" strokeWidth={2} name="Soil Moisture (%)" />
              <Line type="monotone" dataKey="gasLevel" stroke="#8B5CF6" strokeWidth={2} name="Air Quality" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default IoTSensorDisplay;
