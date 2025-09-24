import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { formatToSLTime } from '../../utils/timeUtils';

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState(null);
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

  const alertTypes = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' }
  ];

  const parameters = [
    { value: 'soilMoisturePct', label: 'Soil Moisture (%)' },
    { value: 'soilTemperature', label: 'Soil Temperature (°C)' },
    { value: 'airTemperature', label: 'Air Temperature (°C)' },
    { value: 'airHumidity', label: 'Air Humidity (%)' },
    { value: 'airQualityIndex', label: 'Air Quality Index' },
    { value: 'co2', label: 'CO2 Level (ppm)' },
    { value: 'nh3', label: 'NH3 Level (ppm)' }
  ];

  const comparisons = [
    { value: '>', label: 'Greater than (>)' },
    { value: '<', label: 'Less than (<)' },
    { value: '>=', label: 'Greater than or equal (>=)' },
    { value: '<=', label: 'Less than or equal (<=)' }
  ];

  // Load alerts from Firestore
  useEffect(() => {
    if (!user) return;

    const alertsRef = collection(db, 'users', user.uid, 'alerts');
    const q = query(alertsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlerts(alertsData);
    });

    return () => unsubscribe();
  }, [user]);

  const validateForm = () => {
    if (!formData.value.trim()) {
      alert('Please enter a contact value');
      return false;
    }

    if (formData.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.value)) {
        alert('Please enter a valid email address');
        return false;
      }
    } else if (formData.type === 'sms') {
      const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
      if (!phoneRegex.test(formData.value)) {
        alert('Please enter a valid phone number');
        return false;
      }
    }

    if (formData.threshold === '' || isNaN(formData.threshold)) {
      alert('Please enter a valid threshold value');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const alertData = {
        ...formData,
        threshold: parseFloat(formData.threshold),
        createdAt: new Date()
      };

      if (editingAlert) {
        // Update existing alert
        const alertRef = doc(db, 'users', user.uid, 'alerts', editingAlert.id);
        await updateDoc(alertRef, alertData);
      } else {
        // Create new alert
        await addDoc(collection(db, 'users', user.uid, 'alerts'), alertData);
      }

      setShowForm(false);
      setEditingAlert(null);
      setFormData({
        type: 'email',
        value: '',
        parameter: 'soilMoisturePct',
        threshold: 0,
        comparison: '>',
        critical: false,
        active: true
      });
    } catch (error) {
      console.error('Error saving alert:', error);
      alert('Error saving alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setFormData({
      type: alert.type,
      value: alert.value,
      parameter: alert.parameter,
      threshold: alert.threshold,
      comparison: alert.comparison,
      critical: alert.critical,
      active: alert.active
    });
    setShowForm(true);
  };

  const handleDelete = (alert) => {
    setAlertToDelete(alert);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!alertToDelete) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'alerts', alertToDelete.id));
      setShowDeleteModal(false);
      setAlertToDelete(null);
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Error deleting alert. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    return formatToSLTime(timestamp);
  };

  const getParameterLabel = (value) => {
    const param = parameters.find(p => p.value === value);
    return param ? param.label : value;
  };

  const getComparisonLabel = (value) => {
    const comp = comparisons.find(c => c.value === value);
    return comp ? comp.label : value;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alert Management</h1>
              <p className="mt-2 text-gray-600">Configure alerts for your farm monitoring system</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Alert</span>
            </button>
          </div>
        </div>


        {/* Alerts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Alerts ({alerts.length})</h2>
          </div>
          
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts configured</h3>
              <p className="text-gray-500 mb-4">Create your first alert to get notified about important changes in your farm.</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Alert
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alert.type === 'email' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {alert.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getParameterLabel(alert.parameter)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getComparisonLabel(alert.comparison)} {alert.threshold}
                        {alert.critical && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Critical
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alert.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(alert.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(alert)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(alert)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingAlert ? 'Edit Alert' : 'Create New Alert'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingAlert(null);
                      setFormData({
                        type: 'email',
                        value: '',
                        parameter: 'soilMoisturePct',
                        threshold: 0,
                        comparison: '>',
                        critical: false,
                        active: true
                      });
                    }}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {alertTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Contact Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.type === 'email' ? 'Email Address' : 'Mobile Number'}
                    </label>
                    <input
                      type={formData.type === 'email' ? 'email' : 'tel'}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={formData.type === 'email' ? 'example@email.com' : '+1234567890'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  {/* Parameter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parameter</label>
                    <select
                      value={formData.parameter}
                      onChange={(e) => setFormData({ ...formData, parameter: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {parameters.map(param => (
                        <option key={param.value} value={param.value}>{param.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Comparison and Threshold */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comparison</label>
                      <select
                        value={formData.comparison}
                        onChange={(e) => setFormData({ ...formData, comparison: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {comparisons.map(comp => (
                          <option key={comp.value} value={comp.value}>{comp.value}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.threshold}
                        onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Switches */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Critical Alert</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, critical: !formData.critical })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.critical ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.critical ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Active</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, active: !formData.active })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.active ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Saving...' : (editingAlert ? 'Update Alert' : 'Create Alert')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingAlert(null);
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Alert</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this alert? This action cannot be undone.
                  </p>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setAlertToDelete(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
