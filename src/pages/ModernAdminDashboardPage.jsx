import React, { useState, useEffect } from 'react';
import ModernAdminLayout from '../components/admin/ModernAdminLayout';
import MetricCards from '../components/admin/MetricCards';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const ModernAdminDashboardPage = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    activeDevices: 0,
    rejectedRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState({
    users: { value: 12, positive: true },
    requests: { value: 8, positive: true },
    devices: { value: 5, positive: false },
    rejected: { value: 3, positive: false }
  });

  useEffect(() => {
    // Load real metrics from Firebase
    const loadMetrics = async () => {
      setLoading(true);
      
      // TODO: Implement real Firebase queries for metrics
      // For now, set zero values to avoid mock data
      setMetrics({
        totalUsers: 0,
        pendingRequests: 0,
        activeDevices: 0,
        rejectedRequests: 0
      });
      setLoading(false);
    };

    loadMetrics();
  }, []);

  const recentActivity = [
    { action: 'New user registered', time: '2 minutes ago', type: 'user', icon: UserGroupIcon },
    { action: 'Device request submitted', time: '5 minutes ago', type: 'request', icon: ClockIcon },
    { action: 'Device assigned to user', time: '12 minutes ago', type: 'device', icon: ChartBarIcon },
    { action: 'Order completed', time: '1 hour ago', type: 'order', icon: ArrowTrendingUpIcon },
    { action: 'User profile updated', time: '2 hours ago', type: 'user', icon: UserGroupIcon }
  ];

  const quickStats = [
    {
      title: 'Success Rate',
      value: '94.2%',
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-900',
      labelColor: 'text-green-800',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600'
    },
    {
      title: 'Avg Response Time',
      value: '1.2s',
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900',
      labelColor: 'text-blue-800',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600'
    },
    {
      title: 'System Uptime',
      value: '99.9%',
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-900',
      labelColor: 'text-purple-800',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600'
    }
  ];

  return (
    <ModernAdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="mt-1 text-sm text-gray-600">
            Monitor your system performance and key metrics
          </p>
        </div>

        {/* Metrics Grid */}
        <MetricCards metrics={metrics} loading={loading} trends={trends} />

        {/* Additional Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'user' ? 'bg-green-100' :
                      activity.type === 'request' ? 'bg-yellow-100' :
                      activity.type === 'device' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        activity.type === 'user' ? 'text-green-600' :
                        activity.type === 'request' ? 'text-yellow-600' :
                        activity.type === 'device' ? 'text-blue-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${
                      activity.type === 'user' ? 'bg-green-500' :
                      activity.type === 'request' ? 'bg-yellow-500' :
                      activity.type === 'device' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
              <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {quickStats.map((stat, index) => (
                <div key={index} className={`flex items-center justify-between p-4 ${stat.bgColor} rounded-xl`}>
                  <div>
                    <p className={`text-sm font-medium ${stat.labelColor}`}>{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 ${stat.iconBg} rounded-full flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${stat.iconText}`}>
                      {stat.value.includes('%') ? stat.value.slice(0, -1) : stat.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
              <div className="flex items-center text-sm text-green-600">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +12.5%
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chart visualization would go here</p>
              </div>
            </div>
          </div>

          {/* Device Status Chart */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Device Status</h3>
              <div className="flex items-center text-sm text-blue-600">
                <ChartBarIcon className="h-4 w-4 mr-1" />
                Active: 156
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Device status chart would go here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModernAdminLayout>
  );
};

export default ModernAdminDashboardPage;
