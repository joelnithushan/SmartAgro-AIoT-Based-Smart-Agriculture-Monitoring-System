import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import ViewModal from '../../components/admin/ViewModal';

const Farms = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const farmsQuery = query(collection(db, 'farms'), orderBy('createdAt', 'desc'));
      const farmsSnapshot = await getDocs(farmsQuery);
      const farmsData = farmsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFarms(farmsData);
    } catch (err) {
      console.error('Error fetching farms:', err);
      setError('Failed to load farms');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleViewFarm = (farm) => {
    setSelectedFarm(farm);
    setShowViewModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Farms Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all farms created by users
          </p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            All Farms ({farms.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Complete list of farms in the system
          </p>
        </div>
        
        {farms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No farms found</h3>
              <p className="mt-1 text-sm text-gray-500">No farms have been created yet.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {farms.map((farm) => (
              <li key={farm.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-medium text-sm">
                          {farm.name ? farm.name.charAt(0).toUpperCase() : 'F'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {farm.name || 'Unnamed Farm'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Owner: {farm.ownerEmail || farm.userId || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Location: {farm.location || 'Not specified'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      Created: {formatDate(farm.createdAt)}
                    </div>
                    <button
                      onClick={() => handleViewFarm(farm)}
                      className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      View
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Farm Details"
        data={selectedFarm}
        type="farm"
      />
    </div>
  );
};

export default Farms;
