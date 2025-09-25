import React from 'react';

const ViewModal = ({ isOpen, onClose, title, data, type }) => {
  if (!isOpen || !data) return null;

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
          <h3 className="text-lg font-medium text-gray-900">Device {device.id}</h3>
          <p className="text-sm text-gray-500">Status: {device.status || 'Unknown'}</p>
        </div>
      </div>

      {/* Device Information */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Device Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Device ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{device.id}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
            <p className="mt-1 text-sm text-gray-900">{device.status || 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Owner ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{device.ownerId || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Owner Name</label>
            <p className="mt-1 text-sm text-gray-900">{device.ownerName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Owner Email</label>
            <p className="mt-1 text-sm text-gray-900">{device.ownerEmail || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned At</label>
            <p className="mt-1 text-sm text-gray-900">
              {device.assignedAt ? new Date(device.assignedAt).toLocaleDateString() : 'N/A'}
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
    <div className="space-y-6">
      {/* Farm Header */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-xl font-medium text-green-600">🚜</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{farm.name || 'Unnamed Farm'}</h3>
          <p className="text-sm text-gray-500">Created: {farm.createdAt ? new Date(farm.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>

      {/* Farm Information */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Farm Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Farm Name</label>
            <p className="mt-1 text-sm text-gray-900">{farm.name || 'Unnamed Farm'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Owner</label>
            <p className="mt-1 text-sm text-gray-900">{farm.ownerEmail || farm.userId || 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
            <p className="mt-1 text-sm text-gray-900">{farm.location || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Size</label>
            <p className="mt-1 text-sm text-gray-900">{farm.size ? `${farm.size} acres` : 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Crop Type</label>
            <p className="mt-1 text-sm text-gray-900">{farm.cropType || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Created Date</label>
            <p className="mt-1 text-sm text-gray-900">
              {farm.createdAt ? new Date(farm.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
            </p>
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
