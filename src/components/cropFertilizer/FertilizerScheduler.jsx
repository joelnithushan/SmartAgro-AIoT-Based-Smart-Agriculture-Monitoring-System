import React, { useState } from 'react';
import FertilizerEditorModal from './FertilizerEditorModal';
import FertilizerCalendar from './FertilizerCalendar';
import ConfirmModal from '../common/ConfirmModal';

const FertilizerScheduler = ({ fertilizers, crops, onFertilizerAdd }) => {
  const [showFertilizerEditor, setShowFertilizerEditor] = useState(false);
  const [editingFertilizer, setEditingFertilizer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fertilizerToDelete, setFertilizerToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const handleAddFertilizer = () => {
    setEditingFertilizer(null);
    setShowFertilizerEditor(true);
  };

  const handleEditFertilizer = (fertilizer) => {
    setEditingFertilizer(fertilizer);
    setShowFertilizerEditor(true);
  };

  const handleDeleteFertilizer = (fertilizer) => {
    setFertilizerToDelete(fertilizer);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (fertilizerToDelete) {
      // TODO: Implement delete functionality
      console.log('Delete fertilizer:', fertilizerToDelete.id);
    }
    setShowDeleteConfirm(false);
    setFertilizerToDelete(null);
  };

  const handleFertilizerSubmit = (fertilizerData) => {
    onFertilizerAdd(fertilizerData);
    setShowFertilizerEditor(false);
    setEditingFertilizer(null);
  };

  const getCropName = (cropId) => {
    const crop = crops.find(c => c.id === cropId);
    return crop ? crop.cropName : 'Unknown Crop';
  };

  const formatRecurrence = (recurrence) => {
    if (!recurrence || recurrence.type === 'none') return 'One-time';
    
    switch (recurrence.type) {
      case 'every_n_days':
        return `Every ${recurrence.n} days`;
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return 'Custom';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Fertilizer Schedule</h2>
        <div className="flex space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Calendar
            </button>
          </div>
          <button
            onClick={handleAddFertilizer}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div>
          {fertilizers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">🌿</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No fertilizer schedules</h3>
              <p className="text-gray-600 mb-4">Create a fertilizer schedule for your crops</p>
              <button
                onClick={handleAddFertilizer}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Schedule
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {fertilizers.map((fertilizer) => (
                <div
                  key={fertilizer.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{fertilizer.fertilizerName}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          {getCropName(fertilizer.cropId)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Application Date:</span>
                          <p>{new Date(fertilizer.applicationDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Recurrence:</span>
                          <p>{formatRecurrence(fertilizer.recurrence)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Reminders:</span>
                          <p>
                            {fertilizer.reminders?.email ? '📧' : ''}
                            {fertilizer.reminders?.sms ? '📱' : ''}
                            {!fertilizer.reminders?.email && !fertilizer.reminders?.sms ? 'None' : ''}
                          </p>
                        </div>
                      </div>

                      {fertilizer.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                          {fertilizer.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditFertilizer(fertilizer)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFertilizer(fertilizer)}
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
      ) : (
        <FertilizerCalendar
          fertilizers={fertilizers}
          crops={crops}
          onEdit={handleEditFertilizer}
          onDelete={handleDeleteFertilizer}
        />
      )}

      {/* Modals */}
      {showFertilizerEditor && (
        <FertilizerEditorModal
          fertilizer={editingFertilizer}
          crops={crops}
          onSubmit={handleFertilizerSubmit}
          onClose={() => {
            setShowFertilizerEditor(false);
            setEditingFertilizer(null);
          }}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Fertilizer Schedule"
          message={`Are you sure you want to delete the fertilizer schedule for "${fertilizerToDelete?.fertilizerName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmColor="red"
        />
      )}
    </div>
  );
};

export default FertilizerScheduler;
