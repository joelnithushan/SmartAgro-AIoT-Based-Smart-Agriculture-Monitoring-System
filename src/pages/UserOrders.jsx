import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import MultiStepDeviceRequest from '../components/MultiStepDeviceRequest';
import UpdateRequestModal from '../components/UpdateRequestModal';
import CostEstimationPDFOnly from '../components/CostEstimationPDFOnly';
import CostEstimationQRViewer from '../components/common/ui/CostEstimationQRViewer';
// Removed MultiStepFormDataTest import - component deleted
import toast from 'react-hot-toast';

const UserOrders = () => {
  const { currentUser } = useAuth();
  const [deviceRequests, setDeviceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updatingRequest, setUpdatingRequest] = useState(null);
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showQRViewer, setShowQRViewer] = useState(false);
  const [selectedOrderForPDF, setSelectedOrderForPDF] = useState(null);
  const [selectedOrderForQR, setSelectedOrderForQR] = useState(null);

  // Fetch device requests in real-time
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    console.log('🔍 Setting up real-time listener for user:', currentUser.uid);

    // Use simple query without orderBy to avoid index issues
    const q = query(
      collection(db, 'deviceRequests'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = [];
      snapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort manually by createdAt
      const sortedRequests = requests.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return new Date(bTime) - new Date(aTime);
      });
      
      console.log('📋 Device requests updated:', sortedRequests);
      setDeviceRequests(sortedRequests);
      setLoading(false);
    }, (error) => {
      console.error('❌ Error fetching device requests:', error);
      console.error('Error details:', error.code, error.message);
      
      // Handle different error types
      if (error.code === 'permission-denied') {
        console.log('⚠️ Permission denied - user may not have access to deviceRequests collection');
        setDeviceRequests([]);
        setLoading(false);
        // Don't show error toast for permission issues - this is expected for new users
      } else if (error.code === 'failed-precondition') {
        console.log('⚠️ Failed precondition - likely missing Firestore index');
        setDeviceRequests([]);
        setLoading(false);
        // Don't show error toast for index issues
      } else if (error.code === 'unavailable') {
        console.log('⚠️ Service unavailable - network or Firebase issue');
        setDeviceRequests([]);
        setLoading(false);
        toast.error('Service temporarily unavailable. Please try again.');
      } else {
        // Only show error toast for unexpected errors
        console.log('⚠️ Unexpected error:', error);
        setDeviceRequests([]);
        setLoading(false);
        toast.error('Failed to load device requests');
      }
    });

    return () => {
      console.log('🧹 Cleaning up device requests listener');
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Check if user can make more requests
  const canMakeRequest = () => {
    const activeStatuses = ['pending', 'accepted', 'device-assigned'];
    const activeRequests = deviceRequests.filter(req => 
      activeStatuses.includes(req.status)
    );
    return activeRequests.length < 3;
  };

  // Handle request update
  const handleUpdateRequest = async (requestId) => {
    const request = deviceRequests.find(req => req.id === requestId);
    if (!request) {
      toast.error('Request not found');
      return;
    }

    // Check if request can be updated (only pending requests)
    if (request.status !== 'pending') {
      toast.error('Only pending requests can be updated');
      return;
    }

    setSelectedRequest(request);
    setShowUpdateModal(true);
  };

  // Handle request cancellation
  const handleCancelRequest = async (requestId) => {
    const request = deviceRequests.find(req => req.id === requestId);
    if (!request) {
      toast.error('Request not found');
      return;
    }

    // Check if request can be cancelled (only pending requests)
    if (request.status !== 'pending') {
      toast.error('Only pending requests can be cancelled');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this request? This action cannot be undone.')) {
      return;
    }

    setCancellingRequest(requestId);
    try {
      const requestRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(requestRef, {
        status: 'cancelled',
        updatedAt: new Date(),
        cancelledAt: new Date(),
        cancelledBy: currentUser.uid,
        cancelReason: 'User requested cancellation'
      });
      
      console.log('✅ Request cancelled successfully:', requestId);
      toast.success('Request cancelled successfully');
    } catch (error) {
      console.error('❌ Error cancelling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setCancellingRequest(null);
    }
  };

  // Handle new request success
  const handleRequestSuccess = (result) => {
    console.log('✅ New device request submitted:', result);
    toast.success('Device request submitted successfully!');
    setShowRequestModal(false);
  };

  // Handle update request success
  const handleUpdateSuccess = (requestId) => {
    console.log('✅ Device request updated:', requestId);
    toast.success('Device request updated successfully!');
    setShowUpdateModal(false);
    setSelectedRequest(null);
  };

  // Handle accept cost estimation
  const handleAcceptCost = async (requestId) => {
    try {
      const requestRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(requestRef, {
        status: 'user-accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Cost estimation accepted! Admin will assign your device soon.');
    } catch (error) {
      console.error('Error accepting cost estimation:', error);
      toast.error('Failed to accept cost estimation');
    }
  };

  // Handle reject cost estimation
  const handleRejectCost = async (requestId) => {
    try {
      const requestRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(requestRef, {
        status: 'user-rejected',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Cost estimation rejected. You can request a new device.');
    } catch (error) {
      console.error('Error rejecting cost estimation:', error);
      toast.error('Failed to reject cost estimation');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      accepted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Accepted' },
      'device-assigned': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Device Assigned' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      rejected: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url(/images/leaves-bg.jpg)'
      }}
    >
      <div className="min-h-screen bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">My Device Orders</h1>
            <p className="mt-2 text-gray-200">Manage your IoT device requests and track their status</p>
          </div>

          {/* Request Form Section */}
          <div className="bg-white bg-opacity-95 rounded-lg shadow-lg backdrop-blur-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Request New Device</h2>
              <p className="text-gray-600 mt-1">
                Submit a request for IoT devices to monitor your farm
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Active requests: {deviceRequests.filter(req => ['pending', 'accepted', 'device-assigned'].includes(req.status)).length}/3
              </div>
              {canMakeRequest() ? (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Request Device
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg font-medium cursor-not-allowed"
                >
                  Max Requests Reached
                </button>
              )}
            </div>
          </div>
        </div>

          {/* Orders List */}
          <div className="bg-white bg-opacity-95 rounded-lg shadow-lg backdrop-blur-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">My Orders</h2>
          </div>

          {deviceRequests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-4">Submit your first device request to get started</p>
              {canMakeRequest() && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Request Device
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {deviceRequests.map((request, index) => (
                <div key={request.id} className="relative">
                  {index > 0 && (
                    <div className="border-t-2 border-green-500 my-4"></div>
                  )}
                  <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          Device Request #{request.id.slice(-8)}
                        </h3>
                        {getStatusBadge(request.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.requestType === 'multi-step' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {request.requestType === 'multi-step' ? 'Multi-Step Form' : 'Legacy Form'}
                        </span>
                      </div>
                      
                      {/* Personal Information */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Full Name:</span>
                            <p className="text-gray-900">{request.fullName || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Email:</span>
                            <p className="text-gray-900">{request.email || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Age:</span>
                            <p className="text-gray-900">{request.age || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Mobile:</span>
                            <p className="text-gray-900">{request.mobileNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">NIC Number:</span>
                            <p className="text-gray-900">{request.nicNumber || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Passport:</span>
                            <p className="text-gray-900">{request.passportNumber || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="font-medium text-gray-600">Address:</span>
                          <p className="text-gray-900">{request.address || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Farm Information */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Farm Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Farm Name:</span>
                            <p className="text-gray-900">{request.farmName || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Farm Size:</span>
                            <p className="text-gray-900">{request.farmSize ? `${request.farmSize} acres` : 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Soil Type:</span>
                            <p className="text-gray-900">{request.soilType || 'Not specified'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Farm Location:</span>
                            <p className="text-gray-900">{request.farmLocation || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Sand Type:</span>
                            <p className="text-gray-900">{request.additionalSandType || 'Not specified'}</p>
                          </div>
                        </div>
                        {request.additionalFarmInfo && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-600">Additional Info:</span>
                            <p className="text-gray-900">{request.additionalFarmInfo}</p>
                          </div>
                        )}
                      </div>

                      {/* Device Configuration */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Device Configuration</h4>
                        {request.selectedParameters && request.selectedParameters.length > 0 ? (
                          <div>
                            <span className="font-medium text-gray-600">Selected Parameters:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {request.selectedParameters.map((param) => (
                                <span key={param} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  {param.replace(/([A-Z])/g, ' $1').replace('Ldr', 'LDR').replace('Mq135', 'MQ135').trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium text-gray-600">Selected Parameters:</span>
                            <p className="text-gray-500 text-sm">No parameters selected (legacy request)</p>
                          </div>
                        )}
                        {request.additionalDeviceInfo && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-600">Device Notes:</span>
                            <p className="text-gray-900">{request.additionalDeviceInfo}</p>
                          </div>
                        )}
                      </div>


                      <div className="mt-3 text-sm text-gray-500">
                        <span className="font-medium">Created:</span> {formatDate(request.createdAt)}
                        {request.updatedAt && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="font-medium">Updated:</span> {formatDate(request.updatedAt)}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateRequest(request.id)}
                            disabled={updatingRequest === request.id}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>{updatingRequest === request.id ? 'Updating...' : 'Update'}</span>
                          </button>
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            disabled={cancellingRequest === request.id}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>{cancellingRequest === request.id ? 'Cancelling...' : 'Cancel'}</span>
                          </button>
                        </>
                      )}
                      
                      {/* PDF & QR Viewing for user-accepted status */}
                      {request.status === 'user-accepted' && (request.costDetails || request.costEstimate) && (
                        <div className="flex flex-col space-y-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedOrderForPDF(request);
                                setShowPDFViewer(true);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrderForQR(request);
                                setShowQRViewer(true);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v.01M12 8v.01M12 12v.01M12 16v.01M12 20v.01M16 12h.01M20 12h.01M4 12h.01M8 12h.01" />
                              </svg>
                              <span>QR Code</span>
                            </button>
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            ✅ Cost accepted - Device assignment in progress
                          </div>
                        </div>
                      )}
                      
                      {/* Cost Estimation Actions */}
                      {request.status === 'cost-estimated' && (request.costDetails || request.costEstimate) && (
                        <div className="flex flex-col space-y-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedOrderForPDF(request);
                                setShowPDFViewer(true);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrderForQR(request);
                                setShowQRViewer(true);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v.01M12 8v.01M12 12v.01M12 16v.01M12 20v.01M16 12h.01M20 12h.01M4 12h.01M8 12h.01" />
                              </svg>
                              <span>QR Code</span>
                            </button>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptCost(request.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                              Accept Cost Estimation
                            </button>
                            <button
                              onClick={() => handleRejectCost(request.id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                              Reject Cost Estimation
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* PDF & QR Viewing for user-rejected status */}
                      {request.status === 'user-rejected' && (request.costDetails || request.costEstimate) && (
                        <div className="flex flex-col space-y-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedOrderForPDF(request);
                                setShowPDFViewer(true);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrderForQR(request);
                                setShowQRViewer(true);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v.01M12 8v.01M12 12v.01M12 16v.01M12 20v.01M16 12h.01M20 12h.01M4 12h.01M8 12h.01" />
                              </svg>
                              <span>QR Code</span>
                            </button>
                          </div>
                          <div className="text-sm text-orange-600 font-medium">
                            ❌ Cost estimation rejected
                          </div>
                        </div>
                      )}
                      
                      {/* PDF & QR Viewing for completed status */}
                      {request.status === 'completed' && (request.costDetails || request.costEstimate) && (
                        <div className="flex flex-col space-y-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedOrderForPDF(request);
                                setShowPDFViewer(true);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrderForQR(request);
                                setShowQRViewer(true);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v.01M12 8v.01M12 12v.01M12 16v.01M12 20v.01M16 12h.01M20 12h.01M4 12h.01M8 12h.01" />
                              </svg>
                              <span>QR Code</span>
                            </button>
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            🎉 Request completed successfully!
                          </div>
                        </div>
                      )}
                      
                      {request.status !== 'pending' && request.status !== 'cost-estimated' && request.status !== 'user-accepted' && request.status !== 'user-rejected' && request.status !== 'completed' && (
                        <div className="flex items-center space-x-2">
                          {request.status === 'cancelled' && (
                            <div className="flex items-center space-x-1 text-red-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span className="text-sm font-medium">Request cancelled</span>
                            </div>
                          )}
                          {['accepted', 'device-assigned', 'rejected'].includes(request.status) && (
                            <div className="flex items-center space-x-1 text-blue-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium">Request in progress</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Data Structure Test - Remove after verification */}
      <div className="mt-8">
        {/* MultiStepFormDataTest component removed */}
      </div>

      {/* Multi-Step Device Request Modal */}
      {showRequestModal && (
        <MultiStepDeviceRequest
          onClose={() => setShowRequestModal(false)}
          onSuccess={handleRequestSuccess}
        />
      )}

      {/* Update Request Modal */}
      {showUpdateModal && selectedRequest && (
        <UpdateRequestModal
          request={selectedRequest}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Cost Estimation PDF Viewer Modal */}
      {showPDFViewer && selectedOrderForPDF && (
        <CostEstimationPDFOnly
          request={selectedOrderForPDF}
          isOpen={showPDFViewer}
          onClose={() => {
            setShowPDFViewer(false);
            setSelectedOrderForPDF(null);
          }}
        />
      )}

      {/* Cost Estimation QR Viewer Modal */}
      {showQRViewer && selectedOrderForQR && (
        <CostEstimationQRViewer
          request={selectedOrderForQR}
          isOpen={showQRViewer}
          onClose={() => {
            setShowQRViewer(false);
            setSelectedOrderForQR(null);
          }}
        />
      )}
    </div>
  );
};

export default UserOrders;
