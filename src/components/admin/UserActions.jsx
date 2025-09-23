import React, { useState } from 'react';
import { adminApi } from '../../services/adminApi';
import ConfirmModal from '../common/ConfirmModal';

const UserActions = ({ user, onUserUpdated, currentUserEmail }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = (email) => email === 'joelnithushan6@gmail.com';
  const canPromoteUser = (user) => currentUserEmail === 'joelnithushan6@gmail.com' && user.role === 'user';
  const canDemoteUser = (user) => currentUserEmail === 'joelnithushan6@gmail.com' && user.role === 'admin' && !isSuperAdmin(user.email);
  const canDeleteUser = (user) => !isSuperAdmin(user.email);

  const handlePromote = () => {
    setModalConfig({
      title: 'Promote User',
      message: `Are you sure you want to promote ${user.displayName || user.email} to admin?`,
      confirmText: 'Promote',
      confirmClass: 'bg-blue-600 hover:bg-blue-700',
      action: 'promote'
    });
    setShowConfirmModal(true);
  };

  const handleDemote = () => {
    setModalConfig({
      title: 'Demote User',
      message: `Are you sure you want to demote ${user.displayName || user.email} from admin to regular user?`,
      confirmText: 'Demote',
      confirmClass: 'bg-orange-600 hover:bg-orange-700',
      action: 'demote'
    });
    setShowConfirmModal(true);
  };

  const handleDelete = () => {
    setModalConfig({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.displayName || user.email}? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      action: 'delete'
    });
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    setLoading(true);
    try {
      switch (modalConfig.action) {
        case 'promote':
          await adminApi.promoteUser(user.id);
          break;
        case 'demote':
          await adminApi.demoteUser(user.id);
          break;
        case 'delete':
          await adminApi.deleteUser(user.id);
          break;
        default:
          throw new Error('Unknown action');
      }
      
      // Call the callback to refresh the user list
      if (onUserUpdated) {
        onUserUpdated();
      }
      
      setShowConfirmModal(false);
    } catch (error) {
      console.error(`Error ${modalConfig.action}ing user:`, error);
      // Error handling is done in the API service
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <div className="flex space-x-2">
        {/* View Button */}
        <button
          className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={() => {
            // You can implement a view user details modal here
            console.log('View user:', user);
          }}
        >
          View
        </button>

        {/* Promote Button */}
        {canPromoteUser(user) && (
          <button
            className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handlePromote}
          >
            Promote
          </button>
        )}

        {/* Demote Button */}
        {canDemoteUser(user) && (
          <button
            className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            onClick={handleDemote}
          >
            Demote
          </button>
        )}

        {/* Delete Button */}
        {canDeleteUser(user) && (
          <button
            className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={handleDelete}
          >
            Delete
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText="Cancel"
        onConfirm={executeAction}
        onCancel={handleCancel}
        loading={loading}
        confirmClass={modalConfig.confirmClass}
      />
    </>
  );
};

export default UserActions;
