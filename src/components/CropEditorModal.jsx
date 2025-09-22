import React, { useState, useEffect } from 'react';

const CropEditorModal = ({ isOpen, onClose, onSave, editingCrop }) => {
  const [formData, setFormData] = useState({
    cropName: '',
    variety: '',
    notes: '',
    recommendedRanges: {
      temperature: { min: 20, max: 30 },
      humidity: { min: 40, max: 80 },
      soilMoisture: { min: 30, max: 70 },
      ph: { min: 6.0, max: 7.5 },
      lightIntensity: { min: 1000, max: 10000 }
    }
  });

  useEffect(() => {
    if (editingCrop) {
      setFormData({
        cropName: editingCrop.cropName || '',
        variety: editingCrop.variety || '',
        notes: editingCrop.notes || '',
        recommendedRanges: editingCrop.recommendedRanges || formData.recommendedRanges
      });
    } else {
      setFormData({
        cropName: '',
        variety: '',
        notes: '',
        recommendedRanges: {
          temperature: { min: 20, max: 30 },
          humidity: { min: 40, max: 80 },
          soilMoisture: { min: 30, max: 70 },
          ph: { min: 6.0, max: 7.5 },
          lightIntensity: { min: 1000, max: 10000 }
        }
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