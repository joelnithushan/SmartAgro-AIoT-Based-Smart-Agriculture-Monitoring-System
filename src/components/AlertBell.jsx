import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { formatAlertTime } from '../utils/timeUtils';

const AlertBell = () => {
  const { user } = useAuth();
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load triggered alerts from Firestore
  useEffect(() => {
    if (!user) return;

    const triggeredAlertsRef = collection(db, 'users', user.uid, 'triggeredAlerts');
    const q = query(triggeredAlertsRef, orderBy('triggeredAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTriggeredAlerts(alertsData);
    });

    return () => unsubscribe();
  }, [user]);

  const formatTimestamp = (timestamp) => {
    return formatAlertTime(timestamp);
  };

  const getParameterLabel = (parameter) => {
    const labels = {
      soilMoisturePct: 'Soil Moisture',
      soilTemperature: 'Soil Temperature',
      airTemperature: 'Air Temperature',
      airHumidity: 'Air Humidity',
      airQualityIndex: 'Air Quality',
      co2: 'CO2 Level',
      nh3: 'NH3 Level'
    };
    return labels[parameter] || parameter;
  };

  const getAlertIcon = (alert) => {
    if (alert.critical) {
      return '🔴'; // Critical alert
    }
    return '🟡'; // Regular alert
  };

  return (
    <div className="relative">
      {/* Alert Bell Button */}
      <button
        onClick={() => setShowAlerts(!showAlerts)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 17h8l-2.586-2.586a2 2 0 00-2.828 0L4.828 17z" />
        </svg>
        
        {/* Alert Count Badge */}
        {triggeredAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {triggeredAlerts.length}
          </span>
        )}
      </button>

      {/* Alert Dropdown */}
      {showAlerts && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Triggered Alerts</h3>
              <button
                onClick={() => setShowAlerts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {triggeredAlerts.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-gray-500">No triggered alerts</p>
              </div>
            ) : (
              <div className="p-2">
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 mb-2 rounded-lg border-l-4 ${
                      alert.critical 
                        ? 'bg-red-50 border-red-400' 
                        : 'bg-yellow-50 border-yellow-400'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">{getAlertIcon(alert)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            alert.critical ? 'text-red-800' : 'text-yellow-800'
                          }`}>
                            {getParameterLabel(alert.parameter)}
                          </span>
                          {alert.critical && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Critical
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.comparison} {alert.threshold} 
                          <span className="ml-1">(Current: {alert.currentValue})</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {alert.type.toUpperCase()} to {alert.contactValue}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(alert.triggeredAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {triggeredAlerts.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => {
                  // Navigate to alerts page
                  window.location.href = '/user/alerts';
                }}
                className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View All Alerts
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {showAlerts && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAlerts(false)}
        />
      )}
    </div>
  );
};

export default AlertBell;
