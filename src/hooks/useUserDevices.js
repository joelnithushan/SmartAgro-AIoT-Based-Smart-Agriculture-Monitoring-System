import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { collection, query, where, onSnapshot as onSnapshotCollection } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Hook for managing user's assigned devices and active device selection
 * Handles device switching, assignment tracking, and multi-device support
 */
export const useUserDevices = () => {
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deviceCount, setDeviceCount] = useState(0);

  // Load user's assigned devices from deviceRequests
  const loadAssignedDevices = useCallback(async (userId) => {
    if (!userId) return;

    try {
      console.log('🔍 Loading assigned devices for user:', userId);

      // Query deviceRequests for assigned devices - Check multiple statuses
      const requestsQuery = query(
        collection(db, 'deviceRequests'),
        where('userId', '==', userId),
        where('status', 'in', ['assigned', 'device-assigned', 'approved', 'completed', 'active'])
      );

      const unsubscribe = onSnapshotCollection(requestsQuery, (snapshot) => {
        const devices = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.deviceId) {
            devices.push({
              id: data.deviceId,
              requestId: doc.id,
              farmName: data.farmInfo?.farmName || data.location || 'Unnamed Farm',
              location: data.location || 'Unknown Location',
              assignedAt: data.assignedAt || data.updatedAt,
              status: data.status,
              cropType: data.farmInfo?.cropType || 'Unknown',
              soilType: data.farmInfo?.soilType || 'Unknown'
            });
          }
        });

        // Sort by assignment date (newest first)
        devices.sort((a, b) => {
          const aTime = a.assignedAt?.toDate?.() || a.assignedAt || new Date(0);
          const bTime = b.assignedAt?.toDate?.() || b.assignedAt || new Date(0);
          return new Date(bTime) - new Date(aTime);
        });

        console.log('📱 Assigned devices loaded:', devices.length);
        
        // If no devices found by userId, try searching by email
        if (devices.length === 0) {
          console.log('🔍 No devices found by userId, trying email search...');
          // This will be handled by the fallback logic in CropFertilizer
        }
        
        setAssignedDevices(devices);
        setDeviceCount(devices.length);

        // Set active device if none is set or if current active device is not in the list
        if (devices.length > 0) {
          if (!activeDeviceId || !devices.find(d => d.id === activeDeviceId)) {
            setActiveDeviceId(devices[0].id);
            console.log('🎯 Auto-selected active device:', devices[0].id);
          }
        } else {
          setActiveDeviceId(null);
        }

        setLoading(false);
      }, (error) => {
        console.error('❌ Error loading assigned devices:', error);
        setError(error.message);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error in loadAssignedDevices:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [activeDeviceId]);

  // Load user's active device preference
  const loadActiveDevice = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const userRef = doc(db, 'users', userId);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const savedActiveDeviceId = userData.activeDeviceId;
          
          if (savedActiveDeviceId && assignedDevices.find(d => d.id === savedActiveDeviceId)) {
            setActiveDeviceId(savedActiveDeviceId);
            console.log('💾 Loaded saved active device:', savedActiveDeviceId);
          }
        }
      }, (error) => {
        console.error('❌ Error loading active device:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error in loadActiveDevice:', error);
    }
  }, [assignedDevices]);

  // Set active device and persist to Firestore
  const switchActiveDevice = useCallback(async (deviceId) => {
    if (!auth.currentUser || !deviceId) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        activeDeviceId: deviceId,
        lastDeviceSwitch: serverTimestamp()
      });

      setActiveDeviceId(deviceId);
      console.log('🔄 Switched to device:', deviceId);
    } catch (error) {
      console.error('❌ Error switching device:', error);
      throw error;
    }
  }, []);

  // Main effect to load user devices
  useEffect(() => {
    if (!auth.currentUser?.uid) {
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    let unsubscribeDevices;
    let unsubscribeActiveDevice;

    const setupSubscriptions = async () => {
      // Load assigned devices
      unsubscribeDevices = await loadAssignedDevices(userId);
      
      // Load active device preference
      unsubscribeActiveDevice = await loadActiveDevice(userId);
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeDevices) unsubscribeDevices();
      if (unsubscribeActiveDevice) unsubscribeActiveDevice();
    };
  }, [auth.currentUser?.uid, loadAssignedDevices, loadActiveDevice]);

  // Get current active device info
  const getActiveDevice = useCallback(() => {
    return assignedDevices.find(device => device.id === activeDeviceId) || null;
  }, [assignedDevices, activeDeviceId]);

  // Check if user can request more devices (max 3)
  const canRequestMoreDevices = useCallback(() => {
    return deviceCount < 3;
  }, [deviceCount]);

  // Get device usage summary
  const getDeviceUsageSummary = useCallback(() => {
    return {
      current: deviceCount,
      max: 3,
      available: 3 - deviceCount,
      percentage: Math.round((deviceCount / 3) * 100)
    };
  }, [deviceCount]);

  return {
    assignedDevices,
    activeDeviceId,
    loading,
    error,
    deviceCount,
    switchActiveDevice,
    getActiveDevice,
    canRequestMoreDevices,
    getDeviceUsageSummary
  };
};

export default useUserDevices;
