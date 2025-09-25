import React from 'react';

const CropDetails = ({ crop, onEdit, onDelete }) => {
  const formatRange = (range) => {
    if (!range) return 'Not specified';
    return `${range.min} - ${range.max}`;
  };

  const getRangeStatus = (value, range) => {
    if (!range || !value) return 'unknown';
    if (value >= range.min && value <= range.max) return 'normal';
    if (value < range.min * 0.9 || value > range.max * 1.1) return 'critical';
    return 'warning';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Crop Details</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(crop)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(crop)}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Basic Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Crop Name</label>
              <p className="mt-1 text-sm text-gray-900">{crop.cropName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Variety</label>
              <p className="mt-1 text-sm text-gray-900">{crop.variety || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Source</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">{crop.source || 'user'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Added Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {crop.addedAt ? new Date(crop.addedAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {crop.notes && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{crop.notes}</p>
          </div>
        )}

        {/* Recommended Ranges */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Recommended Parameter Ranges</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">💧 Soil Moisture</label>
              <p className="text-sm text-gray-900">{formatRange(crop.recommendedRanges?.soilMoisturePct)}%</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">🌡️ Soil Temperature</label>
              <p className="text-sm text-gray-900">{formatRange(crop.recommendedRanges?.soilTemperature)}°C</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">🌡️ Air Temperature</label>
              <p className="text-sm text-gray-900">{formatRange(crop.recommendedRanges?.airTemperature)}°C</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">💨 Air Humidity</label>
              <p className="text-sm text-gray-900">{formatRange(crop.recommendedRanges?.airHumidity)}%</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">🌬️ Air Quality Index</label>
              <p className="text-sm text-gray-900">{formatRange(crop.recommendedRanges?.airQualityIndex)} ppm</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onEdit(crop)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>✏️</span>
              <span>Edit Crop</span>
            </button>
            <button
              onClick={() => onDelete(crop)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Delete Crop</span>
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>🚜</span>
              <span>Add to Farm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropDetails;
