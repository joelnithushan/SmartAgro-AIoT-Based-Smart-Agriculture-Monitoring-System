import React from 'react';

const RealTimeParameters = ({ sensorData, isOnline, selectedCrop }) => {
  // Helper function to determine parameter status
  const getParameterStatus = (value, range) => {
    if (!range || !value) return 'unknown';
    if (value >= range.min && value <= range.max) return 'normal';
    if (value < range.min * 0.9 || value > range.max * 1.1) return 'critical';
    return 'warning';
  };

  // Helper function to get status styling
  const getStatusStyling = (status) => {
    switch (status) {
      case 'normal':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🚨';
      default:
        return '❓';
    }
  };

  // Helper function to get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'normal':
        return 'In Range';
      case 'warning':
        return 'Slightly Out';
      case 'critical':
        return 'Out of Range';
      default:
        return 'Unknown';
    }
  };

  // Helper function to format value with unit
  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(1)}${unit}`;
  };

  // Get recommended ranges from selected crop
  const getRecommendedRange = (parameter) => {
    if (!selectedCrop?.recommendedRanges) return null;
    return selectedCrop.recommendedRanges[parameter];
  };

  const parameters = [
    {
      key: 'soilMoisturePct',
      label: '💧 Soil Moisture',
      value: sensorData.soilMoisturePct,
      unit: '%',
      rawValue: sensorData.soilMoistureRaw,
      rawUnit: '',
      description: 'Soil moisture percentage'
    },
    {
      key: 'soilTemperature',
      label: '🌡️ Soil Temperature',
      value: sensorData.soilTemperature,
      unit: '°C',
      description: 'Soil temperature'
    },
    {
      key: 'airTemperature',
      label: '🌡️ Air Temperature',
      value: sensorData.airTemperature,
      unit: '°C',
      description: 'Air temperature'
    },
    {
      key: 'airHumidity',
      label: '💨 Air Humidity',
      value: sensorData.airHumidity,
      unit: '%',
      description: 'Air humidity percentage'
    },
    {
      key: 'airQualityIndex',
      label: '🌬️ Air Quality',
      value: sensorData.airQualityIndex,
      unit: 'ppm',
      description: 'Air quality index',
      gases: {
        co2: sensorData.gases?.co2,
        nh3: sensorData.gases?.nh3
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-time Parameters</h2>
        
        {!isOnline && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 text-lg mr-2">📴</span>
              <div>
                <h3 className="text-red-800 font-medium">Device Offline</h3>
                <p className="text-red-700 text-sm">All values shown as 0</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {parameters.map((param) => {
            const range = getRecommendedRange(param.key);
            const status = getParameterStatus(param.value, range);
            const statusStyling = getStatusStyling(status);
            const statusIcon = getStatusIcon(status);
            const statusText = getStatusText(status);

            return (
              <div
                key={param.key}
                className={`p-4 rounded-lg border ${statusStyling} transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{param.label.split(' ')[0]}</span>
                    <span className="text-sm text-gray-600">{param.label.split(' ').slice(1).join(' ')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{statusIcon}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      status === 'normal' ? 'bg-green-100 text-green-800' :
                      status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      status === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusText}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatValue(param.value, param.unit)}
                    </span>
                    {param.rawValue !== undefined && param.rawValue !== param.value && (
                      <span className="text-sm text-gray-500">
                        Raw: {formatValue(param.rawValue, param.rawUnit)}
                      </span>
                    )}
                  </div>

                  {range && (
                    <div className="text-xs text-gray-600">
                      Recommended: {range.min}{param.unit} - {range.max}{param.unit}
                    </div>
                  )}

                  {param.gases && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {param.gases.co2 !== undefined && (
                        <div>CO₂: {formatValue(param.gases.co2, 'ppm')}</div>
                      )}
                      {param.gases.nh3 !== undefined && (
                        <div>NH₃: {formatValue(param.gases.nh3, 'ppm')}</div>
                      )}
                    </div>
                  )}

                  {status !== 'normal' && range && (
                    <div className={`text-xs ${
                      status === 'critical' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {param.value < range.min 
                        ? `${param.label.split(' ').slice(1).join(' ')} is below recommended ${range.min}${param.unit}`
                        : `${param.label.split(' ').slice(1).join(' ')} is above recommended ${range.max}${param.unit}`
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedCrop && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              📊 Monitoring: {selectedCrop.cropName}
            </h3>
            <p className="text-xs text-blue-700">
              {selectedCrop.variety && `Variety: ${selectedCrop.variety}`}
            </p>
            <p className="text-xs text-blue-700">
              Real-time comparison with recommended ranges
            </p>
          </div>
        )}

        {!selectedCrop && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              ℹ️ No Crop Selected
            </h3>
            <p className="text-xs text-gray-600">
              Select a crop to see recommended ranges and status indicators
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeParameters;
