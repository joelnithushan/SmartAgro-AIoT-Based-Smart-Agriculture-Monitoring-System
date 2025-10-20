import React, { useState, useEffect } from 'react';

const CropModal = ({ crop, predefinedCrops, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    cropName: '',
    variety: '',
    recommendedRanges: {
      soilMoisturePct: { min: 40, max: 80 },
      airTemperature: { min: 20, max: 35 },
      airHumidity: { min: 50, max: 80 },
      soilTemperature: { min: 15, max: 30 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: '',
    source: 'user'
  });
  
  const [errors, setErrors] = useState({});
  const [selectedPredefined, setSelectedPredefined] = useState('');

  useEffect(() => {
    if (crop) {
      setFormData({
        cropName: crop.cropName || '',
        variety: crop.variety || '',
        recommendedRanges: crop.recommendedRanges || {
          soilMoisturePct: { min: 40, max: 80 },
          airTemperature: { min: 20, max: 35 },
          airHumidity: { min: 50, max: 80 },
          soilTemperature: { min: 15, max: 30 },
          airQualityIndex: { min: 0, max: 50 }
        },
        notes: crop.notes || '',
        source: crop.source || 'user'
      });
    }
  }, [crop]);

  const handlePredefinedSelect = (e) => {
    const selectedIndex = e.target.value;
    setSelectedPredefined(selectedIndex);
    
    if (selectedIndex !== '') {
      const predefined = predefinedCrops[parseInt(selectedIndex)];
      setFormData({
        ...formData,
        cropName: predefined.cropName,
        variety: predefined.variety || '',
        recommendedRanges: predefined.recommendedRanges,
        notes: predefined.notes || '',
        source: 'predefined'
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cropName.trim()) {
      newErrors.cropName = 'Crop name is required';
    }

    // Validate ranges
    Object.keys(formData.recommendedRanges).forEach(param => {
      const range = formData.recommendedRanges[param];
      if (range.min >= range.max) {
        newErrors[param] = 'Minimum value must be less than maximum value';
      }
      if (range.min < 0) {
        newErrors[`${param}_min`] = 'Minimum value cannot be negative';
      }
      if (param === 'soilMoisturePct' || param === 'airHumidity') {
        if (range.max > 100) {
          newErrors[`${param}_max`] = 'Maximum percentage cannot exceed 100%';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleRangeChange = (param, field, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      recommendedRanges: {
        ...prev.recommendedRanges,
        [param]: {
          ...prev.recommendedRanges[param],
          [field]: numValue
        }
      }
    }));
  };

  const parameters = [
    { key: 'soilMoisturePct', label: 'Soil Moisture', unit: '%', max: 100 },
    { key: 'airTemperature', label: 'Air Temperature', unit: '°C', max: 50 },
    { key: 'airHumidity', label: 'Air Humidity', unit: '%', max: 100 },
    { key: 'soilTemperature', label: 'Soil Temperature', unit: '°C', max: 50 },
    { key: 'airQualityIndex', label: 'Air Quality Index', unit: 'AQI', max: 500 }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {crop ? 'Edit Crop' : 'Add New Crop'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Predefined Crop Selection */}
            {!crop && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start with a recommended crop (optional)
                </label>
                <select
                  value={selectedPredefined}
                  onChange={handlePredefinedSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a recommended crop...</option>
                  {predefinedCrops.map((crop, index) => (
                    <option key={index} value={index}>
                      {crop.cropName} {crop.variety && `(${crop.variety})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crop Name *
                </label>
                <input
                  type="text"
                  value={formData.cropName}
                  onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.cropName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Tomato, Rice, Cabbage"
                />
                {errors.cropName && (
                  <p className="text-red-500 text-xs mt-1">{errors.cropName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variety (optional)
                </label>
                <input
                  type="text"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Cherry, Basmati, Copenhagen Market"
                />
              </div>
            </div>

            {/* Recommended Ranges */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Recommended Growing Conditions</h4>
              <div className="space-y-4">
                {parameters.map((param) => (
                  <div key={param.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {param.label} ({param.unit})
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                      <input
                        type="number"
                        min="0"
                        max={param.max}
                        step="0.1"
                        value={formData.recommendedRanges[param.key]?.min || 0}
                        onChange={(e) => handleRangeChange(param.key, 'min', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors[param.key] || errors[`${param.key}_min`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                      <input
                        type="number"
                        min="0"
                        max={param.max}
                        step="0.1"
                        value={formData.recommendedRanges[param.key]?.max || 0}
                        onChange={(e) => handleRangeChange(param.key, 'max', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors[param.key] || errors[`${param.key}_max`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {(errors[param.key] || errors[`${param.key}_min`] || errors[`${param.key}_max`]) && (
                      <div className="md:col-span-3">
                        <p className="text-red-500 text-xs">
                          {errors[param.key] || errors[`${param.key}_min`] || errors[`${param.key}_max`]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Additional information about this crop..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
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
    </div>
  );
};

export default CropModal;
