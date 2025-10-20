import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getCountFromServer,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../../services/firebase/firebase';
import { 
  UsersIcon, 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  CpuChipIcon 
} from '@heroicons/react/24/outline';
const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    availableDevices: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchDashboardStats();
    const unsubscribeFunctions = setupRealtimeListeners();
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, []);
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching dashboard stats...');
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getCountFromServer(usersQuery);
      const totalUsers = usersSnapshot.data().count;
      const pendingQuery = query(
        collection(db, 'deviceRequests'),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getCountFromServer(pendingQuery);
      const pendingRequests = pendingSnapshot.data().count;
      const approvedQuery = query(
        collection(db, 'deviceRequests'),
        where('status', 'in', ['accepted', 'cost-estimated', 'user-accepted'])
      );
      const approvedSnapshot = await getCountFromServer(approvedQuery);
      const approvedRequests = approvedSnapshot.data().count;
      const availableQuery = query(
        collection(db, 'devices'),
        where('status', '==', 'available')
      );
      const availableSnapshot = await getCountFromServer(availableQuery);
      const availableDevices = availableSnapshot.data().count;
      setStats({
        totalUsers,
        pendingRequests,
        approvedRequests,
        availableDevices
      });
      console.log('✅ Dashboard stats loaded:', {
        totalUsers,
        pendingRequests,
        approvedRequests,
        availableDevices
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };
  const setupRealtimeListeners = () => {
    const unsubscribeFunctions = [];
    try {
      const usersQuery = query(collection(db, 'users'));
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          totalUsers: snapshot.size
        }));
      });
      unsubscribeFunctions.push(unsubscribeUsers);
      const pendingQuery = query(
        collection(db, 'deviceRequests'),
        where('status', '==', 'pending')
      );
      const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          pendingRequests: snapshot.size
        }));
      });
      unsubscribeFunctions.push(unsubscribePending);
      const approvedQuery = query(
        collection(db, 'deviceRequests'),
        where('status', 'in', ['accepted', 'cost-estimated', 'user-accepted'])
      );
      const unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          approvedRequests: snapshot.size
        }));
      });
      unsubscribeFunctions.push(unsubscribeApproved);
      const availableQuery = query(
        collection(db, 'devices'),
        where('status', '==', 'available')
      );
      const unsubscribeAvailable = onSnapshot(availableQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          availableDevices: snapshot.size
        }));
      });
      unsubscribeFunctions.push(unsubscribeAvailable);
    } catch (error) {
      console.error('❌ Error setting up real-time listeners:', error);
    }
    return unsubscribeFunctions;
  };
  const StatCard = ({ title, value, icon, color, borderColor }) => (
    <div className={`bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 ${borderColor} p-6`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              value.toLocaleString()
            )}
          </p>
        </div>
      </div>
    </div>
  );
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Stats</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchDashboardStats}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-600">
          Real-time statistics for your SmartAgro platform
        </p>
      </div>
      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<UsersIcon className="h-6 w-6 text-blue-600" />}
          color="bg-blue-100"
          borderColor="border-blue-500"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={<ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600" />}
          color="bg-yellow-100"
          borderColor="border-yellow-500"
        />
        <StatCard
          title="Approved Requests"
          value={stats.approvedRequests}
          icon={<CheckCircleIcon className="h-6 w-6 text-green-600" />}
          color="bg-green-100"
          borderColor="border-green-500"
        />
        <StatCard
          title="Rejected Requests"
          value={stats.rejectedRequests}
          icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-600" />}
          color="bg-red-100"
          borderColor="border-red-500"
        />
      </div>
      {}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading statistics...</span>
        </div>
      )}
    </div>
  );
};
export default DashboardStats;
