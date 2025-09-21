import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserDevices } from '../../hooks/useUserDevices';
import DeviceSwitcherInProfile from '../../components/DeviceSwitcherInProfile';
import toast from 'react-hot-toast';

const Profile = () => {
  const { currentUser } = useAuth();
  const {
    assignedDevices,
    activeDeviceId,
    loading: devicesLoading,
    switchActiveDevice,
    getActiveDevice
  } = useUserDevices();

  const [isUpdating, setIsUpdating] = useState(false);

  const handleDeviceSwitch = async (deviceId) => {
    if (deviceId === activeDeviceId) return;

    setIsUpdating(true);
    try {
      await switchActiveDevice(deviceId);
      toast.success('Device switched successfully');
    } catch (error) {
      console.error('Error switching device:', error);
      toast.error('Failed to switch device');
    } finally {
      setIsUpdating(false);
    }
  };

  const activeDevice = getActiveDevice();

  if (devicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account and device settings</p>
        </div>

        <div className="space-y-8">
          {/* Profile Information */}
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
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{currentUser?.uid}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Created</label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentUser?.metadata?.creationTime 
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Device Management */}
          <DeviceSwitcherInProfile />

          {/* Active Device Details */}
          {activeDevice && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Device Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{activeDevice.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farm Name</label>
                  <p className="mt-1 text-sm text-gray-900">{activeDevice.farmName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{activeDevice.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farm Size</label>
                  <p className="mt-1 text-sm text-gray-900">{activeDevice.farmSize} acres</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {activeDevice.assignedAt 
                      ? new Date(activeDevice.assignedAt).toLocaleDateString()
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Device Switching Instructions */}
          {assignedDevices.length > 1 && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Switch Farm/Device</h3>
              <p className="text-blue-800 mb-4">
                You have {assignedDevices.length} devices assigned. Use the device switcher above to change your active device.
                The dashboard will automatically update to show data from the selected device.
              </p>
              <div className="text-sm text-blue-700">
                <p>• Changing the active device updates your dashboard in real-time</p>
                <p>• All sensor data and controls will switch to the selected device</p>
                <p>• Your preference is saved and will be remembered for future sessions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
