import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getCountFromServer,
  getDocs,
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
    availableDevices: 0,
    activeDevices: 0,
    rejectedRequests: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usersCount, setUsersCount] = useState(0);
  const [devicesCount, setDevicesCount] = useState(0);
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
        availableSnapshot,
        activeSnapshot,
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
          collection(db, 'devices'),
          where('status', '==', 'available')
        )),
        getCountFromServer(query(
          collection(db, 'devices'),
          where('status', '==', 'active')
        )),
        getCountFromServer(query(
          collection(db, 'deviceRequests'),
          where('status', '==', 'rejected')
        ))
      ]);
      // Fetch recent device requests with more comprehensive data
      const recentQuery = query(
        collection(db, 'deviceRequests'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const recentSnapshot = await getDocs(recentQuery);
      
      // Fetch user data to enrich the requests
      const allUsersQuery = query(collection(db, 'users'));
      const allUsersSnapshot = await getDocs(allUsersQuery);
      const usersMap = new Map();
      allUsersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        usersMap.set(doc.id, userData);
      });
      
      // Fetch device data
      const allDevicesQuery = query(collection(db, 'devices'));
      const allDevicesSnapshot = await getDocs(allDevicesQuery);
      const devicesMap = new Map();
      allDevicesSnapshot.docs.forEach(doc => {
        const deviceData = doc.data();
        devicesMap.set(doc.id, deviceData);
      });
      const recentRequests = recentSnapshot.docs.map(doc => {
        const data = doc.data();
        const userId = data.userId;
        const userData = userId ? usersMap.get(userId) : null;
        
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          // Extract user information (prioritize user collection data)
          fullName: userData?.personalInfo?.fullName || userData?.fullName || data.personalInfo?.fullName || data.fullName || data.email || 'Unknown User',
          email: userData?.email || data.email || 'No email',
          // Extract farm information
          farmInfo: data.farmInfo || userData?.farmInfo || null,
          farmName: data.farmInfo?.farmName || data.farmName || userData?.farmInfo?.farmName || userData?.farmName || 'No farm name',
          // Extract device information
          deviceInfo: data.deviceInfo || null,
          // Extract status and other details
          status: data.status || 'unknown',
          notes: data.notes || '',
          // Extract contact information (prioritize user collection data)
          phoneNumber: userData?.personalInfo?.phoneNumber || userData?.phoneNumber || data.personalInfo?.phoneNumber || data.phoneNumber || '',
          address: userData?.personalInfo?.address || userData?.address || data.personalInfo?.address || data.address || '',
          // Additional user data
          userRole: userData?.role || 'user',
          userCreatedAt: userData?.createdAt?.toDate?.() || null,
          // Device assignment info
          assignedDeviceId: data.assignedDeviceId || null,
          assignedDevice: data.assignedDeviceId ? devicesMap.get(data.assignedDeviceId) : null
        };
      });
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
        availableDevices: availableSnapshot.data().count,
        activeDevices: activeSnapshot.data().count,
        rejectedRequests: rejectedSnapshot.data().count
      });
      setRecentActivity(recentRequests);
      setChartData(chartData);
      setUsersCount(usersMap.size);
      setDevicesCount(devicesMap.size);
      console.log('✅ Dashboard data loaded successfully:', {
        totalUsers: usersSnapshot.data().count,
        pendingRequests: pendingSnapshot.data().count,
        approvedRequests: approvedSnapshot.data().count,
        availableDevices: availableSnapshot.data().count,
        activeDevices: activeSnapshot.data().count,
        rejectedRequests: rejectedSnapshot.data().count
      });
      console.log('📊 Recent activity data:', recentRequests.slice(0, 3)); // Log first 3 activities
      console.log('👥 Users map size:', usersMap.size);
      console.log('📱 Devices map size:', devicesMap.size);
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
    <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-200 rounded-xl">
              <svg className="h-8 w-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-lg text-gray-700">
                Overview of SmartAgro system activity and statistics
              </p>
            </div>
          </div>
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
        {/* Weekly Requests Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Requests</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="requests" stroke="#059669" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* User Activity Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="users" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {}
      <div className="bg-white rounded-xl shadow-lg border border-green-100">
        <div className="px-6 py-4 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {recentActivity.length} recent requests
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {usersCount} total users
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                {devicesCount} total devices
              </span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-green-100">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={activity.id || index} className="px-6 py-4 hover:bg-green-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.fullName}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        activity.status === 'approved' || activity.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          Email: {activity.email}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                          Farm: {activity.farmName}
                        </span>
                      </div>
                      
                      {activity.farmInfo && (
                        <div className="flex flex-wrap gap-2">
                          {activity.farmInfo.farmSize && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              Size: {activity.farmInfo.farmSize} acres
                            </span>
                          )}
                          {activity.farmInfo.soilType && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                              Soil: {activity.farmInfo.soilType}
                            </span>
                          )}
                          {activity.farmInfo.location && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-100 text-teal-800">
                              Location: {activity.farmInfo.location}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {activity.deviceInfo && (
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                            Device: {activity.deviceInfo.deviceType || 'Smart Sensor'}
                          </span>
                          {activity.deviceInfo.quantity && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
                              Quantity: {activity.deviceInfo.quantity}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {activity.phoneNumber && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-cyan-100 text-cyan-800">
                          Phone: {activity.phoneNumber}
                        </span>
                      )}
                      
                      {activity.notes && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                          Notes: {activity.notes}
                        </span>
                      )}
                      
                      {activity.userRole && activity.userRole !== 'user' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                          Role: {activity.userRole}
                        </span>
                      )}
                      
                      {activity.assignedDevice && (
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                            Assigned: {activity.assignedDevice.deviceType || 'Smart Sensor'}
                          </span>
                          {activity.assignedDevice.deviceId && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              ID: {activity.assignedDevice.deviceId}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        Requested: {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString()}
                      </p>
                      {activity.userCreatedAt && (
                        <p className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                          User since: {new Date(activity.userCreatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-400">
                      ID: {activity.id?.substring(0, 8)}...
                    </p>
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