import React, { useState, useEffect } from 'react';
import Table from '../../common/Table';
import ViewModal from '../admin/ViewModal';
import adminApi from '../../../services/api/adminApi';
import toast from 'react-hot-toast';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getDevices();
        if (response.success) {
          setDevices(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch devices');
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
        toast.error('Failed to load devices');
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleViewDevice = (device) => {
    setSelectedDevice(device);
    setShowViewModal(true);
  };

  const renderDeviceRow = (device) => (
    <tr key={device.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
        {device.deviceId || device.id || 'Unknown Device'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
        {device.userId || device.ownerId || 'Unassigned'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.userName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.userEmail || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          device.status === 'online' ? 'bg-green-100 text-green-800' :
          device.status === 'offline' ? 'bg-red-100 text-red-800' :
          device.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {device.status || 'Unknown'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.lastSeen ? new Date(device.lastSeen).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={() => handleViewDevice(device)}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          View
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
        <p className="mt-1 text-sm text-white">
          View device assignments and status
        </p>
      </div>

      {/* Devices Table */}
      <Table
        headers={['Device ID', 'User ID', 'User Name', 'User Email', 'Status', 'Last Seen', 'Actions']}
        data={devices}
        renderRow={renderDeviceRow}
        loading={loading}
        emptyMessage="No devices found"
      />

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Device Details"
        data={selectedDevice}
        type="device"
      />
    </div>
  );
};

export default DeviceManagement;