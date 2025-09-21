import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  ClockIcon, 
  DevicePhoneMobileIcon, 
  XCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const ModernAdminDashboard = () => {
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
    // Simulate data loading
    const loadMetrics = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics({
        totalUsers: 1247,
        pendingRequests: 23,
        activeDevices: 156,
        rejectedRequests: 8
      });
      setLoading(false);
    };

    loadMetrics();
  }, []);

  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: UsersIcon,
      color: 'green',
      borderColor: 'border-l-green-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: trends.users
    },
    {
      title: 'Pending Requests',
      value: metrics.pendingRequests,
      icon: ClockIcon,
      color: 'yellow',
      borderColor: 'border-l-yellow-500',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      trend: trends.requests
    },
    {
      title: 'Active Devices',
      value: metrics.activeDevices,
      icon: DevicePhoneMobileIcon,
      color: 'blue',
      borderColor: 'border-l-blue-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: trends.devices
    },
    {
      title: 'Rejected Requests',
      value: metrics.rejectedRequests,
      icon: XCircleIcon,
      color: 'red',
      borderColor: 'border-l-red-500',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      trend: trends.rejected
    }
  ];

  const MetricCard = ({ card }) => {
    const Icon = card.icon;
    
    return (
      <div className={`
        rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 
        bg-white p-6 ${card.borderColor} border-l-4
        hover:scale-105 transform
      `}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {card.title}
            </p>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-900">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  card.value.toLocaleString()
                )}
              </p>
              {!loading && (
                <div className={`ml-2 flex items-center text-sm ${
                  card.trend.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.trend.positive ? (
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {card.trend.value}%
                </div>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-xl ${card.bgColor}`}>
            <Icon className={`h-6 w-6 ${card.iconColor}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">A</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <p className="mt-1 text-sm text-gray-600">
            Monitor your system performance and key metrics
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricCards.map((card, index) => (
            <MetricCard key={index} card={card} />
          ))}
        </div>

        {/* Additional Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {[
                { action: 'New user registered', time: '2 minutes ago', type: 'user' },
                { action: 'Device request submitted', time: '5 minutes ago', type: 'request' },
                { action: 'Device assigned to user', time: '12 minutes ago', type: 'device' },
                { action: 'Order completed', time: '1 hour ago', type: 'order' },
                { action: 'User profile updated', time: '2 hours ago', type: 'user' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.type === 'user' ? 'bg-green-500' :
                    activity.type === 'request' ? 'bg-yellow-500' :
                    activity.type === 'device' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-green-800">Success Rate</p>
                  <p className="text-2xl font-bold text-green-900">94.2%</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">94%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-blue-800">Avg Response Time</p>
                  <p className="text-2xl font-bold text-blue-900">1.2s</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">1.2s</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-purple-800">System Uptime</p>
                  <p className="text-2xl font-bold text-purple-900">99.9%</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-600">99%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernAdminDashboard;
