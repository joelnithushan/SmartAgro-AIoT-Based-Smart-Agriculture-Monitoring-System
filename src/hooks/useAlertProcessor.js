import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to process alerts when sensor data changes
 * This hook monitors sensor data and triggers alerts when conditions are met
 */
export const useAlertProcessor = (sensorData, deviceId) => {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);

  // Load user's active alerts
  useEffect(() => {
    if (!currentUser || !deviceId) return;

    const alertsRef = collection(db, 'users', currentUser.uid, 'alerts');
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
  }, [currentUser, deviceId]);

  // Process alerts when sensor data changes
  useEffect(() => {
    if (!sensorData || !alerts.length || !deviceId) return;

    processAlerts(sensorData, alerts, deviceId);
  }, [sensorData, alerts, deviceId]);

  // Load triggered alerts for display
  useEffect(() => {
    if (!currentUser) return;

    const triggeredAlertsRef = collection(db, 'users', currentUser.uid, 'triggeredAlerts');
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
  }, [currentUser]);

  /**
   * Process alerts against current sensor data
   */
  const processAlerts = async (sensorData, alerts, deviceId) => {
    try {
      console.log(`🔍 Processing ${alerts.length} alerts for device ${deviceId}`);
      console.log(`🔍 Current sensor data:`, sensorData);
      
      for (const alert of alerts) {
        console.log(`🔍 Processing alert:`, alert);
        const currentValue = getSensorValue(sensorData, alert.parameter);
        
        if (currentValue === null || currentValue === undefined) {
          console.log(`❌ No value found for parameter: ${alert.parameter}`);
          continue;
        }

        console.log(`🔍 Evaluating condition: ${currentValue} ${alert.comparison} ${alert.threshold}`);
        const conditionMet = evaluateCondition(currentValue, alert.comparison, alert.threshold);
        console.log(`🔍 Condition met:`, conditionMet);
        
        if (conditionMet) {
          console.log(`🚨 Alert condition met: ${alert.parameter} = ${currentValue} ${alert.comparison} ${alert.threshold}`);
          
          // Check if alert was already triggered recently (debounce)
          const debounceKey = `${currentUser.uid}_${alert.id}_${alert.parameter}`;
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
    console.log(`🔍 Getting sensor value for parameter: "${parameter}"`);
    console.log(`🔍 Available sensor data keys:`, Object.keys(sensorData || {}));
    
    // Handle nested gas values
    if (parameter === 'co2' && sensorData.gases && sensorData.gases.co2 !== undefined) {
      console.log(`🔍 Found CO2 in gases:`, sensorData.gases.co2);
      return sensorData.gases.co2;
    }
    if (parameter === 'nh3' && sensorData.gases && sensorData.gases.nh3 !== undefined) {
      console.log(`🔍 Found NH3 in gases:`, sensorData.gases.nh3);
      return sensorData.gases.nh3;
    }
    
    // Handle soil moisture variations
    if (parameter === 'Soil Moisture (%)' || parameter === 'soilMoisture' || parameter === 'soilMoisturePct') {
      const soilMoisture = sensorData.soilMoisturePct || sensorData.soilMoisture || sensorData['Soil Moisture (%)'] || sensorData['soil_moisture'];
      console.log(`🔍 Soil moisture value:`, soilMoisture);
      return soilMoisture;
    }
    
    // Handle air temperature variations
    if (parameter === 'Air Temperature (°C)' || parameter === 'airTemperature' || parameter === 'temperature') {
      const temperature = sensorData.airTemperature || sensorData.temperature || sensorData['Air Temperature (°C)'];
      console.log(`🔍 Air temperature value:`, temperature);
      return temperature;
    }
    
    // Handle air humidity variations
    if (parameter === 'Air Humidity (%)' || parameter === 'airHumidity' || parameter === 'humidity') {
      const humidity = sensorData.airHumidity || sensorData.humidity || sensorData['Air Humidity (%)'];
      console.log(`🔍 Air humidity value:`, humidity);
      return humidity;
    }
    
    // Handle soil temperature variations
    if (parameter === 'Soil Temperature (°C)' || parameter === 'soilTemperature' || parameter === 'soilTemp') {
      const soilTemp = sensorData.soilTemperature || sensorData.soilTemp || sensorData['Soil Temperature (°C)'];
      console.log(`🔍 Soil temperature value:`, soilTemp);
      return soilTemp;
    }
    
    // Handle direct parameters
    const value = sensorData[parameter] !== undefined ? sensorData[parameter] : null;
    console.log(`🔍 Direct parameter "${parameter}" value:`, value);
    return value;
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
      const response = await fetch('http://localhost:5000/process-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
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
