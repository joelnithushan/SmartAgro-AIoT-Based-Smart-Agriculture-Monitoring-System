import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, serverTimestamp } from 'firebase/database';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { database, db, auth } from '../config/firebase';
import toast from 'react-hot-toast';

/**
 * Advanced real-time device monitoring hook with instant pump control
 * Handles device switching, offline detection, and instant relay control
 */
export const useDeviceRealtime = (deviceId) => {
  const [sensorData, setSensorData] = useState({
    soilMoistureRaw: 0,
    soilMoisturePct: 0,
    airTemperature: 0,
    airHumidity: 0,
    soilTemperature: 0,
    airQualityIndex: 0,
    gases: { co2: 0, nh3: 0 },
    lightDetected: 0,
    rainLevelRaw: 0,
    relayStatus: "off",
    timestamp: null,
    deviceOnline: false
  });
  
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relayStatus, setRelayStatus] = useState("off");
  const [irrigationMode, setIrrigationMode] = useState("manual");
  const [schedules, setSchedules] = useState([]);
  const [thresholds, setThresholdsState] = useState({
    soilMoistureLow: 10,
    soilMoistureHigh: 30
  });
  const [lastSeenUpdateTime, setLastSeenUpdateTime] = useState(null);

  // Device offline detection (20 seconds timeout - adjustable)
  const OFFLINE_TIMEOUT = 20000; // Exposed as adjustable constant

  // Enhanced field normalization layer to handle different key names from ESP32
  const normalizeSensorData = useCallback((data) => {
    if (!data) return null;
    
    // Log field mismatches for debugging
    const expectedFields = ['soilMoistureRaw', 'soilMoisturePct', 'airTemperature', 'airHumidity', 'soilTemperature', 'airQualityIndex', 'lightDetected', 'rainLevelRaw', 'relayStatus'];
    const actualFields = Object.keys(data);
    const missingFields = expectedFields.filter(field => !actualFields.includes(field));
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Missing expected fields:', missingFields);
      console.warn('📦 Available fields:', actualFields);
    }
    
    const normalized = {
      soilMoistureRaw: data.soilMoistureRaw ?? data.soil_moisture_raw ?? data.sm_raw ?? data.soilMoisture ?? 0,
      soilMoisturePct: data.soilMoisturePct ?? data.soil_moisture_pct ?? data.sm_pct ?? data.soilMoisture ?? 0,
      airTemperature: data.airTemperature ?? data.air_temperature ?? data.dht11_temp ?? data.temperature ?? 0,
      airHumidity: data.airHumidity ?? data.air_humidity ?? data.dht11_humidity ?? data.humidity ?? 0,
      soilTemperature: data.soilTemperature ?? data.soil_temperature ?? data.ds18b20 ?? data.soilTemp ?? 0,
      airQualityIndex: data.airQualityIndex ?? data.air_quality_index ?? data.mq135 ?? data.airQuality ?? 0,
      gases: {
        co2: data.gases?.co2 ?? data.co2 ?? data.gas_co2 ?? 0,
        nh3: data.gases?.nh3 ?? data.nh3 ?? data.gas_nh3 ?? 0
      },
      lightDetected: data.lightDetected ?? data.light_detected ?? data.ldr ?? data.lightLevel ?? 0,
      rainLevelRaw: data.rainLevelRaw ?? data.rain_level_raw ?? data.rain_sensor ?? data.rainLevel ?? 0,
      relayStatus: data.relayStatus ?? data.relay_status ?? data.pump_status ?? data.pumpStatus ?? "off",
      timestamp: data.timestamp ?? Date.now()
    };
    
    // Log normalized data for debugging
    console.log('🔄 Normalized sensor data:', normalized);
    
    return normalized;
  }, []);

  // Check if device is online based on lastSeen timestamp
  const checkDeviceOnline = useCallback((lastSeen) => {
    if (!lastSeen) return false;
    
    const now = Date.now();
    
    // Handle different timestamp formats
    let normalizedLastSeen = lastSeen;
    
    // If timestamp is very small (< 1000000000), it's likely millis() from ESP32
    // Track when we last received an update to determine if device is still active
    if (lastSeen < 1000000000) {
      // This is millis() from ESP32 - check if we're receiving regular updates
      const currentUpdateTime = Date.now();
      
      if (lastSeenUpdateTime) {
        const timeSinceLastUpdate = currentUpdateTime - lastSeenUpdateTime;
        const isOnline = timeSinceLastUpdate < OFFLINE_TIMEOUT;
        console.log(`🕐 ESP32 millis timestamp: ${lastSeen}, time since last update: ${Math.round(timeSinceLastUpdate/1000)}s, online: ${isOnline}`);
        return isOnline;
      } else {
        // First time seeing this timestamp, assume online
        setLastSeenUpdateTime(currentUpdateTime);
        console.log(`🕐 ESP32 first timestamp: ${lastSeen}, assuming online`);
        return true;
      }
    }
    
    // Handle Unix timestamps (seconds vs milliseconds)
    if (lastSeen < 1000000000000) { // If timestamp is in seconds, convert to milliseconds
      normalizedLastSeen = lastSeen * 1000;
    }
    
    const timeDiff = now - normalizedLastSeen;
    const isOnline = timeDiff < OFFLINE_TIMEOUT;
    
    console.log(`🕐 Device online check: lastSeen=${lastSeen}, age=${Math.round(timeDiff/1000)}s, online=${isOnline}`);
    
    return isOnline;
  }, [lastSeenUpdateTime]);

  // Zero out sensor data when device goes offline
  const zeroSensorData = useCallback(() => {
    setSensorData({
      soilMoistureRaw: 0,
      soilMoisturePct: 0,
      airTemperature: 0,
      airHumidity: 0,
      soilTemperature: 0,
      airQualityIndex: 0,
      gases: { co2: 0, nh3: 0 },
      lightDetected: 0,
      rainLevelRaw: 0,
      relayStatus: "off",
      timestamp: null,
      deviceOnline: false
    });
  }, []);

  // Periodic online check for millis() timestamps
  useEffect(() => {
    if (!lastSeenUpdateTime) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastSeenUpdateTime;
      
      if (timeSinceLastUpdate > OFFLINE_TIMEOUT) {
        console.log('📴 Device offline - no updates received for', Math.round(timeSinceLastUpdate/1000), 'seconds');
        setIsOnline(false);
        zeroSensorData();
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [lastSeenUpdateTime, OFFLINE_TIMEOUT, zeroSensorData]);

  // Main device monitoring effect
  useEffect(() => {
    if (!deviceId || !database) {
      setLoading(false);
      return;
    }

    console.log('🔍 Setting up real-time monitoring for device:', deviceId);

    // Device metadata and online status
    const metaRef = ref(database, `devices/${deviceId}/meta`);
    const latestRef = ref(database, `devices/${deviceId}/sensors/latest`);
    const relayStatusRef = ref(database, `devices/${deviceId}/control/relay/status`);
    const irrigationRef = ref(database, `devices/${deviceId}/control/irrigation`);
    const schedulesRef = ref(database, `devices/${deviceId}/schedules`);
    const thresholdsRef = ref(database, `devices/${deviceId}/control/thresholds`);

    // Subscribe to device metadata (lastSeen for online/offline detection)
    const unsubscribeMeta = onValue(metaRef, (snapshot) => {
      if (snapshot.exists()) {
        const meta = snapshot.val();
        const online = checkDeviceOnline(meta.lastSeen);
        setIsOnline(online);
        
        // Update the last seen update time for millis() timestamps
        if (meta.lastSeen && meta.lastSeen < 1000000000) {
          setLastSeenUpdateTime(Date.now());
        }
        
        if (!online) {
          console.log('📴 Device went offline, zeroing sensor data');
          zeroSensorData();
        }
      } else {
        setIsOnline(false);
        zeroSensorData();
      }
    }, (error) => {
      console.error('❌ Error in meta subscription:', error);
      setIsOnline(false);
      zeroSensorData();
    });

    // Subscribe to latest sensor data
    const unsubscribeLatest = onValue(latestRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        const normalizedData = normalizeSensorData(rawData);
        
        if (normalizedData && isOnline) {
          console.log('📊 Received sensor data:', normalizedData);
          
          setSensorData(prev => ({
            ...prev,
            ...normalizedData,
            deviceOnline: true
          }));
        } else if (!isOnline) {
          console.log('📴 Device offline, not updating sensor data');
        }
      } else {
        console.log('📊 No sensor data available');
        if (!isOnline) {
          zeroSensorData();
        }
      }
    }, (error) => {
      console.error('❌ Error in sensor data subscription:', error);
    });

    // Subscribe to instant relay status for immediate UI updates
    const unsubscribeRelayStatus = onValue(relayStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        const relayData = snapshot.val();
        // Handle both simple string values and object payloads
        const status = typeof relayData === 'string' ? relayData : relayData.value;
        console.log('⚡ Instant relay status update:', status);
        setRelayStatus(status);
        
        // Update sensor data relay status for consistency
        setSensorData(prev => ({
          ...prev,
          relayStatus: status
        }));
      }
    }, (error) => {
      console.error('❌ Error in relay status subscription:', error);
    });

    // Subscribe to irrigation mode
    const unsubscribeIrrigation = onValue(irrigationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setIrrigationMode(data.mode || 'manual');
      }
    }, (error) => {
      console.error('❌ Error in irrigation subscription:', error);
    });

    // Subscribe to schedules
    const unsubscribeSchedules = onValue(schedulesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const scheduleArray = Object.entries(data).map(([id, schedule]) => ({
          id,
          ...schedule
        }));
        setSchedules(scheduleArray);
      } else {
        setSchedules([]);
      }
    }, (error) => {
      console.error('❌ Error in schedules subscription:', error);
    });

    // Subscribe to thresholds
    const unsubscribeThresholds = onValue(thresholdsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setThresholdsState(data);
      }
    }, (error) => {
      console.error('❌ Error in thresholds subscription:', error);
    });

    setLoading(false);

    return () => {
      unsubscribeMeta();
      unsubscribeLatest();
      unsubscribeRelayStatus();
      unsubscribeIrrigation();
      unsubscribeSchedules();
      unsubscribeThresholds();
    };
  }, [deviceId, isOnline, checkDeviceOnline, zeroSensorData]);

  // Instant pump control function with proper payload structure
  const togglePump = useCallback(async (status) => {
    if (!deviceId || !database) {
      console.error('❌ Missing deviceId or database:', { deviceId, database: !!database });
      toast.error('No device connected');
      return;
    }

    if (!auth || !auth.currentUser) {
      console.error('❌ User not authenticated:', { auth: !!auth, currentUser: !!auth?.currentUser });
      toast.error('Please log in to control the pump');
      return;
    }

    try {
      console.log(`🔄 INSTANT pump control: ${status} for device: ${deviceId}`);
      console.log(`👤 User: ${auth.currentUser.email} (${auth.currentUser.uid})`);
      
      // Create structured payload for instant relay control
      const controlPayload = {
        value: status,
        requestedBy: auth.currentUser.uid,
        requestedByEmail: auth.currentUser.email,
        timestamp: Date.now()
      };
      
      console.log(`📦 Relay control payload:`, controlPayload);
      
      // Write to instant relay control path for immediate response
      const relayStatusRef = ref(database, `devices/${deviceId}/control/relay/status`);
      console.log(`📡 Writing to: devices/${deviceId}/control/relay/status`);
      
      await update(relayStatusRef, controlPayload);
      console.log(`✅ INSTANT: Relay control command sent successfully`);
      
      // Update local state immediately for instant UI feedback
      setRelayStatus(status);
      setSensorData(prev => ({
        ...prev,
        relayStatus: status
      }));
      
      console.log(`⚡ INSTANT: Pump control sent to device - ${status}`);
      toast.success(`Water pump turned ${status}`);
      
    } catch (error) {
      console.error('❌ Error toggling pump:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to control pump';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your authentication.';
        console.error('🔒 Permission denied - check Firebase rules and user authentication');
      } else if (error.code === 'unavailable') {
        errorMessage = 'Database temporarily unavailable. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'invalid-argument') {
        errorMessage = 'Invalid data format. Please try again.';
      }
      
      toast.error(errorMessage);
    }
  }, [deviceId, auth, database]);

  // Set irrigation mode
  const updateIrrigationMode = useCallback(async (mode) => {
    if (!deviceId || !database) {
      toast.error('No device connected');
      return;
    }

    try {
      const irrigationRef = ref(database, `devices/${deviceId}/control/irrigation`);
      await update(irrigationRef, {
        mode: mode,
        lastChangedBy: auth.currentUser?.email || 'user',
        timestamp: serverTimestamp()
      });
      
      toast.success(`Irrigation mode set to ${mode}`);
    } catch (error) {
      console.error('❌ Error setting irrigation mode:', error);
      toast.error('Failed to update irrigation mode');
    }
  }, [deviceId]);

  // Set thresholds
  const updateThresholds = useCallback(async (newThresholds) => {
    if (!deviceId || !database) {
      toast.error('No device connected');
      return;
    }

    try {
      const thresholdsRef = ref(database, `devices/${deviceId}/control/thresholds`);
      await update(thresholdsRef, {
        ...newThresholds,
        lastChangedBy: auth.currentUser?.email || 'user',
        timestamp: serverTimestamp()
      });
      
      toast.success('Thresholds updated successfully');
    } catch (error) {
      console.error('❌ Error setting thresholds:', error);
      toast.error('Failed to update thresholds');
    }
  }, [deviceId]);

  // Add schedule
  const addSchedule = useCallback(async (schedule) => {
    if (!deviceId || !database) {
      toast.error('No device connected');
      return;
    }

    try {
      const scheduleId = `schedule_${Date.now()}`;
      const scheduleRef = ref(database, `devices/${deviceId}/schedules/${scheduleId}`);
      await update(scheduleRef, {
        ...schedule,
        id: scheduleId,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || 'user'
      });
      
      toast.success('Schedule added successfully');
    } catch (error) {
      console.error('❌ Error adding schedule:', error);
      toast.error('Failed to add schedule');
    }
  }, [deviceId]);

  // Remove schedule
  const removeSchedule = useCallback(async (scheduleId) => {
    if (!deviceId || !database) {
      toast.error('No device connected');
      return;
    }

    try {
      const scheduleRef = ref(database, `devices/${deviceId}/schedules/${scheduleId}`);
      await update(scheduleRef, null);
      
      toast.success('Schedule removed successfully');
    } catch (error) {
      console.error('❌ Error removing schedule:', error);
      toast.error('Failed to remove schedule');
    }
  }, [deviceId]);

  return {
    sensorData,
    isOnline,
    loading,
    error,
    relayStatus,
    irrigationMode,
    schedules,
    thresholds,
    togglePump,
    setIrrigationMode: updateIrrigationMode,
    setThresholds: updateThresholds,
    addSchedule,
    removeSchedule
  };
};

export default useDeviceRealtime;
