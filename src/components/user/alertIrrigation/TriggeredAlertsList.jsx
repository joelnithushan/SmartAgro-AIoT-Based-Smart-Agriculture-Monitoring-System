import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc, deleteDoc, limit } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { formatAlertDate } from '../../../utils/dateUtils';
import toast from 'react-hot-toast';

const TriggeredAlertsList = () => {
  const { user } = useAuth();
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterTriggeredBy, setFilterTriggeredBy] = useState('all');
  const [selectedAlerts, setSelectedAlerts] = useState([]);

  // Load triggered alerts from Firestore
  useEffect(() => {
    if (!user) {
      console.log('📊 TriggeredAlertsList: No user found, skipping listener setup');
      return;
    }

    console.log('📊 TriggeredAlertsList: Setting up listener for user:', user.uid);
    
    const triggeredAlertsRef = collection(db, 'triggered_alerts', user.uid, 'alerts');
    let q = query(triggeredAlertsRef, orderBy('createdAt', 'desc'), limit(100));
    
    console.log('📊 TriggeredAlertsList: Query created, setting up listener...');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📊 TriggeredAlertsList: Received triggered alerts snapshot:', snapshot.docs.length, 'alerts');
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📊 TriggeredAlertsList: Processed alerts data:', alertsData);
      setTriggeredAlerts(alertsData);
      setLoading(false);
    }, (error) => {
      console.error('❌ TriggeredAlertsList: Error loading triggered alerts:', error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatTimestamp = (timestamp) => {
    return formatAlertDate(timestamp);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const markAsSeen = async (alertId) => {
    try {
      const alertRef = doc(db, 'triggered_alerts', user.uid, 'alerts', alertId);
      await updateDoc(alertRef, { seen: true });
      toast.success('Alert marked as seen');
    } catch (error) {
      console.error('Error marking alert as seen:', error);
      toast.error('Failed to mark alert as seen');
    }
  };

  const deleteAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this triggered alert?')) {
      return;
    }

    try {
      const alertRef = doc(db, 'triggered_alerts', user.uid, 'alerts', alertId);
      await deleteDoc(alertRef);
      toast.success('Alert deleted successfully');
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    }
  };

  const markSelectedAsSeen = async () => {
    if (selectedAlerts.length === 0) return;

    try {
      const updatePromises = selectedAlerts.map(alertId => {
        const alertRef = doc(db, 'triggered_alerts', user.uid, 'alerts', alertId);
        return updateDoc(alertRef, { seen: true });
      });
      
      await Promise.all(updatePromises);
      setSelectedAlerts([]);
      toast.success(`${selectedAlerts.length} alerts marked as seen`);
    } catch (error) {
      console.error('Error marking alerts as seen:', error);
      toast.error('Failed to mark alerts as seen');
    }
  };

  const deleteSelected = async () => {
    if (selectedAlerts.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedAlerts.length} selected alerts?`)) {
      return;
    }

    try {
      const deletePromises = selectedAlerts.map(alertId => {
        const alertRef = doc(db, 'triggered_alerts', user.uid, 'alerts', alertId);
        return deleteDoc(alertRef);
      });
      
      await Promise.all(deletePromises);
      setSelectedAlerts([]);
      toast.success(`${selectedAlerts.length} alerts deleted successfully`);
    } catch (error) {
      console.error('Error deleting alerts:', error);
      toast.error('Failed to delete alerts');
    }
  };

  const toggleSelectAlert = (alertId) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const selectAll = () => {
    setSelectedAlerts(filteredAlerts.map(alert => alert.id));
  };

  const clearSelection = () => {
    setSelectedAlerts([]);
  };

  // Filter alerts
  const filteredAlerts = triggeredAlerts.filter(alert => {
    if (filterDate) {
      const alertDate = new Date(alert.createdAt?.toDate?.() || alert.createdAt);
      const filterDateObj = new Date(filterDate);
      if (alertDate.toDateString() !== filterDateObj.toDateString()) {
        return false;
      }
    }
    
    if (filterTriggeredBy !== 'all') {
      return alert.triggeredBy === filterTriggeredBy;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading triggered alerts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
              </div>
              
                <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Source</label>
          <select
            value={filterTriggeredBy}
            onChange={(e) => setFilterTriggeredBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All</option>
            <option value="test">Test</option>
            <option value="auto">Auto</option>
          </select>
                </div>
        
        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterDate('');
              setFilterTriggeredBy('all');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
                </div>
              </div>
              
      {/* Bulk Actions */}
      {selectedAlerts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedAlerts.length} alert(s) selected
                  </span>
            <div className="flex space-x-2">
              <button
                onClick={markSelectedAsSeen}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Mark as Seen
              </button>
              <button
                onClick={deleteSelected}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Table */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500">No triggered alerts found</p>
          {filterDate || filterTriggeredBy !== 'all' ? (
            <button
              onClick={() => {
                setFilterDate('');
                setFilterTriggeredBy('all');
              }}
              className="mt-2 text-sm text-green-600 hover:text-green-700"
            >
              Clear filters to see all alerts
            </button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                    onChange={selectedAlerts.length === filteredAlerts.length ? clearSelection : selectAll}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DateTime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parameter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Send Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className={!alert.seen ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.includes(alert.id)}
                      onChange={() => toggleSelectAlert(alert.id)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(alert.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getParameterLabel(alert.parameter)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {alert.comparison} {alert.threshold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {alert.actualValue || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.triggeredBy === 'test' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {alert.triggeredBy === 'test' ? 'Test' : 'Auto'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {alert.sendStatus?.sms && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(alert.sendStatus.sms)}`}>
                          SMS: {alert.sendStatus.sms}
                        </span>
                      )}
                      {alert.sendStatus?.email && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(alert.sendStatus.email)}`}>
                          Email: {alert.sendStatus.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!alert.seen ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Seen
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {!alert.seen && (
                        <button
                          onClick={() => markAsSeen(alert.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Mark Seen
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
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
  );
};

export default TriggeredAlertsList;