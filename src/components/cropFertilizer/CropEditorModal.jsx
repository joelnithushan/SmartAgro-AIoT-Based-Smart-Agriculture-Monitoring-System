import React, { useState, useEffect } from 'react';

const CropEditorModal = ({ crop, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    cropName: '',
    variety: '',
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 20, max: 30 },
      airHumidity: { min: 40, max: 70 },
      soilTemperature: { min: 18, max: 28 },
      airQualityIndex: { min: 0, max: 100 }
    },
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (crop) {
      setFormData({
        cropName: crop.cropName || '',
        variety: crop.variety || '',
        recommendedRanges: crop.recommendedRanges || {
          soilMoisturePct: { min: 25, max: 45 },
          airTemperature: { min: 20, max: 30 },
          airHumidity: { min: 40, max: 70 },
          soilTemperature: { min: 18, max: 28 },
          airQualityIndex: { min: 0, max: 100 }
        },
        notes: crop.notes || ''
      });
    }
  }, [crop]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRangeChange = (parameter, field, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      recommendedRanges: {
        ...prev.recommendedRanges,
        [parameter]: {
          ...prev.recommendedRanges[parameter],
          [field]: numValue
        }
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cropName.trim()) {
      newErrors.cropName = 'Crop name is required';
    }

    // Validate ranges
    Object.entries(formData.recommendedRanges).forEach(([param, range]) => {
      if (range.min >= range.max) {
        newErrors[`${param}_range`] = 'Minimum must be less than maximum';
      }
      
      // Validate sensible bounds
      if (param === 'soilMoisturePct' && (range.min < 0 || range.max > 100)) {
        newErrors[`${param}_bounds`] = 'Soil moisture must be between 0-100%';
      }
      if (param === 'airHumidity' && (range.min < 0 || range.max > 100)) {
        newErrors[`${param}_bounds`] = 'Air humidity must be between 0-100%';
      }
      if ((param === 'airTemperature' || param === 'soilTemperature') && (range.min < -10 || range.max > 50)) {
        newErrors[`${param}_bounds`] = 'Temperature must be between -10°C and 50°C';
      }
      if (param === 'airQualityIndex' && (range.min < 0 || range.max > 1000)) {
        newErrors[`${param}_bounds`] = 'Air quality index must be between 0-1000 ppm';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const rangeInputs = [
    { key: 'soilMoisturePct', label: '💧 Soil Moisture (%)', unit: '%', min: 0, max: 100 },
    { key: 'airTemperature', label: '🌡️ Air Temperature (°C)', unit: '°C', min: -10, max: 50 },
    { key: 'airHumidity', label: '💨 Air Humidity (%)', unit: '%', min: 0, max: 100 },
    { key: 'soilTemperature', label: '🌡️ Soil Temperature (°C)', unit: '°C', min: -10, max: 50 },
    { key: 'airQualityIndex', label: '🌬️ Air Quality Index (ppm)', unit: 'ppm', min: 0, max: 1000 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {crop ? 'Edit Crop' : 'Add Custom Crop'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    name="cropName"
                    value={formData.cropName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.cropName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter crop name"
                  />
                  {errors.cropName && (
                    <p className="mt-1 text-sm text-red-600">{errors.cropName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variety
                  </label>
                  <input
                    type="text"
                    name="variety"
                    value={formData.variety}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter variety (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Recommended Ranges */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recommended Parameter Ranges</h3>
              <div className="space-y-4">
                {rangeInputs.map(({ key, label, unit, min, max }) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {label}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="number"
                          min={min}
                          max={max}
                          step="0.1"
                          value={formData.recommendedRanges[key]?.min || ''}
                          onChange={(e) => handleRangeChange(key, 'min', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors[`${key}_range`] || errors[`${key}_bounds`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="number"
                          min={min}
                          max={max}
                          step="0.1"
                          value={formData.recommendedRanges[key]?.max || ''}
                          onChange={(e) => handleRangeChange(key, 'max', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors[`${key}_range`] || errors[`${key}_bounds`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                    {(errors[`${key}_range`] || errors[`${key}_bounds`]) && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors[`${key}_range`] || errors[`${key}_bounds`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Additional notes about this crop (optional)"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {crop ? 'Update Crop' : 'Add Crop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CropEditorModal;
