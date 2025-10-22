import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import alertApi from '../../../services/api/alertApi';
import AlertForm from './AlertForm';
import AlertList from './AlertList';
import TriggeredAlertsList from './TriggeredAlertsList';
import ManualIrrigation from './ManualIrrigation';
import AutoIrrigationEnhanced from './AutoIrrigationEnhanced';
import toast from 'react-hot-toast';

const AlertIrrigation = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load alerts from API
  useEffect(() => {
    if (!user?.uid) return;

    const loadAlerts = async () => {
      try {
        setLoading(true);
        const response = await alertApi.getAlerts(user.uid);
        setAlerts(response.alerts || []);
      } catch (error) {
        console.error('Error loading alerts:', error);
        toast.error('Failed to load alerts');
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [user?.uid]);

  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setShowForm(true);
  };

  const handleDeleteAlert = (alertId) => {
    // Remove alert from local state
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleAlertSaved = async () => {
    // Reload alerts from API
    try {
      const response = await alertApi.getAlerts(user.uid);
      setAlerts(response.alerts || []);
    } catch (error) {
      console.error('Error reloading alerts:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerts and irrigation settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url(/images/leaves-bg.jpg)'
      }}
    >
      <div className="min-h-screen bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Alerts & Irrigation</h1>
            <p className="mt-2 text-gray-200">
              Manage your alerts and control irrigation settings for your devices
            </p>
          </div>

          {/* Combined Content - Both Sections on One Page */}
          <div className="space-y-8">
            {/* Alerts Section */}
            <div className="bg-white bg-opacity-95 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <span className="mr-2">🔔</span>
                      Alert Management
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Set up alerts to get notified when sensor values go out of range
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Alert
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <AlertList
                  alerts={alerts}
                  onEditAlert={handleEditAlert}
                  onDeleteAlert={handleDeleteAlert}
                  loading={loading}
                />
              </div>
            </div>

            {/* Recent Triggered Alerts */}
            <div className="bg-white bg-opacity-95 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <span className="mr-2">📊</span>
                  Triggered Alerts
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  History of alerts that have been triggered
                </p>
              </div>
              
              <div className="p-6">
                <TriggeredAlertsList />
              </div>
            </div>

            {/* Irrigation Section */}
            <div className="bg-white bg-opacity-95 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <span className="mr-2">💧</span>
                  Irrigation Control
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Control your irrigation system manually or set up automatic irrigation
                </p>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {/* Manual Irrigation */}
                  <ManualIrrigation />
                  
                  {/* Auto Irrigation */}
                  <AutoIrrigationEnhanced />
                </div>
              </div>
            </div>
          </div>

          {/* Alert Form Modal */}
          <AlertForm
            showForm={showForm}
            setShowForm={setShowForm}
            editingAlert={editingAlert}
            setEditingAlert={setEditingAlert}
            onAlertSaved={handleAlertSaved}
          />
        </div>
      </div>
    </div>
  );
};

export default AlertIrrigation;

