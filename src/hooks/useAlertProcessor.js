import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to process alerts when sensor data changes
 * This hook monitors sensor data and triggers alerts when conditions are met
 */
export const useAlertProcessor = (sensorData, deviceId) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);

  // Load user's active alerts
  useEffect(() => {
    if (!user || !deviceId) return;

    const alertsRef = collection(db, 'users', user.uid, 'alerts');
    const activeAlertsQuery = query(
      alertsRef, 
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(activeAlertsQuery, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlerts(alertsData);
    });

    return () => unsubscribe();
  }, [user, deviceId]);

  // Process alerts when sensor data changes
  useEffect(() => {
    if (!sensorData || !alerts.length || !deviceId) return;

    processAlerts(sensorData, alerts, deviceId);
  }, [sensorData, alerts, deviceId]);

  // Load triggered alerts for display
  useEffect(() => {
    if (!user) return;

    const triggeredAlertsRef = collection(db, 'users', user.uid, 'triggeredAlerts');
    const recentAlertsQuery = query(
      triggeredAlertsRef,
      orderBy('triggeredAt', 'desc')
    );

    const unsubscribe = onSnapshot(recentAlertsQuery, (snapshot) => {
      const triggeredData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTriggeredAlerts(triggeredData);
    });

    return () => unsubscribe();
  }, [user]);

  /**
   * Process alerts against current sensor data
   */
  const processAlerts = async (sensorData, alerts, deviceId) => {
    try {
      for (const alert of alerts) {
        const currentValue = getSensorValue(sensorData, alert.parameter);
        
        if (currentValue === null || currentValue === undefined) {
          continue;
        }

        const conditionMet = evaluateCondition(currentValue, alert.comparison, alert.threshold);
        
        if (conditionMet) {
          console.log(`🚨 Alert condition met: ${alert.parameter} = ${currentValue} ${alert.comparison} ${alert.threshold}`);
          
          // Check if alert was already triggered recently (debounce)
          const debounceKey = `${user.uid}_${alert.id}_${alert.parameter}`;
          const now = Date.now();
          const lastTriggered = localStorage.getItem(debounceKey);
          
          if (lastTriggered && (now - parseInt(lastTriggered)) < 60000) { // 1 minute debounce
            console.log(`Alert ${alert.id} debounced`);
            continue;
          }

          // Update debounce timestamp
          localStorage.setItem(debounceKey, now.toString());

          // Trigger alert by calling backend
          await triggerAlert(alert, currentValue, deviceId);
        }
      }
    } catch (error) {
      console.error('Error processing alerts:', error);
    }
  };

  /**
   * Get sensor value for a specific parameter
   */
  const getSensorValue = (sensorData, parameter) => {
    // Handle nested gas values
    if (parameter === 'co2' && sensorData.gases && sensorData.gases.co2 !== undefined) {
      return sensorData.gases.co2;
    }
    if (parameter === 'nh3' && sensorData.gases && sensorData.gases.nh3 !== undefined) {
      return sensorData.gases.nh3;
    }
    
    // Handle direct parameters
    return sensorData[parameter] !== undefined ? sensorData[parameter] : null;
  };

  /**
   * Evaluate alert condition
   */
  const evaluateCondition = (currentValue, comparison, threshold) => {
    switch (comparison) {
      case '>':
        return currentValue > threshold;
      case '<':
        return currentValue < threshold;
      case '>=':
        return currentValue >= threshold;
      case '<=':
        return currentValue <= threshold;
      default:
        return false;
    }
  };

  /**
   * Trigger alert by calling backend
   */
  const triggerAlert = async (alert, currentValue, deviceId) => {
    try {
      const response = await fetch('http://localhost:5001/process-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          sensorData: {
            ...sensorData,
            [alert.parameter]: currentValue
          },
          deviceId: deviceId,
          alert: alert
        })
      });

      if (response.ok) {
        console.log(`✅ Alert triggered successfully for ${alert.type} to ${alert.value}`);
      } else {
        console.error('Failed to trigger alert:', response.statusText);
      }
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  };

  return {
    alerts,
    triggeredAlerts,
    processAlerts: () => processAlerts(sensorData, alerts, deviceId)
  };
};
