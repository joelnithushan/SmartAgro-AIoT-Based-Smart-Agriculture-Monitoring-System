import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../config/firebase';
import { collection, doc, addDoc, deleteDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
      console.error('Error deleting alert via API:', error);
      
      // Fallback to Firestore direct delete
      try {
        console.log('⚠️ API delete failed, falling back to Firestore direct delete...');
        const alertRef = doc(db, 'users', user.uid, 'alerts', alertId);
        await deleteDoc(alertRef);
        toast.success('Alert deleted successfully (Firestore)');
        if (onDeleteAlert) {
          onDeleteAlert(alertId);
        }
      } catch (firestoreError) {
        console.error('❌ Firestore delete also failed:', firestoreError);
        toast.error('Failed to delete alert. Please check your connection.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleTestAlert = async (alertId) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) {
      toast.error('Alert not found');
      return;
    }

    try {
      // Try backend API first
      await alertApi.testAlert(user.uid, alertId);
      toast.success('Test alert sent successfully');
    } catch (error) {
      console.error('Error sending test alert via API:', error);
      
      // Fallback: Create triggered alert directly in Firestore
      try {
        console.log('⚠️ API failed, creating test alert directly in Firestore...');
        
        // Calculate test value based on alert comparison
        let testValue;
        if (alert.comparison === '<' || alert.comparison === '<=') {
          testValue = alert.threshold - 5; // Below threshold for < or <=
        } else {
          testValue = alert.threshold + 5; // Above threshold for > or >=
        }
        
        // Ensure test value is reasonable (not negative)
        if (testValue < 0) testValue = 0;
        if (testValue > 100 && ['soilMoisturePct', 'airHumidity'].includes(alert.parameter)) {
          testValue = 100;
        }
        
        // Ensure user document exists in triggered_alerts
        const userDocRef = doc(db, 'triggered_alerts', user.uid);
        await setDoc(userDocRef, {
          userId: user.uid,
          lastUpdated: serverTimestamp()
        }, { merge: true });
        
        // Create the triggered alert in alerts subcollection
        const alertsRef = collection(db, 'triggered_alerts', user.uid, 'alerts');
        const triggeredAlertData = {
          alertId: alert.id,
          sourceAlertId: alert.id,
          parameter: alert.parameter,
          threshold: alert.threshold,
          comparison: alert.comparison,
          actualValue: testValue,
          triggeredBy: 'test',
          sendStatus: { 
            sms: alert.type === 'sms' ? 'pending' : 'not_applicable',
            email: alert.type === 'email' ? 'pending' : 'not_applicable'
          },
          seen: false,
          createdAt: serverTimestamp(),
          deviceId: 'ESP32_001', // Default device
          alertType: alert.type,
          contactValue: alert.value,
          critical: alert.critical || false
        };
        
        await addDoc(alertsRef, triggeredAlertData);
        
        console.log('✅ Test alert created in Firestore:', triggeredAlertData);
        toast.success(`Test alert created! Check the "Triggered Alerts" section below.`);
      } catch (firestoreError) {
        console.error('❌ Firestore test alert creation failed:', firestoreError);
        toast.error('Failed to create test alert. Please check your connection and permissions.');
      }
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