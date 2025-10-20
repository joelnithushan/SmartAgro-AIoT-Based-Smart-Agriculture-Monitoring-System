import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/common/ui/Table';
import UserActions from '../../components/admin/userManagement/UserActions';
import UserDetailsModal from '../../components/admin/userManagement/UserDetailsModal';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUsersWithDetails = async () => {
      try {
        // Fetch users from Firestore
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = [];
        
        for (const userDoc of usersSnapshot.docs) {
          const userData = { id: userDoc.id, ...userDoc.data() };
          
          // Fetch device request data for this user
          try {
            const deviceRequestsQuery = query(
              collection(db, 'deviceRequests'),
              where('userId', '==', userDoc.id),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            const deviceRequestsSnapshot = await getDocs(deviceRequestsQuery);
            
            if (!deviceRequestsSnapshot.empty) {
              const latestRequest = deviceRequestsSnapshot.docs[0].data();
              // Merge device request data with priority
              userData.deviceRequestData = latestRequest;
            }
          } catch (error) {
            console.warn('Error fetching device request data for user:', userDoc.id, error);
          }
          
          usersData.push(userData);
        }
        
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        setLoading(false);
      }
    };

    fetchUsersWithDetails();
  }, []);

  const handleUserUpdated = () => {
    // Refresh user data after update
    const fetchUsersWithDetails = async () => {
      try {
        // Fetch users from Firestore
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = [];
        
        for (const userDoc of usersSnapshot.docs) {
          const userData = { id: userDoc.id, ...userDoc.data() };
          
          // Fetch device request data for this user
          try {
            const deviceRequestsQuery = query(
              collection(db, 'deviceRequests'),
              where('userId', '==', userDoc.id),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            const deviceRequestsSnapshot = await getDocs(deviceRequestsQuery);
            
            if (!deviceRequestsSnapshot.empty) {
              const latestRequest = deviceRequestsSnapshot.docs[0].data();
              // Merge device request data with priority
              userData.deviceRequestData = latestRequest;
            }
          } catch (error) {
            console.warn('Error fetching device request data for user:', userDoc.id, error);
          }
          
          usersData.push(userData);
        }
        
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to refresh user data');
      }
    };

    fetchUsersWithDetails();
    toast.success('User updated successfully');
  };

  const handleUserDeleted = (userId) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    toast.success('User deleted successfully');
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleCloseUserDetails = () => {
    setSelectedUser(null);
    setShowUserDetails(false);
  };

  // Function to get the best available name for a user
  const getUserDisplayName = (user) => {
    // Priority: profile > device request > Firebase Auth (Google/Apple) > fallback to email
    if (user.fullName) return user.fullName;
    if (user.deviceRequestData?.fullName) return user.deviceRequestData.fullName;
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0]; // Use email prefix as fallback
    return 'Unknown User';
  };

  // Function to get the best available email for a user
  const getUserEmail = (user) => {
    // Priority: profile > device request > Firebase Auth > fallback
    if (user.email) return user.email;
    if (user.deviceRequestData?.email) return user.deviceRequestData.email;
    return 'No email available';
  };

  const getStatusBadge = (user) => {
    const SUPERADMIN_EMAIL = 'joelnithushan6@gmail.com';
    const userEmail = getUserEmail(user);
    const isSuperAdmin = userEmail === SUPERADMIN_EMAIL;
    
    if (isSuperAdmin) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Super Admin</span>;
    } else if (user.role === 'admin') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Admin</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">User</span>;
  };

  const getVerificationStatus = (user) => {
    const SUPERADMIN_EMAIL = 'joelnithushan6@gmail.com';
    const userEmail = getUserEmail(user);
    const isSuperAdmin = userEmail === SUPERADMIN_EMAIL;
    
    // Super Admin is always verified
    if (isSuperAdmin) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Super Admin (Verified)</span>;
    }
    
    // For other users, check emailVerified status
    if (user.emailVerified) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Verified</span>;
    }
    
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Unverified</span>;
  };

  const renderUserRow = (user) => (
    <tr key={user.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            {user.photoURL ? (
              <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {getUserDisplayName(user).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {getUserDisplayName(user)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {getUserEmail(user)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(user)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {getVerificationStatus(user)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <UserActions 
          user={user} 
          onUserUpdated={handleUserUpdated}
          onUserDeleted={handleUserDeleted}
          onViewUser={handleViewUser}
          currentUserEmail={currentUser?.email}
        />
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-white">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Users Table */}
      <Table
        headers={['Name', 'Email', 'Role', 'Verified Status', 'Actions']}
        data={users}
        renderRow={renderUserRow}
        emptyMessage="No users found"
      />

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={showUserDetails}
          onClose={handleCloseUserDetails}
          getUserDisplayName={getUserDisplayName}
          getUserEmail={getUserEmail}
        />
      )}
    </div>
  );
};

export default UserManagement;