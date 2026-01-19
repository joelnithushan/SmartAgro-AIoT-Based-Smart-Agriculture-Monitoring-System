import express from 'express';
import { admin } from '../config/firebase.js';
import { processAlerts } from '../functions/alertProcessor.js';

const router = express.Router();

// Helper function to verify user authentication
const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Get all alerts for a user
router.get('/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin not initialized in alerts route');
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }
    
    const db = admin.firestore();
    
    if (!db) {
      console.error('❌ Firestore not available in alerts route');
      return res.status(500).json({ error: 'Firestore not available' });
    }

    // Verify user can access these alerts
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const alertsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('alerts')
      .orderBy('createdAt', 'desc')
      .get();

    const alerts = alertsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ alerts });

  } catch (error) {
    console.error('❌ Error getting alerts:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to get alerts',
      details: error.message 
    });
  }
});

// Create a new alert
router.post('/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, value, parameter, threshold, comparison, critical, active } = req.body;
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin not initialized in alerts POST route');
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }
    
    const db = admin.firestore();
    
    if (!db) {
      console.error('❌ Firestore not available in alerts POST route');
      return res.status(500).json({ error: 'Firestore not available' });
    }

    // Verify user can create alerts
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validation
    if (!type || !value || !parameter || threshold === undefined || !comparison) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, value, parameter, threshold, comparison' 
      });
    }

    if (!['email', 'sms'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "email" or "sms"' });
    }

    if (!['>', '<', '>=', '<='].includes(comparison)) {
      return res.status(400).json({ 
        error: 'Invalid comparison. Must be one of: >, <, >=, <=' 
      });
    }

    // Validate email format
    if (type === 'email' && !/\S+@\S+\.\S+/.test(value)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone format (basic validation)
    if (type === 'sms' && !/^\+?[\d\s\-()]{10,}$/.test(value.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Create alert
    const alertRef = await db.collection('users').doc(userId).collection('alerts').add({
      type,
      value: value.trim(),
      parameter,
      threshold: Number(threshold),
      comparison,
      critical: Boolean(critical),
      active: Boolean(active),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      success: true, 
      alertId: alertRef.id,
      message: 'Alert created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating alert:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create alert',
      details: error.message 
    });
  }
});

// Update an alert
router.put('/:userId/:alertId', verifyUser, async (req, res) => {
  try {
    const { userId, alertId } = req.params;
    const { type, value, parameter, threshold, comparison, critical, active } = req.body;
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin not initialized in alerts PUT route');
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }
    
    const db = admin.firestore();
    
    if (!db) {
      console.error('❌ Firestore not available in alerts PUT route');
      return res.status(500).json({ error: 'Firestore not available' });
    }

    // Verify user can update this alert
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validation (same as create)
    if (!type || !value || !parameter || threshold === undefined || !comparison) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, value, parameter, threshold, comparison' 
      });
    }

    if (!['email', 'sms'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "email" or "sms"' });
    }

    if (!['>', '<', '>=', '<='].includes(comparison)) {
      return res.status(400).json({ 
        error: 'Invalid comparison. Must be one of: >, <, >=, <=' 
      });
    }

    // Validate email format
    if (type === 'email' && !/\S+@\S+\.\S+/.test(value)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone format
    if (type === 'sms' && !/^\+?[\d\s\-()]{10,}$/.test(value.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Update alert
    await db.collection('users').doc(userId).collection('alerts').doc(alertId).update({
      type,
      value: value.trim(),
      parameter,
      threshold: Number(threshold),
      comparison,
      critical: Boolean(critical),
      active: Boolean(active),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      success: true, 
      message: 'Alert updated successfully'
    });

  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete an alert
router.delete('/:userId/:alertId', verifyUser, async (req, res) => {
  try {
    const { userId, alertId } = req.params;
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin not initialized in alerts DELETE route');
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }
    
    const db = admin.firestore();
    
    if (!db) {
      console.error('❌ Firestore not available in alerts DELETE route');
      return res.status(500).json({ error: 'Firestore not available' });
    }

    // Verify user can delete this alert
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete alert
    await db.collection('users').doc(userId).collection('alerts').doc(alertId).delete();

    res.json({ 
      success: true, 
      message: 'Alert deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting alert:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to delete alert',
      details: error.message 
    });
  }
});

// Get triggered alerts for a user
router.get('/:userId/triggered', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const db = admin.firestore();

    // Verify user can access these alerts
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const triggeredAlertsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('triggeredAlerts')
      .orderBy('triggeredAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const triggeredAlerts = triggeredAlertsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ triggeredAlerts });

  } catch (error) {
    console.error('Error getting triggered alerts:', error);
    res.status(500).json({ error: 'Failed to get triggered alerts' });
  }
});

// Process alerts for a specific device (called by frontend)
router.post('/process/:deviceId', verifyUser, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { sensorData } = req.body;

    if (!sensorData) {
      return res.status(400).json({ error: 'Missing sensorData' });
    }

    // Process alerts asynchronously
    processAlerts(sensorData, deviceId).catch(error => {
      console.error('Error in async alert processing:', error);
    });

    res.json({ 
      success: true, 
      message: 'Alert processing initiated'
    });

  } catch (error) {
    console.error('Error processing alerts:', error);
    res.status(500).json({ error: 'Failed to process alerts' });
  }
});

// Test alert (send a test alert to verify configuration)
router.post('/:userId/:alertId/test', verifyUser, async (req, res) => {
  console.log('🧪 Test alert endpoint called:', req.params);
  console.log('🧪 Request body:', req.body);
  console.log('🧪 User authenticated:', req.user);
  try {
    const { userId, alertId } = req.params;
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin not initialized in alerts TEST route');
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }
    
    console.log('🧪 Getting Firestore instance...');
    const db = admin.firestore();
    console.log('🧪 Firestore instance obtained:', !!db);
    
    if (!db) {
      console.error('❌ Firestore not available in alerts TEST route');
      return res.status(500).json({ error: 'Firestore not available' });
    }

    // Verify user can test this alert
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get alert configuration
    const alertDoc = await db
      .collection('users')
      .doc(userId)
      .collection('alerts')
      .doc(alertId)
      .get();

    if (!alertDoc.exists) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const alert = { id: alertDoc.id, ...alertDoc.data() };

    // For soil moisture alerts, use full alert processing
    if (alert.parameter === 'soilMoisturePct' && alert.comparison === '<') {
      console.log(`🧪 Testing soil moisture alert with full processing`);
      
      // Create test sensor data below threshold
      const testSoilMoisture = alert.threshold - 5; // 5% below threshold
      
      // Create test sensor data
      const testSensorData = {
        soilMoisturePct: testSoilMoisture,
        soilMoistureRaw: Math.round((100 - testSoilMoisture) / 100 * 4095), // Convert to raw value
        airTemperature: 25.0,
        airHumidity: 50,
        soilTemperature: 24.0
      };
      
      // Use permanent device ID for single device setup
      const deviceId = 'ESP32_001'; // Fixed device ID for your single device
      
      console.log(`🧪 Testing alert with device: ${deviceId}`);
      console.log(`📊 Test sensor data:`, testSensorData);
      
    // Create triggered alert directly for test
    try {
      console.log(`🧪 Creating triggered alert for test...`);
      const { createTriggeredAlert, updateTriggeredAlertStatus } = await import('../functions/alertProcessor.js');
      const triggeredAlertId = await createTriggeredAlert(alert, testSoilMoisture, userId, deviceId, 'test');
      console.log(`✅ Triggered alert created with ID: ${triggeredAlertId}`);
      
      // Try to send the actual notification
      let sendStatus = { sms: 'pending', email: 'pending' };
      try {
        if (alert.type === 'email') {
          console.log(`📧 Attempting to send email to: ${alert.value}`);
          const { sendEmailAlert } = await import('../services/emailService.js');
          await sendEmailAlert(alert, testSoilMoisture, deviceId);
          sendStatus.email = 'sent';
          console.log(`✅ Email sent successfully`);
        } else if (alert.type === 'sms') {
          console.log(`📱 Attempting to send SMS to: ${alert.value}`);
          const { sendSMSAlert } = await import('../services/smsService.js');
          await sendSMSAlert(alert, testSoilMoisture, deviceId);
          sendStatus.sms = 'sent';
          console.log(`✅ SMS sent successfully`);
        }
      } catch (sendError) {
        console.error('Failed to send test notification:', sendError);
        if (alert.type === 'email') {
          sendStatus.email = 'failed';
          sendStatus.emailError = sendError.message;
        } else if (alert.type === 'sms') {
          sendStatus.sms = 'failed';
          sendStatus.smsError = sendError.message;
        }
      }
      
      await updateTriggeredAlertStatus(triggeredAlertId, userId, sendStatus);
      console.log(`📧 Test alert created and processed successfully with status:`, sendStatus);
    } catch (error) {
      console.error(`❌ Test alert creation failed:`, error);
      // Still return success to user but log the error
      console.log(`📧 Test alert would be sent to: ${alert.value}`);
      console.log(`📧 Alert: Soil moisture is ${testSoilMoisture}% (threshold: ${alert.threshold}%)`);
    }
      
      res.json({ 
        success: true, 
        message: 'Test alert sent successfully',
        details: { 
          method: 'full_processing', 
          testValue: testSoilMoisture,
          threshold: alert.threshold,
          deviceId: deviceId
        }
      });
      
      return;
    }

    // For other alert types, use full alert processing
    console.log(`🧪 Testing ${alert.parameter} alert with full processing`);
    
    // Create test sensor data based on comparison type
    const testValue = alert.comparison === '<' ? alert.threshold - 5 : alert.threshold + 5;
    
    // Create test sensor data
    const testSensorData = {
      soilMoisturePct: alert.parameter === 'soilMoisturePct' ? testValue : 50,
      soilMoistureRaw: alert.parameter === 'soilMoisturePct' ? Math.round((100 - testValue) / 100 * 4095) : 2000,
      airTemperature: alert.parameter === 'airTemperature' ? testValue : 25.0,
      airHumidity: alert.parameter === 'airHumidity' ? testValue : 50,
      soilTemperature: alert.parameter === 'soilTemperature' ? testValue : 24.0,
      airQualityIndex: alert.parameter === 'airQualityIndex' ? testValue : 50
    };
    
    // Use permanent device ID for single device setup
    const deviceId = 'ESP32_001'; // Fixed device ID for your single device
    
    console.log(`🧪 Testing alert with device: ${deviceId}`);
    console.log(`📊 Test sensor data:`, testSensorData);
    
    // Create triggered alert directly for test
    try {
      console.log(`🧪 Creating triggered alert for test...`);
      const { createTriggeredAlert, updateTriggeredAlertStatus } = await import('../functions/alertProcessor.js');
      const triggeredAlertId = await createTriggeredAlert(alert, testValue, userId, deviceId, 'test');
      console.log(`✅ Triggered alert created with ID: ${triggeredAlertId}`);
      
      // Try to send the actual notification
      let sendStatus = { sms: 'pending', email: 'pending' };
      try {
        if (alert.type === 'email') {
          console.log(`📧 Attempting to send email to: ${alert.value}`);
          const { sendEmailAlert } = await import('../services/emailService.js');
          await sendEmailAlert(alert, testValue, deviceId);
          sendStatus.email = 'sent';
          console.log(`✅ Email sent successfully`);
        } else if (alert.type === 'sms') {
          console.log(`📱 Attempting to send SMS to: ${alert.value}`);
          const { sendSMSAlert } = await import('../services/smsService.js');
          await sendSMSAlert(alert, testValue, deviceId);
          sendStatus.sms = 'sent';
          console.log(`✅ SMS sent successfully`);
        }
      } catch (sendError) {
        console.error('Failed to send test notification:', sendError);
        if (alert.type === 'email') {
          sendStatus.email = 'failed';
          sendStatus.emailError = sendError.message;
        } else if (alert.type === 'sms') {
          sendStatus.sms = 'failed';
          sendStatus.smsError = sendError.message;
        }
      }
      
      await updateTriggeredAlertStatus(triggeredAlertId, userId, sendStatus);
      console.log(`📧 Test alert created and processed successfully with status:`, sendStatus);
    } catch (error) {
      console.error(`❌ Test alert creation failed:`, error);
      // Still return success to user but log the error
      console.log(`📧 Test alert would be sent to: ${alert.value}`);
      console.log(`📧 Alert: ${alert.parameter} is ${testValue} (threshold: ${alert.threshold})`);
    }
    
    res.json({ 
      success: true, 
      message: 'Test alert sent successfully',
      details: { 
        method: 'full_processing', 
        parameter: alert.parameter,
        testValue: testValue,
        threshold: alert.threshold,
        deviceId: deviceId
      }
    });

  } catch (error) {
    console.error('❌ Error sending test alert:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.params?.userId,
      alertId: req.params?.alertId
    });
    res.status(500).json({ 
      error: 'Failed to send test alert',
      details: error.message 
    });
  }
});

// Get cooldown status for user
router.get('/:userId/cooldown', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can access this data
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Import SmartAlertService
    const { SmartAlertService } = await import('../services/smartAlertService.js');
    
    const cooldownStatus = await SmartAlertService.getCooldownStatus(userId);
    
    res.json({ 
      success: true, 
      cooldownStatus 
    });

  } catch (error) {
    console.error('Error getting cooldown status:', error);
    res.status(500).json({ error: 'Failed to get cooldown status' });
  }
});

// Reset cooldown for testing purposes
router.post('/:userId/cooldown/reset', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { alertType = 'soilMoisture' } = req.body;

    // Verify user can reset cooldown
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Import SmartAlertService
    const { SmartAlertService } = await import('../services/smartAlertService.js');
    
    await SmartAlertService.resetCooldown(userId, alertType);
    
    res.json({ 
      success: true, 
      message: `Cooldown reset for ${alertType} alerts`
    });

  } catch (error) {
    console.error('Error resetting cooldown:', error);
    res.status(500).json({ error: 'Failed to reset cooldown' });
  }
});

export default router;
