import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database, auth } from '../../../services/firebase/firebase';
import toast from 'react-hot-toast';

/**
 * Custom hook for real-time sensor data from Firebase Realtime Database
 * @param {string} deviceId - The device ID to monitor
 * @returns {object} - { sensorData, isOnline, loading, error }
 */
export const useRealtimeSensorData = (deviceId) => {
  const [sensorData, setSensorData] = useState({
    soilMoistureRaw: 0,
    soilMoisturePct: 0,
    airTemperature: 0,
    airHumidity: 0,
    soilTemperature: 0,
    airQualityIndex: 0,
    gases: {
      co2: 0,
      nh3: 0
    },
    lightDetected: 0,
    rainLevelRaw: 0,
    relayStatus: "off",
    timestamp: null,
    deviceOnline: false
  });
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!deviceId) {
      console.log('🔍 No deviceId provided to useRealtimeSensorData - user may not have a device assigned yet');
      setLoading(false);
      return;
    }

    console.log('📡 Setting up real-time sensor data for device:', deviceId);

    const latestRef = ref(database, `devices/${deviceId}/sensors/latest`);
    const historyRef = ref(database, `devices/${deviceId}/sensors/history`);
    const lastSeenRef = ref(database, `devices/${deviceId}/meta/lastSeen`);

    const unsubscribeLatest = onValue(latestRef, (snapshot) => {
      console.log('🔍 useRealtimeSensorData: Received data from Firebase');
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('📊 Raw data from Firebase:', data);
        
        // Check if data is fresh (less than 60 seconds old for online/offline detection)
        const dataTimestamp = data.timestamp || 0;
        const currentTime = Date.now();
        
        // Handle different timestamp formats (seconds vs milliseconds)
        let normalizedTimestamp = dataTimestamp;
        if (dataTimestamp < 1000000000000) { // If timestamp is in seconds, convert to milliseconds
          normalizedTimestamp = dataTimestamp * 1000;
        }
        
        const dataAge = currentTime - normalizedTimestamp;
        const isDataFresh = dataAge < 60000; // 60 seconds for online/offline detection

        console.log(`🕐 Timestamp check: ${dataTimestamp} vs ${currentTime}, age: ${Math.round(dataAge/1000)}s, fresh: ${isDataFresh}`);
        console.log(`🕐 Normalized timestamp: ${normalizedTimestamp}, dataAge: ${dataAge}ms`);

        // Always process and display data if it exists, regardless of age
        if (data && Object.keys(data).length > 0) {
          // Debug timestamp
          console.log('🕐 Raw timestamp from Firebase:', data.timestamp, 'Type:', typeof data.timestamp);
          
          // Data is fresh - process and display it
          const processedData = {
            soilMoistureRaw: data.soilMoistureRaw || 0,
            soilMoisturePct: data.soilMoisturePct || 0,
            airTemperature: data.airTemperature || 0,
            airHumidity: data.airHumidity || 0,
            soilTemperature: data.soilTemperature || 0,
            airQualityIndex: data.airQualityIndex || 0,
            gases: {
              co2: data.gases?.co2 || 0,
              nh3: data.gases?.nh3 || 0
            },
            lightDetected: data.lightDetected || 0,
            rainLevelRaw: data.rainLevelRaw || 0,
            relayStatus: data.relayStatus || "off",
            timestamp: data.timestamp && data.timestamp > 86400000 ? data.timestamp : Date.now(),
            deviceOnline: true
          };
          setSensorData(processedData);
          setError(null);
          console.log('✅ Sensor data updated:', processedData);
          
          // Track when we last received sensor data for ESP32 online detection
          window.lastESP32UpdateTime = Date.now();
          console.log(`📡 Received sensor data update at ${new Date().toISOString()}`);
          
          // Also update online status immediately when we receive fresh data
          setIsOnline(true);
        } else {
          // No data or empty data - show zeros
          console.log('⚠️ No data or empty data, showing zeros');
          setSensorData({
            soilMoistureRaw: 0,
            soilMoisturePct: 0,
            airTemperature: 0,
            airHumidity: 0,
            soilTemperature: 0,
            airQualityIndex: 0,
            gases: {
              co2: 0,
              nh3: 0
            },
            lightDetected: 0,
            rainLevelRaw: 0,
            relayStatus: "off",
            timestamp: null,
            deviceOnline: false
          });
          setError('Device offline - no sensor data available');
        }
      } else {
        // Device is offline - reset all data to 0
        console.log('❌ No data in Firebase, device offline');
        setSensorData({
          soilMoistureRaw: 0,
          soilMoisturePct: 0,
          airTemperature: 0,
          airHumidity: 0,
          soilTemperature: 0,
          airQualityIndex: 0,
          gases: {
            co2: 0,
            nh3: 0
          },
          lightDetected: 0,
          rainLevelRaw: 0,
          relayStatus: "off",
          timestamp: null,
          deviceOnline: false
        });
        setIsOnline(false);
        setError('Device offline - no sensor data available');
      }
      setLoading(false);
    }, (error) => {
      console.error('❌ Error in sensor data subscription:', error);
      console.log('🔧 Connection error details:', error.code, error.message);
      // Connection error - reset all data to 0
      setSensorData({
        soilMoistureRaw: 0,
        soilMoisturePct: 0,
        airTemperature: 0,
        airHumidity: 0,
        soilTemperature: 0,
        airQualityIndex: 0,
        gases: {
          co2: 0,
          nh3: 0
        },
        lightDetected: 0,
        rainLevelRaw: 0,
        relayStatus: "off",
        timestamp: null,
        deviceOnline: false
      });
      setError(error.message);
      setIsOnline(false);
      setLoading(false);
    });

    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Process historical data if needed
        console.log('📈 Historical data updated:', Object.keys(data).length, 'records');
      }
    }, (error) => {
      console.error('❌ Error in history subscription:', error);
    });

    // Periodic check to ensure device goes offline if no updates received
    const offlineCheckInterval = setInterval(() => {
      if (window.lastESP32UpdateTime) {
        const timeSinceLastUpdate = Date.now() - window.lastESP32UpdateTime;
        if (timeSinceLastUpdate > 20000) {
          console.log(`⏰ Periodic check: No updates for ${Math.round(timeSinceLastUpdate/1000)}s - setting OFFLINE`);
          setIsOnline(false);
        }
      }
    }, 5000); // Check every 5 seconds

    // Listen to lastSeen timestamp for device online/offline detection
    const unsubscribeLastSeen = onValue(lastSeenRef, (snapshot) => {
      if (snapshot.exists()) {
        const lastSeen = snapshot.val();
        const currentTime = Date.now();
        
        // Handle different timestamp formats
        let normalizedLastSeen = lastSeen;
        
        // If timestamp is very small (< 1000000000), it's likely millis() from ESP32
        if (lastSeen < 1000000000) {
          // This is millis() from ESP32 - we need to track when we last received an update
          // For ESP32 millis(), we can't determine absolute time, so we track update frequency
          const currentTime = Date.now();
          
          // If this is the first time or we haven't seen an update recently, assume offline
          if (!window.lastESP32UpdateTime || (currentTime - window.lastESP32UpdateTime) > 20000) {
            console.log(`🕐 ESP32 millis timestamp: ${lastSeen}, no recent updates - OFFLINE`);
            setIsOnline(false);
            return;
          }
          
          // If we're receiving regular updates, consider online
          const isOnline = (currentTime - window.lastESP32UpdateTime) < 20000;
          console.log(`🕐 ESP32 millis timestamp: ${lastSeen}, time since last update: ${Math.round((currentTime - window.lastESP32UpdateTime)/1000)}s, online: ${isOnline}`);
          setIsOnline(isOnline);
          return;
        }
        
        // Handle Unix timestamps (seconds vs milliseconds)
        if (lastSeen < 1000000000000) { // If timestamp is in seconds, convert to milliseconds
          normalizedLastSeen = lastSeen * 1000;
        }
        
        const timeSinceLastSeen = currentTime - normalizedLastSeen;
        const isDeviceOnline = timeSinceLastSeen < 20000; // 20 seconds threshold (reduced from 60)
        
        console.log(`🕐 LastSeen check: ${lastSeen}, age: ${Math.round(timeSinceLastSeen/1000)}s, online: ${isDeviceOnline}`);
        console.log(`🕐 Normalized lastSeen: ${normalizedLastSeen}, timeSinceLastSeen: ${timeSinceLastSeen}ms`);
        
        setIsOnline(isDeviceOnline);
        
        // Only update online status, don't interfere with sensor data
        // Sensor data will be handled by the main sensor data listener
      } else {
        // No lastSeen data - device is offline
        setIsOnline(false);
        setSensorData({
          soilMoistureRaw: 0,
          soilMoisturePct: 0,
          airTemperature: 0,
          airHumidity: 0,
          soilTemperature: 0,
          airQualityIndex: 0,
          gases: {
            co2: 0,
            nh3: 0
          },
          lightDetected: 0,
          rainLevelRaw: 0,
          relayStatus: "off",
          timestamp: null,
          deviceOnline: false
        });
      }
    }, (error) => {
      console.error('❌ Error in lastSeen subscription:', error);
      setIsOnline(false);
    });

    return () => {
      unsubscribeLatest();
      unsubscribeHistory();
      unsubscribeLastSeen();
      clearInterval(offlineCheckInterval);
    };
  }, [deviceId]);

  return { sensorData, isOnline, loading, error };
};

/**
 * Custom hook for irrigation system control
 * @param {string} deviceId - The device ID to control
 * @returns {object} - { irrigationMode, pumpStatus, togglePump, setIrrigationMode, schedules }
 */
export const useIrrigationControl = (deviceId) => {
  const [irrigationMode, setIrrigationModeState] = useState('manual');
  const [pumpStatus, setPumpStatus] = useState('off');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    console.log('💧 Setting up irrigation control for device:', deviceId);

    const irrigationRef = ref(database, `devices/${deviceId}/control/irrigation`);
    const relayRef = ref(database, `devices/${deviceId}/control/relay`);
    const relayStatusRef = ref(database, `devices/${deviceId}/control/relay/status`);
    const schedulesRef = ref(database, `devices/${deviceId}/schedules`);

    const unsubscribeIrrigation = onValue(irrigationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setIrrigationModeState(data.mode || 'manual');
      }
    });

    const unsubscribeRelay = onValue(relayRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPumpStatus(data.status || 'off');
      }
    });

    // Instant relay status listener for immediate UI updates
    const unsubscribeRelayStatus = onValue(relayStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        const status = snapshot.val();
        console.log('⚡ INSTANT: Relay status update received:', status);
        setPumpStatus(status || 'off');
      }
    }, (error) => {
      console.error('❌ Error in instant relay status subscription:', error);
    });

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
      setLoading(false);
    });

    return () => {
      unsubscribeIrrigation();
      unsubscribeRelay();
      unsubscribeRelayStatus();
      unsubscribeSchedules();
    };
  }, [deviceId]);

  const togglePump = async (status) => {
    if (!deviceId) {
      toast.error('No device connected');
      return;
    }

    if (!database) {
      console.error('❌ Firebase database not initialized');
      toast.error('Database connection error. Please refresh the page.');
      return;
    }

    if (!auth || !auth.currentUser) {
      console.error('❌ User not authenticated');
      toast.error('Please log in to control the pump');
      return;
    }

    try {
      console.log(`🔄 Attempting to control pump: ${status} for device: ${deviceId}`);
      
      // First, try to write to the instant relay control path for immediate response
      const relayStatusRef = ref(database, `devices/${deviceId}/control/relay/status`);
      await update(relayStatusRef, { value: status });
      console.log(`✅ Instant relay status updated: ${status}`);
      
      // Then update the main relay control for consistency (with error handling)
      try {
        const relayRef = ref(database, `devices/${deviceId}/control/relay`);
        await update(relayRef, {
          status: status,
          mode: 'manual',
          lastChangedBy: 'user',
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Main relay control updated: ${status}`);
      } catch (relayError) {
        console.warn('⚠️ Failed to update main relay control, but instant control succeeded:', relayError);
        // Don't fail the entire operation if this secondary update fails
      }
      
      // Finally, update the sensor data to reflect the relay status (with error handling)
      try {
        const sensorRef = ref(database, `devices/${deviceId}/sensors/latest`);
        await update(sensorRef, {
          relayStatus: status,
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Sensor data updated with relay status: ${status}`);
      } catch (sensorError) {
        console.warn('⚠️ Failed to update sensor data, but pump control succeeded:', sensorError);
        // Don't fail the entire operation if this secondary update fails
      }
      
      console.log(`⚡ INSTANT: Pump control sent to device - ${status}`);
      toast.success(`Water pump turned ${status}`);
    } catch (error) {
      console.error('❌ Error toggling pump:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to control pump';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Database temporarily unavailable. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('auth')) {
        errorMessage = 'Authentication error. Please log in again.';
      }
      
      toast.error(errorMessage);
    }
  };

  const setIrrigationMode = async (mode) => {
    if (!deviceId) {
      toast.error('No device connected');
      return;
    }

    try {
      const irrigationRef = ref(database, `devices/${deviceId}/control/irrigation`);
      await update(irrigationRef, {
        mode: mode,
        lastChangedBy: 'user',
        timestamp: new Date().toISOString()
      });
      
      // Also update device meta
      const metaRef = ref(database, `devices/${deviceId}/meta`);
      await update(metaRef, {
        irrigationMode: mode,
        lastUpdated: new Date().toISOString()
      });
      
      toast.success(`Irrigation mode set to ${mode}`);
    } catch (error) {
      console.error('Error setting irrigation mode:', error);
      toast.error('Failed to set irrigation mode');
    }
  };

  const addSchedule = async (schedule) => {
    if (!deviceId) {
      toast.error('No device connected');
      return;
    }

    try {
      const scheduleId = `schedule_${Date.now()}`;
      const scheduleRef = ref(database, `devices/${deviceId}/schedules/${scheduleId}`);
      await update(scheduleRef, {
        ...schedule,
        enabled: true,
        createdAt: new Date().toISOString()
      });
      
      toast.success('Irrigation schedule added');
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule');
    }
  };

  const removeSchedule = async (scheduleId) => {
    if (!deviceId) {
      toast.error('No device connected');
      return;
    }

    try {
      const scheduleRef = ref(database, `devices/${deviceId}/schedules/${scheduleId}`);
      await update(scheduleRef, null);
      
      toast.success('Schedule removed');
    } catch (error) {
      console.error('Error removing schedule:', error);
      toast.error('Failed to remove schedule');
    }
  };

  return {
    irrigationMode,
    pumpStatus,
    schedules,
    loading,
    togglePump,
    setIrrigationMode,
    addSchedule,
    removeSchedule
  };
};
