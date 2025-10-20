import { getFirestore } from 'firebase-admin/firestore';
import { sendEmailAlert } from './emailService.js';
import { sendSMSAlert } from './smsService.js';

// Get Firestore instance (will be initialized by the main server)
let db;
try {
  db = getFirestore();
} catch (error) {
  console.log('⚠️ Firestore not initialized yet - will be available when server starts');
}

// Cooldown period: 2 hours in milliseconds
const ALERT_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Smart Alert Service with 2-hour cooldown logic
 * Prevents alert spam while ensuring timely notifications
 */
export class SmartAlertService {
  
  /**
   * Process soil moisture alert with cooldown logic
   * @param {string} userId - User ID
   * @param {number} soilMoisture - Current soil moisture value
   * @param {number} threshold - Alert threshold
   * @param {string} deviceId - Device ID
   * @param {Object} userAlerts - User's alert configurations
   * @param {boolean} isTestAlert - Whether this is a test alert (bypasses cooldown)
   */
  static async processSoilMoistureAlert(userId, soilMoisture, threshold, deviceId, userAlerts, isTestAlert = false) {
    try {
      console.log(`🌱 Processing soil moisture alert for user ${userId}: ${soilMoisture}% (threshold: ${threshold}%)`);
      
      // Check if soil moisture is below threshold
      if (soilMoisture >= threshold) {
        console.log(`✅ Soil moisture ${soilMoisture}% is above threshold ${threshold}% - no alert needed`);
        return { sent: false, reason: 'Above threshold' };
      }
      
      // For test alerts, bypass cooldown
      if (isTestAlert) {
        console.log(`🧪 Test alert - bypassing cooldown`);
        return await this.sendAlerts(userId, soilMoisture, threshold, deviceId, userAlerts, 'Test Alert');
      }
      
      // Check cooldown period
      const canSendAlert = await this.checkCooldown(userId, 'soilMoisture');
      
      if (!canSendAlert.allowed) {
        console.log(`⏰ Alert cooldown active - last sent ${canSendAlert.timeRemaining} ago`);
        return { sent: false, reason: 'Cooldown active', timeRemaining: canSendAlert.timeRemaining };
      }
      
      // Send alerts and update cooldown
      const result = await this.sendAlerts(userId, soilMoisture, threshold, deviceId, userAlerts, 'Soil Moisture Alert');
      
      if (result.sent) {
        await this.updateCooldown(userId, 'soilMoisture');
        console.log(`✅ Alerts sent and cooldown updated for user ${userId}`);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error processing soil moisture alert:', error);
      return { sent: false, reason: 'Error', error: error.message };
    }
  }
  
  /**
   * Check if alert can be sent based on cooldown period
   * @param {string} userId - User ID
   * @param {string} alertType - Type of alert (e.g., 'soilMoisture')
   * @returns {Object} - { allowed: boolean, timeRemaining: string }
   */
  static async checkCooldown(userId, alertType) {
    try {
      const alertMetaRef = db.collection('alertsMeta').doc(userId);
      const alertMetaDoc = await alertMetaRef.get();
      
      if (!alertMetaDoc.exists) {
        console.log(`📝 No previous alerts found for user ${userId} - alert allowed`);
        return { allowed: true, timeRemaining: null };
      }
      
      const alertMeta = alertMetaDoc.data();
      const lastSentKey = `${alertType}LastSent`;
      const lastSent = alertMeta[lastSentKey];
      
      if (!lastSent) {
        console.log(`📝 No previous ${alertType} alerts found - alert allowed`);
        return { allowed: true, timeRemaining: null };
      }
      
      const now = Date.now();
      const timeSinceLastAlert = now - lastSent;
      
      if (timeSinceLastAlert >= ALERT_COOLDOWN_MS) {
        console.log(`✅ Cooldown period expired - alert allowed`);
        return { allowed: true, timeRemaining: null };
      }
      
      const timeRemaining = ALERT_COOLDOWN_MS - timeSinceLastAlert;
      const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
      
      console.log(`⏰ Cooldown active - ${hoursRemaining} hours remaining`);
      return { 
        allowed: false, 
        timeRemaining: `${hoursRemaining} hours`
      };
      
    } catch (error) {
      console.error('❌ Error checking cooldown:', error);
      // On error, allow alert to be sent
      return { allowed: true, timeRemaining: null };
    }
  }
  
  /**
   * Update cooldown timestamp for alert type
   * @param {string} userId - User ID
   * @param {string} alertType - Type of alert
   */
  static async updateCooldown(userId, alertType) {
    try {
      const alertMetaRef = db.collection('alertsMeta').doc(userId);
      const updateData = {
        [`${alertType}LastSent`]: Date.now(),
        [`${alertType}LastSentFormatted`]: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      await alertMetaRef.set(updateData, { merge: true });
      console.log(`📝 Updated cooldown for ${alertType} alert for user ${userId}`);
      
    } catch (error) {
      console.error('❌ Error updating cooldown:', error);
    }
  }
  
  /**
   * Send alerts (SMS and Email) to user
   * @param {string} userId - User ID
   * @param {number} soilMoisture - Current soil moisture value
   * @param {number} threshold - Alert threshold
   * @param {string} deviceId - Device ID
   * @param {Array} userAlerts - User's alert configurations
   * @param {string} alertTitle - Title for the alert
   * @returns {Object} - { sent: boolean, details: Object }
   */
  static async sendAlerts(userId, soilMoisture, threshold, deviceId, userAlerts, alertTitle) {
    try {
      console.log(`📤 Sending alerts for user ${userId}`);
      
      const results = {
        sms: { sent: false, count: 0 },
        email: { sent: false, count: 0 }
      };
      
      // Filter active alerts for soil moisture
      const soilMoistureAlerts = userAlerts.filter(alert => 
        alert.active && 
        alert.parameter === 'soilMoisturePct' && 
        alert.comparison === '<' && 
        alert.threshold === threshold
      );
      
      if (soilMoistureAlerts.length === 0) {
        console.log(`⚠️ No active soil moisture alerts found for user ${userId}`);
        return { sent: false, reason: 'No active alerts' };
      }
      
      // Send SMS alerts
      const smsAlerts = soilMoistureAlerts.filter(alert => alert.type === 'sms');
      for (const alert of smsAlerts) {
        try {
          const success = await sendSMSAlert(alert, soilMoisture, deviceId);
          if (success) {
            results.sms.sent = true;
            results.sms.count++;
            console.log(`✅ SMS alert sent to ${alert.value}`);
          }
        } catch (error) {
          console.error(`❌ Error sending SMS to ${alert.value}:`, error);
        }
      }
      
      // Send Email alerts
      const emailAlerts = soilMoistureAlerts.filter(alert => alert.type === 'email');
      for (const alert of emailAlerts) {
        try {
          const success = await sendEmailAlert(alert, soilMoisture, deviceId);
          if (success) {
            results.email.sent = true;
            results.email.count++;
            console.log(`✅ Email alert sent to ${alert.value}`);
          }
        } catch (error) {
          console.error(`❌ Error sending email to ${alert.value}:`, error);
        }
      }
      
      const totalSent = results.sms.count + results.email.count;
      console.log(`📊 Alert summary: ${totalSent} alerts sent (${results.sms.count} SMS, ${results.email.count} Email)`);
      
      return {
        sent: totalSent > 0,
        details: results,
        totalSent: totalSent
      };
      
    } catch (error) {
      console.error('❌ Error sending alerts:', error);
      return { sent: false, reason: 'Error', error: error.message };
    }
  }
  
  /**
   * Get alert cooldown status for user
   * @param {string} userId - User ID
   * @returns {Object} - Cooldown status for all alert types
   */
  static async getCooldownStatus(userId) {
    try {
      const alertMetaRef = db.collection('alertsMeta').doc(userId);
      const alertMetaDoc = await alertMetaRef.get();
      
      if (!alertMetaDoc.exists) {
        return { soilMoisture: { allowed: true, timeRemaining: null } };
      }
      
      const alertMeta = alertMetaDoc.data();
      const now = Date.now();
      
      const status = {};
      const alertTypes = ['soilMoisture'];
      
      for (const alertType of alertTypes) {
        const lastSentKey = `${alertType}LastSent`;
        const lastSent = alertMeta[lastSentKey];
        
        if (!lastSent) {
          status[alertType] = { allowed: true, timeRemaining: null };
          continue;
        }
        
        const timeSinceLastAlert = now - lastSent;
        
        if (timeSinceLastAlert >= ALERT_COOLDOWN_MS) {
          status[alertType] = { allowed: true, timeRemaining: null };
        } else {
          const timeRemaining = ALERT_COOLDOWN_MS - timeSinceLastAlert;
          const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
          status[alertType] = { 
            allowed: false, 
            timeRemaining: `${hoursRemaining} hours`
          };
        }
      }
      
      return status;
      
    } catch (error) {
      console.error('❌ Error getting cooldown status:', error);
      return { soilMoisture: { allowed: true, timeRemaining: null } };
    }
  }
  
  /**
   * Reset cooldown for testing purposes
   * @param {string} userId - User ID
   * @param {string} alertType - Type of alert to reset
   */
  static async resetCooldown(userId, alertType = 'soilMoisture') {
    try {
      const alertMetaRef = db.collection('alertsMeta').doc(userId);
      const updateData = {
        [`${alertType}LastSent`]: null,
        [`${alertType}LastSentFormatted`]: null,
        lastUpdated: new Date().toISOString()
      };
      
      await alertMetaRef.set(updateData, { merge: true });
      console.log(`🔄 Cooldown reset for ${alertType} alert for user ${userId}`);
      
    } catch (error) {
      console.error('❌ Error resetting cooldown:', error);
    }
  }
}

export default SmartAlertService;
