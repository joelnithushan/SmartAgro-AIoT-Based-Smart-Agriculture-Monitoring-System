import React from 'react';

const UserDetailsModal = ({ user, isOpen, onClose, getUserDisplayName, getUserEmail }) => {
  if (!isOpen || !user) return null;

  const displayName = getUserDisplayName(user);
  const email = getUserEmail(user);
  const phone = user.phone || user.phoneNumber || user.deviceRequestData?.mobileNumber || 'N/A';
  const role = user.role || 'user';
  const createdAt = user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
  const emailVerified = user.emailVerified ? 'Yes' : 'No';
  const photoURL = user.photoURL || user.avatar;
  const isSuperAdmin = email === 'joelnithushan6@gmail.com';

  // Get farm information from device request data
  const farmName = user.deviceRequestData?.farmName || 'N/A';
  const farmSize = user.deviceRequestData?.farmSize || 'N/A';
  const farmLocation = user.deviceRequestData?.farmLocation || 'N/A';
  const soilType = user.deviceRequestData?.soilType || 'N/A';

  // Get additional personal information
  const age = user.deviceRequestData?.age || 'N/A';
  const nicNumber = user.deviceRequestData?.nicNumber || user.nic || 'N/A';
  const address = user.deviceRequestData?.address || user.location || 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 flex-shrink-0">
              {photoURL ? (
                <img className="h-16 w-16 rounded-full" src={photoURL} alt={displayName} />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-700">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{displayName}</h3>
              <p className="text-sm text-gray-500">{email}</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                  isSuperAdmin ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {isSuperAdmin ? 'Super Admin' : role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">{displayName}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                <p className="mt-1 text-sm text-gray-900">{email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{phone}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Age</label>
                <p className="mt-1 text-sm text-gray-900">{age}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">NIC Number</label>
                <p className="mt-1 text-sm text-gray-900">{nicNumber}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Email Verified</label>
                <p className="mt-1 text-sm text-gray-900">{emailVerified}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Address</label>
                <p className="mt-1 text-sm text-gray-900">{address}</p>
              </div>
            </div>
          </div>

          {/* Farm Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Farm Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Farm Name</label>
                <p className="mt-1 text-sm text-gray-900">{farmName}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Farm Size</label>
                <p className="mt-1 text-sm text-gray-900">{farmSize} {typeof farmSize === 'number' ? 'acres' : ''}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Farm Location</label>
                <p className="mt-1 text-sm text-gray-900">{farmLocation}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Soil Type</label>
                <p className="mt-1 text-sm text-gray-900">{soilType}</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Account Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Role</label>
                <p className="mt-1 text-sm text-gray-900">
                  {isSuperAdmin ? 'Super Admin' : role === 'admin' ? 'Admin' : 'User'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Account Created</label>
                <p className="mt-1 text-sm text-gray-900">{createdAt}</p>
              </div>
            </div>
          </div>

          {/* Device Information */}
          {user.deviceRequestData?.selectedParameters && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Requested Device Parameters</h4>
              <div className="flex flex-wrap gap-2">
                {user.deviceRequestData.selectedParameters.map((param, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {param}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
