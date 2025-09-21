import React, { useState } from 'react';
import { useUserDevices } from '../hooks/useUserDevices';
import toast from 'react-hot-toast';

const DeviceSwitcherInProfile = () => {
  const {
    assignedDevices,
    activeDeviceId,
    loading,
    switchActiveDevice,
    getActiveDevice,
    getDeviceUsageSummary
  } = useUserDevices();

  const [isChanging, setIsChanging] = useState(false);

  const handleDeviceSwitch = async (deviceId) => {
    if (deviceId === activeDeviceId) return;

    setIsChanging(true);
    try {
      await switchActiveDevice(deviceId);
      toast.success('Device switched successfully');
    } catch (error) {
      console.error('Error switching device:', error);
      toast.error('Failed to switch device');
    } finally {
      setIsChanging(false);
    }
  };

  const usageSummary = getDeviceUsageSummary();
  const activeDevice = getActiveDevice();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Farm Devices</h3>
          <p className="text-sm text-gray-600">Manage your assigned devices</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {usageSummary.current}/{usageSummary.max}
          </div>
          <div className="text-sm text-gray-500">Devices Used</div>
        </div>
      </div>

      {/* Usage Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Device Usage</span>
          <span>{usageSummary.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${usageSummary.percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {usageSummary.available} device{usageSummary.available !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Device List */}
      {assignedDevices.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Assigned Devices</h4>
          {assignedDevices.map((device) => (
            <div
              key={device.id}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                device.id === activeDeviceId
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      device.id === activeDeviceId ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <div>
                      <h5 className="font-medium text-gray-900">{device.farmName}</h5>
                      <p className="text-sm text-gray-600">
                        {device.location} • {device.cropType}
                      </p>
                      <p className="text-xs text-gray-500">
                        Device ID: {device.id}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {device.id === activeDeviceId && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleDeviceSwitch(device.id)}
                    disabled={isChanging || device.id === activeDeviceId}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      device.id === activeDeviceId
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isChanging ? 'Switching...' : (device.id === activeDeviceId ? 'Current' : 'Switch To')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🚜</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Devices Assigned</h4>
          <p className="text-gray-600 mb-4">
            You don't have any devices assigned yet. Request a device to start monitoring your farm.
          </p>
          <button
            onClick={() => {
              // This would typically navigate to the device request page
              window.location.href = '/dashboard';
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Request Device
          </button>
        </div>
      )}

      {/* Active Device Info */}
      {activeDevice && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Currently Active Device</h4>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <h5 className="font-medium text-gray-900">{activeDevice.farmName}</h5>
                <p className="text-sm text-gray-600">
                  {activeDevice.location} • {activeDevice.cropType}
                </p>
                <p className="text-xs text-gray-500">
                  Assigned: {new Date(activeDevice.assignedAt?.toDate?.() || activeDevice.assignedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">💡 Device Switching</h5>
          <p className="text-sm text-blue-800">
            Switch between your assigned devices to monitor different farms. 
            The dashboard will automatically update to show data from the selected device.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeviceSwitcherInProfile;
