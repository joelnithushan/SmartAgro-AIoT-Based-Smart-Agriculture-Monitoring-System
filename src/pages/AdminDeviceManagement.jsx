import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';
import { db, database } from '../config/firebase';
import toast from 'react-hot-toast';

const AdminDeviceManagement = () => {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState([]);
  const [deviceRequests, setDeviceRequests] = useState([]);
  const [realtimeData, setRealtimeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  // Check if user is admin
  useEffect(() => {
    if (!currentUser) return;

    const checkAdminStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.roles?.admin === true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  // Subscribe to device requests to get device assignments
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'deviceRequests'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = [];
      const deviceList = [];

      snapshot.forEach((doc) => {
        const request = { id: doc.id, ...doc.data() };
        requests.push(request);

        // Extract devices from requests that have been assigned
        if (request.deviceId && request.status === 'device-assigned') {
          deviceList.push({
            deviceId: request.deviceId,
            userId: request.userId,
            userEmail: request.email,
            userName: request.fullName,
            location: request.location,
            cropType: request.farmInfo?.cropType,
            assignedAt: request.updatedAt,
            status: 'active'
          });
        }
      });

      setDeviceRequests(requests);
      setDevices(deviceList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Subscribe to real-time sensor data for all devices
  useEffect(() => {
    if (devices.length === 0) return;

    const unsubscribes = [];

    devices.forEach((device) => {
      const latestRef = ref(database, `devices/${device.deviceId}/sensors/latest`);
      
      const unsubscribe = onValue(latestRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setRealtimeData(prev => ({
            ...prev,
            [device.deviceId]: {
              ...data,
              lastUpdate: new Date().toISOString()
            }
          }));
        }
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [devices]);

  // Handle device deactivation
  const handleDeactivateDevice = async (deviceId, requestId) => {
    if (!window.confirm('Are you sure you want to deactivate this device? This will remove it from the user and mark the request as completed.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [deviceId]: true }));

    try {
      // Update the device request status to completed
      const requestRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(requestRef, {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Device deactivated successfully');
    } catch (error) {
      console.error('Error deactivating device:', error);
      toast.error('Failed to deactivate device');
    } finally {
      setActionLoading(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  // Get sensor status color
  const getSensorStatusColor = (data) => {
    if (!data) return 'bg-gray-100 text-gray-800';
    
    const lastUpdate = new Date(data.timestamp?.toDate?.() || data.timestamp);
    const now = new Date();
    const timeDiff = (now - lastUpdate) / (1000 * 60); // minutes
    
    if (timeDiff > 60) return 'bg-red-100 text-red-800'; // No data for 1+ hours
    if (timeDiff > 30) return 'bg-yellow-100 text-yellow-800'; // No data for 30+ minutes
    return 'bg-green-100 text-green-800'; // Recent data
  };

  const getSensorStatusText = (data) => {
    if (!data) return 'No Data';
    
    const lastUpdate = new Date(data.timestamp?.toDate?.() || data.timestamp);
    const now = new Date();
    const timeDiff = (now - lastUpdate) / (1000 * 60); // minutes
    
    if (timeDiff > 60) return 'Offline';
    if (timeDiff > 30) return 'Delayed';
    return 'Online';
  };

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor and manage IoT devices across all users
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {devices.length} active devices
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Devices</h3>
            <p className="text-gray-600">
              No devices have been assigned yet. Devices will appear here once admin assigns them to users.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Device Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {devices.map((device) => {
                const deviceData = realtimeData[device.deviceId];
                const request = deviceRequests.find(r => r.deviceId === device.deviceId);
                
                return (
                  <div key={device.deviceId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {device.deviceId}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {device.userName} • {device.userEmail}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSensorStatusColor(deviceData)}`}>
                        {getSensorStatusText(deviceData)}
                      </span>
                    </div>

                    {/* Device Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Location:</span>
                        <span className="text-gray-900">{device.location || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Crop Type:</span>
                        <span className="text-gray-900">{device.cropType || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Assigned:</span>
                        <span className="text-gray-900">
                          {device.assignedAt?.toDate?.() ? 
                            device.assignedAt.toDate().toLocaleDateString() :
                            new Date(device.assignedAt).toLocaleDateString()
                          }
                        </span>
                      </div>
                    </div>

                    {/* Sensor Data */}
                    {deviceData && (
                      <div className="border-t border-gray-200 pt-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Latest Sensor Data</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">Soil Moisture</div>
                            <div className="text-sm font-medium">{deviceData.soilMoisture?.toFixed(1) || 'N/A'}%</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">Temperature</div>
                            <div className="text-sm font-medium">{deviceData.temperature?.toFixed(1) || 'N/A'}°C</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">Humidity</div>
                            <div className="text-sm font-medium">{deviceData.humidity?.toFixed(1) || 'N/A'}%</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">Air Quality</div>
                            <div className="text-sm font-medium">{deviceData.airQuality?.toFixed(0) || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-2">
                          Last update: {deviceData.lastUpdate ? 
                            new Date(deviceData.lastUpdate).toLocaleString() : 'Unknown'
                          }
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeactivateDevice(device.deviceId, request?.id)}
                        disabled={actionLoading[device.deviceId]}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        {actionLoading[device.deviceId] ? 'Deactivating...' : 'Deactivate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDeviceManagement;
