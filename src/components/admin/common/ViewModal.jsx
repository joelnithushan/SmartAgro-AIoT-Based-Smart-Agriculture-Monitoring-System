import React from 'react';

const ViewModal = ({ isOpen, onClose, title, data, type }) => {
  if (!isOpen || !data) return null;
  
  // Debug: Log the data being passed to the modal
  console.log('🔍 ViewModal data:', data);

  const renderOrderDetails = (order) => (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xl font-medium text-blue-600">📋</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Order #{order.id}</h3>
          <p className="text-sm text-gray-500">Status: {order.status || 'Unknown'}</p>
        </div>
      </div>

      {/* Order Information */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Order Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Order ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{order.id}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
            <p className="mt-1 text-sm text-gray-900">{order.status || 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{order.userId || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Created At</label>
            <p className="mt-1 text-sm text-gray-900">
              {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Farm Name</label>
            <p className="mt-1 text-sm text-gray-900">{order.farmName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Farm Size</label>
            <p className="mt-1 text-sm text-gray-900">{order.farmSize || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Farm Location</label>
            <p className="mt-1 text-sm text-gray-900">{order.farmLocation || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Soil Type</label>
            <p className="mt-1 text-sm text-gray-900">{order.soilType || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Device Parameters */}
      {order.selectedParameters && order.selectedParameters.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Requested Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-900">
            {order.selectedParameters.map((param, index) => (
              <li key={index}>{param}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Information */}
      {order.additionalFarmInfo && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Farm Information</h4>
          <p className="text-sm text-gray-900">{order.additionalFarmInfo}</p>
        </div>
      )}

      {order.additionalDeviceInfo && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Device Information</h4>
          <p className="text-sm text-gray-900">{order.additionalDeviceInfo}</p>
        </div>
      )}
    </div>
  );

  const renderDeviceDetails = (device) => (
    <div className="space-y-6">
      {/* Device Header */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-xl font-medium text-green-600">📱</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Device {device.deviceId || device.id}</h3>
          <p className="text-sm text-gray-500">Status: {device.status || 'Unknown'}</p>
        </div>
      </div>

      {/* Device Information */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Device Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Device ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{device.deviceId || device.id}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
            <p className="mt-1 text-sm text-gray-900">{device.status || 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Owner ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{device.userId || device.ownerId || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Owner Name</label>
            <p className="mt-1 text-sm text-gray-900">{device.userName || device.ownerName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Owner Email</label>
            <p className="mt-1 text-sm text-gray-900">{device.userEmail || device.ownerEmail || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned At</label>
            <p className="mt-1 text-sm text-gray-900">
              {device.assignedAt ? (typeof device.assignedAt === 'object' ? new Date(device.assignedAt.seconds * 1000).toLocaleDateString() : new Date(device.assignedAt).toLocaleDateString()) : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Last Seen</label>
            <p className="mt-1 text-sm text-gray-900">
              {device.lastSeen ? new Date(device.lastSeen).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Farm Name</label>
            <p className="mt-1 text-sm text-gray-900">{device.farmName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Soil Type</label>
            <p className="mt-1 text-sm text-gray-900">{device.soilType || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Farm Size</label>
            <p className="mt-1 text-sm text-gray-900">{device.farmSize ? `${device.farmSize} acres` : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Device Metadata */}
      {device.meta && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Device Metadata</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-xs text-gray-700 overflow-x-auto">
              {JSON.stringify(device.meta, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  const renderFormDetails = (form) => (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-xl font-medium text-purple-600">📝</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Form {form.id}</h3>
          <p className="text-sm text-gray-500">Submitted: {form.submittedAt ? new Date(form.submittedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>

      {/* Form Information */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Form Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Form ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{form.id}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{form.userId || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">User Name</label>
            <p className="mt-1 text-sm text-gray-900">{form.userName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">User Email</label>
            <p className="mt-1 text-sm text-gray-900">{form.userEmail || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Device ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{form.deviceId || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted At</label>
            <p className="mt-1 text-sm text-gray-900">
              {form.submittedAt ? new Date(form.submittedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Data */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Form Data</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <pre className="text-xs text-gray-700 overflow-x-auto">
            {JSON.stringify(form, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );

  const renderFarmDetails = (farm) => (
    <div className="space-y-8">
      {/* Farm Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">{farm.farmName || 'Unnamed Farm'}</h3>
            <div className="flex items-center space-x-4 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Status: {farm.status || 'Unknown'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                ID: {farm.requestId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Farm Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Farm Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Farm Details */}
          <div className="space-y-4">
            <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Farm Details</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Farm Name</span>
                <span className="text-sm font-semibold text-gray-900">{farm.farmName || 'Unnamed Farm'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Soil Type</span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  {farm.soilType || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Farm Size</span>
                <span className="text-sm font-semibold text-gray-900">{farm.farmSize ? `${farm.farmSize} acres` : 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Device Type</span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  {farm.deviceType || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">User Information</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">User Name</span>
                <span className="text-sm font-semibold text-gray-900">{farm.userName || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="text-sm font-semibold text-gray-900">{farm.userEmail || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">User ID</span>
                <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{farm.userId || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Request ID</span>
                <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{farm.requestId || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Timeline</h5>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Created</span>
              </div>
              <span className="text-sm text-gray-600">
                {farm.createdAt ? (typeof farm.createdAt === 'object' ? new Date(farm.createdAt.seconds * 1000).toLocaleDateString() : new Date(farm.createdAt).toLocaleDateString()) : 'N/A'}
              </span>
            </div>
            {farm.completedAt && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Completed</span>
                </div>
                <span className="text-sm text-gray-600">
                  {typeof farm.completedAt === 'object' ? new Date(farm.completedAt.seconds * 1000).toLocaleDateString() : new Date(farm.completedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Farm Description */}
      {farm.description && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Description</h4>
          <p className="text-sm text-gray-900">{farm.description}</p>
        </div>
      )}

      {/* Farm Data */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Complete Farm Data</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <pre className="text-xs text-gray-700 overflow-x-auto">
            {JSON.stringify(farm, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'order':
        return renderOrderDetails(data);
      case 'device':
        return renderDeviceDetails(data);
      case 'form':
        return renderFormDetails(data);
      case 'farm':
        return renderFarmDetails(data);
      default:
        return (
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-xs text-gray-700 overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
