import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useUserDevices } from '../../hooks/useUserDevices';
import { useDeviceRealtime } from '../../hooks/useDeviceRealtime';
import DeviceMetricsCard from '../DeviceMetricsCard';
import RelayControl from '../RelayControl';
import RealtimeCharts from '../RealtimeCharts';
import WeeklyReportExport from '../WeeklyReportExport';
import MultiStepDeviceRequest from '../MultiStepDeviceRequest';
import AlertBell from '../AlertBell';
import WeatherWidget from '../WeatherWidget';
import { useAlertProcessor } from '../../hooks/useAlertProcessor';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const {
    assignedDevices,
    activeDeviceId,
    loading: devicesLoading,
    switchActiveDevice,
    getActiveDevice,
    canRequestMoreDevices
  } = useUserDevices();

  const {
    sensorData,
    isOnline,
    loading: sensorLoading,
    error: sensorError
  } = useDeviceRealtime(activeDeviceId);

  // Process alerts when sensor data changes
  useAlertProcessor(sensorData, activeDeviceId);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const activeDevice = getActiveDevice();

  // Auto-request device if user has no devices
  useEffect(() => {
    if (!devicesLoading && assignedDevices.length === 0 && canRequestMoreDevices()) {
      setShowRequestModal(true);
    }
  }, [devicesLoading, assignedDevices.length, canRequestMoreDevices]);

  // Handle device switching
  const handleDeviceSwitch = async (deviceId) => {
    try {
      await switchActiveDevice(deviceId);
      toast.success('Device switched successfully');
    } catch (error) {
      console.error('Error switching device:', error);
      toast.error('Failed to switch device');
    }
  };

  // Loading state
  if (devicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // No devices assigned
  if (assignedDevices.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Smart Agriculture Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor and control your farm devices</p>
          </div>

          {/* No Devices State */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-6">🚜</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Devices Assigned</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You don't have any devices assigned yet. Request a device to start monitoring your farm with real-time sensor data and automated irrigation control.
            </p>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                To request a device, please go to the Orders section where you can fill out the proper device request form.
              </p>
              <Link
                to="/user/orders"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Go to Orders Section
              </Link>
            </div>
          </div>
        </div>

        {/* Multi-Step Device Request Modal */}
        {showRequestModal && (
          <MultiStepDeviceRequest
            onClose={() => setShowRequestModal(false)}
            onSuccess={() => {
              setShowRequestModal(false);
              // The component will automatically refresh device list
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3 text-4xl">🍃</span>
                Smart Agriculture Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                {activeDevice ? `${activeDevice.farmName} • ${activeDevice.location}` : 'Select a device to view data'}
              </p>
            </div>
            
            {/* Alert Bell */}
            <AlertBell />
            
            {/* Device Switcher */}
            {assignedDevices.length > 1 && (
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">Active Device:</label>
                <select
                  value={activeDeviceId || ''}
                  onChange={(e) => handleDeviceSwitch(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {assignedDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.farmName} ({device.location})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Device Status Banner */}
          <div className={`mt-4 p-4 rounded-lg ${
            isOnline 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div>
                <h3 className={`font-medium ${
                  isOnline ? 'text-green-900' : 'text-red-900'
                }`}>
                  Device {isOnline ? 'Online' : 'Offline'}
                </h3>
                <p className={`text-sm ${
                  isOnline ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isOnline 
                    ? 'Real-time data is being received from your device'
                    : 'Device is not responding. Check power and network connection.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'control', label: 'Pump Control', icon: '💧' },
              { id: 'charts', label: 'Charts & Trends', icon: '📈' },
              { id: 'reports', label: 'Reports', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <DeviceMetricsCard 
                sensorData={sensorData} 
                isOnline={isOnline}
                deviceInfo={activeDevice}
              />
              
              {/* Quick Actions and Weather */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('control')}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      💧 Control Pump
                    </button>
                    <button
                      onClick={() => setActiveTab('charts')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📈 View Charts
                    </button>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      📋 Generate Report
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Info</h3>
                  {activeDevice ? (
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Farm:</span> {activeDevice.farmName}</div>
                      <div><span className="font-medium">Location:</span> {activeDevice.location}</div>
                      <div><span className="font-medium">Crop:</span> {activeDevice.cropType}</div>
                      <div><span className="font-medium">Device ID:</span> {activeDevice.id}</div>
                      <div><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No device selected</p>
                  )}
                </div>

                <WeatherWidget />

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Data Connection:</span>
                      <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                        {isOnline ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Update:</span>
                      <span className="text-gray-600">
                        {sensorData.timestamp 
                          ? new Date(sensorData.timestamp).toLocaleTimeString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pump Status:</span>
                      <span className={sensorData.relayStatus === 'on' ? 'text-green-600' : 'text-gray-600'}>
                        {sensorData.relayStatus === 'on' ? 'Running' : 'Stopped'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'control' && (
            <RelayControl deviceId={activeDeviceId} isOnline={isOnline} sensorData={sensorData} />
          )}

          {activeTab === 'charts' && (
            <RealtimeCharts deviceId={activeDeviceId} isOnline={isOnline} />
          )}

          {activeTab === 'reports' && (
            <WeeklyReportExport deviceId={activeDeviceId} isOnline={isOnline} />
          )}
        </div>

        {/* Multi-Step Device Request Modal */}
        {showRequestModal && (
          <MultiStepDeviceRequest
            onClose={() => setShowRequestModal(false)}
            onSuccess={() => {
              setShowRequestModal(false);
              // The component will automatically refresh device list
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
