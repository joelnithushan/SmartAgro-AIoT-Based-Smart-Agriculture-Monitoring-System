import React, { useState, useEffect } from 'react';

const CropEditorModal = ({ isOpen, onClose, onSave, editingCrop }) => {
  const defaultRanges = {
    airTemperature: { min: 20, max: 30 },
    airHumidity: { min: 40, max: 80 },
    soilMoisturePct: { min: 30, max: 70 },
    soilTemperature: { min: 15, max: 35 },
    airQualityIndex: { min: 0, max: 500 }
  };

  const [formData, setFormData] = useState({
    cropName: '',
    variety: '',
    notes: '',
    recommendedRanges: { ...defaultRanges }
  });

  useEffect(() => {
    if (editingCrop) {
      setFormData({
        cropName: editingCrop.cropName || '',
        variety: editingCrop.variety || '',
        notes: editingCrop.notes || '',
        recommendedRanges: {
          ...defaultRanges,
          ...(editingCrop.recommendedRanges || {})
        }
      });
    } else {
      setFormData({
        cropName: '',
        variety: '',
        notes: '',
        recommendedRanges: { ...defaultRanges }
      });
    }
  }, [editingCrop]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">
          {editingCrop ? 'Edit Crop' : 'Add New Crop'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crop Name
            </label>
            <input
              type="text"
              value={formData.cropName}
              onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variety
            </label>
            <input
              type="text"
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>

          {/* Recommended Ranges */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Recommended Ranges</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Air Temperature (°C)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={formData.recommendedRanges?.airTemperature?.min || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recommendedRanges: {
                        ...formData.recommendedRanges,
                        airTemperature: { 
                          ...(formData.recommendedRanges?.airTemperature || {}), 
                          min: parseFloat(e.target.value) || 0 
                        }
                      }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={formData.recommendedRanges?.airTemperature?.max || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recommendedRanges: {
                        ...formData.recommendedRanges,
                        airTemperature: { 
                          ...(formData.recommendedRanges?.airTemperature || {}), 
                          max: parseFloat(e.target.value) || 0 
                        }
                      }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Air Humidity (%)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={formData.recommendedRanges?.airHumidity?.min || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recommendedRanges: {
                        ...formData.recommendedRanges,
                        airHumidity: { 
                          ...(formData.recommendedRanges?.airHumidity || {}), 
                          min: parseFloat(e.target.value) || 0 
                        }
                      }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={formData.recommendedRanges?.airHumidity?.max || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recommendedRanges: {
                        ...formData.recommendedRanges,
                        airHumidity: { 
                          ...(formData.recommendedRanges?.airHumidity || {}), 
                          max: parseFloat(e.target.value) || 0 
                        }
                      }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soil Moisture (%)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={formData.recommendedRanges?.soilMoisturePct?.min || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recommendedRanges: {
                        ...formData.recommendedRanges,
                        soilMoisturePct: { 
                          ...(formData.recommendedRanges?.soilMoisturePct || {}), 
                          min: parseFloat(e.target.value) || 0 
                        }
                      }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={formData.recommendedRanges?.soilMoisturePct?.max || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recommendedRanges: {
                        ...formData.recommendedRanges,
                        soilMoisturePct: { 
                          ...(formData.recommendedRanges?.soilMoisturePct || {}), 
                          max: parseFloat(e.target.value) || 0 
                        }
                      }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soil Temperature (°C)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={formData.recommendedRanges?.soilTemperature?.min || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recommendedRanges: {
                        ...formData.recommendedRanges,
                        soilTemperature: { 
                          ...(formData.recommendedRanges?.soilTemperature || {}), 
                          min: parseFloat(e.target.value) || 0 
                        }
                      }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={formData.recommendedRanges?.soilTemperature?.max || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recommendedRanges: {
                        ...formData.recommendedRanges,
                        soilTemperature: { 
                          ...(formData.recommendedRanges?.soilTemperature || {}), 
                          max: parseFloat(e.target.value) || 0 
                        }
                      }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {editingCrop ? 'Update' : 'Add'} Crop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CropEditorModal;