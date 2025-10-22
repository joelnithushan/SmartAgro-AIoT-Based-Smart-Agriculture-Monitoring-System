import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import alertApi from '../../../services/api/alertApi';
import toast from 'react-hot-toast';
import { formatAlertDate } from '../../../utils/dateUtils';

const AlertList = ({ alerts, onEditAlert, onDeleteAlert, loading }) => {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      setDeletingId(alertId);
      await alertApi.deleteAlert(user.uid, alertId);
      toast.success('Alert deleted successfully');
      if (onDeleteAlert) {
        onDeleteAlert(alertId);
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error(error.message || 'Failed to delete alert');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTestAlert = async (alertId) => {
    try {
      await alertApi.testAlert(user.uid, alertId);
      toast.success('Test alert sent successfully');
    } catch (error) {
      console.error('Error sending test alert:', error);
      toast.error(error.message || 'Failed to send test alert');
    }
  };

  const formatParameter = (parameter) => {
    const param = alertApi.getAvailableParameters().find(p => p.value === parameter);
    return param ? param.label : parameter;
  };

  const formatComparison = (comparison) => {
    const comp = alertApi.getComparisonOperators().find(c => c.value === comparison);
    return comp ? comp.label : comparison;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading alerts...</span>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-2">🔔</div>
        <p className="text-gray-500">No alerts configured yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Create your first alert to get notified about important sensor readings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  alert.type === 'email' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {alert.type === 'email' ? '📧' : '📱'} {alert.type.toUpperCase()}
                </span>
                
                {alert.critical && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    🚨 Critical
                  </span>
                )}
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  alert.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {alert.active ? '✅ Active' : '⏸️ Inactive'}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Contact:</span> {alert.value}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Condition:</span> {formatParameter(alert.parameter)} {formatComparison(alert.comparison)} {alert.threshold}
                </p>
                {alert.createdAt && (
                  <p className="text-xs text-gray-500">
                    Created: {formatAlertDate(alert.createdAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleTestAlert(alert.id)}
                className="px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                title="Send test alert"
              >
                Test
              </button>
              
              <button
                onClick={() => onEditAlert && onEditAlert(alert)}
                className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                title="Edit alert"
              >
                Edit
              </button>
              
              <button
                onClick={() => handleDelete(alert.id)}
                disabled={deletingId === alert.id}
                className="px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
                title="Delete alert"
              >
                {deletingId === alert.id ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-red-800"></div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertList;