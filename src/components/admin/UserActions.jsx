import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../common/ConfirmModal';
import Modal from '../common/Modal';
import adminApi from '../../services/adminApi';
import toast from 'react-hot-toast';

const UserActions = ({ user, onUserUpdated, onUserDeleted }) => {
  const { user: currentUser } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const SUPERADMIN_EMAIL = 'joelnithushan6@gmail.com';
  
  const isSuperAdmin = (email) => email === SUPERADMIN_EMAIL;
  const isCurrentUserSuperAdmin = isSuperAdmin(currentUser?.email);
  const isUserSuperAdmin = isSuperAdmin(user.email);

  const canPromoteUser = () => {
    return isCurrentUserSuperAdmin && !isUserSuperAdmin && user.role !== 'admin';
  };

  const canDemoteUser = () => {
    return isCurrentUserSuperAdmin && !isUserSuperAdmin && user.role === 'admin';
  };

  const canDeleteUser = () => {
    return !isUserSuperAdmin && user.id !== currentUser?.uid;
  };

  const handlePromoteUser = async () => {
    setActionLoading(true);
    try {
      await adminApi.promoteUser(user.id);
      toast.success('User promoted to admin successfully');
      onUserUpdated();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error(error.message || 'Failed to promote user');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleDemoteUser = async () => {
    setActionLoading(true);
    try {
      await adminApi.demoteUser(user.id);
      toast.success('User demoted to regular user successfully');
      onUserUpdated();
    } catch (error) {
      console.error('Error demoting user:', error);
      toast.error(error.message || 'Failed to demote user');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleDeleteUser = async () => {
    setActionLoading(true);
    try {
      await adminApi.deleteUser(user.id);
      toast.success('User deleted successfully');
      onUserDeleted(user.id);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleActionClick = (action) => {
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = () => {
    switch (confirmAction) {
      case 'promote':
        handlePromoteUser();
        break;
      case 'demote':
        handleDemoteUser();
        break;
      case 'delete':
        handleDeleteUser();
        break;
      default:
        break;
    }
  };

  const getConfirmModalContent = () => {
    switch (confirmAction) {
      case 'promote':
        return {
          title: 'Promote User',
          message: `Are you sure you want to promote ${user.displayName || user.email} to admin?`,
          confirmText: 'Promote',
          confirmColor: 'blue'
        };
      case 'demote':
        return {
          title: 'Demote User',
          message: `Are you sure you want to demote ${user.displayName || user.email} from admin to regular user?`,
          confirmText: 'Demote',
          confirmColor: 'blue'
        };
      case 'delete':
        return {
          title: 'Delete User',
          message: `Are you sure you want to delete ${user.displayName || user.email}? This action cannot be undone.`,
          confirmText: 'Delete',
          confirmColor: 'red'
        };
      default:
        return {
          title: 'Confirm Action',
          message: 'Are you sure you want to perform this action?',
          confirmText: 'Confirm',
          confirmColor: 'red'
        };
    }
  };

  const confirmContent = getConfirmModalContent();

  return (
    <>
      <div className="flex space-x-2">
        {/* View Button */}
        <button
          onClick={() => setShowDetailsModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          View
        </button>

        {/* Promote/Demote Button - Only visible to super admin */}
        {canPromoteUser() && (
          <button
            onClick={() => handleActionClick('promote')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Promote
          </button>
        )}

        {canDemoteUser() && (
          <button
            onClick={() => handleActionClick('demote')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Demote
          </button>
        )}

        {/* Delete Button */}
        {canDeleteUser() && (
          <button
            onClick={() => handleActionClick('delete')}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeAction}
        title={confirmContent.title}
        message={confirmContent.message}
        confirmText={confirmContent.confirmText}
        confirmColor={confirmContent.confirmColor}
        loading={actionLoading}
      />

      {/* User Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="User Details"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <p className="mt-1 text-sm text-gray-900">{user.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <p className="mt-1 text-sm text-gray-900">{user.displayName || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.role === 'admin' 
                    ? 'bg-blue-100 text-blue-800' 
                    : isUserSuperAdmin
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isUserSuperAdmin ? 'Super Admin' : user.role || 'user'}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{user.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Verified</label>
              <p className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.emailVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Created Date</label>
            <p className="mt-1 text-sm text-gray-900">
              {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Sign In</label>
            <p className="mt-1 text-sm text-gray-900">
              {user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString() : 'N/A'}
            </p>
          </div>

          {user.providerData && user.providerData.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Sign-in Methods</label>
              <div className="mt-1 space-y-1">
                {user.providerData.map((provider, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 mr-2">
                    {provider.providerId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default UserActions;
