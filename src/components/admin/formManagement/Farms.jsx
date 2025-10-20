import React, { useState, useEffect } from 'react';
import adminApi from '../../../services/api/adminApi';
import ViewModal from '../admin/ViewModal';
import toast from 'react-hot-toast';

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
      console.log('🌾 Fetching farms from deviceRequests...');
      const response = await adminApi.getFarms();
      if (response.success) {
        console.log('📊 Farms data received:', response.data);
        setFarms(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch farms');
      }
    } catch (err) {
      console.error('Error fetching farms:', err);
      setError('Failed to load farms');
      toast.error('Failed to load farms');
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Farm Management</h1>
        <p className="mt-1 text-sm text-white">
          Manage and monitor farm data and user information
        </p>
      </div>

      {/* Farms List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Farm Operations
          </h3>
              <p className="mt-1 text-sm text-gray-500">
                Complete overview of all farm activities
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {farms.length} Users
              </div>
            </div>
          </div>
        </div>
        
        {farms.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No farms found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No farm operations have been recorded yet. Farm data will appear here once users submit device requests.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {farms.map((userFarm) => (
              <div key={userFarm.userId} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 overflow-hidden">
                {/* User Header */}
                <div className="px-6 py-4 bg-white/70 backdrop-blur-sm border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-semibold text-lg">
                            {userFarm.userName ? userFarm.userName.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {userFarm.userName || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-600">{userFarm.userEmail}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {userFarm.totalRequests} Total Requests
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {userFarm.completedRequests} Completed
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
                
                {/* User's Farms */}
                <div className="p-6">
                  <div className="grid gap-4">
                    {userFarm.farms.map((farm, index) => (
                      <div key={`${userFarm.userId}-${index}`} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                              <span className="text-white font-semibold">
                                {farm.farmName ? farm.farmName.charAt(0).toUpperCase() : 'F'}
                              </span>
                      </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                {farm.farmName || 'Unnamed Farm'}
                              </h4>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                  {farm.soilType || 'Not specified'}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                  {farm.farmSize || 0} acres
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                  {farm.deviceType || 'Unknown'}
                                </span>
                      </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Status: {farm.status || 'Unknown'}
                                </span>
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8" />
                                  </svg>
                                  ID: {farm.requestId}
                                </span>
                      </div>
                    </div>
                  </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right text-sm text-gray-500">
                              <div>Created: {formatDate(farm.createdAt)}</div>
                              {farm.completedAt && (
                                <div>Completed: {formatDate(farm.completedAt)}</div>
                              )}
                    </div>
                    <button
                      onClick={() => handleViewFarm(farm)}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                    </button>
                  </div>
                </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
