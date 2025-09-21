import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [estimateData, setEstimateData] = useState({
    deviceCost: '',
    serviceCharge: '',
    deliveryCharge: '',
    notes: ''
  });
  const [assignData, setAssignData] = useState({
    deviceId: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'deviceRequests')),
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleEstimateCost = async () => {
    if (!selectedOrder) return;

    setActionLoading(true);
    try {
      // Use Firestore directly instead of backend API
      const totalCost = parseFloat(estimateData.deviceCost) + parseFloat(estimateData.serviceCharge) + parseFloat(estimateData.deliveryCharge);
      
      await updateDoc(doc(db, 'deviceRequests', selectedOrder.id), {
        status: 'cost-estimated',
        costDetails: {
          deviceCost: parseFloat(estimateData.deviceCost),
          serviceCharge: parseFloat(estimateData.serviceCharge),
          deliveryCharge: parseFloat(estimateData.deliveryCharge),
          totalCost: totalCost,
          notes: estimateData.notes || '',
          estimatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      
      toast.success('Cost estimate created successfully');
      setShowEstimateModal(false);
      setEstimateData({ deviceCost: '', serviceCharge: '', deliveryCharge: '', notes: '' });
    } catch (error) {
      console.error('Error estimating cost:', error);
      toast.error('Failed to create cost estimate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDevice = async () => {
    if (!selectedOrder || !assignData.deviceId) return;

    setActionLoading(true);
    try {
      // Use Firestore directly instead of backend API
      await updateDoc(doc(db, 'deviceRequests', selectedOrder.id), {
        deviceId: assignData.deviceId,
        status: 'device-assigned',
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast.success('Device assigned successfully');
      setShowAssignModal(false);
      setAssignData({ deviceId: '' });
    } catch (error) {
      console.error('Error assigning device:', error);
      toast.error('Failed to assign device');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;

    setActionLoading(true);
    try {
      // Use Firestore directly instead of backend API
      await updateDoc(doc(db, 'deviceRequests', selectedOrder.id), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectionReason: 'Rejected by admin',
        updatedAt: serverTimestamp()
      });
      
      toast.success('Order rejected successfully');
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrder) return;

    setActionLoading(true);
    try {
      // Use Firestore directly instead of backend API
      await updateDoc(doc(db, 'deviceRequests', selectedOrder.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast.success('Order completed successfully');
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Failed to complete order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = (action, order) => {
    setSelectedOrder(order);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = () => {
    if (!selectedOrder || !confirmAction) return;

    switch (confirmAction) {
      case 'reject':
        handleRejectOrder();
        break;
      case 'complete':
        handleCompleteOrder();
        break;
      default:
        break;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'yellow', text: 'Pending' },
      'cost-estimated': { color: 'blue', text: 'Cost Estimated' },
      'user-accepted': { color: 'green', text: 'User Accepted' },
      'device-assigned': { color: 'purple', text: 'Device Assigned' },
      completed: { color: 'green', text: 'Completed' },
      rejected: { color: 'red', text: 'Rejected' }
    };

    const config = statusConfig[status] || { color: 'gray', text: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        {config.text}
      </span>
    );
  };

  const renderOrderRow = (order, index) => (
    <tr key={order.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {order.id.substring(0, 8)}...
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{order.fullName || 'No name'}</div>
          <div className="text-sm text-gray-500">{order.email}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.farmName || order.farmInfo?.farmName || 'No farm name'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.farmLocation || order.farmInfo?.location || 'No location'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(order.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.costDetails?.totalCost ? `$${order.costDetails.totalCost.toFixed(2)}` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.deviceId || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.createdAt ? (
          order.createdAt.toDate ? 
            order.createdAt.toDate().toLocaleDateString() : 
            new Date(order.createdAt).toLocaleDateString()
        ) : 'Invalid Date'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={() => {
            setSelectedOrder(order);
            setShowDetailsModal(true);
          }}
          className="text-blue-600 hover:text-blue-900"
        >
          View
        </button>
        {order.status === 'pending' && (
          <>
            <button
              onClick={() => {
                setSelectedOrder(order);
                setShowEstimateModal(true);
              }}
              className="text-green-600 hover:text-green-900"
            >
              Estimate
            </button>
            <button
              onClick={() => handleAction('reject', order)}
              className="text-red-600 hover:text-red-900"
            >
              Reject
            </button>
          </>
        )}
        {order.status === 'user-accepted' && (
          <button
            onClick={() => {
              setSelectedOrder(order);
              setShowAssignModal(true);
            }}
            className="text-purple-600 hover:text-purple-900"
          >
            Assign
          </button>
        )}
        {order.status === 'device-assigned' && (
          <button
            onClick={() => handleAction('complete', order)}
            className="text-green-600 hover:text-green-900"
          >
            Complete
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage device requests and orders
        </p>
      </div>

      {/* Orders Table */}
      <Table
        headers={['Order ID', 'User', 'Farm Name', 'Location', 'Status', 'Cost', 'Device ID', 'Created', 'Actions']}
        data={orders}
        renderRow={renderOrderRow}
        loading={loading}
        emptyMessage="No orders found"
      />

      {/* Order Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Order Details"
        size="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* User Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">User Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.mobileNumber || selectedOrder.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">NIC</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.nicNumber || selectedOrder.nic || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.age || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.address || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Farm Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Farm Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farm Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.farmName || selectedOrder.farmInfo?.farmName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.farmLocation || selectedOrder.farmInfo?.location || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farm Size</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedOrder.farmSize ? `${selectedOrder.farmSize} acres` : selectedOrder.farmInfo?.farmSize || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Soil Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.soilType || selectedOrder.farmInfo?.soilType || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Parameters */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Requested Parameters</h3>
              {selectedOrder.selectedParameters && selectedOrder.selectedParameters.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.selectedParameters.map((param) => (
                    <span key={param} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {param.replace(/([A-Z])/g, ' $1').replace('Ldr', 'LDR').replace('Mq135', 'MQ135').trim()}
                    </span>
                  ))}
                </div>
              ) : selectedOrder.parameters ? (
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(selectedOrder.parameters).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{value ? 'Yes' : 'No'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No parameters specified</p>
              )}
            </div>

            {/* Cost Details */}
            {selectedOrder.costDetails && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Cost Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Device Cost</label>
                    <p className="mt-1 text-sm text-gray-900">${selectedOrder.costDetails.deviceCost}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service Charge</label>
                    <p className="mt-1 text-sm text-gray-900">${selectedOrder.costDetails.serviceCharge}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Charge</label>
                    <p className="mt-1 text-sm text-gray-900">${selectedOrder.costDetails.deliveryCharge}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                    <p className="mt-1 text-sm text-gray-900 font-semibold">${selectedOrder.costDetails.totalCost}</p>
                  </div>
                </div>
                {selectedOrder.costDetails.notes && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.costDetails.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Order Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Order Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.deviceId || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Cost Estimate Modal */}
      <Modal
        isOpen={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        title="Estimate Cost"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Device Cost ($)</label>
            <input
              type="number"
              step="0.01"
              value={estimateData.deviceCost}
              onChange={(e) => setEstimateData({ ...estimateData, deviceCost: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Service Charge ($)</label>
            <input
              type="number"
              step="0.01"
              value={estimateData.serviceCharge}
              onChange={(e) => setEstimateData({ ...estimateData, serviceCharge: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Delivery Charge ($)</label>
            <input
              type="number"
              step="0.01"
              value={estimateData.deliveryCharge}
              onChange={(e) => setEstimateData({ ...estimateData, deliveryCharge: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={estimateData.notes}
              onChange={(e) => setEstimateData({ ...estimateData, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Additional notes..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowEstimateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEstimateCost}
              disabled={actionLoading || !estimateData.deviceCost || !estimateData.serviceCharge || !estimateData.deliveryCharge}
              className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Estimating...' : 'Create Estimate'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Device Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Device"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Device ID</label>
            <input
              type="text"
              value={assignData.deviceId}
              onChange={(e) => setAssignData({ ...assignData, deviceId: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="dev-XXXXXX"
            />
            <p className="mt-1 text-xs text-gray-500">Format: dev-XXXXXX (e.g., dev-ABC123)</p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignDevice}
              disabled={actionLoading || !assignData.deviceId}
              className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Assigning...' : 'Assign Device'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeAction}
        title={confirmAction === 'reject' ? 'Reject Order' : 'Complete Order'}
        message={confirmAction === 'reject' 
          ? `Are you sure you want to reject this order? This action cannot be undone.`
          : `Are you sure you want to mark this order as completed?`
        }
        confirmText={confirmAction === 'reject' ? 'Reject' : 'Complete'}
        confirmColor={confirmAction === 'reject' ? 'red' : 'green'}
        loading={actionLoading}
      />
    </div>
  );
};

export default OrderManagement;