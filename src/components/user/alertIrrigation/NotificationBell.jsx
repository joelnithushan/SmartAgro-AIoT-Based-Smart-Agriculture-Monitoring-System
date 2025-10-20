import React, { useState, useEffect } from 'react';
import { db } from '../../../services/firebase/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';
import { formatToSLTime } from '../../common/validations/timeUtils';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    // Listen to recent notifications
    const notificationsQuery = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationList = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationList.push({
          id: doc.id,
          ...data
        });
        
        if (!data.read) {
          unread++;
        }
      });

      setNotifications(notificationList);
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return formatToSLTime(timestamp);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert':
        return '🔔';
      case 'irrigation':
        return '💧';
      case 'system':
        return '⚙️';
      case 'device':
        return '📱';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type, critical = false) => {
    if (critical) return 'text-red-600';
    
    switch (type) {
      case 'alert':
        return 'text-yellow-600';
      case 'irrigation':
        return 'text-blue-600';
      case 'system':
        return 'text-gray-600';
      case 'device':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 rounded-full transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            </div>
            
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-400 text-2xl mb-2">🔔</div>
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${getNotificationColor(notification.type, notification.critical)}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="px-4 py-2 border-t border-gray-200">
              <a
                href="/user/alerts"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
                onClick={() => setShowDropdown(false)}
              >
                View all notifications
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
