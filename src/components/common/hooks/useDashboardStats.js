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
import { db } from '../../../services/firebase/firebase';
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
        getCountFromServer(query(collection(db, 'deviceRequests'))),
        getCountFromServer(query(
          collection(db, 'devices'),
          where('status', '==', 'active')
        )),
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
  const setupRealtimeListeners = useCallback(() => {
    const unsubscribeFunctions = [];
    try {
      console.log('🔄 Setting up real-time listeners...');
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
  const refreshStats = useCallback(() => {
    fetchInitialStats();
  }, [fetchInitialStats]);
  useEffect(() => {
    fetchInitialStats();
    const unsubscribeFunctions = setupRealtimeListeners();
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
export const useRecentActivity = (limitCount = 10) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError(null);
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
