import React from 'react';

const CropDetails = ({ crop, sensorData, onEdit, onDelete }) => {
  const getComplianceStatus = (value, range) => {
    if (!range) return { status: 'unknown', color: 'gray' };
    
    if (value < range.min * 0.9 || value > range.max * 1.1) {
      return { status: 'critical', color: 'red' };
    } else if (value < range.min || value > range.max) {
      return { status: 'warning', color: 'yellow' };
    }
    return { status: 'good', color: 'green' };
  };

  const parameters = [
    {
      label: 'Soil Moisture',
      current: sensorData?.soilMoisturePct || 0,
      recommended: crop.recommendedRanges?.soilMoisturePct,
      unit: '%'
    },
    {
      label: 'Air Temperature',
      current: sensorData?.airTemperature || 0,
      recommended: crop.recommendedRanges?.airTemperature,
      unit: '°C'
    },
    {
      label: 'Air Humidity',
      current: sensorData?.airHumidity || 0,
      recommended: crop.recommendedRanges?.airHumidity,
      unit: '%'
    },
    {
      label: 'Soil Temperature',
      current: sensorData?.soilTemperature || 0,
      recommended: crop.recommendedRanges?.soilTemperature,
      unit: '°C'
    },
    {
      label: 'Air Quality Index',
      current: sensorData?.airQualityIndex || 0,
      recommended: crop.recommendedRanges?.airQualityIndex,
      unit: 'AQI'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{crop.cropName}</h3>
          {crop.variety && (
            <p className="text-gray-600 mt-1">Variety: {crop.variety}</p>
          )}
          <div className="flex items-center mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              crop.source === 'predefined' 
                ? 'bg-blue-100 text-blue-800' 
                : crop.source === 'ai-recommended'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {crop.source === 'predefined' ? 'Recommended Crop' : 
               crop.source === 'ai-recommended' ? 'AI Suggested' : 'Custom Crop'}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(crop)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(crop.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Notes */}
      {crop.notes && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
          <p className="text-gray-700 text-sm">{crop.notes}</p>
        </div>
      )}

      {/* Parameter Comparison */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4">Current vs Recommended Conditions</h4>
        <div className="space-y-4">
          {parameters.map((param, index) => {
            const compliance = getComplianceStatus(param.current, param.recommended);
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{param.label}</div>
                  <div className="text-sm text-gray-600">
                    Current: <span className="font-medium">{param.current.toFixed(1)}{param.unit}</span>
                    {param.recommended && (
                      <>
                        {' • '}Recommended: {param.recommended.min}–{param.recommended.max}{param.unit}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="ml-4">
                  {param.recommended ? (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      compliance.color === 'green' ? 'bg-green-100 text-green-800' :
                      compliance.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      compliance.color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {compliance.status === 'good' ? '✓ Good' :
                       compliance.status === 'warning' ? '⚠ Warning' :
                       compliance.status === 'critical' ? '✗ Critical' :
                       '? Unknown'}
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      No range set
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Status */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Crop Status Summary</h4>
        <div className="text-sm text-blue-700">
          {(() => {
            const criticalCount = parameters.filter(p => 
              getComplianceStatus(p.current, p.recommended).status === 'critical'
            ).length;
            
            const warningCount = parameters.filter(p => 
              getComplianceStatus(p.current, p.recommended).status === 'warning'
            ).length;

            if (criticalCount > 0) {
              return `⚠️ ${criticalCount} parameter${criticalCount > 1 ? 's' : ''} in critical range. Immediate attention required.`;
            } else if (warningCount > 0) {
              return `📊 ${warningCount} parameter${warningCount > 1 ? 's' : ''} outside optimal range. Monitor closely.`;
            } else {
              return `✅ All parameters within recommended ranges. Crop conditions are optimal.`;
            }
          })()}
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          Added on {crop.addedAt ? new Date(crop.addedAt.toDate()).toLocaleDateString() : 'Unknown'}
        </div>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          onClick={() => {
            // TODO: Implement add to farm functionality
            alert('Add to Farm functionality coming soon!');
          }}
        >
          Add Crop to Farm
        </button>
      </div>
    </div>
  );
};

export default CropDetails;
