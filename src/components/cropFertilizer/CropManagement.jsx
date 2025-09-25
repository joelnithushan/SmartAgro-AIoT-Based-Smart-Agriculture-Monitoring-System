import React, { useState } from 'react';
import CropSelector from './CropSelector';
import CropDetails from './CropDetails';
import CropEditorModal from './CropEditorModal';
import ConfirmModal from '../common/ConfirmModal';
import { PREDEFINED_CROPS } from '../../data/predefinedCrops';

const CropManagement = ({
  crops,
  selectedCrop,
  onCropSelect,
  onCropAdd,
  onCropUpdate,
  onCropDelete,
  recommendations,
  onAddRecommendedCrop
}) => {
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cropToDelete, setCropToDelete] = useState(null);
  const [showCropSelector, setShowCropSelector] = useState(false);

  const handleAddCrop = () => {
    setEditingCrop(null);
    setShowCropEditor(true);
  };

  const handleEditCrop = (crop) => {
    setEditingCrop(crop);
    setShowCropEditor(true);
  };

  const handleDeleteCrop = (crop) => {
    setCropToDelete(crop);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (cropToDelete) {
      onCropDelete(cropToDelete.id);
      setCropToDelete(null);
    }
    setShowDeleteConfirm(false);
  };

  const handleCropEditorSubmit = (cropData) => {
    if (editingCrop) {
      onCropUpdate(editingCrop.id, cropData);
    } else {
      onCropAdd(cropData);
    }
    setShowCropEditor(false);
    setEditingCrop(null);
  };

  const handleAddPredefinedCrop = (predefinedCrop) => {
    onCropAdd({
      ...predefinedCrop,
      source: 'predefined'
    });
    setShowCropSelector(false);
  };

  const handleAddRecommendedCrop = (recommendation) => {
    // Convert recommendation to crop format
    const cropData = {
      cropName: recommendation.name,
      variety: recommendation.variety || 'Recommended',
      recommendedRanges: recommendation.recommendedRanges || {
        soilMoisturePct: { min: 25, max: 45 },
        airTemperature: { min: 20, max: 30 },
        airHumidity: { min: 40, max: 70 },
        soilTemperature: { min: 18, max: 28 },
        airQualityIndex: { min: 0, max: 100 }
      },
      notes: `AI Recommended: ${recommendation.reason}`,
      source: 'ai_recommended'
    };
    onAddRecommendedCrop(cropData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Crop Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCropSelector(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>📋</span>
            <span>Browse Crops</span>
          </button>
          <button
            onClick={handleAddCrop}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      {/* Your Crops */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🌾</span>
          Your Crops
        </h3>

        {crops.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No crops added yet</h3>
            <p className="text-gray-600 mb-4">Browse predefined crops or add a custom one</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowCropSelector(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Crops
              </button>
              <button
                onClick={handleAddCrop}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Custom
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crops.map((crop) => (
              <div
                key={crop.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedCrop?.id === crop.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => onCropSelect(crop)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{crop.cropName}</h4>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {crop.source === 'predefined' ? 'Predefined' : 
                       crop.source === 'ai_recommended' ? 'AI Recommended' : 'Custom'}
                    </span>
                  </div>
                </div>
                
                {crop.variety && (
                  <p className="text-sm text-gray-600 mb-2">Variety: {crop.variety}</p>
                )}
                
                {crop.notes && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{crop.notes}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Added: {crop.addedAt ? new Date(crop.addedAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCrop(crop);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCrop(crop);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Crop Details */}
      {selectedCrop && (
        <CropDetails
          crop={selectedCrop}
          onEdit={handleEditCrop}
          onDelete={handleDeleteCrop}
        />
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🤖</span>
            AI Recommendations
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-4">
              Based on your current field conditions, here are some crop recommendations:
            </p>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{rec.name}</h4>
                      <p className="text-sm text-gray-600">{rec.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">{rec.recommendation}</p>
                      {rec.confidenceScore && (
                        <div className="text-xs text-blue-600 mt-1">
                          Confidence: {Math.round(rec.confidenceScore * 100)}%
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddRecommendedCrop(rec)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Add Crop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCropSelector && (
        <CropSelector
          predefinedCrops={PREDEFINED_CROPS}
          onSelect={handleAddPredefinedCrop}
          onClose={() => setShowCropSelector(false)}
        />
      )}

      {showCropEditor && (
        <CropEditorModal
          crop={editingCrop}
          onSubmit={handleCropEditorSubmit}
          onClose={() => {
            setShowCropEditor(false);
            setEditingCrop(null);
          }}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Crop"
          message={`Are you sure you want to delete "${cropToDelete?.cropName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmColor="red"
        />
      )}
    </div>
  );
};

export default CropManagement;
