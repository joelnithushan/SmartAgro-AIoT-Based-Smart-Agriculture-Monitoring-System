import React, { useState } from 'react';

const CropSelector = ({ 
  crops, 
  predefinedCrops, 
  selectedCrop, 
  onSelectCrop, 
  onAddCrop, 
  onAddPredefinedCrop 
}) => {
  const [showPredefined, setShowPredefined] = useState(false);

  const handleAddPredefinedCrop = async (predefinedCrop) => {
    await onAddPredefinedCrop(predefinedCrop);
    setShowPredefined(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Your Crops</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPredefined(!showPredefined)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Browse Crops
          </button>
          <button
            onClick={onAddCrop}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Add Custom Crop
          </button>
        </div>
      </div>

      {/* Predefined Crops */}
      {showPredefined && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3">Recommended Crops for Sri Lanka</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {predefinedCrops.map((crop, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <div className="font-medium text-gray-900">{crop.cropName}</div>
                  {crop.variety && (
                    <div className="text-sm text-gray-600">{crop.variety}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">{crop.notes}</div>
                </div>
                <button
                  onClick={() => handleAddPredefinedCrop(crop)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowPredefined(false)}
            className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
          >
            Hide recommendations
          </button>
        </div>
      )}

      {/* User's Crops */}
      {crops.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🌱</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No crops added yet</h4>
          <p className="text-gray-600 mb-4">
            Start by adding crops from our recommendations or create your own custom crop
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crops.map((crop) => (
            <div
              key={crop.id}
              onClick={() => onSelectCrop(crop)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedCrop?.id === crop.id
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{crop.cropName}</h4>
                  {crop.variety && (
                    <p className="text-sm text-gray-600 mt-1">{crop.variety}</p>
                  )}
                  <div className="flex items-center mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      crop.source === 'predefined' 
                        ? 'bg-blue-100 text-blue-800' 
                        : crop.source === 'ai-recommended'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {crop.source === 'predefined' ? 'Recommended' : 
                       crop.source === 'ai-recommended' ? 'AI Suggested' : 'Custom'}
                    </span>
                  </div>
                </div>
                {selectedCrop?.id === crop.id && (
                  <div className="ml-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
              </div>
              
              {crop.notes && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {crop.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CropSelector;
