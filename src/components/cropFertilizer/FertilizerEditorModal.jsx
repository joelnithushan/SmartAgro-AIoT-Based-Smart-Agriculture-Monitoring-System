import React, { useState, useEffect } from 'react';

const FertilizerEditorModal = ({ fertilizer, crops, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    cropId: '',
    fertilizerName: '',
    applicationDate: '',
    recurrence: {
      type: 'none',
      n: 1
    },
    notes: '',
    reminders: {
      email: false,
      sms: false
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (fertilizer) {
      setFormData({
        cropId: fertilizer.cropId || '',
        fertilizerName: fertilizer.fertilizerName || '',
        applicationDate: fertilizer.applicationDate ? new Date(fertilizer.applicationDate).toISOString().split('T')[0] : '',
        recurrence: fertilizer.recurrence || { type: 'none', n: 1 },
        notes: fertilizer.notes || '',
        reminders: fertilizer.reminders || { email: false, sms: false }
      });
    } else {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        applicationDate: today
      }));
    }
  }, [fertilizer]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('reminders.')) {
      const reminderType = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        reminders: {
          ...prev.reminders,
          [reminderType]: checked
        }
      }));
    } else if (name.startsWith('recurrence.')) {
      const recurrenceField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        recurrence: {
          ...prev.recurrence,
          [recurrenceField]: recurrenceField === 'n' ? parseInt(value) || 1 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cropId) {
      newErrors.cropId = 'Please select a crop';
    }

    if (!formData.fertilizerName.trim()) {
      newErrors.fertilizerName = 'Fertilizer name is required';
    }

    if (!formData.applicationDate) {
      newErrors.applicationDate = 'Application date is required';
    } else {
      const selectedDate = new Date(formData.applicationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.applicationDate = 'Application date cannot be in the past';
      }
    }

    if (formData.recurrence.type === 'every_n_days' && (!formData.recurrence.n || formData.recurrence.n < 1)) {
      newErrors.recurrence_n = 'Number of days must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        applicationDate: new Date(formData.applicationDate).toISOString()
      };
      onSubmit(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {fertilizer ? 'Edit Fertilizer Schedule' : 'Add Fertilizer Schedule'}
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
                    Crop *
                  </label>
                  <select
                    name="cropId"
                    value={formData.cropId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.cropId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a crop</option>
                    {crops.map(crop => (
                      <option key={crop.id} value={crop.id}>
                        {crop.cropName} {crop.variety && `(${crop.variety})`}
                      </option>
                    ))}
                  </select>
                  {errors.cropId && (
                    <p className="mt-1 text-sm text-red-600">{errors.cropId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fertilizer Name *
                  </label>
                  <input
                    type="text"
                    name="fertilizerName"
                    value={formData.fertilizerName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.fertilizerName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., NPK 20-20-20"
                  />
                  {errors.fertilizerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fertilizerName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Date *
                  </label>
                  <input
                    type="date"
                    name="applicationDate"
                    value={formData.applicationDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.applicationDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.applicationDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.applicationDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recurrence
                  </label>
                  <select
                    name="recurrence.type"
                    value={formData.recurrence.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="none">One-time</option>
                    <option value="every_n_days">Every N days</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {formData.recurrence.type === 'every_n_days' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Days
                  </label>
                  <input
                    type="number"
                    name="recurrence.n"
                    value={formData.recurrence.n}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.recurrence_n ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.recurrence_n && (
                    <p className="mt-1 text-sm text-red-600">{errors.recurrence_n}</p>
                  )}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reminders</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="reminders.email"
                    checked={formData.reminders.email}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">📧 Email reminder</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="reminders.sms"
                    checked={formData.reminders.sms}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">📱 SMS reminder</span>
                </label>
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
                placeholder="Additional notes about this fertilizer application (optional)"
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
              {fertilizer ? 'Update Schedule' : 'Add Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FertilizerEditorModal;
