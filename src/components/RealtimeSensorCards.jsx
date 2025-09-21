import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RealtimeSensorCards = ({ sensorData, isOnline, deviceId }) => {
  const getStatusColor = (value, type) => {
    // If device is offline, show red color
    if (!isOnline) {
      return 'text-red-600';
    }

    switch (type) {
      case 'moisture':
        if (value === 0) return 'text-red-600';
        if (value < 10) return 'text-red-600';
        if (value < 30) return 'text-yellow-600';
        return 'text-green-600';
      case 'temperature':
        if (value === 0) return 'text-red-600';
        if (value < 5 || value > 35) return 'text-red-600';
        return 'text-green-600';
      case 'humidity':
        if (value === 0) return 'text-red-600';
        if (value < 30 || value > 80) return 'text-yellow-600';
        return 'text-green-600';
      case 'airQuality':
        if (value === 0) return 'text-red-600';
        if (value > 1000) return 'text-red-600';
        if (value > 500) return 'text-yellow-600';
        return 'text-green-600';
      case 'gases':
        if (value.co2 === 0 && value.nh3 === 0) return 'text-red-600';
        if (value.co2 > 1000 || value.nh3 > 50) return 'text-red-600';
        if (value.co2 > 500 || value.nh3 > 25) return 'text-yellow-600';
        return 'text-green-600';
      case 'light':
        if (value === 0 && !isOnline) return 'text-red-600';
        return value ? 'text-yellow-600' : 'text-gray-600';
      case 'rain':
        if (value === 0 && !isOnline) return 'text-red-600';
        return value > 50 ? 'text-blue-600' : 'text-gray-600';
      case 'relay':
        if (!isOnline) return 'text-red-600';
        return value ? 'text-green-600' : 'text-gray-600';
      default:
        return isOnline ? 'text-gray-600' : 'text-red-600';
    }
  };

  const getStatusText = (value, type) => {
    // If device is offline, show offline status
    if (!isOnline) {
      return 'OFFLINE';
    }

    switch (type) {
      case 'moisture':
        if (value === 0) return 'OFFLINE';
        if (value < 10) return 'Critical';
        if (value < 30) return 'Low';
        return 'Good';
      case 'temperature':
        if (value === 0) return 'OFFLINE';
        if (value < 5) return 'Too Cold';
        if (value > 35) return 'Too Hot';
        return 'Optimal';
      case 'humidity':
        if (value === 0) return 'OFFLINE';
        if (value < 30) return 'Low';
        if (value > 80) return 'High';
        return 'Optimal';
      case 'airQuality':
        if (value === 0) return 'OFFLINE';
        if (value > 1000) return 'Poor';
        if (value > 500) return 'Moderate';
        return 'Good';
      case 'gases':
        if (value.co2 === 0 && value.nh3 === 0) return 'OFFLINE';
        if (value.co2 > 1000 || value.nh3 > 50) return 'Poor';
        if (value.co2 > 500 || value.nh3 > 25) return 'Moderate';
        return 'Good';
      case 'light':
        if (value === 0 && !isOnline) return 'OFFLINE';
        return value ? 'Light Detected' : 'Dark';
      case 'rain':
        if (value === 0 && !isOnline) return 'OFFLINE';
        return value > 50 ? 'Rain Detected' : 'No Rain';
      case 'relay':
        if (!isOnline) return 'OFFLINE';
        return value ? 'ON' : 'OFF';
      default:
        return isOnline ? 'Normal' : 'OFFLINE';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'No data';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Real-time Farm Monitoring</h2>
          <p className="text-sm text-gray-600">
            Device: {deviceId} • 
            <span className={`ml-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </span>
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {formatTimestamp(sensorData.timestamp)}
        </div>
      </div>

      {/* Primary Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Soil Moisture */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Soil Moisture</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.soilMoisturePct, 'moisture')}`}>
                {sensorData.soilMoisturePct}%
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.soilMoisturePct, 'moisture')}</p>
              <p className="text-xs text-gray-400">Raw: {sensorData.soilMoistureRaw}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💧</span>
            </div>
          </div>
        </div>

        {/* Air Temperature */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Air Temperature</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.airTemperature, 'temperature')}`}>
                {sensorData.airTemperature}°C
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.airTemperature, 'temperature')}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌡️</span>
            </div>
          </div>
        </div>

        {/* Air Humidity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Air Humidity</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.airHumidity, 'humidity')}`}>
                {sensorData.airHumidity}%
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.airHumidity, 'humidity')}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💨</span>
            </div>
          </div>
        </div>

        {/* Soil Temperature */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Soil Temperature</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.soilTemperature, 'temperature')}`}>
                {sensorData.soilTemperature}°C
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.soilTemperature, 'temperature')}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌡️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Air Quality */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Air Quality</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.airQualityIndex, 'airQuality')}`}>
                {sensorData.airQualityIndex}
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.airQualityIndex, 'airQuality')}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        {/* Gas Levels */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gas Levels</p>
              <div className="text-xs space-y-1">
                <p>CO2: {sensorData.gases?.co2 || 0} ppm</p>
                <p>NH3: {sensorData.gases?.nh3 || 0} ppm</p>
              </div>
              <p className={`text-xs font-medium ${getStatusColor(sensorData.gases, 'gases')}`}>
                {getStatusText(sensorData.gases, 'gases')}
              </p>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💨</span>
            </div>
          </div>
        </div>

        {/* Light Detection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Light Detection</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.lightDetected, 'light')}`}>
                {sensorData.lightDetected ? 'Light' : 'Dark'}
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.lightDetected, 'light')}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">☀️</span>
            </div>
          </div>
        </div>

        {/* Rain Detection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rain Detection</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.rainLevelRaw, 'rain')}`}>
                {sensorData.rainLevelRaw}
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.rainLevelRaw, 'rain')}</p>
              <p className="text-xs text-gray-400">Raw ADC</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌧️</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className={`text-2xl font-bold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Active' : 'Offline'}
              </p>
              <p className="text-xs text-gray-500">
                {isOnline ? 'All systems operational' : 'Device disconnected'}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className="text-2xl">{isOnline ? '✅' : '❌'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Relay Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Relay Status</p>
              <p className={`text-2xl font-bold ${getStatusColor(sensorData.relayStatus === 'on', 'relay')}`}>
                {sensorData.relayStatus === 'on' ? 'ON' : 'OFF'}
              </p>
              <p className="text-xs text-gray-500">{getStatusText(sensorData.relayStatus === 'on', 'relay')}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔌</span>
            </div>
          </div>
        </div>

        {/* Data Quality */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Quality</p>
              <p className={`text-2xl font-bold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Good' : 'Poor'}
              </p>
              <p className="text-xs text-gray-500">
                {isOnline ? 'All sensors reading' : 'Connection issues'}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className="text-2xl">{isOnline ? '📊' : '⚠️'}</span>
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Update</p>
              <p className="text-lg font-bold text-gray-900">
                {formatTimestamp(sensorData.timestamp).split(' ')[1] || 'Never'}
              </p>
              <p className="text-xs text-gray-500">
                {formatTimestamp(sensorData.timestamp).split(' ')[0] || 'No data'}
              </p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🕒</span>
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Device Info</p>
              <p className="text-lg font-bold text-gray-900">{deviceId}</p>
              <p className="text-xs text-gray-500">
                {isOnline ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Temperature Range</p>
            <p className="text-lg font-semibold text-gray-900">
              {Math.min(sensorData.airTemperature, sensorData.soilTemperature)}°C - {Math.max(sensorData.airTemperature, sensorData.soilTemperature)}°C
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Humidity Level</p>
            <p className="text-lg font-semibold text-gray-900">{sensorData.airHumidity}%</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Moisture Status</p>
            <p className={`text-lg font-semibold ${getStatusColor(sensorData.soilMoisturePct, 'moisture')}`}>
              {getStatusText(sensorData.soilMoisturePct, 'moisture')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeSensorCards;
