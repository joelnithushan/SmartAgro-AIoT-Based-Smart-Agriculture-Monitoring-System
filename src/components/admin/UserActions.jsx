import React, { useState } from 'react';
import adminApi from '../../services/adminApi';
import ConfirmModal from '../common/ConfirmModal';

const UserActions = ({ user, onUserUpdated, onUserDeleted, onViewUser, currentUserEmail }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = (email) => email === 'joelnithushan6@gmail.com';
  const isCurrentUserSuperAdmin = currentUserEmail === 'joelnithushan6@gmail.com';
  const isCurrentUserAdmin = currentUserEmail && currentUserEmail !== 'joelnithushan6@gmail.com';
  
  const canPromoteUser = (user) => {
    const userEmail = getUserEmail(user);
    return isCurrentUserSuperAdmin && user.role === 'user' && !isSuperAdmin(userEmail);
  };
  
  const canDemoteUser = (user) => {
    const userEmail = getUserEmail(user);
    return isCurrentUserSuperAdmin && user.role === 'admin' && !isSuperAdmin(userEmail);
  };
  
  const canDeleteUser = (user) => {
    const userEmail = getUserEmail(user);
    if (isSuperAdmin(userEmail)) return false; // Cannot delete super admin
    if (isCurrentUserSuperAdmin) return true; // Super admin can delete anyone except super admin
    if (isCurrentUserAdmin && user.role === 'user') return true; // Admin can delete users
    return false; // Users cannot delete anyone
  };

  const getUserEmail = (user) => {
    if (user.email) return user.email;
    if (user.deviceRequestData?.email) return user.deviceRequestData.email;
    return '';
  };

  const getUserDisplayName = (user) => {
    if (user.fullName) return user.fullName;
    if (user.deviceRequestData?.fullName) return user.deviceRequestData.fullName;
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return 'Unknown User';
  };

  const handlePromote = () => {
    setModalConfig({
      title: 'Promote User',
      message: `Are you sure you want to promote ${getUserDisplayName(user)} to admin?`,
      confirmText: 'Promote',
      confirmClass: 'bg-blue-600 hover:bg-blue-700',
      action: 'promote'
    });
    setShowConfirmModal(true);
  };

  const handleDemote = () => {
    setModalConfig({
      title: 'Demote User',
      message: `Are you sure you want to demote ${getUserDisplayName(user)} from admin to regular user?`,
      confirmText: 'Demote',
      confirmClass: 'bg-orange-600 hover:bg-orange-700',
      action: 'demote'
    });
    setShowConfirmModal(true);
  };

  const handleDelete = () => {
    setModalConfig({
      title: 'Delete User',
      message: `Are you sure you want to delete ${getUserDisplayName(user)}? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      action: 'delete'
    });
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    setLoading(true);
    try {
      let result;
      switch (modalConfig.action) {
        case 'promote':
          result = await adminApi.promoteUser(user.id);
          console.log('✅ User promoted successfully:', result);
          break;
        case 'demote':
          result = await adminApi.demoteUser(user.id);
          console.log('✅ User demoted successfully:', result);
          break;
        case 'delete':
          result = await adminApi.deleteUser(user.id);
          console.log('✅ User deleted successfully:', result);
          // Call the delete callback to remove user from the list
          if (onUserDeleted) {
            onUserDeleted(user.id);
          }
          break;
        default:
          throw new Error('Unknown action');
      }
      
      // Call the callback to refresh the user list (for promote/demote)
      if (modalConfig.action !== 'delete' && onUserUpdated) {
        onUserUpdated();
      }
      
      setShowConfirmModal(false);
    } catch (error) {
      console.error(`❌ Error ${modalConfig.action}ing user:`, error);
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
          onClick={() => onViewUser && onViewUser(user)}
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
        onClose={handleCancel}
        loading={loading}
        confirmClass={modalConfig.confirmClass}
      />
    </>
  );
};

export default UserActions;
