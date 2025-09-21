import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import OrderDetailsModal from '../components/OrderDetailsModal';
import CostEstimateModal from '../components/CostEstimateModal';

const AdminOrderManagement = () => {
  const { currentUser } = useAuth();
  const [deviceRequests, setDeviceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showCostEstimate, setShowCostEstimate] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, cost-estimated, user-accepted, device-assigned, completed

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Check admin status
    const checkAdminStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.roles?.admin === true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  // Subscribe to device requests
  useEffect(() => {
    if (!isAdmin) return;

    let unsubscribe;

    try {
      let q = query(
        collection(db, 'deviceRequests'),
        orderBy('createdAt', 'desc')
      );

      // Apply filter
      if (filter !== 'all') {
        q = query(
          collection(db, 'deviceRequests'),
          where('status', '==', filter),
          orderBy('createdAt', 'desc')
        );
      }

      unsubscribe = onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
          requests.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setDeviceRequests(requests);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching device requests:', error);
        setError('Failed to load device requests');
        setLoading(false);
      });

    } catch (error) {
      console.error('Error setting up device requests listener:', error);
      setError('Failed to set up real-time listener');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAdmin, filter]);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowOrderDetails(true);
  };

  const handleEstimateCost = (request) => {
    setSelectedRequest(request);
    setShowCostEstimate(true);
  };

  const handleCloseModals = () => {
    setShowOrderDetails(false);
    setShowCostEstimate(false);
    setSelectedRequest(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'cost-estimated': 'bg-blue-100 text-blue-800',
      'user-accepted': 'bg-green-100 text-green-800',
      'user-rejected': 'bg-red-100 text-red-800',
      'device-assigned': 'bg-purple-100 text-purple-800',
      'completed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Pending Review',
      'cost-estimated': 'Cost Estimated',
      'user-accepted': 'User Accepted',
      'user-rejected': 'User Rejected',
      'device-assigned': 'Device Assigned',
      'completed': 'Completed'
    };
    return texts[status] || status;
  };

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-6">You don't have admin privileges to access this page.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading device requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Requests</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Order Management</h1>
            <p className="text-gray-400 mt-1">Manage device requests and assignments</p>
          </div>
          
          {/* Filter Dropdown */}
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-300">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending Review</option>
              <option value="cost-estimated">Cost Estimated</option>
              <option value="user-accepted">User Accepted</option>
              <option value="device-assigned">Device Assigned</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {deviceRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Device Requests</h3>
            <p className="text-gray-400">
              {filter === 'all' 
                ? 'No device requests have been submitted yet.'
                : `No requests with status "${getStatusText(filter)}" found.`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {deviceRequests.map((request) => (
              <div key={request.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {request.fullName || request.personalInfo?.fullName || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {request.farmName || request.farmInfo?.farmName || 'Unknown Farm'} • {request.farmSize || request.farmInfo?.farmSize || 0} acres
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                    
                    {request.costDetails && (
                      <span className="text-lg font-semibold text-green-400">
                        ${request.costDetails.totalCost?.toFixed(2) || '0.00'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Contact Info</h4>
                    <p className="text-sm text-gray-400">{request.mobileNumber || request.personalInfo?.phone || 'N/A'}</p>
                    <p className="text-sm text-gray-400">{request.email || request.personalInfo?.email || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Farm Details</h4>
                    <p className="text-sm text-gray-400">Soil: {request.soilType || request.farmInfo?.soilType || 'N/A'}</p>
                    <p className="text-sm text-gray-400">Location: {request.farmLocation || request.farmInfo?.location || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Sensors Requested</h4>
                    <div className="flex flex-wrap gap-1">
                      {/* Multi-step form data */}
                      {request.selectedParameters && request.selectedParameters.length > 0 ? (
                        request.selectedParameters.map((sensor) => (
                          <span key={sensor} className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                            {sensor.replace(/([A-Z])/g, ' $1').replace('Ldr', 'LDR').replace('Mq135', 'MQ135').trim()}
                          </span>
                        ))
                      ) : (
                        /* Legacy format support */
                        request.paramRequirements?.sensors && Object.entries(request.paramRequirements.sensors)
                          .filter(([_, selected]) => selected)
                          .map(([sensor, _]) => (
                            <span key={sensor} className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                              {sensor.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Requested: {request.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      View Details
                    </button>
                    
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleEstimateCost(request)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Estimate Cost
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showOrderDetails && selectedRequest && (
        <OrderDetailsModal
          request={selectedRequest}
          onClose={handleCloseModals}
          onUpdate={() => {
            // Refresh data will happen automatically via real-time listener
          }}
        />
      )}

      {showCostEstimate && selectedRequest && (
        <CostEstimateModal
          request={selectedRequest}
          onClose={handleCloseModals}
          onSuccess={() => {
            // Refresh data will happen automatically via real-time listener
          }}
        />
      )}
    </div>
  );
};

export default AdminOrderManagement;
