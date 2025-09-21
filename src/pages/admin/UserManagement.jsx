import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import adminApi from '../../services/adminApi';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'users')),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePromoteUser = async (userId) => {
    setActionLoading(true);
    try {
      await adminApi.promoteUser(userId);
      toast.success('User promoted to admin successfully');
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error(error.message || 'Failed to promote user');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleDemoteUser = async (userId) => {
    setActionLoading(true);
    try {
      await adminApi.demoteUser(userId);
      toast.success('User demoted successfully');
    } catch (error) {
      console.error('Error demoting user:', error);
      toast.error(error.message || 'Failed to demote user');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    setActionLoading(true);
    try {
      await adminApi.deleteUser(userId);
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleAction = (action, user) => {
    setSelectedUser(user);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = () => {
    if (!selectedUser || !confirmAction) return;

    switch (confirmAction) {
      case 'promote':
        handlePromoteUser(selectedUser.id);
        break;
      case 'demote':
        handleDemoteUser(selectedUser.id);
        break;
      case 'delete':
        handleDeleteUser(selectedUser.id);
        break;
      default:
        break;
    }
  };

  const getLoginMethods = (user) => {
    const methods = [];
    if (user.loginProviders?.google) methods.push('Google');
    if (user.loginProviders?.apple) methods.push('Apple');
    if (user.loginProviders?.phone) methods.push('Phone');
    if (user.loginProviders?.email) methods.push('Email');
    return methods.join(', ') || 'Email';
  };

  const getStatusBadge = (user) => {
    if (user.role === 'admin') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">User</span>;
  };

  const renderUserRow = (user, index) => (
    <tr key={user.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            {user.photoURL ? (
              <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.displayName || 'No name'}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {getLoginMethods(user)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(user)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.totalRequests || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.assignedDevices ? Object.keys(user.assignedDevices).length : 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={() => {
            setSelectedUser(user);
            setShowDetailsModal(true);
          }}
          className="text-blue-600 hover:text-blue-900"
        >
          View Details
        </button>
        {user.id !== currentUser?.uid && (
          <>
            {user.role !== 'admin' ? (
              <button
                onClick={() => handleAction('promote', user)}
                className="text-green-600 hover:text-green-900"
              >
                Promote
              </button>
            ) : (
              <button
                onClick={() => handleAction('demote', user)}
                className="text-yellow-600 hover:text-yellow-900"
              >
                Demote
              </button>
            )}
            <button
              onClick={() => handleAction('delete', user)}
              className="text-red-600 hover:text-red-900"
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );

  const getConfirmModalContent = () => {
    if (!selectedUser || !confirmAction) return { title: '', message: '' };

    switch (confirmAction) {
      case 'promote':
        return {
          title: 'Promote User to Admin',
          message: `Are you sure you want to promote ${selectedUser.displayName || selectedUser.email} to admin? This will give them full access to the admin panel.`
        };
      case 'demote':
        return {
          title: 'Demote Admin to User',
          message: `Are you sure you want to demote ${selectedUser.displayName || selectedUser.email} from admin? This will remove their admin access.`
        };
      case 'delete':
        return {
          title: 'Delete User Account',
          message: `Are you sure you want to permanently delete ${selectedUser.displayName || selectedUser.email}'s account? This action cannot be undone and will remove all their data.`
        };
      default:
        return { title: '', message: '' };
    }
  };

  const confirmModalContent = getConfirmModalContent();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Users Table */}
      <Table
        headers={['User', 'Login Methods', 'Role', 'Requests', 'Devices', 'Joined', 'Actions']}
        data={users}
        renderRow={renderUserRow}
        loading={loading}
        emptyMessage="No users found"
      />

      {/* User Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.displayName || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">NIC</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.nic || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.role || 'user'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Login Methods</label>
                <p className="mt-1 text-sm text-gray-900">{getLoginMethods(selectedUser)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Requests</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.totalRequests || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned Devices</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedUser.assignedDevices ? Object.keys(selectedUser.assignedDevices).length : 0}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <p className="mt-1 text-sm text-gray-900">{selectedUser.location || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Joined</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedUser.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeAction}
        title={confirmModalContent.title}
        message={confirmModalContent.message}
        confirmText={confirmAction === 'delete' ? 'Delete' : 'Confirm'}
        confirmColor={confirmAction === 'delete' ? 'red' : 'blue'}
        loading={actionLoading}
      />
    </div>
  );
};

export default UserManagement;