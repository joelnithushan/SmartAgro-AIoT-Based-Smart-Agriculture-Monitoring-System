import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/firestoreService';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Subscribe to all users in real-time
  useEffect(() => {
    if (!isAdmin) {
      console.log('❌ User is not admin, skipping users subscription');
      setLoading(false);
      return;
    }

    console.log('🔄 Setting up real-time subscription for admin users');
    console.log('👤 Current user:', currentUser?.email);
    console.log('🔑 Is admin:', isAdmin);

    const unsubscribe = usersService.subscribeToAllUsers((allUsers) => {
      console.log('📥 Received admin users:', allUsers.length);
      console.log('👥 Users data:', allUsers);
      setUsers(allUsers);
      setLoading(false);
      setError(null);
    });

    return () => {
      console.log('🔄 Unsubscribing from admin users');
      unsubscribe();
    };
  }, [isAdmin]);

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    if (!isAdmin) {
      toast.error('Only administrators can change user roles');
      return;
    }

    setActionLoading(prev => ({ ...prev, [userId]: true }));

    try {
      const result = await usersService.updateUserRole(userId, newRole);
      
      if (result.success) {
        toast.success(`User role updated to ${newRole}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId, userEmail) => {
    if (!isAdmin) {
      toast.error('Only administrators can delete users');
      return;
    }

    setActionLoading(prev => ({ ...prev, [userId]: true }));

    try {
      const result = await usersService.deleteUser(userId);
      
      if (result.success) {
        toast.success(`User ${userEmail} deleted successfully`);
        setDeleteConfirm(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Get role badge styling
  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
        User
      </span>
    );
  };

  // Format user ID for display
  const formatUserId = (userId) => {
    return userId ? `${userId.substring(0, 8)}...` : 'N/A';
  };

  // Format display name
  const formatDisplayName = (displayName) => {
    return displayName || 'N/A';
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Only administrators can access user management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Debug Info */}
      <div className="px-6 py-2 bg-yellow-50 border-b border-yellow-200">
        <div className="text-xs text-yellow-800">
          <strong>Debug Info:</strong> Current User: {currentUser?.email || 'None'} | 
          Admin Config: joelnithushan6@gmail.com | 
          Is Admin: {isAdmin ? 'YES' : 'NO'}
        </div>
      </div>
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-600">
                {users.length} total users
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">No users have been registered yet.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {formatUserId(user.id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDisplayName(user.displayName)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.email !== currentUser?.email && (
                      <div className="flex space-x-2">
                        {/* Role Change Button */}
                        {user.role === 'user' ? (
                          <button
                            onClick={() => handleRoleChange(user.id, 'admin')}
                            disabled={actionLoading[user.id]}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[user.id] ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : null}
                            Promote to Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(user.id, 'user')}
                            disabled={actionLoading[user.id]}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[user.id] ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                            ) : null}
                            Demote to User
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteConfirm({ userId: user.id, userEmail: user.email })}
                          disabled={actionLoading[user.id]}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete User Account</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the user account for <strong>{deleteConfirm.userEmail}</strong>?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  This action cannot be undone. The user will be permanently removed from the system.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(deleteConfirm.userId, deleteConfirm.userEmail)}
                    disabled={actionLoading[deleteConfirm.userId]}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading[deleteConfirm.userId] ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </div>
                    ) : (
                      'Delete User'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
