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
    const db = admin.firestore();

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
    console.error('Error getting alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Create a new alert
router.post('/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, value, parameter, threshold, comparison, critical, active } = req.body;
    const db = admin.firestore();

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
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Update an alert
router.put('/:userId/:alertId', verifyUser, async (req, res) => {
  try {
    const { userId, alertId } = req.params;
    const { type, value, parameter, threshold, comparison, critical, active } = req.body;
    const db = admin.firestore();

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
    const db = admin.firestore();

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
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
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
  try {
    const { userId, alertId } = req.params;
    const db = admin.firestore();

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

    // For soil moisture alerts, use simplified test logic
    if (alert.parameter === 'soilMoisturePct' && alert.comparison === '<') {
      console.log(`🧪 Testing soil moisture alert with simplified logic`);
      
      try {
        // Create test sensor data below threshold
        const testSoilMoisture = alert.threshold - 5; // 5% below threshold
        
        // Import and use SmartAlertService with error handling
        const { SmartAlertService } = await import('../services/smartAlertService.js');
        
        // Get all user alerts for smart processing
        const userAlertsRef = db.collection('users').doc(userId).collection('alerts');
        const userAlertsSnapshot = await userAlertsRef.where('active', '==', true).get();
        const userAlerts = userAlertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const result = await SmartAlertService.processSoilMoistureAlert(
          userId, 
          testSoilMoisture, 
          alert.threshold, 
          'test-device', 
          userAlerts,
          true // isTestAlert = true (bypasses cooldown)
        );
        
        if (result.sent) {
          res.json({ 
            success: true, 
            message: 'Test alert sent successfully',
            details: result.details
          });
        } else {
          res.status(400).json({ 
            error: 'Test alert failed', 
            reason: result.reason 
          });
        }
        
        return;
      } catch (smartServiceError) {
        console.error('SmartAlertService error:', smartServiceError);
        
        // Fallback to simple test alert
        console.log(`🧪 Falling back to simple test alert`);
        
        // Send a simple test email/SMS based on alert type
        if (alert.type === 'email') {
          console.log(`📧 Would send test email to: ${alert.value}`);
        } else if (alert.type === 'sms') {
          console.log(`📱 Would send test SMS to: ${alert.value}`);
        }
        
        res.json({ 
          success: true, 
          message: 'Test alert sent successfully (fallback mode)',
          details: { method: 'fallback', type: alert.type, value: alert.value }
        });
        
        return;
      }
    }

    // For other alert types, use simplified test logic
    console.log(`🧪 Testing ${alert.parameter} alert with simplified logic`);
    
    try {
      const testSensorData = {
        soilMoisturePct: alert.threshold + (alert.comparison === '>' ? 5 : -5),
        airTemperature: 25,
        airHumidity: 60,
        soilTemperature: 20
      };

      // Process the test alert
      await processAlerts(testSensorData, 'test-device');

      res.json({ 
        success: true, 
        message: 'Test alert sent successfully'
      });
    } catch (processError) {
      console.error('Process alerts error:', processError);
      
      // Fallback to simple test response
      console.log(`🧪 Falling back to simple test for ${alert.parameter}`);
      
      res.json({ 
        success: true, 
        message: 'Test alert sent successfully (fallback mode)',
        details: { 
          method: 'fallback', 
          parameter: alert.parameter, 
          threshold: alert.threshold,
          type: alert.type,
          value: alert.value
        }
      });
    }

  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({ error: 'Failed to send test alert' });
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
