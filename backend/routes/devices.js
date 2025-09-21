const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const { ref, update, get } = require('firebase/database');
const { doc, getDoc, updateDoc, serverTimestamp } = require('firebase/firestore');

// Middleware to verify admin access
const verifyAdmin = async (req, res, next) => {
  try {
    const adminEmail = req.headers['x-admin-email'];
    if (!adminEmail || adminEmail !== 'joelnithushan6@gmail.com') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    req.adminEmail = adminEmail;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

// Middleware to verify user access to device
const verifyDeviceAccess = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User authentication required' });
    }

    // Check if user has access to this device
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userData = userDoc.data();
    const hasAccess = userData.devices && userData.devices.includes(deviceId);
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied to this device' });
    }

    req.userId = userId;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Access verification error' });
  }
};

/**
 * POST /api/devices/:deviceId/relay
 * Control device relay (pump) - instant control
 */
router.post('/:deviceId/relay', verifyDeviceAccess, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { status, mode = 'manual' } = req.body;
    const userId = req.userId;

    if (!status || !['on', 'off'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status must be "on" or "off"' 
      });
    }

    // Get user info for logging
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userEmail = userDoc.exists() ? userDoc.data().email : 'unknown';

    // Update instant relay control path
    const relayStatusRef = ref(admin.database(), `devices/${deviceId}/control/relay/status`);
    await update(relayStatusRef, status);

    // Update main relay control for consistency
    const relayRef = ref(admin.database(), `devices/${deviceId}/control/relay`);
    await update(relayRef, {
      status: status,
      mode: mode,
      lastChangedBy: userEmail,
      timestamp: Date.now()
    });

    // Update sensor data to reflect relay status
    const sensorRef = ref(admin.database(), `devices/${deviceId}/sensors/latest`);
    await update(sensorRef, {
      relayStatus: status,
      timestamp: Date.now()
    });

    console.log(`✅ Relay control: ${status} for device ${deviceId} by user ${userEmail}`);

    res.json({
      success: true,
      message: `Pump turned ${status}`,
      data: {
        deviceId,
        status,
        mode,
        timestamp: Date.now(),
        changedBy: userEmail
      }
    });

  } catch (error) {
    console.error('❌ Error controlling relay:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to control pump',
      details: error.message 
    });
  }
});

/**
 * GET /api/devices/:deviceId/relay
 * Get current relay status
 */
router.get('/:deviceId/relay', verifyDeviceAccess, async (req, res) => {
  try {
    const { deviceId } = req.params;

    const relayRef = ref(admin.database(), `devices/${deviceId}/control/relay`);
    const snapshot = await get(relayRef);

    if (snapshot.exists()) {
      res.json({
        success: true,
        data: snapshot.val()
      });
    } else {
      res.json({
        success: true,
        data: {
          status: 'off',
          mode: 'manual',
          lastChangedBy: null,
          timestamp: null
        }
      });
    }

  } catch (error) {
    console.error('❌ Error getting relay status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get relay status' 
    });
  }
});

/**
 * POST /api/devices/:deviceId/schedules
 * Add irrigation schedule
 */
router.post('/:deviceId/schedules', verifyDeviceAccess, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { name, type, startTime, endTime, days, enabled = true } = req.body;
    const userId = req.userId;

    if (!name || !type || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, type, startTime, endTime' 
      });
    }

    if (type === 'weekly' && (!days || days.length === 0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Weekly schedules require at least one day' 
      });
    }

    const scheduleId = `schedule_${Date.now()}`;
    const scheduleRef = ref(admin.database(), `devices/${deviceId}/schedules/${scheduleId}`);
    
    await update(scheduleRef, {
      id: scheduleId,
      name,
      type,
      startTime,
      endTime,
      days: type === 'weekly' ? days : [],
      enabled,
      createdAt: Date.now(),
      createdBy: userId
    });

    console.log(`✅ Schedule added: ${name} for device ${deviceId}`);

    res.json({
      success: true,
      message: 'Schedule added successfully',
      data: {
        scheduleId,
        name,
        type,
        startTime,
        endTime,
        days,
        enabled
      }
    });

  } catch (error) {
    console.error('❌ Error adding schedule:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add schedule' 
    });
  }
});

/**
 * DELETE /api/devices/:deviceId/schedules/:scheduleId
 * Remove irrigation schedule
 */
router.delete('/:deviceId/schedules/:scheduleId', verifyDeviceAccess, async (req, res) => {
  try {
    const { deviceId, scheduleId } = req.params;

    const scheduleRef = ref(admin.database(), `devices/${deviceId}/schedules/${scheduleId}`);
    await update(scheduleRef, null);

    console.log(`✅ Schedule removed: ${scheduleId} from device ${deviceId}`);

    res.json({
      success: true,
      message: 'Schedule removed successfully'
    });

  } catch (error) {
    console.error('❌ Error removing schedule:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove schedule' 
    });
  }
});

/**
 * GET /api/devices/:deviceId/schedules
 * Get all schedules for device
 */
router.get('/:deviceId/schedules', verifyDeviceAccess, async (req, res) => {
  try {
    const { deviceId } = req.params;

    const schedulesRef = ref(admin.database(), `devices/${deviceId}/schedules`);
    const snapshot = await get(schedulesRef);

    if (snapshot.exists()) {
      const schedules = Object.entries(snapshot.val()).map(([id, schedule]) => ({
        id,
        ...schedule
      }));

      res.json({
        success: true,
        data: schedules
      });
    } else {
      res.json({
        success: true,
        data: []
      });
    }

  } catch (error) {
    console.error('❌ Error getting schedules:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get schedules' 
    });
  }
});

/**
 * GET /api/devices/:deviceId/report
 * Generate device report (CSV format)
 */
router.get('/:deviceId/report', verifyDeviceAccess, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { from, to } = req.query;

    // Parse date range (default to last 7 days)
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get historical data
    const historyRef = ref(admin.database(), `devices/${deviceId}/sensors/history`);
    const snapshot = await get(historyRef);

    if (!snapshot.exists()) {
      return res.status(404).json({ 
        success: false, 
        error: 'No historical data found' 
      });
    }

    const data = snapshot.val();
    const filteredData = Object.entries(data)
      .map(([timestamp, values]) => ({
        timestamp: parseInt(timestamp),
        ...values
      }))
      .filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= fromDate && itemDate <= toDate;
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    // Generate CSV
    const headers = [
      'Timestamp',
      'Date',
      'Time',
      'Soil Moisture Raw',
      'Soil Moisture %',
      'Air Temperature (°C)',
      'Air Humidity (%)',
      'Soil Temperature (°C)',
      'Air Quality Index',
      'CO2 (ppm)',
      'NH3 (ppm)',
      'Light Detected',
      'Rain Level Raw',
      'Relay Status'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.timestamp,
        new Date(item.timestamp).toLocaleDateString(),
        new Date(item.timestamp).toLocaleTimeString(),
        item.soilMoistureRaw || 0,
        item.soilMoisturePct || 0,
        item.airTemperature || 0,
        item.airHumidity || 0,
        item.soilTemperature || 0,
        item.airQualityIndex || 0,
        item.gases?.co2 || 0,
        item.gases?.nh3 || 0,
        item.lightDetected || 0,
        item.rainLevelRaw || 0,
        item.relayStatus || 'off'
      ].join(','))
    ].join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="smartagro-report-${deviceId}-${fromDate.toISOString().split('T')[0]}-to-${toDate.toISOString().split('T')[0]}.csv"`);

    res.send(csvContent);

  } catch (error) {
    console.error('❌ Error generating report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate report' 
    });
  }
});

/**
 * GET /api/devices/:deviceId/status
 * Get device status and metadata
 */
router.get('/:deviceId/status', verifyDeviceAccess, async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Get device metadata
    const metaRef = ref(admin.database(), `devices/${deviceId}/meta`);
    const metaSnapshot = await get(metaRef);

    // Get latest sensor data
    const latestRef = ref(admin.database(), `devices/${deviceId}/sensors/latest`);
    const latestSnapshot = await get(latestRef);

    // Get relay status
    const relayRef = ref(admin.database(), `devices/${deviceId}/control/relay`);
    const relaySnapshot = await get(relayRef);

    const response = {
      success: true,
      data: {
        deviceId,
        meta: metaSnapshot.exists() ? metaSnapshot.val() : null,
        latestData: latestSnapshot.exists() ? latestSnapshot.val() : null,
        relayStatus: relaySnapshot.exists() ? relaySnapshot.val() : null,
        isOnline: false,
        lastSeen: null
      }
    };

    // Calculate online status
    if (metaSnapshot.exists()) {
      const meta = metaSnapshot.val();
      const lastSeen = meta.lastSeen;
      const now = Date.now();
      const timeDiff = now - (typeof lastSeen === 'number' ? lastSeen : lastSeen * 1000);
      response.data.isOnline = timeDiff < 20000; // 20 seconds timeout
      response.data.lastSeen = lastSeen;
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Error getting device status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get device status' 
    });
  }
});

/**
 * POST /api/devices/:deviceId/thresholds
 * Update irrigation thresholds
 */
router.post('/:deviceId/thresholds', verifyDeviceAccess, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { soilMoistureLow, soilMoistureHigh } = req.body;
    const userId = req.userId;

    if (typeof soilMoistureLow !== 'number' || typeof soilMoistureHigh !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'Thresholds must be numbers' 
      });
    }

    if (soilMoistureLow < 0 || soilMoistureLow > 100 || soilMoistureHigh < 0 || soilMoistureHigh > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thresholds must be between 0 and 100' 
      });
    }

    if (soilMoistureLow >= soilMoistureHigh) {
      return res.status(400).json({ 
        success: false, 
        error: 'Low threshold must be less than high threshold' 
      });
    }

    const thresholdsRef = ref(admin.database(), `devices/${deviceId}/control/thresholds`);
    await update(thresholdsRef, {
      soilMoistureLow,
      soilMoistureHigh,
      lastChangedBy: userId,
      timestamp: Date.now()
    });

    console.log(`✅ Thresholds updated for device ${deviceId}: ${soilMoistureLow}% - ${soilMoistureHigh}%`);

    res.json({
      success: true,
      message: 'Thresholds updated successfully',
      data: {
        soilMoistureLow,
        soilMoistureHigh,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('❌ Error updating thresholds:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update thresholds' 
    });
  }
});

module.exports = router;
