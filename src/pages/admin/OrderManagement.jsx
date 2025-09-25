import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Table from '../../components/common/Table';
import ViewModal from '../../components/admin/ViewModal';
import toast from 'react-hot-toast';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

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

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const renderOrderRow = (order) => (
    <tr key={order.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {order.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {order.fullName || order.email || 'Unknown'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {order.farmName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {order.farmLocation || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          order.status === 'accepted' ? 'bg-green-100 text-green-800' :
          order.status === 'rejected' ? 'bg-red-100 text-red-800' :
          order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {order.status || 'Unknown'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {order.costEstimate?.totalCost ? `$${order.costEstimate.totalCost}` : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {order.assignedDeviceId || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={() => handleViewOrder(order)}
          className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          View
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          View device requests and orders
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

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Order Details"
        data={selectedOrder}
        type="order"
      />
    </div>
  );
};

export default OrderManagement;