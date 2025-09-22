import React from 'react';

const DeviceMetricsCard = ({ sensorData, isOnline, deviceInfo }) => {
  // Helper function to get status color
  const getStatusColor = (value, type) => {
    if (!isOnline) return 'bg-red-50 text-red-600';
    
    switch (type) {
      case 'soilMoisture':
        if (value < 20) return 'bg-red-50 text-red-600';
        if (value < 40) return 'bg-yellow-50 text-yellow-600';
        return 'bg-green-50 text-green-600';
      
      case 'temperature':
        if (value < 10 || value > 35) return 'bg-red-50 text-red-600';
        if (value < 15 || value > 30) return 'bg-yellow-50 text-yellow-600';
        return 'bg-green-50 text-green-600';
      
      case 'humidity':
        if (value < 30 || value > 80) return 'bg-red-50 text-red-600';
        if (value < 40 || value > 70) return 'bg-yellow-50 text-yellow-600';
        return 'bg-green-50 text-green-600';
      
      case 'airQuality':
        if (value > 200) return 'bg-red-50 text-red-600';
        if (value > 100) return 'bg-yellow-50 text-yellow-600';
        return 'bg-green-50 text-green-600';
      
      case 'light':
        return value ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600';
      
      case 'rain':
        return value ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600';
      
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  // Helper function to format values
  const formatValue = (value, type) => {
    if (!isOnline) {
      switch (type) {
        case 'temperature':
          return '0.0°C';
        case 'humidity':
        case 'soilMoisture':
          return '0%';
        case 'airQuality':
          return '0 ppm';
        case 'light':
          return 'Dark';
        case 'rain':
          return 'No Rain';
        default:
          return '0';
      }
    }
    
    switch (type) {
      case 'temperature':
        return `${value.toFixed(1)}°C`;
      case 'humidity':
      case 'soilMoisture':
        return `${value}%`;
      case 'airQuality':
        return `${value} ppm`;
      case 'light':
        return value ? 'Light' : 'Dark';
      case 'rain':
        return value ? 'Rain Detected' : 'No Rain';
      default:
        return value.toString();
    }
  };

  const metrics = [
    {
      title: 'Soil Moisture',
      value: isOnline ? sensorData.soilMoisturePct : 0,
      rawValue: isOnline ? sensorData.soilMoistureRaw : 0,
      type: 'soilMoisture',
      icon: '💧',
      unit: '%',
      description: 'Soil moisture percentage'
    },
    {
      title: 'Air Temperature',
      value: isOnline ? sensorData.airTemperature : 0,
      type: 'temperature',
      icon: '🌡️',
      unit: '°C',
      description: 'Ambient air temperature'
    },
    {
      title: 'Air Humidity',
      value: isOnline ? sensorData.airHumidity : 0,
      type: 'humidity',
      icon: '💨',
      unit: '%',
      description: 'Relative humidity'
    },
    {
      title: 'Soil Temperature',
      value: isOnline ? sensorData.soilTemperature : 0,
      type: 'temperature',
      icon: '🌱',
      unit: '°C',
      description: 'Soil temperature'
    },
    {
      title: 'Air Quality',
      value: isOnline ? sensorData.airQualityIndex : 0,
      co2: isOnline ? sensorData.gases?.co2 : 0,
      nh3: isOnline ? sensorData.gases?.nh3 : 0,
      type: 'airQuality',
      icon: '🌬️',
      unit: 'ppm',
      description: 'Air quality index'
    },
    {
      title: 'Light Detection',
      value: isOnline ? sensorData.lightDetected : 0,
      type: 'light',
      icon: '☀️',
      description: 'Light sensor status'
    },
    {
      title: 'Rain Detection',
      value: isOnline ? (sensorData.rainLevelRaw > 1000) : false, // Threshold for rain detection
      rawValue: isOnline ? sensorData.rainLevelRaw : 0,
      type: 'rain',
      icon: '🌧️',
      description: 'Rain sensor status'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Device Metrics</h3>
          {deviceInfo && (
            <p className="text-sm text-gray-600">{deviceInfo.farmName} • {deviceInfo.location}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isOnline 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              !isOnline 
                ? 'bg-red-50 border-red-200' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{metric.icon}</span>
                <h4 className="font-medium text-gray-900">{metric.title}</h4>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className={`text-2xl font-bold ${getStatusColor(metric.value, metric.type)}`}>
                {formatValue(metric.value, metric.type)}
              </div>
              
              {metric.rawValue !== undefined && (
                <div className="text-sm text-gray-500">
                  Raw: {metric.rawValue}
                </div>
              )}
              
              {metric.co2 !== undefined && (
                <div className="text-sm text-gray-500">
                  CO₂: {metric.co2} ppm
                </div>
              )}
              
              {metric.nh3 !== undefined && (
                <div className="text-sm text-gray-500">
                  NH₃: {metric.nh3} ppm
                </div>
              )}
              
              <div className="text-xs text-gray-400">
                {metric.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        {isOnline ? (
          sensorData.timestamp && sensorData.timestamp !== 0 && (
            <p className="text-sm text-gray-500">
              Last updated: {new Date(sensorData.timestamp).toLocaleString()}
            </p>
          )
        ) : (
          <p className="text-sm text-red-500" title="Device offline - last seen more than 20 seconds ago">
            Device offline - all values set to 0
          </p>
        )}
      </div>
    </div>
  );
};

export default DeviceMetricsCard;
