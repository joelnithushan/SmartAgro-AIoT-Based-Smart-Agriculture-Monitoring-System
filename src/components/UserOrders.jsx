import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deviceRequestsService } from '../services/firestoreService';
import UpdateRequestModal from './UpdateRequestModal';
import toast from 'react-hot-toast';

const UserOrders = ({ onRequestDevice }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Subscribe to user's orders in real-time
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('❌ No current user, cannot load orders');
      setLoading(false);
      return;
    }

    console.log('🔄 Setting up real-time subscription for user orders:', currentUser.uid);

    const unsubscribe = deviceRequestsService.subscribeToUserRequests(
      currentUser.uid,
      (userOrders) => {
        console.log('📥 Received user orders:', userOrders.length);
        setOrders(userOrders);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      console.log('🔄 Unsubscribing from user orders');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid]);

  const handleAcceptCost = async (orderId) => {
    try {
      const result = await deviceRequestsService.updateRequestStatus(orderId, 'user-accepted', {
        acceptedAt: new Date()
      });
      
      if (result.success) {
        toast.success('Cost accepted! Your order is now being processed.');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error accepting cost:', error);
      toast.error('Failed to accept cost. Please try again.');
    }
  };

  const handleRejectCost = async (orderId) => {
    try {
      const result = await deviceRequestsService.updateRequestStatus(orderId, 'user-rejected', {
        rejectedAt: new Date()
      });
      
      if (result.success) {
        toast.success('Cost rejected. You can request a new device.');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error rejecting cost:', error);
      toast.error('Failed to reject cost. Please try again.');
    }
  };

  // Handle update request
  const handleUpdateRequest = (requestId) => {
    setSelectedRequestId(requestId);
    setShowUpdateModal(true);
  };

  // Handle cancel request
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deviceRequestsService.cancelRequest(requestId, currentUser.uid);
      if (result.success) {
        toast.success('Request cancelled successfully');
      } else {
        toast.error('Failed to cancel request: ' + result.error);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Error cancelling request');
    }
  };

  // Handle successful update
  const handleUpdateSuccess = () => {
    toast.success('Request updated successfully');
    setShowUpdateModal(false);
    setSelectedRequestId(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-green-50 text-green-600 border-green-200',
      'cost-estimated': 'bg-green-100 text-green-700 border-green-300',
      'user-accepted': 'bg-green-200 text-green-800 border-green-400',
      'user-rejected': 'bg-red-50 text-red-700 border-red-200',
      'device-assigned': 'bg-green-300 text-green-900 border-green-500',
      'completed': 'bg-green-500 text-white border-green-600',
      'cancelled': 'bg-gray-50 text-gray-500 border-gray-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Pending Review',
      'cost-estimated': 'Cost Estimated',
      'user-accepted': 'Accepted',
      'user-rejected': 'Rejected',
      'device-assigned': 'Device Assigned',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return texts[status] || status;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const canRequestMore = orders.length < 3;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Device Orders</h2>
            <p className="text-sm text-gray-600">
              {orders.length}/3 orders submitted
            </p>
          </div>
        </div>
        
        {canRequestMore && (
          <button
            onClick={() => onRequestDevice(canRequestMore)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Request Device
          </button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No device orders yet</h3>
          <p className="mt-2 text-sm text-gray-600">Get started by submitting your first device request</p>
          {canRequestMore && (
            <button
              onClick={() => onRequestDevice(canRequestMore)}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Request Device
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Order #{order.id.substring(0, 8).toUpperCase()}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Submitted: {formatTimestamp(order.createdAt)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                    <p className="text-sm text-gray-900 mt-1">{order.fullName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</label>
                    <p className="text-sm text-gray-900 mt-1">{order.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">NIC Number</label>
                    <p className="text-sm text-gray-900 mt-1">{order.nic || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Device/Farm Location</label>
                    <p className="text-sm text-gray-900 mt-1">{order.location || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Cost Estimation Display */}
              {order.costDetails && (
                <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-green-800">Cost Estimation</h5>
                    <span className="text-xl font-bold text-green-700">
                      ${order.costDetails.totalCost?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-green-600 font-medium">Device:</span>
                      <span className="text-green-800 ml-2">${order.costDetails.deviceCost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">Service:</span>
                      <span className="text-green-800 ml-2">${order.costDetails.serviceCharge?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">Delivery:</span>
                      <span className="text-green-800 ml-2">${order.costDetails.deliveryCharge?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Device Assignment */}
              {order.assignedDeviceId && (
                <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
                  <h5 className="text-sm font-semibold text-purple-800 mb-2">Device Assigned</h5>
                  <p className="text-sm text-purple-700">
                    <span className="font-medium">Device ID:</span> {order.assignedDeviceId}
                  </p>
                  {order.deviceNotes && (
                    <p className="text-xs text-purple-600 mt-2">
                      <span className="font-medium">Notes:</span> {order.deviceNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {/* Update and Cancel buttons - only show for pending requests */}
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateRequest(order.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Update Request
                    </button>
                    <button
                      onClick={() => handleCancelRequest(order.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Cancel Request
                    </button>
                  </>
                )}

                {/* Cost acceptance buttons - only show when cost is estimated */}
                {order.status === 'cost-estimated' && (
                  <>
                    <button
                      onClick={() => handleAcceptCost(order.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Accept Cost
                    </button>
                    <button
                      onClick={() => handleRejectCost(order.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Reject Cost
                    </button>
                  </>
                )}

                {/* Status message for non-actionable states */}
                {!['pending', 'cost-estimated'].includes(order.status) && (
                  <div className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm text-center border border-gray-200">
                    {order.status === 'cancelled' && 'Request cancelled'}
                    {order.status === 'user-rejected' && 'Cost rejected'}
                    {order.status === 'user-accepted' && 'Waiting for device assignment'}
                    {order.status === 'device-assigned' && 'Device assigned - setup in progress'}
                    {order.status === 'completed' && 'Order completed successfully'}
                  </div>
                )}
              </div>
            </div>
          ))}

          {!canRequestMore && (
            <div className="text-center py-6 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                You have reached the maximum limit of 3 device orders.
              </p>
              <p className="text-xs text-green-600 mt-1">
                Cancel or complete existing orders to submit new requests.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Update Request Modal */}
      <UpdateRequestModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedRequestId(null);
        }}
        onSuccess={handleUpdateSuccess}
        requestId={selectedRequestId}
      />
    </div>
  );
};

export default UserOrders;