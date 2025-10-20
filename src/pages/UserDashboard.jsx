import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';
import { db, database } from '../config/firebase';
import { deviceRequestsService } from '../services/firebase/firestoreService';
import SensorDataDisplay from '../components/SensorDataDisplay';
import IoTSensorDisplay from '../components/IoTSensorDisplay';
import MultiStepDeviceRequest from '../components/MultiStepDeviceRequest';
import UpdateRequestModal from '../components/UpdateRequestModal';
import DeviceCard from '../components/DeviceCard';
import DeviceShareModal from '../components/DeviceShareModal';
import toast from 'react-hot-toast';
const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [deviceId, setDeviceId] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [cropData, setCropData] = useState([]);
  const [activeCropSchedule, setActiveCropSchedule] = useState(null);
  const [deviceRequests, setDeviceRequests] = useState([]);
  const [canRequestDevice, setCanRequestDevice] = useState(true);
  const [activeRequestCount, setActiveRequestCount] = useState(0);
  const [accessibleDevices, setAccessibleDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [updatingRequest, setUpdatingRequest] = useState(null);
  const [cancellingRequest, setCancellingRequest] = useState(null);
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }
      try {
        console.log('🔍 Loading user data for:', currentUser.uid);
        let assignedRequests = [];
        try {
          const deviceRequestsQuery = query(
            collection(db, 'deviceRequests'),
            where('userId', '==', currentUser.uid),
            where('status', '==', 'assigned')
          );
          const deviceRequestsSnapshot = await getDocs(deviceRequestsQuery);
          assignedRequests = deviceRequestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('📋 Assigned device requests:', assignedRequests);
        } catch (deviceRequestError) {
          console.log('⚠️ Could not fetch device requests (this is normal for new users):', deviceRequestError.message);
        }
        if (assignedRequests.length > 0) {
          const primaryRequest = assignedRequests[0];
          if (primaryRequest.deviceId) {
            setDeviceId(primaryRequest.deviceId);
            console.log('📱 Primary device found from request:', primaryRequest.deviceId);
          }
        } else {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('📊 User data loaded:', data);
            if (data.devices && data.devices.length > 0) {
              const primaryDevice = data.devices[0];
              setDeviceId(primaryDevice);
              console.log('📱 Primary device found from user doc:', primaryDevice);
            } else {
              console.log('⚠️ No devices assigned to user');
            }
          } else {
            console.log('📝 Creating new user document');
            await setDoc(userDocRef, {
              email: currentUser.email,
              displayName: currentUser.displayName,
              createdAt: new Date(),
              devices: []
            });
          }
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [currentUser?.uid, currentUser?.email, currentUser?.displayName]);
  useEffect(() => {
    if (!deviceId) return;
    console.log('📡 Subscribing to sensor data for device:', deviceId);
    const latestRef = ref(database, `devices/${deviceId}/sensors/latest`);
    const historyRef = ref(database, `devices/${deviceId}/sensors/history`);
    const unsubscribeLatest = onValue(latestRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('📊 Latest sensor data received:', data);
        const processedData = {
          soilMoisture: data.soilMoisture || data.soil_moisture || 0,
          soilTemperature: data.soilTemperature || data.soil_temperature || data.temperature || 0,
          airTemperature: data.airTemperature || data.air_temperature || data.temperature || 0,
          humidity: data.humidity || 0,
          gasLevel: data.gasLevel || data.gas_level || data.mq135 || 0,
          rainSensor: data.rainSensor || data.rain_sensor || data.rain || 0,
          lightLevel: data.lightLevel || data.light_level || data.ldr || 0,
          waterLevel: data.waterLevel || data.water_level || 0,
          ph: data.ph || data.pH || 0,
          timestamp: new Date().toISOString()
        };
        setLatestData(processedData);
        storeSensorDataInFirestore(deviceId, processedData);
      }
    });
    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const historyArray = Object.values(data || {});
        console.log('📈 Sensor history received:', historyArray.length, 'records');
        setSensorData(historyArray);
      }
    });
    return () => {
      off(latestRef, 'value', unsubscribeLatest);
      off(historyRef, 'value', unsubscribeHistory);
    };
  }, [deviceId]);
  const storeSensorDataInFirestore = async (deviceId, sensorData) => {
    try {
      const { deviceRequestsService } = await import('../services/firestoreService');
      await deviceRequestsService.storeSensorData(deviceId, sensorData);
    } catch (error) {
      console.error('❌ Error storing sensor data in Firestore:', error);
    }
  };
  useEffect(() => {
    const loadCropData = async () => {
      if (!currentUser?.uid) return;
      try {
        const cropsQuery = query(
          collection(db, 'users', currentUser.uid, 'crops'),
          orderBy('addedAt', 'desc')
        );
        const cropsSnapshot = await getDocs(cropsQuery);
        const crops = cropsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCropData(crops);
        const activeCrop = crops.find(crop => crop.status === 'active');
        if (activeCrop) {
          setActiveCropSchedule(activeCrop);
        }
      } catch (error) {
        console.error('❌ Error loading crop data:', error);
      }
    };
    loadCropData();
  }, [currentUser?.uid]);
  useEffect(() => {
    if (!currentUser?.uid) return;
    console.log('🔍 Setting up real-time listener for device requests:', currentUser.uid);
    console.log('🔍 Current user email:', currentUser.email);
    console.log('🔍 Current user object:', currentUser);
    const unsubscribe = deviceRequestsService.subscribeToUserRequests(
      currentUser.uid,
      (requests) => {
        console.log('📋 Device requests updated:', requests);
        console.log('📋 Number of requests found:', requests.length);
        const sortedRequests = requests.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return new Date(bTime) - new Date(aTime);
        });
        setDeviceRequests(sortedRequests);
        const activeStatuses = ['pending', 'cost-estimated', 'user-accepted', 'device-assigned'];
        const activeRequests = sortedRequests.filter(req => activeStatuses.includes(req.status));
        const assignedRequests = sortedRequests.filter(req => req.status === 'assigned');
        setCanRequestDevice(activeRequests.length < 3);
        setActiveRequestCount(activeRequests.length);
        if (assignedRequests.length > 0 && assignedRequests[0].deviceId) {
          const newDeviceId = assignedRequests[0].deviceId;
          if (newDeviceId !== deviceId) {
            setDeviceId(newDeviceId);
            console.log('📱 Device ID updated to:', newDeviceId);
          }
        }
        console.log('📊 Active requests count:', activeRequests.length);
        console.log('📊 Assigned requests count:', assignedRequests.length);
        console.log('🔒 Can request more devices:', activeRequests.length < 3);
      }
    );
    return () => {
      console.log('🧹 Cleaning up device requests listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid, deviceId]);
  useEffect(() => {
    const loadAccessibleDevices = async () => {
      if (!currentUser?.uid) return;
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/devices/users/${currentUser.uid}/accessible-devices`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAccessibleDevices(data.devices || []);
          const ownedDevices = data.devices.filter(d => d.accessType === 'owner');
          const primaryDevice = ownedDevices.length > 0 ? ownedDevices[0] : data.devices[0];
          if (primaryDevice) {
            setDeviceId(primaryDevice.deviceId);
            setSelectedDevice(primaryDevice);
            console.log('📱 Primary device set:', primaryDevice.deviceId);
          }
        } else {
          console.log('⚠️ API call failed (this is normal if backend is not fully configured):', response.status);
        }
      } catch (error) {
        console.log('⚠️ API call error (this is normal if backend is not fully configured):', error.message);
      }
    };
    loadAccessibleDevices();
  }, [currentUser?.uid]);
  const handleUpdateRequest = (requestId) => {
    setSelectedRequestId(requestId);
    setShowUpdateModal(true);
  };
  const handleCancelRequest = async (requestId) => {
    if (!currentUser?.uid) return;
    setCancellingRequest(requestId);
    try {
      const result = await deviceRequestsService.cancelRequest(requestId, currentUser.uid);
      if (result.success) {
        toast.success('Request cancelled successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request: ' + error.message);
    } finally {
      setCancellingRequest(null);
    }
  };
  const handleUpdateModalClose = () => {
    setShowUpdateModal(false);
    setSelectedRequestId(null);
  };
  const handleUpdateSuccess = () => {
    toast.success('Request updated successfully!');
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cost-estimated': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user-accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'user-rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'device-assigned': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'cost-estimated': return 'Cost Estimated';
      case 'user-accepted': return 'Accepted by User';
      case 'user-rejected': return 'Rejected by User';
      case 'device-assigned': return 'Device Assigned';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };
  const canModifyRequest = (status) => {
    return status === 'pending';
  };
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {currentUser?.displayName || currentUser?.email}!
              </p>
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!deviceId ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Device Assigned</h3>
            <p className="text-gray-600 mb-6">
              You don't have any devices assigned yet. Request a device to start monitoring your farm.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: '📊' },
                  { id: 'devices', name: 'Devices', icon: '📱' },
                  { id: 'sensors', name: 'Sensors', icon: '🌡️' },
                  { id: 'orders', name: 'Orders', icon: '📋' },
                  { id: 'crops', name: 'Crops', icon: '🌱' },
                  { id: 'profile', name: 'Profile', icon: '👤' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
            {}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {deviceId ? (
                  <IoTSensorDisplay deviceId={deviceId} />
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">📱</span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No devices available</h4>
                    <p className="text-gray-600 mb-4">Request a device to start monitoring your farm</p>
                  </div>
                )}
                {}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {latestData && (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 text-sm">✓</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Latest sensor reading received
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(latestData.timestamp?.toDate?.() || latestData.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {activeCropSchedule && (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-sm">🌱</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Active crop: {activeCropSchedule.cropName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Growth stage: {activeCropSchedule.growthStage}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'devices' && (
              <div className="space-y-6">
                {}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Devices</h3>
                    <span className="text-sm text-gray-500">
                      {accessibleDevices.length} device{accessibleDevices.length !== 1 ? 's' : ''} available
                    </span>
                  </div>
                  {accessibleDevices.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">📱</span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No devices available</h4>
                      <p className="text-gray-600 mb-4">Request a device or ask a friend to share their device with you</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {accessibleDevices.map((device) => (
                        <DeviceCard
                          key={device.deviceId}
                          device={device}
                          isSelected={selectedDevice?.deviceId === device.deviceId}
                          onDeviceClick={(device) => {
                            setSelectedDevice(device);
                            setDeviceId(device.deviceId);
                            setActiveTab('sensors'); 
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {}
                {accessibleDevices.some(d => d.accessType === 'owner') && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <span className="text-blue-600 text-xl">💡</span>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Device Sharing Tips</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Click the share icon on your devices to grant friends view access</li>
                          <li>• Friends can see real-time data but cannot control your devices</li>
                          <li>• You can revoke access anytime from the sharing modal</li>
                          <li>• Share links only work for users you've explicitly granted access</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'sensors' && (
              <div className="space-y-6">
                {}
                {selectedDevice && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📱</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{selectedDevice.deviceId}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              selectedDevice.accessType === 'owner' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {selectedDevice.accessType === 'owner' ? '👑 Owner' : '👥 Shared'}
                            </span>
                            {selectedDevice.accessType === 'shared' && (
                              <span className="text-sm text-gray-600">by {selectedDevice.ownerName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedDevice.accessType === 'owner' && (
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          <span>Share Device</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {}
                {selectedDevice?.accessType === 'shared' && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">ℹ️</span>
                      <div>
                        <p className="text-sm font-medium text-blue-900">View-Only Access</p>
                        <p className="text-sm text-blue-700">
                          You can view real-time data but cannot control this device. Device controls are disabled.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {}
                {deviceId ? (
                  <SensorDataDisplay 
                    deviceId={deviceId}
                    sensorData={sensorData}
                    latestData={latestData}
                    isReadOnly={selectedDevice?.accessType === 'shared'}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">📱</span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Device Selected</h4>
                    <p className="text-gray-600 mb-4">Select a device from the Devices tab to view sensor data</p>
                    <button
                      onClick={() => setActiveTab('devices')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      View Devices
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {}
                {canRequestDevice && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Request New Device</h3>
                        <p className="text-sm text-gray-600">Device requests: {activeRequestCount}/3</p>
                      </div>
                    </div>
                  </div>
                )}
                {}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    My Device Requests ({deviceRequests.length})
                  </h3>
                  {deviceRequests.length > 0 ? (
                    <div className="space-y-4">
                      {deviceRequests.map((request) => {
                        const canUpdateOrCancel = request.status === 'pending';
                        return (
                          <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  Request #{request.id.slice(-6)}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {request.farmInfo?.cropType || 'Not specified'} • {request.farmInfo?.farmSize || 'Size not specified'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Location: {request.location || 'Not specified'}
                                </p>
                              </div>
                              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(request.status)}`}>
                                {getStatusText(request.status)}
                              </span>
                            </div>
                            {request.costEstimation && (
                              <div className="mb-3 p-3 bg-green-50 rounded-lg">
                                <p className="text-sm font-medium text-green-800">
                                  Cost Estimate: Rs. {request.costEstimation.toLocaleString()}
                                </p>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                Created: {request.createdAt?.toDate ? 
                                  request.createdAt.toDate().toLocaleDateString() : 
                                  new Date(request.createdAt).toLocaleDateString()
                                }
                              </span>
                              {canModifyRequest(request.status) && (
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => handleUpdateRequest(request.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                                  >
                                    <span>✏️</span>
                                    <span>Update</span>
                                  </button>
                                  <button 
                                    onClick={() => handleCancelRequest(request.id)}
                                    disabled={cancellingRequest === request.id}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                                  >
                                    {cancellingRequest === request.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        <span>Cancelling...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>❌</span>
                                        <span>Cancel</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">📋</span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
                      <p className="text-gray-600 mb-4">Request your first device to get started</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'crops' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Crop Management</h3>
                  {cropData.length > 0 ? (
                    <div className="space-y-4">
                      {cropData.map((crop) => (
                        <div key={crop.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{crop.cropName}</h4>
                              <p className="text-sm text-gray-600">Status: {crop.status}</p>
                              <p className="text-sm text-gray-600">Growth Stage: {crop.growthStage}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              crop.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {crop.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No crops found. Add a crop to start tracking.</p>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {currentUser?.displayName || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{currentUser?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Device ID</label>
                      <p className="mt-1 text-sm text-gray-900">{deviceId || 'No device assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
            {}
        {showRequestModal && (
          <MultiStepDeviceRequest
            onClose={() => setShowRequestModal(false)}
            onSuccess={() => {
              setShowRequestModal(false);
              window.location.reload();
            }}
          />
        )}
        {}
        {showUpdateModal && selectedRequestId && (
          <UpdateRequestModal
            isOpen={showUpdateModal}
            onClose={handleUpdateModalClose}
            onSuccess={handleUpdateSuccess}
            requestId={selectedRequestId}
          />
        )}
        {}
        {showShareModal && selectedDevice && (
          <DeviceShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            deviceId={selectedDevice.deviceId}
            onShareSuccess={() => {
            }}
          />
        )}
        {}
        {(activeTab === 'overview' || activeTab === 'orders') && deviceRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <span className="text-sm text-gray-500">{deviceRequests.length} total</span>
            </div>
            <div className="space-y-4">
              {deviceRequests.slice(0, 3).map((request) => {
                const getStatusColor = (status) => {
                  switch (status) {
                    case 'pending': return 'bg-yellow-100 text-yellow-800';
                    case 'cost-estimated': return 'bg-blue-100 text-blue-800';
                    case 'user-accepted': return 'bg-green-100 text-green-800';
                    case 'device-assigned': return 'bg-green-100 text-green-800';
                    case 'completed': return 'bg-green-100 text-green-800';
                    case 'cancelled': return 'bg-red-100 text-red-800';
                    case 'rejected': return 'bg-red-100 text-red-800';
                    default: return 'bg-gray-100 text-gray-800';
                  }
                };
                return (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Request #{request.id.slice(-6)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {request.farmInfo?.cropType || 'Not specified'} • {request.farmInfo?.farmSize || 'Size not specified'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>
                        {request.createdAt?.toDate ? 
                          request.createdAt.toDate().toLocaleDateString() : 
                          new Date(request.createdAt).toLocaleDateString()
                        }
                      </span>
                      {request.costEstimation && (
                        <span className="font-medium text-green-600">
                          Rs. {request.costEstimation.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {deviceRequests.length > 3 && (
                <div className="text-center pt-2">
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    View all {deviceRequests.length} orders →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default UserDashboard;
