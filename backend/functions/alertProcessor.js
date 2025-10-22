import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { sendEmailAlert } from '../services/emailService.js';
import { sendSMSAlert } from '../services/smsService.js';
import SmartAlertService from '../services/smartAlertService.js';

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore();
const auth = getAuth();

// Debounce system to prevent duplicate alerts within 1 minute
const alertDebounce = new Map();

// Cooldown system to prevent duplicate alerts within 1 hour for same parameter
const alertCooldown = new Map();

/**
 * Process sensor data and check for alert conditions
 * @param {Object} sensorData - The sensor data from ESP32
 * @param {string} deviceId - The device ID
 */
export async function processAlerts(sensorData, deviceId) {
  try {
    console.log(`🔍 Processing alerts for device: ${deviceId}`);
    console.log('Sensor data:', sensorData);

    // Get all users who have access to this device
    const users = await getUsersWithDeviceAccess(deviceId);
    
    if (users.length === 0) {
      console.log(`⚠️ No users found for device ${deviceId}`);
      return;
    }

    console.log(`👥 Found ${users.length} users for device ${deviceId}:`, users);
    
    for (const userId of users) {
      try {
        await checkUserAlerts(userId, sensorData, deviceId);
      } catch (userError) {
        console.error(`❌ Error processing alerts for user ${userId}:`, userError);
        // Continue processing other users even if one fails
      }
    }

    console.log('✅ Alert processing completed');
  } catch (error) {
    console.error('❌ Critical error in alert processing:', error);
    
    // Fallback: Try to save a basic triggered alert even if main processing fails
    try {
      console.log('🔄 Attempting fallback alert processing...');
      await fallbackAlertProcessing(sensorData, deviceId);
    } catch (fallbackError) {
      console.error('❌ Fallback alert processing also failed:', fallbackError);
    }
  }
}

/**
 * Fallback alert processing when main processing fails
 * @param {Object} sensorData - The sensor data
 * @param {string} deviceId - The device ID
 */
async function fallbackAlertProcessing(sensorData, deviceId) {
  try {
    console.log('🔄 Running fallback alert processing...');
    
    // Get all users from the device assignment
    const deviceDoc = await db.collection('devices').doc(deviceId).get();
    if (!deviceDoc.exists) {
      console.log(`❌ Device ${deviceId} not found in database`);
      return;
    }
    
    const deviceData = deviceDoc.data();
    const assignedTo = deviceData.assignedTo;
    
    if (!assignedTo) {
      console.log(`❌ No user assigned to device ${deviceId}`);
      return;
    }
    
    console.log(`🔄 Fallback: Processing alerts for user ${assignedTo}`);
    await checkUserAlerts(assignedTo, sensorData, deviceId);
    
  } catch (error) {
    console.error('❌ Fallback alert processing failed:', error);
  }
}

/**
 * Get all users who have access to a specific device
 * @param {string} deviceId - The device ID
 * @returns {Array<string>} Array of user IDs
 */
async function getUsersWithDeviceAccess(deviceId) {
  try {
    // Get device document to find owner
    const deviceRef = db.collection('devices').doc(deviceId);
    const deviceDoc = await deviceRef.get();
    
    if (!deviceDoc.exists) {
      console.log(`Device ${deviceId} not found`);
      return [];
    }

    const deviceData = deviceDoc.data();
    const users = [deviceData.ownerId]; // Start with owner

    // Get shared users
    if (deviceData.sharedWith) {
      users.push(...deviceData.sharedWith);
    }

    return [...new Set(users)]; // Remove duplicates
  } catch (error) {
    console.error('Error getting users with device access:', error);
    return [];
  }
}

/**
 * Check alerts for a specific user
 * @param {string} userId - The user ID
 * @param {Object} sensorData - The sensor data
 * @param {string} deviceId - The device ID
 */
async function checkUserAlerts(userId, sensorData, deviceId) {
  try {
    // Get all active alerts for this user
    const alertsRef = db.collection('users').doc(userId).collection('alerts');
    const activeAlertsQuery = alertsRef.where('active', '==', true);
    const alertsSnapshot = await activeAlertsQuery.get();

    if (alertsSnapshot.empty) {
      console.log(`No active alerts for user ${userId}`);
      return;
    }

    console.log(`Found ${alertsSnapshot.size} active alerts for user ${userId}`);

    for (const alertDoc of alertsSnapshot.docs) {
      const alert = { id: alertDoc.id, ...alertDoc.data() };
      await checkAlertCondition(alert, sensorData, userId, deviceId);
    }
  } catch (error) {
    console.error(`Error checking alerts for user ${userId}:`, error);
  }
}

/**
 * Check if a specific alert condition is met
 * @param {Object} alert - The alert configuration
 * @param {Object} sensorData - The sensor data
 * @param {string} userId - The user ID
 * @param {string} deviceId - The device ID
 */
async function checkAlertCondition(alert, sensorData, userId, deviceId) {
  try {
    const currentValue = getSensorValue(sensorData, alert.parameter);
    
    console.log(`🔍 Checking alert condition:`, {
      alertId: alert.id,
      parameter: alert.parameter,
      currentValue,
      comparison: alert.comparison,
      threshold: alert.threshold,
      userId,
      deviceId
    });
    
    if (currentValue === null || currentValue === undefined) {
      console.log(`❌ Parameter ${alert.parameter} not found in sensor data`);
      return;
    }

    const conditionMet = evaluateCondition(currentValue, alert.comparison, alert.threshold);
    
    console.log(`📊 Condition evaluation: ${currentValue} ${alert.comparison} ${alert.threshold} = ${conditionMet}`);
    
    if (conditionMet) {
      console.log(`🚨 Alert condition met for ${alert.parameter}: ${currentValue} ${alert.comparison} ${alert.threshold}`);
      
      // Use smart alert service for soil moisture alerts with 1-hour cooldown
      if (alert.parameter === 'soilMoisturePct' && alert.comparison === '<') {
        console.log(`🌱 Using smart alert service for soil moisture alert`);
        
        // Get all user alerts for smart processing
        const userAlertsRef = db.collection('users').doc(userId).collection('alerts');
        const userAlertsSnapshot = await userAlertsRef.where('active', '==', true).get();
        const userAlerts = userAlertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const result = await SmartAlertService.processSoilMoistureAlert(
          userId, 
          currentValue, 
          alert.threshold, 
          deviceId, 
          userAlerts
        );
        
        if (result.sent) {
          console.log(`✅ Smart alert sent successfully`);
        } else {
          console.log(`⏰ Smart alert not sent: ${result.reason}`);
        }
        
        return;
      }
      
      // For other alert types, use debounce and cooldown logic
      const debounceKey = `${userId}_${alert.id}_${alert.parameter}`;
      const cooldownKey = `${userId}_${alert.parameter}`;
      const now = Date.now();
      const lastTriggered = alertDebounce.get(debounceKey);
      const lastCooldown = alertCooldown.get(cooldownKey);
      
      // Check 1 minute debounce
      if (lastTriggered && (now - lastTriggered) < 60000) {
        console.log(`Alert ${alert.id} debounced (triggered ${Math.round((now - lastTriggered) / 1000)}s ago)`);
        return;
      }
      
      // Check 2 hour cooldown for same parameter (enhanced for triggered alerts)
      if (lastCooldown && (now - lastCooldown) < 7200000) { // 2 hours = 7200000ms
        console.log(`Alert ${alert.id} in cooldown (last triggered ${Math.round((now - lastCooldown) / 1000 / 60)} minutes ago)`);
        return;
      }

      // Additional check: Look for recent triggered alerts in Firestore
      const recentTriggered = await checkRecentTriggeredAlerts(userId, alert.id, 7200000); // 2 hours
      if (recentTriggered) {
        console.log(`Alert ${alert.id} has recent triggered alert in Firestore, skipping`);
        return;
      }

      // Update debounce and cooldown
      alertDebounce.set(debounceKey, now);
      alertCooldown.set(cooldownKey, now);

      // Trigger the alert
      await triggerAlert(alert, currentValue, userId, deviceId);
    }
  } catch (error) {
    console.error(`Error checking alert condition for ${alert.id}:`, error);
  }
}

/**
 * Get sensor value for a specific parameter
 * @param {Object} sensorData - The sensor data
 * @param {string} parameter - The parameter name
 * @returns {number|null} The sensor value or null if not found
 */
function getSensorValue(sensorData, parameter) {
  // Handle nested gas values
  if (parameter === 'co2' && sensorData.gases && sensorData.gases.co2 !== undefined) {
    return sensorData.gases.co2;
  }
  if (parameter === 'nh3' && sensorData.gases && sensorData.gases.nh3 !== undefined) {
    return sensorData.gases.nh3;
  }
  
  // Handle soil moisture with raw value conversion
  if (parameter === 'soilMoisturePct') {
    // First try to get the percentage value directly
    if (sensorData.soilMoisturePct !== undefined) {
      return sensorData.soilMoisturePct;
    }
    
    // If percentage not available, try to convert from raw value
    if (sensorData.soilMoistureRaw !== undefined) {
      const rawValue = sensorData.soilMoistureRaw;
      const percentage = convertSoilMoistureRawToPercentage(rawValue);
      console.log(`🔄 Converted soil moisture: Raw ${rawValue} → ${percentage.toFixed(1)}%`);
      return percentage;
    }
  }
  
  // Handle direct parameters
  return sensorData[parameter] !== undefined ? sensorData[parameter] : null;
}

/**
 * Convert soil moisture raw value to percentage
 * @param {number} rawValue - Raw sensor value
 * @returns {number} Percentage value (0-100)
 */
function convertSoilMoistureRawToPercentage(rawValue) {
  // Handle different sensor types and ranges
  if (rawValue >= 0 && rawValue <= 4095) {
    // 12-bit ADC (0-4095) - typical for ESP32
    // Higher raw values = lower moisture (dry soil = high resistance)
    return Math.max(0, Math.min(100, (4095 - rawValue) / 4095 * 100));
  } else if (rawValue >= 0 && rawValue <= 1023) {
    // 10-bit ADC (0-1023) - some sensors
    return Math.max(0, Math.min(100, (1023 - rawValue) / 1023 * 100));
  } else if (rawValue >= 0 && rawValue <= 1024) {
    // Alternative 10-bit range
    return Math.max(0, Math.min(100, (1024 - rawValue) / 1024 * 100));
  } else if (rawValue >= 0 && rawValue <= 255) {
    // 8-bit ADC (0-255)
    return Math.max(0, Math.min(100, (255 - rawValue) / 255 * 100));
  } else {
    // Unknown range - try to normalize to 0-100
    console.warn(`⚠️ Unknown soil moisture raw value range: ${rawValue}`);
    return Math.max(0, Math.min(100, rawValue));
  }
}

/**
 * Evaluate alert condition
 * @param {number} currentValue - Current sensor value
 * @param {string} comparison - Comparison operator
 * @param {number} threshold - Threshold value
 * @returns {boolean} Whether condition is met
 */
function evaluateCondition(currentValue, comparison, threshold) {
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
      console.error(`Unknown comparison operator: ${comparison}`);
      return false;
  }
}

/**
 * Trigger an alert (send notification and log)
 * @param {Object} alert - The alert configuration
 * @param {number} currentValue - Current sensor value
 * @param {string} userId - The user ID
 * @param {string} deviceId - The device ID
 */
async function triggerAlert(alert, currentValue, userId, deviceId, triggeredBy = 'auto') {
  try {
    console.log(`🚨 Triggering alert: ${alert.type} to ${alert.value} (${triggeredBy})`);

    // Create triggered alert record with new structure
    const triggeredAlertId = await createTriggeredAlert(alert, currentValue, userId, deviceId, triggeredBy);
    let sendStatus = { sms: 'pending', email: 'pending' };

    // Try to send notification (but don't fail if this doesn't work)
    let notificationSent = false;
    try {
      if (alert.type === 'email') {
        await sendEmailAlertService(alert, currentValue, deviceId);
        sendStatus.email = 'sent';
        notificationSent = true;
        console.log(`✅ Email notification sent successfully`);
      } else if (alert.type === 'sms') {
        await sendSMSAlertService(alert, currentValue, deviceId);
        sendStatus.sms = 'sent';
        notificationSent = true;
        console.log(`✅ SMS notification sent successfully`);
      }
    } catch (notificationError) {
      console.error(`⚠️ Notification sending failed:`, notificationError);
      if (alert.type === 'email') {
        sendStatus.email = 'failed';
        sendStatus.emailError = notificationError.message;
      } else if (alert.type === 'sms') {
        sendStatus.sms = 'failed';
        sendStatus.smsError = notificationError.message;
      }
    }

    // Update the triggered alert with send status
    try {
      await updateTriggeredAlertStatus(triggeredAlertId, userId, sendStatus);
      console.log(`✅ Updated triggered alert status`);
      } catch (updateError) {
        console.error(`⚠️ Failed to update alert status:`, updateError);
    }

    console.log(`✅ Alert processing completed - Notification: ${notificationSent}`);
  } catch (error) {
    console.error(`❌ Critical error in alert processing:`, error);
  }
}

/**
 * Create a triggered alert record in Firestore
 * @param {Object} alert - The alert configuration
 * @param {number} currentValue - Current sensor value
 * @param {string} userId - User ID
 * @param {string} deviceId - Device ID
 * @param {string} triggeredBy - 'test' or 'auto'
 * @returns {string} The triggered alert document ID
 */
async function createTriggeredAlert(alert, currentValue, userId, deviceId, triggeredBy = 'auto') {
  try {
    console.log(`🔧 Creating triggered alert with data:`, {
      alertId: alert.id,
      userId,
      deviceId: deviceId || 'ESP32_001', // Use fixed device ID if not provided
      triggeredBy,
      currentValue
    });

    const triggeredAlertData = {
      alertId: alert.id,
      sourceAlertId: alert.id,
      parameter: alert.parameter,
      threshold: alert.threshold,
      comparison: alert.comparison,
      actualValue: currentValue,
      triggeredBy: triggeredBy,
      sendStatus: { sms: 'pending', email: 'pending' },
      seen: false,
      createdAt: FieldValue.serverTimestamp(),
      deviceId: deviceId || 'ESP32_001', // Use fixed device ID if not provided
      alertType: alert.type,
      contactValue: alert.value,
      critical: alert.critical || false
    };

    console.log(`🔧 Triggered alert data:`, triggeredAlertData);

    const triggeredAlertRef = await db.collection('triggered_alerts')
      .doc(userId)
      .collection('alerts')
      .add(triggeredAlertData);

    console.log(`📝 Created triggered alert record: ${triggeredAlertRef.id}`);
    return triggeredAlertRef.id;
  } catch (error) {
    console.error('❌ Error creating triggered alert record:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      alertId: alert.id,
      userId,
      deviceId
    });
    throw error;
  }
}

/**
 * Update triggered alert send status
 * @param {string} triggeredAlertId - The triggered alert document ID
 * @param {string} userId - User ID
 * @param {Object} sendStatus - Send status object
 */
async function updateTriggeredAlertStatus(triggeredAlertId, userId, sendStatus) {
  try {
    const triggeredAlertRef = db.collection('triggered_alerts')
      .doc(userId)
      .collection('alerts')
      .doc(triggeredAlertId);

    await triggeredAlertRef.update({
      sendStatus: sendStatus,
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log(`📝 Updated triggered alert status: ${triggeredAlertId}`);
  } catch (error) {
    console.error('Error updating triggered alert status:', error);
  }
}

/**
 * Check for recent triggered alerts to prevent duplicates
 * @param {string} userId - User ID
 * @param {string} alertId - Alert ID
 * @param {number} cooldownMs - Cooldown period in milliseconds
 * @returns {boolean} True if recent triggered alert exists
 */
async function checkRecentTriggeredAlerts(userId, alertId, cooldownMs) {
  try {
    const twoHoursAgo = new Date(Date.now() - cooldownMs);
    
    const triggeredAlertsRef = db.collection('triggered_alerts')
      .doc(userId)
      .collection('alerts');
    
    const recentAlertsQuery = triggeredAlertsRef
      .where('sourceAlertId', '==', alertId)
      .where('createdAt', '>=', twoHoursAgo)
      .limit(1);
    
    const snapshot = await recentAlertsQuery.get();
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking recent triggered alerts:', error);
    return false; // Allow alert if check fails
  }
}

/**
 * Log triggered alert to Firestore (legacy function - keeping for compatibility)
 * @param {Object} alert - The alert configuration
 * @param {number} currentValue - Current sensor value
 * @param {string} userId - The user ID
 * @param {string} deviceId - The device ID
 */
async function logTriggeredAlert(alert, currentValue, userId, deviceId) {
  const triggeredAlertData = {
    alertId: alert.id,
    alertType: getParameterLabel(alert.parameter),
    type: alert.type,
    contactValue: alert.value,
    parameter: alert.parameter,
    comparison: alert.comparison,
    threshold: alert.threshold,
    actualValue: currentValue,
    critical: alert.critical,
    deviceId: deviceId,
    timestamp: new Date(),
    triggeredAt: new Date(),
    triggeredAtSL: new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }),
    status: 'Triggered',
    seen: false,
    notificationSent: false
  };

  let savedToNewCollection = false;
  let savedToOldCollection = false;

  // Try to save to new triggered_alerts collection structure
  try {
    // First, ensure the user document exists in triggered_alerts
    const userDocRef = db.collection('triggered_alerts').doc(userId);
    await userDocRef.set({ 
      userId: userId,
      createdAt: new Date(),
      lastUpdated: new Date()
    }, { merge: true });
    
    // Then add the alert to the alerts subcollection
    await userDocRef.collection('alerts').add(triggeredAlertData);
    savedToNewCollection = true;
    console.log(`✅ Saved to new triggered_alerts collection for user ${userId}`);
  } catch (newCollectionError) {
    console.error('❌ Failed to save to new triggered_alerts collection:', newCollectionError);
  }

  // Try to save to old structure for backward compatibility
  try {
    await db.collection('users').doc(userId).collection('triggeredAlerts').add(triggeredAlertData);
    savedToOldCollection = true;
    console.log(`✅ Saved to old triggeredAlerts collection for user ${userId}`);
  } catch (oldCollectionError) {
    console.error('❌ Failed to save to old triggeredAlerts collection:', oldCollectionError);
  }

  if (!savedToNewCollection && !savedToOldCollection) {
    throw new Error('Failed to save triggered alert to any collection');
  }

  console.log(`📝 Triggered alert logged for user ${userId} - New: ${savedToNewCollection}, Old: ${savedToOldCollection}`);
}

/**
 * Get parameter label for display
 * @param {string} parameter - The parameter name
 * @returns {string} The display label
 */
function getParameterLabel(parameter) {
  const labels = {
    soilMoisturePct: 'Soil Moisture',
    soilTemperature: 'Soil Temperature',
    airTemperature: 'Air Temperature',
    airHumidity: 'Air Humidity',
    airQualityIndex: 'Air Quality Index',
    co2: 'CO2 Level',
    nh3: 'NH3 Level'
  };
  return labels[parameter] || parameter;
}

/**
 * Send email alert using SendGrid service
 * @param {Object} alert - The alert configuration
 * @param {number} currentValue - Current sensor value
 * @param {string} deviceId - The device ID
 */
async function sendEmailAlertService(alert, currentValue, deviceId) {
  try {
    const success = await sendEmailAlert(alert, currentValue, deviceId);
    if (success) {
      console.log(`✅ Email alert sent successfully to ${alert.value}`);
    } else {
      console.log(`❌ Failed to send email alert to ${alert.value}`);
    }
  } catch (error) {
    console.error('Error sending email alert:', error);
  }
}

/**
 * Send SMS alert using Twilio service
 * @param {Object} alert - The alert configuration
 * @param {number} currentValue - Current sensor value
 * @param {string} deviceId - The device ID
 */
async function sendSMSAlertService(alert, currentValue, deviceId) {
  try {
    const success = await sendSMSAlert(alert, currentValue, deviceId);
    if (success) {
      console.log(`✅ SMS alert sent successfully to ${alert.value}`);
    } else {
      console.log(`❌ Failed to send SMS alert to ${alert.value}`);
    }
  } catch (error) {
    console.error('Error sending SMS alert:', error);
  }
}

/**
 * Clean up old triggered alerts (run periodically)
 * @param {number} daysOld - Number of days old to clean up
 */
export async function cleanupOldAlerts(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const triggeredAlertsRef = db.collection('users').doc(userDoc.id).collection('triggeredAlerts');
      const oldAlertsQuery = triggeredAlertsRef.where('triggeredAt', '<', cutoffDate);
      const oldAlertsSnapshot = await oldAlertsQuery.get();
      
      const batch = db.batch();
      oldAlertsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      if (!oldAlertsSnapshot.empty) {
        await batch.commit();
        console.log(`Cleaned up ${oldAlertsSnapshot.size} old alerts for user ${userDoc.id}`);
      }
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('Error cleaning up old alerts:', error);
  }
}

// Export functions for use in other modules
export { createTriggeredAlert, updateTriggeredAlertStatus, checkRecentTriggeredAlerts };
