import React from 'react';

const CropSelector = ({ crops, selectedCrop, onCropSelect, onEditCrop, onDeleteCrop, onAddCrop }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Crop</h3>
        <button
          onClick={onAddCrop}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
        >
          Add New
        </button>
      </div>
      
      {crops.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No crops added yet</p>
          <p className="text-sm">Click "Add New" to create your first crop</p>
        </div>
      ) : (
        <div className="space-y-2">
          {crops.map((crop) => (
            <div
              key={crop.id}
              className={`p-3 rounded-lg border transition-colors ${
                selectedCrop?.id === crop.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div 
                className="cursor-pointer"
                onClick={() => onCropSelect && onCropSelect(crop)}
              >
                <h4 className="font-medium text-gray-900">{crop.cropName}</h4>
                <p className="text-sm text-gray-600">{crop.variety}</p>
              </div>
              
              {/* Action buttons */}
              <div className="flex space-x-2 mt-2">
                {onEditCrop && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditCrop(crop);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                )}
                {onDeleteCrop && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCrop(crop.id);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CropSelector;