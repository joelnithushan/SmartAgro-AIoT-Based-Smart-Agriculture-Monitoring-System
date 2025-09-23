import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

const Farms = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);

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

  const openFarmDetails = (farm) => {
    setSelectedFarm(farm);
  };

  const closeFarmDetails = () => {
    setSelectedFarm(null);
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
                      onClick={() => openFarmDetails(farm)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Farm Details Modal */}
      {selectedFarm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Farm Details
                </h3>
                <button
                  onClick={closeFarmDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farm Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedFarm.name || 'Unnamed Farm'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedFarm.ownerEmail || selectedFarm.userId || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedFarm.location || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Size</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedFarm.size ? `${selectedFarm.size} acres` : 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Crop Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedFarm.cropType || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedFarm.createdAt)}</p>
                </div>
                
                {selectedFarm.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedFarm.description}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeFarmDetails}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Farms;
