import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getCountFromServer,
  getDocs,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchDashboardData();
  }, []);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching dashboard data with optimized queries...');
      const [
        usersSnapshot,
        pendingSnapshot,
        approvedSnapshot,
        rejectedSnapshot
      ] = await Promise.all([
        getCountFromServer(query(collection(db, 'users'))),
        getCountFromServer(query(
          collection(db, 'deviceRequests'),
          where('status', '==', 'pending')
        )),
        getCountFromServer(query(
          collection(db, 'deviceRequests'),
          where('status', '==', 'approved')
        )),
        getCountFromServer(query(
          collection(db, 'deviceRequests'),
          where('status', '==', 'rejected')
        ))
      ]);
      const recentQuery = query(
        collection(db, 'deviceRequests'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const recentSnapshot = await getDocs(recentQuery);
      const recentRequests = recentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      const allRequestsQuery = query(collection(db, 'deviceRequests'));
      const allRequestsSnapshot = await getDocs(allRequestsQuery);
      const allRequests = allRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      const chartData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayRequests = allRequests.filter(req => {
          const reqDate = req.createdAt;
          return reqDate.toDateString() === date.toDateString();
        }).length;
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          requests: dayRequests,
          users: Math.floor(dayRequests * 0.3) 
        };
      });
      setStats({
        totalUsers: usersSnapshot.data().count,
        pendingRequests: pendingSnapshot.data().count,
        approvedRequests: approvedSnapshot.data().count,
        rejectedRequests: rejectedSnapshot.data().count
      });
      setRecentActivity(recentRequests);
      setChartData(chartData);
      console.log('✅ Dashboard data loaded successfully:', {
        totalUsers: usersSnapshot.data().count,
        pendingRequests: pendingSnapshot.data().count,
        approvedRequests: approvedSnapshot.data().count,
        rejectedRequests: rejectedSnapshot.data().count
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  const StatCard = ({ title, value, color = 'green', icon }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-semibold text-${color}-600`}>{value}</p>
        </div>
      </div>
    </div>
  );
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3">
                <button
                  onClick={fetchDashboardData}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of SmartAgro system activity and statistics
        </p>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          color="blue"
          icon={
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          color="yellow"
          icon={
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Approved Requests"
          value={stats.approvedRequests}
          color="green"
          icon={
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Rejected Requests"
          value={stats.rejectedRequests}
          color="red"
          icon={
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />
      </div>
      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Requests</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <button 
            onClick={() => window.location.href = '/admin/orders'}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All Orders →
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {(activity.fullName || activity.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.fullName || activity.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.email && activity.fullName ? activity.email : 'User Activity'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-11 space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Farm:</span> {activity.farmInfo?.farmName || 'No farm name'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Location:</span> {activity.farmInfo?.farmLocation || 'Not specified'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Device ID:</span> {activity.deviceId || 'Not assigned'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Cost:</span> {activity.costDetails?.totalCost ? `$${activity.costDetails.totalCost.toFixed(2)}` : 'Not estimated'}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Submitted:</span> {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      activity.status === 'accepted' || activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                      activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      activity.status === 'cost-estimated' ? 'bg-blue-100 text-blue-800' :
                      activity.status === 'device-assigned' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status}
                    </span>
                    {activity.updatedAt && activity.updatedAt !== activity.createdAt && (
                      <span className="text-xs text-gray-400">
                        Updated: {new Date(activity.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;