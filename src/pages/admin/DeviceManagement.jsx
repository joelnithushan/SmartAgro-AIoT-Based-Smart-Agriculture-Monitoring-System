import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import adminApi from '../../services/adminApi';
import toast from 'react-hot-toast';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reassignData, setReassignData] = useState({
    userId: '',
    userEmail: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'devices')),
      (snapshot) => {
        const devicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDevices(devicesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching devices:', error);
        toast.error('Failed to load devices');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUnassignDevice = async () => {
    if (!selectedDevice) return;

    setActionLoading(true);
    try {
      await adminApi.unassignDevice(selectedDevice.id);
      toast.success('Device unassigned successfully');
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error unassigning device:', error);
      toast.error(error.message || 'Failed to unassign device');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassignDevice = async () => {
    if (!selectedDevice || !reassignData.userId) return;

    setActionLoading(true);
    try {
      await adminApi.reassignDevice(selectedDevice.id, reassignData.userId);
      toast.success('Device reassigned successfully');
      setShowReassignModal(false);
      setReassignData({ userId: '', userEmail: '' });
    } catch (error) {
      console.error('Error reassigning device:', error);
      toast.error(error.message || 'Failed to reassign device');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (deviceId, status) => {
    setActionLoading(true);
    try {
      await adminApi.updateDeviceStatus(deviceId, status);
      toast.success(`Device status updated to ${status}`);
    } catch (error) {
      console.error('Error updating device status:', error);
      toast.error(error.message || 'Failed to update device status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = (action, device) => {
    setSelectedDevice(device);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = () => {
    if (!selectedDevice || !confirmAction) return;

    switch (confirmAction) {
      case 'unassign':
        handleUnassignDevice();
        break;
      default:
        break;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'green', text: 'Active' },
      offline: { color: 'red', text: 'Offline' },
      maintenance: { color: 'yellow', text: 'Maintenance' },
      unassigned: { color: 'gray', text: 'Unassigned' }
    };

    const config = statusConfig[status] || { color: 'gray', text: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        {config.text}
      </span>
    );
  };

  const renderDeviceRow = (device, index) => (
    <tr key={device.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {device.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(device.status || 'unassigned')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {device.assignedTo ? (
          <div>
            <div className="text-sm font-medium text-gray-900">{device.assignedToName || 'Unknown User'}</div>
            <div className="text-sm text-gray-500">{device.assignedToEmail || device.assignedTo}</div>
          </div>
        ) : (
          <span className="text-gray-500">Unassigned</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {device.assignedAt ? new Date(device.assignedAt).toLocaleDateString() : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {device.assignedBy || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {device.requestId ? device.requestId.substring(0, 8) + '...' : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={() => {
            setSelectedDevice(device);
            setShowDetailsModal(true);
          }}
          className="text-blue-600 hover:text-blue-900"
        >
          View Details
        </button>
        {device.assignedTo && (
          <>
            <button
              onClick={() => {
                setSelectedDevice(device);
                setShowReassignModal(true);
              }}
              className="text-purple-600 hover:text-purple-900"
            >
              Reassign
            </button>
            <button
              onClick={() => handleAction('unassign', device)}
              className="text-red-600 hover:text-red-900"
            >
              Unassign
            </button>
          </>
        )}
        <select
          value={device.status || 'unassigned'}
          onChange={(e) => handleUpdateStatus(device.id, e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1"
        >
          <option value="active">Active</option>
          <option value="offline">Offline</option>
          <option value="maintenance">Maintenance</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage IoT devices, assignments, and status
        </p>
      </div>

      {/* Devices Table */}
      <Table
        headers={['Device ID', 'Status', 'Assigned To', 'Assigned Date', 'Assigned By', 'Request ID', 'Actions']}
        data={devices}
        renderRow={renderDeviceRow}
        loading={loading}
        emptyMessage="No devices found"
      />

      {/* Device Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Device Details"
        size="lg"
      >
        {selectedDevice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Device ID</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedDevice.status || 'unassigned')}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedDevice.assignedTo ? (
                    <div>
                      <div>{selectedDevice.assignedToName || 'Unknown User'}</div>
                      <div className="text-gray-500">{selectedDevice.assignedToEmail || selectedDevice.assignedTo}</div>
                    </div>
                  ) : (
                    'Unassigned'
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedDevice.assignedAt ? new Date(selectedDevice.assignedAt).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned By</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.assignedBy || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Request ID</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.requestId || '-'}</p>
              </div>
            </div>

            {/* Sensor Data */}
            {selectedDevice.latestSensorData && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Latest Sensor Data</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(selectedDevice.latestSensorData).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device History */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Device History</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Created: {new Date(selectedDevice.createdAt).toLocaleString()}
                </div>
                {selectedDevice.assignedAt && (
                  <div className="text-sm text-gray-600">
                    Assigned: {new Date(selectedDevice.assignedAt).toLocaleString()}
                  </div>
                )}
                {selectedDevice.updatedAt && (
                  <div className="text-sm text-gray-600">
                    Last Updated: {new Date(selectedDevice.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reassign Device Modal */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign Device"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Assignment</label>
            <p className="mt-1 text-sm text-gray-900">
              {selectedDevice?.assignedToName || selectedDevice?.assignedToEmail || selectedDevice?.assignedTo || 'Unknown User'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New User Email</label>
            <input
              type="email"
              value={reassignData.userEmail}
              onChange={(e) => setReassignData({ ...reassignData, userEmail: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">User ID (optional)</label>
            <input
              type="text"
              value={reassignData.userId}
              onChange={(e) => setReassignData({ ...reassignData, userId: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="User ID (leave empty to search by email)"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowReassignModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReassignDevice}
              disabled={actionLoading || (!reassignData.userId && !reassignData.userEmail)}
              className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Reassigning...' : 'Reassign Device'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeAction}
        title="Unassign Device"
        message={`Are you sure you want to unassign device ${selectedDevice?.id}? This will remove the current assignment and make the device available for reassignment.`}
        confirmText="Unassign"
        confirmColor="red"
        loading={actionLoading}
      />
    </div>
  );
};

export default DeviceManagement;