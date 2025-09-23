import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const Farms = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'farms')),
      (snapshot) => {
        const farmsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFarms(farmsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching farms:', error);
        toast.error('Failed to load farms');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleViewFarm = (farm) => {
    setSelectedFarm(farm);
    setShowDetailsModal(true);
  };

  const renderFarmRow = (farm) => (
    <tr key={farm.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {farm.farmId || farm.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {farm.farmName || 'Unnamed Farm'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {farm.ownerId || farm.userId || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {farm.ownerEmail || farm.userEmail || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {farm.ownerName || farm.userName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {farm.location || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {farm.size ? `${farm.size} ${farm.sizeUnit || 'acres'}` : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          farm.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : farm.status === 'inactive'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {farm.status || 'active'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={() => handleViewFarm(farm)}
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
        <h1 className="text-2xl font-bold text-gray-900">All Farms</h1>
        <p className="mt-1 text-sm text-gray-600">
          View all farms created by users with owner information
        </p>
      </div>

      {/* Farms Table */}
      <Table
        headers={['Farm ID', 'Farm Name', 'Owner ID', 'Owner Email', 'Owner Name', 'Location', 'Size', 'Status', 'Actions']}
        data={farms}
        renderRow={renderFarmRow}
        emptyMessage="No farms found"
      />

      {/* Farm Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Farm Details"
      >
        {selectedFarm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Farm ID</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFarm.farmId || selectedFarm.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Farm Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFarm.farmName || 'Unnamed Farm'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFarm.status || 'Active'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFarm.location || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Size</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedFarm.size ? `${selectedFarm.size} ${selectedFarm.sizeUnit || 'acres'}` : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner ID</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFarm.ownerId || selectedFarm.userId || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFarm.ownerEmail || selectedFarm.userEmail || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFarm.ownerName || selectedFarm.userName || 'N/A'}</p>
              </div>
            </div>
            
            {selectedFarm.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFarm.description}</p>
              </div>
            )}

            {selectedFarm.cropType && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Crop Type</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFarm.cropType}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Created Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {selectedFarm.createdAt ? new Date(selectedFarm.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
              </p>
            </div>

            {selectedFarm.updatedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedFarm.updatedAt.seconds * 1000).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Farms;
