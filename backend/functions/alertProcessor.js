import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { sendEmailAlert } from '../services/emailService.js';
import { sendSMSAlert } from '../services/smsService.js';

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore();
const auth = getAuth();

// Debounce system to prevent duplicate alerts within 1 minute
const alertDebounce = new Map();

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
    
    for (const userId of users) {
      await checkUserAlerts(userId, sensorData, deviceId);
    }

    console.log('✅ Alert processing completed');
  } catch (error) {
    console.error('❌ Error processing alerts:', error);
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
    
    if (currentValue === null || currentValue === undefined) {
      console.log(`Parameter ${alert.parameter} not found in sensor data`);
      return;
    }

    const conditionMet = evaluateCondition(currentValue, alert.comparison, alert.threshold);
    
    if (conditionMet) {
      console.log(`🚨 Alert condition met for ${alert.parameter}: ${currentValue} ${alert.comparison} ${alert.threshold}`);
      
      // Check debounce to prevent duplicate alerts
      const debounceKey = `${userId}_${alert.id}_${alert.parameter}`;
      const now = Date.now();
      const lastTriggered = alertDebounce.get(debounceKey);
      
      if (lastTriggered && (now - lastTriggered) < 60000) { // 1 minute debounce
        console.log(`Alert ${alert.id} debounced (triggered ${Math.round((now - lastTriggered) / 1000)}s ago)`);
        return;
      }

      // Update debounce
      alertDebounce.set(debounceKey, now);

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
  
  // Handle direct parameters
  return sensorData[parameter] !== undefined ? sensorData[parameter] : null;
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
async function triggerAlert(alert, currentValue, userId, deviceId) {
  try {
    console.log(`🚨 Triggering alert: ${alert.type} to ${alert.value}`);

    // Log triggered alert to Firestore
    await logTriggeredAlert(alert, currentValue, userId, deviceId);

    // Send notification based on type
    if (alert.type === 'email') {
      await sendEmailAlertService(alert, currentValue, deviceId);
    } else if (alert.type === 'sms') {
      await sendSMSAlertService(alert, currentValue, deviceId);
    }

    console.log(`✅ Alert triggered successfully for ${alert.type} to ${alert.value}`);
  } catch (error) {
    console.error(`Error triggering alert:`, error);
  }
}

/**
 * Log triggered alert to Firestore
 * @param {Object} alert - The alert configuration
 * @param {number} currentValue - Current sensor value
 * @param {string} userId - The user ID
 * @param {string} deviceId - The device ID
 */
async function logTriggeredAlert(alert, currentValue, userId, deviceId) {
  try {
    const triggeredAlertData = {
      alertId: alert.id,
      type: alert.type,
      contactValue: alert.value,
      parameter: alert.parameter,
      comparison: alert.comparison,
      threshold: alert.threshold,
      currentValue: currentValue,
      critical: alert.critical,
      deviceId: deviceId,
      triggeredAt: new Date(),
      triggeredAtSL: new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }),
      status: 'sent'
    };

    await db.collection('users').doc(userId).collection('triggeredAlerts').add(triggeredAlertData);
    console.log(`📝 Logged triggered alert for user ${userId}`);
  } catch (error) {
    console.error('Error logging triggered alert:', error);
  }
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
