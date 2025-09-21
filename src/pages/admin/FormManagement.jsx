import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const FormManagement = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    let q;
    
    if (filterStatus === 'all') {
      q = query(collection(db, 'deviceRequests'));
    } else {
      q = query(
        collection(db, 'deviceRequests'),
        where('status', 'in', ['accepted', 'device-assigned', 'completed'])
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const formsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setForms(formsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching forms:', error);
        toast.error('Failed to load forms');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filterStatus]);

  const exportToCSV = () => {
    const csvData = forms.map(form => ({
      'Order ID': form.id,
      'User Name': form.fullName || '',
      'Email': form.email,
      'Phone': form.phone || '',
      'NIC': form.nic || '',
      'Farm Name': form.farmInfo?.farmName || '',
      'Location': form.farmInfo?.location || '',
      'Farm Size': form.farmInfo?.farmSize || '',
      'Crop Type': form.farmInfo?.cropType || '',
      'Status': form.status,
      'Device ID': form.deviceId || '',
      'Total Cost': form.costDetails?.totalCost || '',
      'Created': new Date(form.createdAt).toLocaleDateString(),
      'Updated': new Date(form.updatedAt).toLocaleDateString()
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartagro-forms-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Forms exported to CSV successfully');
  };

  const exportSingleToPDF = (form) => {
    // Simple PDF generation using browser print
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>SmartAgro Form - ${form.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section h3 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 5px; }
            .field { margin-bottom: 10px; }
            .field label { font-weight: bold; }
            .field value { margin-left: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SmartAgro Device Request Form</h1>
            <p>Order ID: ${form.id}</p>
          </div>
          
          <div class="section">
            <h3>User Information</h3>
            <div class="grid">
              <div class="field">
                <label>Name:</label>
                <span>${form.fullName || 'Not provided'}</span>
              </div>
              <div class="field">
                <label>Email:</label>
                <span>${form.email}</span>
              </div>
              <div class="field">
                <label>Phone:</label>
                <span>${form.phone || 'Not provided'}</span>
              </div>
              <div class="field">
                <label>NIC:</label>
                <span>${form.nic || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Farm Information</h3>
            <div class="grid">
              <div class="field">
                <label>Farm Name:</label>
                <span>${form.farmInfo?.farmName || 'Not provided'}</span>
              </div>
              <div class="field">
                <label>Location:</label>
                <span>${form.farmInfo?.location || 'Not provided'}</span>
              </div>
              <div class="field">
                <label>Farm Size:</label>
                <span>${form.farmInfo?.farmSize || 'Not provided'}</span>
              </div>
              <div class="field">
                <label>Crop Type:</label>
                <span>${form.farmInfo?.cropType || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Requested Parameters</h3>
            <div class="grid">
              ${form.parameters ? Object.entries(form.parameters).map(([key, value]) => `
                <div class="field">
                  <label>${key.replace(/([A-Z])/g, ' $1').trim()}:</label>
                  <span>${value ? 'Yes' : 'No'}</span>
                </div>
              `).join('') : '<p>No parameters specified</p>'}
            </div>
          </div>

          ${form.costDetails ? `
          <div class="section">
            <h3>Cost Details</h3>
            <div class="grid">
              <div class="field">
                <label>Device Cost:</label>
                <span>$${form.costDetails.deviceCost}</span>
              </div>
              <div class="field">
                <label>Service Charge:</label>
                <span>$${form.costDetails.serviceCharge}</span>
              </div>
              <div class="field">
                <label>Delivery Charge:</label>
                <span>$${form.costDetails.deliveryCharge}</span>
              </div>
              <div class="field">
                <label>Total Cost:</label>
                <span>$${form.costDetails.totalCost}</span>
              </div>
            </div>
            ${form.costDetails.notes ? `
              <div class="field">
                <label>Notes:</label>
                <span>${form.costDetails.notes}</span>
              </div>
            ` : ''}
          </div>
          ` : ''}

          <div class="section">
            <h3>Order Status</h3>
            <div class="grid">
              <div class="field">
                <label>Status:</label>
                <span>${form.status}</span>
              </div>
              <div class="field">
                <label>Device ID:</label>
                <span>${form.deviceId || 'Not assigned'}</span>
              </div>
              <div class="field">
                <label>Created:</label>
                <span>${new Date(form.createdAt).toLocaleString()}</span>
              </div>
              <div class="field">
                <label>Updated:</label>
                <span>${new Date(form.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
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

  const renderFormRow = (form, index) => (
    <tr key={form.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {form.id.substring(0, 8)}...
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{form.fullName || 'No name'}</div>
          <div className="text-sm text-gray-500">{form.email}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {form.farmInfo?.farmName || 'No farm name'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {form.farmInfo?.location || 'No location'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(form.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {form.costDetails?.totalCost ? `$${form.costDetails.totalCost.toFixed(2)}` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(form.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={() => {
            setSelectedForm(form);
            setShowDetailsModal(true);
          }}
          className="text-blue-600 hover:text-blue-900"
        >
          View Details
        </button>
        <button
          onClick={() => exportSingleToPDF(form)}
          className="text-green-600 hover:text-green-900"
        >
          Export PDF
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farm Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage completed/accepted farm forms
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
          >
            <option value="all">All Forms</option>
            <option value="accepted">Accepted Only</option>
            <option value="completed">Completed Only</option>
          </select>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Forms Table */}
      <Table
        headers={['Form ID', 'User', 'Farm Name', 'Location', 'Status', 'Cost', 'Created', 'Actions']}
        data={forms}
        renderRow={renderFormRow}
        loading={loading}
        emptyMessage="No forms found"
      />

      {/* Form Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Form Details"
        size="xl"
      >
        {selectedForm && (
          <div className="space-y-6">
            {/* User Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">User Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">NIC</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.nic || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Farm Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Farm Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farm Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.farmInfo?.farmName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.farmInfo?.location || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farm Size</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.farmInfo?.farmSize || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Crop Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.farmInfo?.cropType || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Parameters */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Requested Parameters</h3>
              <div className="grid grid-cols-3 gap-4">
                {selectedForm.parameters && Object.entries(selectedForm.parameters).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{value ? 'Yes' : 'No'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Details */}
            {selectedForm.costDetails && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Cost Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Device Cost</label>
                    <p className="mt-1 text-sm text-gray-900">${selectedForm.costDetails.deviceCost}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service Charge</label>
                    <p className="mt-1 text-sm text-gray-900">${selectedForm.costDetails.serviceCharge}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Charge</label>
                    <p className="mt-1 text-sm text-gray-900">${selectedForm.costDetails.deliveryCharge}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                    <p className="mt-1 text-sm text-gray-900 font-semibold">${selectedForm.costDetails.totalCost}</p>
                  </div>
                </div>
                {selectedForm.costDetails.notes && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedForm.costDetails.notes}</p>
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
                  <div className="mt-1">{getStatusBadge(selectedForm.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedForm.deviceId || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedForm.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedForm.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FormManagement;
