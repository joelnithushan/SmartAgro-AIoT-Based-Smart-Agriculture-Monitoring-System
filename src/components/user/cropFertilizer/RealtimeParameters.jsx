import React from 'react';

const RealtimeParameters = ({ sensorData, isOnline, loading, selectedCrop, onAnalyze, analyzing }) => {
  // Debug sensor data
  console.log('📊 RealtimeParameters - Sensor Data:', sensorData);
  console.log('📊 RealtimeParameters - Is Online:', isOnline);
  console.log('📊 RealtimeParameters - Loading:', loading);
  const getParameterStatus = (value, range) => {
    if (!range || !selectedCrop) return 'normal';
    
    if (value < range.min * 0.9 || value > range.max * 1.1) {
      return 'critical';
    } else if (value < range.min || value > range.max) {
      return 'warning';
    }
    return 'normal';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'normal': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const parameters = [
    {
      label: 'Soil Moisture',
      value: sensorData?.soilMoisturePct || 0,
      unit: '%',
      rawValue: sensorData?.soilMoistureRaw || 0,
      icon: '💧',
      range: selectedCrop?.recommendedRanges?.soilMoisturePct
    },
    {
      label: 'Soil Temperature',
      value: sensorData?.soilTemperature || 0,
      unit: '°C',
      icon: '🌡️',
      range: selectedCrop?.recommendedRanges?.soilTemperature
    },
    {
      label: 'Air Temperature',
      value: sensorData?.airTemperature || 0,
      unit: '°C',
      icon: '🌤️',
      range: selectedCrop?.recommendedRanges?.airTemperature
    },
    {
      label: 'Air Humidity',
      value: sensorData?.airHumidity || 0,
      unit: '%',
      icon: '💨',
      range: selectedCrop?.recommendedRanges?.airHumidity
    },
    {
      label: 'Air Quality Index',
      value: sensorData?.airQualityIndex || 0,
      unit: 'AQI',
      icon: '🏭',
      range: selectedCrop?.recommendedRanges?.airQualityIndex
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Real-time Parameters</h3>
        {!isOnline && (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            Device Offline
          </span>
        )}
        {isOnline && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Live
          </span>
        )}
      </div>

      <div className="space-y-4">
        {parameters.map((param, index) => {
          const status = getParameterStatus(param.value, param.range);
          const statusColor = getStatusColor(status);

          return (
            <div key={index} className={`p-4 rounded-lg border ${statusColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{param.icon}</span>
                  <span className="font-medium text-gray-900">{param.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {param.value.toFixed(1)}{param.unit}
                  </div>
                  {param.rawValue !== undefined && (
                    <div className="text-sm text-gray-500">
                      Raw: {param.rawValue}
                    </div>
                  )}
                </div>
              </div>

              {param.range && selectedCrop && (
                <div className="mt-2 text-sm text-gray-600">
                  Recommended: {param.range.min}–{param.range.max}{param.unit}
                  {status !== 'normal' && (
                    <div className={`mt-1 text-xs ${
                      status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {status === 'critical' ? 'Critical: ' : 'Warning: '}
                      {param.value < param.range.min 
                        ? `${param.label} is below recommended range`
                        : `${param.label} is above recommended range`
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gas Levels */}
      {sensorData?.gases && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Gas Levels</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {sensorData.gases.co2 || 0} ppm
              </div>
              <div className="text-sm text-gray-600">CO2</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {sensorData.gases.nh3 || 0} ppm
              </div>
              <div className="text-sm text-gray-600">NH3</div>
            </div>
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <div className="mt-6">
        <button
          onClick={onAnalyze}
          disabled={!isOnline || analyzing}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            !isOnline || analyzing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {analyzing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            'Analyze Conditions'
          )}
        </button>
        {!isOnline && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Device must be online to analyze
          </p>
        )}
      </div>

      {/* Last Update */}
      {sensorData?.timestamp && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {new Date(sensorData.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default RealtimeParameters;
