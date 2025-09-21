import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getCountFromServer,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Custom hook for fetching dashboard statistics with real-time updates
 * Uses Firebase v9 modular syntax with optimized queries
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    availableDevices: 0,
    totalRequests: 0,
    activeDevices: 0,
    rejectedRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch initial counts using getCountFromServer for better performance
  const fetchInitialStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching initial dashboard stats...');

      const [
        usersSnapshot,
        pendingSnapshot,
        approvedSnapshot,
        availableSnapshot,
        totalRequestsSnapshot,
        activeDevicesSnapshot,
        rejectedSnapshot
      ] = await Promise.all([
        // Total users count
        getCountFromServer(query(collection(db, 'users'))),
        
        // Pending requests count
        getCountFromServer(query(
          collection(db, 'deviceRequests'),
          where('status', '==', 'pending')
        )),
        
        // Approved requests count
        getCountFromServer(query(
          collection(db, 'deviceRequests'),
          where('status', '==', 'approved')
        )),
        
        // Available devices count
        getCountFromServer(query(
          collection(db, 'devices'),
          where('status', '==', 'available')
        )),
        
        // Total requests count
        getCountFromServer(query(collection(db, 'deviceRequests'))),
        
        // Active devices count (assigned devices)
        getCountFromServer(query(
          collection(db, 'devices'),
          where('status', '==', 'active')
        )),
        
        // Rejected requests count
        getCountFromServer(query(
          collection(db, 'deviceRequests'),
          where('status', '==', 'rejected')
        ))
      ]);

      const newStats = {
        totalUsers: usersSnapshot.data().count,
        pendingRequests: pendingSnapshot.data().count,
        approvedRequests: approvedSnapshot.data().count,
        availableDevices: availableSnapshot.data().count,
        totalRequests: totalRequestsSnapshot.data().count,
        activeDevices: activeDevicesSnapshot.data().count,
        rejectedRequests: rejectedSnapshot.data().count
      };

      setStats(newStats);
      setLastUpdated(new Date());
      
      console.log('✅ Initial dashboard stats loaded:', newStats);

    } catch (error) {
      console.error('❌ Error fetching initial dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time listeners for live updates
  const setupRealtimeListeners = useCallback(() => {
    const unsubscribeFunctions = [];

    try {
      console.log('🔄 Setting up real-time listeners...');

      // Real-time listener for users count
      const usersQuery = query(collection(db, 'users'));
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          totalUsers: snapshot.size
        }));
        setLastUpdated(new Date());
      }, (error) => {
        console.error('❌ Error in users listener:', error);
      });
      unsubscribeFunctions.push(unsubscribeUsers);

      // Real-time listener for pending requests
      const pendingQuery = query(
        collection(db, 'deviceRequests'),
        where('status', '==', 'pending')
      );
      const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          pendingRequests: snapshot.size
        }));
        setLastUpdated(new Date());
      }, (error) => {
        console.error('❌ Error in pending requests listener:', error);
      });
      unsubscribeFunctions.push(unsubscribePending);

      // Real-time listener for approved requests
      const approvedQuery = query(
        collection(db, 'deviceRequests'),
        where('status', '==', 'approved')
      );
      const unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          approvedRequests: snapshot.size
        }));
        setLastUpdated(new Date());
      }, (error) => {
        console.error('❌ Error in approved requests listener:', error);
      });
      unsubscribeFunctions.push(unsubscribeApproved);

      // Real-time listener for available devices
      const availableQuery = query(
        collection(db, 'devices'),
        where('status', '==', 'available')
      );
      const unsubscribeAvailable = onSnapshot(availableQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          availableDevices: snapshot.size
        }));
        setLastUpdated(new Date());
      }, (error) => {
        console.error('❌ Error in available devices listener:', error);
      });
      unsubscribeFunctions.push(unsubscribeAvailable);

      // Real-time listener for total requests
      const totalRequestsQuery = query(collection(db, 'deviceRequests'));
      const unsubscribeTotalRequests = onSnapshot(totalRequestsQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          totalRequests: snapshot.size
        }));
        setLastUpdated(new Date());
      }, (error) => {
        console.error('❌ Error in total requests listener:', error);
      });
      unsubscribeFunctions.push(unsubscribeTotalRequests);

      // Real-time listener for active devices
      const activeDevicesQuery = query(
        collection(db, 'devices'),
        where('status', '==', 'active')
      );
      const unsubscribeActiveDevices = onSnapshot(activeDevicesQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          activeDevices: snapshot.size
        }));
        setLastUpdated(new Date());
      }, (error) => {
        console.error('❌ Error in active devices listener:', error);
      });
      unsubscribeFunctions.push(unsubscribeActiveDevices);

      // Real-time listener for rejected requests
      const rejectedQuery = query(
        collection(db, 'deviceRequests'),
        where('status', '==', 'rejected')
      );
      const unsubscribeRejected = onSnapshot(rejectedQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          rejectedRequests: snapshot.size
        }));
        setLastUpdated(new Date());
      }, (error) => {
        console.error('❌ Error in rejected requests listener:', error);
      });
      unsubscribeFunctions.push(unsubscribeRejected);

      console.log('✅ Real-time listeners set up successfully');

    } catch (error) {
      console.error('❌ Error setting up real-time listeners:', error);
    }

    return unsubscribeFunctions;
  }, []);

  // Refresh stats manually
  const refreshStats = useCallback(() => {
    fetchInitialStats();
  }, [fetchInitialStats]);

  useEffect(() => {
    // Fetch initial stats
    fetchInitialStats();
    
    // Set up real-time listeners
    const unsubscribeFunctions = setupRealtimeListeners();
    
    // Cleanup listeners on unmount
    return () => {
      console.log('🧹 Cleaning up dashboard stats listeners...');
      unsubscribeFunctions.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [fetchInitialStats, setupRealtimeListeners]);

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refreshStats
  };
};

/**
 * Hook for fetching recent activity data
 */
export const useRecentActivity = (limitCount = 10) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch recent device requests
        const requestsQuery = query(
          collection(db, 'deviceRequests'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
          const activities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'request',
            timestamp: doc.data().createdAt?.toDate?.() || new Date()
          }));

          setRecentActivity(activities);
          setLoading(false);
        }, (error) => {
          console.error('❌ Error fetching recent activity:', error);
          setError('Failed to load recent activity');
          setLoading(false);
        });

        return unsubscribe;

      } catch (error) {
        console.error('❌ Error setting up recent activity listener:', error);
        setError('Failed to load recent activity');
        setLoading(false);
      }
    };

    const unsubscribe = fetchRecentActivity();
    return unsubscribe;

  }, [limitCount]);

  return {
    recentActivity,
    loading,
    error
  };
};
