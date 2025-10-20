import React from 'react';
import { 
  UsersIcon, 
  ClockIcon, 
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
const MetricCards = ({ metrics, loading = false, trends = {} }) => {
  const metricCards = [
    {
      title: 'Total Users',
      value: metrics?.totalUsers || 0,
      icon: UsersIcon,
      color: 'green',
      borderColor: 'border-l-green-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: trends.users || { value: 12, positive: true }
    },
    {
      title: 'Pending Requests',
      value: metrics?.pendingRequests || 0,
      icon: ClockIcon,
      color: 'yellow',
      borderColor: 'border-l-yellow-500',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      trend: trends.requests || { value: 8, positive: true }
    },
    {
      title: 'Rejected Requests',
      value: metrics?.rejectedRequests || 0,
      icon: XCircleIcon,
      color: 'red',
      borderColor: 'border-l-red-500',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      trend: trends.rejected || { value: 3, positive: false }
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
              {!loading && card.trend && (
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((card, index) => (
        <MetricCard key={index} card={card} />
      ))}
    </div>
  );
};
export default MetricCards;
