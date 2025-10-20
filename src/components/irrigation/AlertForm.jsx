import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import alertApi from '../../services/alertApi';
import toast from 'react-hot-toast';

const AlertForm = ({ showForm, setShowForm, editingAlert, setEditingAlert, onAlertSaved }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'email',
    value: '',
    parameter: 'soilMoisturePct',
    threshold: 0,
    comparison: '>',
    critical: false,
    active: true
  });

  const alertTypes = alertApi.getAlertTypes();
  const parameters = alertApi.getAvailableParameters();
  const comparisons = alertApi.getComparisonOperators();

  React.useEffect(() => {
    if (editingAlert) {
      setFormData({
        type: editingAlert.type,
        value: editingAlert.value,
        parameter: editingAlert.parameter,
        threshold: editingAlert.threshold,
        comparison: editingAlert.comparison,
        critical: editingAlert.critical,
        active: editingAlert.active
      });
    } else {
      setFormData({
        type: 'email',
        value: '',
        parameter: 'soilMoisturePct',
        threshold: 0,
        comparison: '>',
        critical: false,
        active: true
      });
    }
  }, [editingAlert]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data using API service
    const validation = alertApi.validateAlertData(formData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    setLoading(true);

    try {
      const alertData = {
        type: formData.type,
        value: formData.value.trim(),
        parameter: formData.parameter,
        threshold: Number(formData.threshold),
        comparison: formData.comparison,
        critical: formData.critical,
        active: formData.active
      };

      if (editingAlert) {
        // Update existing alert
        await alertApi.updateAlert(user.uid, editingAlert.id, alertData);
        toast.success('Alert updated successfully');
      } else {
        // Create new alert
        await alertApi.createAlert(user.uid, alertData);
        toast.success('Alert created successfully');
      }

      setShowForm(false);
      setEditingAlert(null);
      if (onAlertSaved) {
        onAlertSaved();
      }
    } catch (error) {
      console.error('Error saving alert:', error);
      toast.error(error.message || 'Failed to save alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingAlert(null);
  };

  if (!showForm) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingAlert ? 'Edit Alert' : 'Create New Alert'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Alert Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                {alertTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Contact Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <input
                type={formData.type === 'email' ? 'email' : 'tel'}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === 'email' ? 'user@example.com' : '+94771234567'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Parameter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parameter
              </label>
              <select
                value={formData.parameter}
                onChange={(e) => setFormData({ ...formData, parameter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                {parameters.map(param => (
                  <option key={param.value} value={param.value}>{param.label}</option>
                ))}
              </select>
            </div>

            {/* Comparison and Threshold */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comparison
                </label>
                <select
                  value={formData.comparison}
                  onChange={(e) => setFormData({ ...formData, comparison: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  {comparisons.map(comp => (
                    <option key={comp.value} value={comp.value}>{comp.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Threshold
                </label>
                <input
                  type="number"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Critical Alert */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="critical"
                checked={formData.critical}
                onChange={(e) => setFormData({ ...formData, critical: e.target.checked })}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="critical" className="ml-2 block text-sm text-gray-900">
                Critical Alert (Higher Priority)
              </label>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  editingAlert ? 'Update Alert' : 'Create Alert'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AlertForm;
