import express from 'express';
import { admin } from '../config/firebase.js';
import { getDatabase } from 'firebase-admin/database';

const router = express.Router();

// Test endpoint to verify server is working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Irrigation API is working',
    timestamp: new Date().toISOString()
  });
});

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

// Get irrigation status
router.get('/status/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin not initialized');
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }
    
    const db = admin.firestore();
    
    if (!db) {
      console.error('❌ Firestore not available');
      return res.status(500).json({ error: 'Firestore not available' });
    }

    // Get user's irrigation settings
    const irrigationDoc = await db.collection('users').doc(userId).collection('irrigation').doc('settings').get();
    
    if (!irrigationDoc.exists) {
    // Return default settings
    return res.json({
      mode: 'manual', // manual or automatic
      pumpStatus: 'off', // on or off
      soilMoisture: 65,
      schedules: [],
      autoIrrigationEnabled: false,
      autoIrrigationSettings: {
        turnOnThreshold: 10,
        turnOffThreshold: 30
      }
    });
    }

    const settings = irrigationDoc.data();
    
    // Get irrigation schedules
    const schedulesSnapshot = await db.collection('users').doc(userId).collection('irrigation').doc('settings').collection('schedules').get();
    const schedules = schedulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      mode: settings.mode || 'manual',
      pumpStatus: settings.pumpStatus || 'off',
      soilMoisture: settings.soilMoisture || 65,
      schedules: schedules,
      autoIrrigationEnabled: settings.autoIrrigationEnabled || false,
      autoIrrigationSettings: settings.autoIrrigationSettings || {
        turnOnThreshold: 10,
        turnOffThreshold: 30
      }
    });

  } catch (error) {
    console.error('❌ Error getting irrigation status:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to get irrigation status',
      details: error.message 
    });
  }
});

// Update irrigation mode
router.post('/mode/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { mode } = req.body; // 'manual' or 'automatic'
    const db = admin.firestore();

    if (!['manual', 'automatic'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be "manual" or "automatic"' });
    }

    // Update irrigation settings
    await db.collection('users').doc(userId).collection('irrigation').doc('settings').set({
      mode: mode,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true, mode: mode });

  } catch (error) {
    console.error('Error updating irrigation mode:', error);
    res.status(500).json({ error: 'Failed to update irrigation mode' });
  }
});

// Control water pump
router.post('/pump/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, deviceId } = req.body; // 'on' or 'off', and optional deviceId
    const db = admin.firestore();

    if (!['on', 'off'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "on" or "off"' });
    }

    // Update pump status in Firestore
    await db.collection('users').doc(userId).collection('irrigation').doc('settings').set({
      pumpStatus: action,
      pumpUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // If deviceId is provided, also update Firebase Realtime Database for ESP32 control
    if (deviceId) {
      try {
        const realtimeDb = getDatabase();
        const deviceRef = realtimeDb.ref(`devices/${deviceId}/controls/relayCommand`);
        
        // Update relay control for ESP32 (ESP32 expects simple string value)
        await deviceRef.set(action);

        console.log(`✅ Pump control sent to ESP32 device ${deviceId}: ${action}`);
      } catch (realtimeError) {
        console.error('Error updating Firebase Realtime Database:', realtimeError);
        // Don't fail the request if realtime update fails
      }
    }

    // Log the pump action
    await db.collection('users').doc(userId).collection('irrigation').add({
      action: `pump_${action}`,
      deviceId: deviceId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId
    });

    res.json({ success: true, pumpStatus: action });

  } catch (error) {
    console.error('Error controlling water pump:', error);
    res.status(500).json({ error: 'Failed to control water pump' });
  }
});

// Add irrigation schedule
router.post('/schedule/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, startTime, endTime, frequency, enabled = true } = req.body;
    const db = admin.firestore();

    if (!name || !startTime || !endTime || !frequency) {
      return res.status(400).json({ error: 'Missing required fields: name, startTime, endTime, frequency' });
    }

    // Add new schedule
    const scheduleRef = await db.collection('users').doc(userId).collection('irrigation').doc('settings').collection('schedules').add({
      name: name,
      startTime: startTime,
      endTime: endTime,
      frequency: frequency, // 'daily', 'weekly', 'custom'
      enabled: enabled,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      success: true, 
      scheduleId: scheduleRef.id,
      schedule: {
        id: scheduleRef.id,
        name,
        startTime,
        endTime,
        frequency,
        enabled
      }
    });

  } catch (error) {
    console.error('Error adding irrigation schedule:', error);
    res.status(500).json({ error: 'Failed to add irrigation schedule' });
  }
});

// Remove irrigation schedule
router.delete('/schedule/:userId/:scheduleId', verifyUser, async (req, res) => {
  try {
    const { userId, scheduleId } = req.params;
    const db = admin.firestore();

    // Delete the schedule
    await db.collection('users').doc(userId).collection('irrigation').doc('settings').collection('schedules').doc(scheduleId).delete();

    res.json({ success: true, message: 'Schedule deleted successfully' });

  } catch (error) {
    console.error('Error removing irrigation schedule:', error);
    res.status(500).json({ error: 'Failed to remove irrigation schedule' });
  }
});

// Update soil moisture (for testing/simulation)
router.post('/soil-moisture/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { moisture } = req.body;
    const db = admin.firestore();

    if (typeof moisture !== 'number' || moisture < 0 || moisture > 100) {
      return res.status(400).json({ error: 'Invalid moisture value. Must be a number between 0 and 100' });
    }

    // Update soil moisture
    await db.collection('users').doc(userId).collection('irrigation').doc('settings').set({
      soilMoisture: moisture,
      moistureUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true, soilMoisture: moisture });

  } catch (error) {
    console.error('Error updating soil moisture:', error);
    res.status(500).json({ error: 'Failed to update soil moisture' });
  }
});

// Update auto irrigation settings
router.post('/auto-settings/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { enabled, turnOnThreshold, turnOffThreshold } = req.body;
    const db = admin.firestore();

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid enabled value. Must be a boolean' });
    }

    if (typeof turnOnThreshold !== 'number' || turnOnThreshold < 0 || turnOnThreshold > 100) {
      return res.status(400).json({ error: 'Invalid turnOnThreshold. Must be a number between 0 and 100' });
    }

    if (typeof turnOffThreshold !== 'number' || turnOffThreshold < 0 || turnOffThreshold > 100) {
      return res.status(400).json({ error: 'Invalid turnOffThreshold. Must be a number between 0 and 100' });
    }

    // Update auto irrigation settings
    await db.collection('users').doc(userId).collection('irrigation').doc('settings').set({
      autoIrrigationEnabled: enabled,
      autoIrrigationSettings: {
        turnOnThreshold: turnOnThreshold,
        turnOffThreshold: turnOffThreshold
      },
      autoIrrigationUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ 
      success: true, 
      autoIrrigationEnabled: enabled,
      autoIrrigationSettings: {
        turnOnThreshold: turnOnThreshold,
        turnOffThreshold: turnOffThreshold
      }
    });

  } catch (error) {
    console.error('Error updating auto irrigation settings:', error);
    res.status(500).json({ error: 'Failed to update auto irrigation settings' });
  }
});

// Auto irrigation control endpoint (called by ESP32 or scheduled tasks)
router.post('/auto-control/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { soilMoisture, turnOnThreshold, turnOffThreshold } = req.body;

    console.log(`🤖 Auto irrigation request for device ${deviceId}:`, {
      soilMoisture,
      turnOnThreshold,
      turnOffThreshold,
      body: req.body,
      headers: req.headers
    });

    if (soilMoisture === undefined || turnOnThreshold === undefined || turnOffThreshold === undefined) {
      console.error('Missing required fields:', { soilMoisture, turnOnThreshold, turnOffThreshold });
      return res.status(400).json({ 
        error: 'Missing required fields: soilMoisture, turnOnThreshold, turnOffThreshold' 
      });
    }

    const realtimeDb = getDatabase();
    const deviceRef = realtimeDb.ref(`devices/${deviceId}/control/relay/status`);
    
    let pumpAction = null;
    let reason = '';

    // Auto irrigation logic
    if (soilMoisture < turnOnThreshold) {
      pumpAction = 'on';
      reason = `Soil moisture (${soilMoisture}%) below turn-on threshold (${turnOnThreshold}%)`;
    } else if (soilMoisture > turnOffThreshold) {
      pumpAction = 'off';
      reason = `Soil moisture (${soilMoisture}%) above turn-off threshold (${turnOffThreshold}%)`;
    }

    if (pumpAction) {
      try {
        // Update relay control for ESP32
        await deviceRef.set(pumpAction);
        
        // Also update the main relay control for consistency
        const mainRelayRef = realtimeDb.ref(`devices/${deviceId}/control/relay`);
        await mainRelayRef.update({
          status: pumpAction,
          mode: 'automatic',
          lastChangedBy: 'auto-irrigation-system',
          timestamp: Date.now()
        });
        
        console.log(`✅ Auto irrigation: ${pumpAction} - ${reason}`);
      } catch (realtimeError) {
        console.error('Error updating Firebase Realtime Database:', realtimeError);
        return res.status(500).json({ 
          error: 'Failed to update device control',
          details: realtimeError.message 
        });
      }
    } else {
      console.log(`ℹ️ No auto irrigation action needed - moisture within optimal range`);
    }

    res.json({ 
      success: true, 
      action: pumpAction,
      reason: reason || 'No action needed - moisture within optimal range'
    });

  } catch (error) {
    console.error('Error in auto irrigation control:', error);
    res.status(500).json({ 
      error: 'Failed to process auto irrigation control',
      details: error.message 
    });
  }
});

// Get real-time irrigation status from Firebase Realtime Database
router.get('/status/:deviceId/realtime', verifyUser, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const realtimeDb = getDatabase();
    
    const deviceRef = realtimeDb.ref(`devices/${deviceId}`);
    const snapshot = await deviceRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const deviceData = snapshot.val();
    
    res.json({
      success: true,
      deviceId: deviceId,
      irrigation: {
        relayStatus: deviceData.control?.relay?.status || 'off',
        mode: deviceData.control?.relay?.mode || 'manual',
        lastChangedBy: deviceData.control?.relay?.lastChangedBy || null,
        timestamp: deviceData.control?.relay?.timestamp || null
      },
      sensors: deviceData.sensors?.latest || {},
      isOnline: deviceData.status?.online || false
    });

  } catch (error) {
    console.error('Error getting real-time irrigation status:', error);
    res.status(500).json({ error: 'Failed to get real-time status' });
  }
});

export default router;
