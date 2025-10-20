import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useCurrency } from '../context/CurrencyContext';
const OrderDetailsModal = ({ isOpen, onClose, requestId }) => {
  const { formatCurrency } = useCurrency();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCostForm, setShowCostForm] = useState(false);
  const [costData, setCostData] = useState({
    deviceCost: '',
    serviceCharge: '',
    delivery: '',
    totalCost: ''
  });
  const [deviceId, setDeviceId] = useState('');
  const [showDeviceAssignment, setShowDeviceAssignment] = useState(false);
  const [costValidationErrors, setCostValidationErrors] = useState({});

  // Validation functions for cost estimation
  const validateCostInput = (value) => {
    // Allow empty string, numbers, and decimal points
    const regex = /^(\d+\.?\d*)?$/;
    return regex.test(value);
  };

  const handleCostInputChange = (field, value) => {
    // Validate input - only allow numbers and decimal point
    if (!validateCostInput(value)) {
      return; // Don't update if invalid
    }

    setCostData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (costValidationErrors[field]) {
      setCostValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCostForm = () => {
    const errors = {};
    
    // Check if all required fields have values
    if (!costData.deviceCost || costData.deviceCost === '') {
      errors.deviceCost = 'Device cost is required';
    } else if (parseFloat(costData.deviceCost) < 0) {
      errors.deviceCost = 'Device cost cannot be negative';
    }
    
    if (!costData.serviceCharge || costData.serviceCharge === '') {
      errors.serviceCharge = 'Service charge is required';
    } else if (parseFloat(costData.serviceCharge) < 0) {
      errors.serviceCharge = 'Service charge cannot be negative';
    }
    
    if (!costData.delivery || costData.delivery === '') {
      errors.delivery = 'Delivery charge is required';
    } else if (parseFloat(costData.delivery) < 0) {
      errors.delivery = 'Delivery charge cannot be negative';
    }

    setCostValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (!isOpen || !requestId) return;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const orderRef = doc(db, 'deviceRequests', requestId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          setOrder({
            id: orderSnap.id,
            ...orderSnap.data()
          });
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [isOpen, requestId]);
  useEffect(() => {
    const deviceCost = parseFloat(costData.deviceCost) || 0;
    const serviceCharge = parseFloat(costData.serviceCharge) || 0;
    const delivery = parseFloat(costData.delivery) || 0;
    const total = deviceCost + serviceCharge + delivery;
    setCostData(prev => ({
      ...prev,
      totalCost: total.toFixed(2)
    }));
  }, [costData.deviceCost, costData.serviceCharge, costData.delivery]);
  const handleCostSubmit = async () => {
    // Validate form before submission
    if (!validateCostForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const orderRef = doc(db, 'deviceRequests', requestId);
      // Admin enters costs in LKR, so store them as LKR and convert to USD
      const deviceCostLKR = parseFloat(costData.deviceCost);
      const serviceChargeLKR = parseFloat(costData.serviceCharge);
      const deliveryLKR = parseFloat(costData.delivery);
      const totalCostLKR = deviceCostLKR + serviceChargeLKR + deliveryLKR;
      
      // Convert LKR to USD for storage
      const deviceCostUSD = deviceCostLKR / 303.62;
      const serviceChargeUSD = serviceChargeLKR / 303.62;
      const deliveryUSD = deliveryLKR / 303.62;
      const totalCostUSD = totalCostLKR / 303.62;

      await updateDoc(orderRef, {
        costDetails: {
          deviceCost: deviceCostUSD,
          serviceCharge: serviceChargeUSD,
          delivery: deliveryUSD,
          totalCost: totalCostUSD,
          // Store original LKR values for reference
          deviceCostLKR: deviceCostLKR,
          serviceChargeLKR: serviceChargeLKR,
          deliveryLKR: deliveryLKR,
          totalCostLKR: totalCostLKR
        },
        status: 'cost-estimated',
        estimatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess('Cost estimation submitted successfully!');
      setShowCostForm(false);
      setCostValidationErrors({}); // Clear validation errors
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        setOrder({
          id: orderSnap.id,
          ...orderSnap.data()
        });
      }
    } catch (err) {
      console.error('Error submitting cost estimation:', err);
      setError('Failed to submit cost estimation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      setLoading(true);
      setError('');
      const orderRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(orderRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess('Request accepted successfully! You can now create a cost estimation.');
      // Refresh order data
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        setOrder({
          id: orderSnap.id,
          ...orderSnap.data()
        });
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Failed to accept request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    try {
      setLoading(true);
      setError('');
      const orderRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(orderRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess('Request rejected successfully.');
      // Refresh order data
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        setOrder({
          id: orderSnap.id,
          ...orderSnap.data()
        });
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDevice = async () => {
    if (!deviceId.trim()) {
      setError('Please enter a device ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const orderRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(orderRef, {
        assignedDeviceId: deviceId.trim(),
        status: 'device-assigned',
        deviceAssignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess(`Device ${deviceId.trim()} assigned successfully!`);
      setShowDeviceAssignment(false);
      setDeviceId('');
      // Refresh order data
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        setOrder({
          id: orderSnap.id,
          ...orderSnap.data()
        });
      }
    } catch (err) {
      console.error('Error assigning device:', err);
      setError('Failed to assign device');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const orderRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(orderRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess('Order completed successfully!');
      // Refresh order data
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        setOrder({
          id: orderSnap.id,
          ...orderSnap.data()
        });
      }
    } catch (err) {
      console.error('Error completing order:', err);
      setError('Failed to complete order');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const orderRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(orderRef, {
        status: 'user-accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess('Order accepted successfully!');
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        setOrder({
          id: orderSnap.id,
          ...orderSnap.data()
        });
      }
    } catch (err) {
      console.error('Error accepting order:', err);
      setError('Failed to accept order');
    } finally {
      setLoading(false);
    }
  };
  const handleRejectOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const orderRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(orderRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess('Order rejected successfully!');
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        setOrder({
          id: orderSnap.id,
          ...orderSnap.data()
        });
      }
    } catch (err) {
      console.error('Error rejecting order:', err);
      setError('Failed to reject order');
    } finally {
      setLoading(false);
    }
  };
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {}
        <div className="bg-green-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Order Details</h2>
              <p className="text-green-100 mt-1">Request ID: {requestId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-green-100 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading order details...</p>
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="ml-3 text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="ml-3 text-sm text-green-800">{success}</p>
              </div>
            </div>
          )}
          {order && !loading && (
            <div className="space-y-6">
              {}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Status</h3>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'cost-estimated' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'user-accepted' ? 'bg-green-100 text-green-800' :
                    order.status === 'device-assigned' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status?.replace('-', ' ') || 'Unknown'}
                  </span>
                  <span className="text-sm text-gray-600">
                    Created: {formatTimestamp(order.createdAt)}
                  </span>
                </div>
              </div>
              {}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{order.fullName || order.personalInfo?.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{order.email || order.userEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <p className="mt-1 text-sm text-gray-900">{order.age || order.personalInfo?.age || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                    <p className="mt-1 text-sm text-gray-900">{order.mobileNumber || order.personalInfo?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">NIC Number</label>
                    <p className="mt-1 text-sm text-gray-900">{order.nicNumber || order.personalInfo?.nic || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Passport Number</label>
                    <p className="mt-1 text-sm text-gray-900">{order.passportNumber || order.personalInfo?.passportId || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{order.address || order.personalInfo?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
              {}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Farm Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Farm Name</label>
                    <p className="mt-1 text-sm text-gray-900">{order.farmName || order.farmInfo?.farmName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Farm Size</label>
                    <p className="mt-1 text-sm text-gray-900">{order.farmSize || order.farmInfo?.farmSize || 'N/A'} acres</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Soil Type</label>
                    <p className="mt-1 text-sm text-gray-900">{order.soilType || order.farmInfo?.soilType || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Farm Location</label>
                    <p className="mt-1 text-sm text-gray-900">{order.farmLocation || order.farmInfo?.location || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Additional Sand Type</label>
                    <p className="mt-1 text-sm text-gray-900">{order.additionalSandType || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Additional Information</label>
                    <p className="mt-1 text-sm text-gray-900">{order.additionalFarmInfo || order.farmInfo?.notes || 'No additional notes'}</p>
                  </div>
                </div>
              </div>
              {}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Device Configuration</h3>
                {}
                {order.selectedParameters && order.selectedParameters.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Parameters</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {order.selectedParameters.map((param) => (
                        <div key={param} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm text-gray-700 capitalize">
                            {param.replace(/([A-Z])/g, ' $1').replace('Ldr', 'LDR').replace('Mq135', 'MQ135').trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                    {order.additionalDeviceInfo && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Additional Device Information</label>
                        <p className="mt-1 text-sm text-gray-900">{order.additionalDeviceInfo}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Sensor Requirements</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(order.paramRequirements || {}).map(([sensor, required]) => (
                        <div key={sensor} className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${required ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm text-gray-700 capitalize">{sensor.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                      ))}
                    </div>
                    {order.advancedNotes && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Advanced Notes</label>
                        <p className="mt-1 text-sm text-gray-900">{order.advancedNotes}</p>
                      </div>
                    )}
                  </div>
                )}
                {}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Request Type:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.requestType === 'multi-step' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.requestType === 'multi-step' ? 'Multi-Step Form' : 'Legacy Form'}
                    </span>
                  </div>
                </div>
              </div>
              {}
              {order.costDetails && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Estimation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Device Cost</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatCurrency(order.costDetails.deviceCost)} / LKR {order.costDetails.deviceCostLKR?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service Charge</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatCurrency(order.costDetails.serviceCharge)} / LKR {order.costDetails.serviceChargeLKR?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Delivery</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatCurrency(order.costDetails.deliveryCharge)} / LKR {order.costDetails.deliveryLKR?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                      <p className="mt-1 text-lg font-semibold text-green-600">
                        {formatCurrency(order.costDetails.totalCost)} / LKR {order.costDetails.totalCostLKR?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Estimated: {formatTimestamp(order.estimatedAt)}
                  </p>
                </div>
              )}
              {}
              {order.status === 'pending' && !order.costDetails && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">Cost Estimation</h3>
                  <div className="flex items-center space-x-2">
                    <div className="text-yellow-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-yellow-700 font-medium">
                      Please accept the order first before providing cost estimation
                    </p>
                  </div>
                  <button
                    disabled
                    className="mt-3 bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed opacity-50"
                  >
                    Provide Cost Estimation (Disabled)
                  </button>
                </div>
              )}
              {order.status === 'accepted' && !order.costDetails && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Estimation</h3>
                  {!showCostForm ? (
                    <button
                      onClick={() => setShowCostForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Provide Cost Estimation
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Device Cost (LKR)</label>
                          <input
                            type="text"
                            value={costData.deviceCost}
                            onChange={(e) => handleCostInputChange('deviceCost', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                              costValidationErrors.deviceCost 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-green-500'
                            }`}
                            placeholder="0.00"
                          />
                          {costValidationErrors.deviceCost && (
                            <p className="mt-1 text-sm text-red-600">{costValidationErrors.deviceCost}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (LKR)</label>
                          <input
                            type="text"
                            value={costData.serviceCharge}
                            onChange={(e) => handleCostInputChange('serviceCharge', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                              costValidationErrors.serviceCharge 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-green-500'
                            }`}
                            placeholder="0.00"
                          />
                          {costValidationErrors.serviceCharge && (
                            <p className="mt-1 text-sm text-red-600">{costValidationErrors.serviceCharge}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery (LKR)</label>
                          <input
                            type="text"
                            value={costData.delivery}
                            onChange={(e) => handleCostInputChange('delivery', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                              costValidationErrors.delivery 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-green-500'
                            }`}
                            placeholder="0.00"
                          />
                          {costValidationErrors.delivery && (
                            <p className="mt-1 text-sm text-red-600">{costValidationErrors.delivery}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (LKR)</label>
                          <input
                            type="text"
                            value={costData.totalCost}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-semibold"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleCostSubmit}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                        >
                          {loading ? 'Submitting...' : 'Submit Cost Estimation'}
                        </button>
                        <button
                          onClick={() => setShowCostForm(false)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Device Assignment Form */}
              {showDeviceAssignment && order.status === 'user-accepted' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Assign Device ID</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Device ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter device ID (e.g., ESP32_001, DEV_001)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the unique device ID that will be assigned to this farm
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleAssignDevice}
                        disabled={loading || !deviceId.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                      >
                        {loading ? 'Assigning...' : 'Assign Device'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeviceAssignment(false);
                          setDeviceId('');
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Actions</h3>
                
                {/* Workflow Status Info */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Workflow Status:</h4>
                  <div className="text-sm text-blue-800">
                    {order.status === 'pending' && (
                      <>📋 <strong>Pending Review</strong> - Request is waiting for admin approval</>
                    )}
                    {order.status === 'accepted' && (
                      <>✅ <strong>Accepted</strong> - Request approved, cost estimation now available</>
                    )}
                    {order.status === 'cost-estimated' && (
                      <>💰 <strong>Cost Estimated</strong> - Cost sent to user, waiting for their response</>
                    )}
                    {order.status === 'user-accepted' && (
                      <>🎉 <strong>User Accepted</strong> - User approved cost, ready for device assignment</>
                    )}
                    {order.status === 'user-rejected' && (
                      <>❌ <strong>User Rejected</strong> - User rejected the cost estimation</>
                    )}
                    {order.status === 'device-assigned' && (
                      <>📱 <strong>Device Assigned</strong> - Device ID assigned, ready to complete</>
                    )}
                    {order.status === 'completed' && (
                      <>🎉 <strong>Completed</strong> - Order completed successfully</>
                    )}
                    {order.status === 'rejected' && (
                      <>🚫 <strong>Rejected</strong> - Request was rejected by admin</>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={handleAcceptRequest}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Accept Request'}
                      </button>
                      <button
                        onClick={handleRejectRequest}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Reject Request'}
                      </button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => setShowCostForm(true)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      Create Cost Estimation
                    </button>
                  )}
                  {order.status === 'cost-estimated' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="text-blue-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-blue-700 font-medium">
                          Cost estimation sent to user. Waiting for user response.
                        </p>
                      </div>
                      <div className="text-sm text-blue-600">
                        The user will receive a notification and can accept or reject the cost estimation.
                      </div>
                    </div>
                  )}
                  {order.status === 'user-accepted' && (
                    <>
                      <button
                        onClick={() => setShowDeviceAssignment(true)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Assign Device ID'}
                      </button>
                      <div className="text-sm text-green-600 font-medium mt-2">
                        ✅ Order accepted by user - Ready for device assignment
                      </div>
                    </>
                  )}
                  {order.status === 'device-assigned' && (
                    <>
                      <div className="bg-purple-50 rounded-lg p-4 mb-3">
                        <h4 className="text-sm font-semibold text-purple-800 mb-2">📱 Device Assignment</h4>
                        <p className="text-sm text-purple-700">
                          <span className="font-medium">Assigned Device ID:</span> {order.assignedDeviceId}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          Device assigned on: {order.deviceAssignedAt ? new Date(order.deviceAssignedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={handleCompleteOrder}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                        style={{ width: '150px', height: '50px', marginTop: '30px' }}
                      >
                        {loading ? 'Processing...' : 'Mark as Completed'}
                      </button>
                    </>
                  )}
                  {order.status === 'user-rejected' && (
                    <div className="text-sm text-orange-600 font-medium">
                      ❌ Cost estimation rejected by user
                    </div>
                  )}
                  {order.status === 'completed' && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium mb-2">
                        🎉 Order completed successfully!
                      </div>
                      {order.assignedDeviceId && (
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Assigned Device:</span> {order.assignedDeviceId}
                        </div>
                      )}
                      {order.completedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Completed on: {new Date(order.completedAt.seconds * 1000).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                  {order.status === 'rejected' && (
                    <div className="text-sm text-red-600 font-medium">
                      ❌ Order rejected
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default OrderDetailsModal;