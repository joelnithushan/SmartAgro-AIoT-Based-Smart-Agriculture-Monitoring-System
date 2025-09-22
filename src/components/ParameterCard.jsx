import React from 'react';

const ParameterCard = ({ parameter, value, unit, recommendedRange, isOutOfRange }) => {
  const getStatusColor = () => {
    if (isOutOfRange) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (isOutOfRange) return '⚠️';
    return '✅';
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium capitalize">{parameter}</h4>
        <span className="text-lg">{getStatusIcon()}</span>
      </div>
      
      <div className="text-2xl font-bold mb-1">
        {value !== null && value !== undefined ? `${value}${unit}` : 'N/A'}
      </div>
      
      {recommendedRange && (
        <div className="text-sm opacity-75">
          Recommended: {recommendedRange.min} - {recommendedRange.max}{unit}
        </div>
      )}
      
      {isOutOfRange && (
        <div className="text-sm font-medium mt-2">
          ⚠️ Out of recommended range
        </div>
      )}
    </div>
  );
};

export default ParameterCard;