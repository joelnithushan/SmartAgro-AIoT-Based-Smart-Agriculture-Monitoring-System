import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../../services/firebase/firebase';
import Table from '../../common/Table';
import Modal from '../../common/Modal';
import toast from 'react-hot-toast';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'devices')),
      (snapshot) => {
        const devicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Filter only assigned devices
        const assignedDevices = devicesData.filter(device => device.assignedTo);
        setDevices(assignedDevices);
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

  const handleViewDevice = (device) => {
    setSelectedDevice(device);
    setShowDetailsModal(true);
  };

  const renderDeviceRow = (device) => (
    <tr key={device.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {device.deviceId || device.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.deviceType || 'Unknown'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.userId || device.assignedTo || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.userEmail || device.assignedToEmail || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.userName || device.assignedToName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.location || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          device.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : device.status === 'inactive'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {device.status || 'unknown'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={() => handleViewDevice(device)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
        >
          View Details
        </button>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assigned Devices</h1>
        <p className="mt-1 text-sm text-white">
          View all devices assigned to users with owner information
        </p>
      </div>

      {/* Devices Table */}
      <Table
        headers={['Device ID', 'Type', 'Owner ID', 'Owner Email', 'Owner Name', 'Location', 'Status', 'Actions']}
        data={devices}
        renderRow={renderDeviceRow}
        emptyMessage="No assigned devices found"
      />

      {/* Device Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Device Details"
      >
        {selectedDevice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Device ID</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.deviceId || selectedDevice.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Device Type</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.deviceType || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.status || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.location || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner ID</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.userId || selectedDevice.assignedTo || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.userEmail || selectedDevice.assignedToEmail || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.userName || selectedDevice.assignedToName || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedDevice.assignedAt ? new Date(selectedDevice.assignedAt.seconds * 1000).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
            
            {selectedDevice.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevice.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Created Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {selectedDevice.createdAt ? new Date(selectedDevice.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Devices;
