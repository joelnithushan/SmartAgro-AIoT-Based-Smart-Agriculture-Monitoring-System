import React from 'react';

const ParameterCard = ({ parameter, label, value, unit, recommendedRange, isOutOfRange, isOnline }) => {
  const getStatusColor = () => {
    if (isOutOfRange) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (isOutOfRange) return '⚠️';
    return '✅';
  };

  const displayLabel = label || parameter;
  const displayValue = value !== null && value !== undefined ? value : 'N/A';
  const isOffline = isOnline === false;

  return (
    <div className={`p-4 rounded-lg border ${isOffline ? 'bg-gray-50 border-gray-200' : getStatusColor()}`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-lg capitalize text-gray-800">
          {displayLabel}
        </h4>
        <span className="text-lg">
          {isOffline ? '📴' : getStatusIcon()}
        </span>
      </div>
      
      <div className="text-3xl font-bold mb-2 text-gray-900">
        {displayValue}
        {displayValue !== 'N/A' && unit && (
          <span className="text-lg text-gray-600 ml-1">{unit}</span>
        )}
      </div>
      
      {recommendedRange && !isOffline && (
        <div className="text-sm text-gray-600 bg-gray-100 rounded px-2 py-1">
          <span className="font-medium">Recommended:</span> {recommendedRange.min} - {recommendedRange.max}{unit}
        </div>
      )}
      
      {isOutOfRange && !isOffline && (
        <div className="text-sm font-medium mt-2 text-red-600 bg-red-100 rounded px-2 py-1">
          ⚠️ Out of recommended range
        </div>
      )}

      {isOffline && (
        <div className="text-sm text-gray-500 mt-2">
          📴 Device offline
        </div>
      )}
    </div>
  );
};

export default ParameterCard;