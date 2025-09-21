const express = require('express');
const { db, admin } = require('../config/firebase');
const { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, writeBatch, serverTimestamp } = require('firebase/firestore');
const { ref, update } = require('firebase/database');
const router = express.Router();

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Middleware to verify device ownership
const verifyDeviceOwnership = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const userId = req.uid;

    // Check if user is admin
    const userDoc = await getDoc(doc(db, 'users', userId));
    const isAdmin = userDoc.exists() && userDoc.data().roles?.admin === true;

    if (isAdmin) {
      req.isAdmin = true;
      return next();
    }

    // Check device ownership in Firestore
    const deviceDoc = await getDoc(doc(db, 'devices', deviceId));
    if (!deviceDoc.exists()) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    const deviceData = deviceDoc.data();
    if (deviceData.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not the owner of this device' });
    }

    req.deviceData = deviceData;
    next();
  } catch (error) {
    console.error('Device ownership verification error:', error);
    return res.status(500).json({ success: false, error: 'Failed to verify device ownership' });
  }
};

// Apply token verification to all routes
router.use(verifyToken);

/**
 * POST /api/devices/:deviceId/share
 * Share device with another user by email
 */
router.post('/:deviceId/share', verifyDeviceOwnership, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { email } = req.body;
    const ownerId = req.uid;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required and must be a string'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Get target user by email using Firebase Admin
    let targetUser;
    try {
      targetUser = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          error: 'User with this email not found'
        });
      }
      throw error;
    }

    const targetUid = targetUser.uid;

    // Prevent sharing with yourself
    if (targetUid === ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot share device with yourself'
      });
    }

    // Get current device data
    const deviceRef = doc(db, 'devices', deviceId);
    const deviceDoc = await getDoc(deviceRef);
    const deviceData = deviceDoc.data();

    // Check if already shared with this user
    if (deviceData.sharedWith && deviceData.sharedWith[targetUid]) {
      return res.status(400).json({
        success: false,
        error: 'Device is already shared with this user'
      });
    }

    // Use batch write for atomic operations
    const batch = writeBatch(db);

    // Update device metadata to include shared user
    const updatedSharedWith = {
      ...(deviceData.sharedWith || {}),
      [targetUid]: true
    };

    batch.update(deviceRef, {
      sharedWith: updatedSharedWith,
      updatedAt: serverTimestamp()
    });

    // Add device to target user's shared devices
    const targetUserRef = doc(db, 'users', targetUid);
    const targetUserDoc = await getDoc(targetUserRef);
    
    if (targetUserDoc.exists()) {
      const targetUserData = targetUserDoc.data();
      const updatedSharedDevices = {
        ...(targetUserData.sharedDevices || {}),
        [deviceId]: true
      };
      
      batch.update(targetUserRef, {
        sharedDevices: updatedSharedDevices,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create user document if it doesn't exist
      batch.set(targetUserRef, {
        email: email,
        displayName: targetUser.displayName || '',
        createdAt: serverTimestamp(),
        sharedDevices: { [deviceId]: true },
        devices: []
      });
    }

    // Create notification for target user
    const notificationId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notificationRef = doc(db, 'notifications', targetUid, 'items', notificationId);
    
    // Get owner's name for notification
    const ownerDoc = await getDoc(doc(db, 'users', ownerId));
    const ownerName = ownerDoc.exists() ? 
      (ownerDoc.data().displayName || ownerDoc.data().email || 'Someone') : 
      'Someone';

    batch.set(notificationRef, {
      id: notificationId,
      title: 'Device Shared With You',
      message: `${ownerName} has shared device ${deviceId} with you. You can now view its real-time data.`,
      type: 'device_share',
      deviceId: deviceId,
      ownerId: ownerId,
      ownerName: ownerName,
      createdAt: serverTimestamp(),
      read: false
    });

    // Commit all changes atomically
    await batch.commit();

    console.log(`Device ${deviceId} shared with user ${targetUid} (${email})`);

    res.json({
      success: true,
      message: 'Device shared successfully',
      sharedWith: {
        uid: targetUid,
        email: email,
        displayName: targetUser.displayName || ''
      }
    });

  } catch (error) {
    console.error('Error sharing device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share device'
    });
  }
});

/**
 * POST /api/devices/:deviceId/unshare
 * Remove sharing access for a user
 */
router.post('/:deviceId/unshare', verifyDeviceOwnership, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { targetUid } = req.body;

    if (!targetUid || typeof targetUid !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'targetUid is required and must be a string'
      });
    }

    // Get current device data
    const deviceRef = doc(db, 'devices', deviceId);
    const deviceDoc = await getDoc(deviceRef);
    const deviceData = deviceDoc.data();

    // Check if device is actually shared with this user
    if (!deviceData.sharedWith || !deviceData.sharedWith[targetUid]) {
      return res.status(400).json({
        success: false,
        error: 'Device is not shared with this user'
      });
    }

    // Use batch write for atomic operations
    const batch = writeBatch(db);

    // Remove user from device's sharedWith
    const updatedSharedWith = { ...deviceData.sharedWith };
    delete updatedSharedWith[targetUid];

    batch.update(deviceRef, {
      sharedWith: updatedSharedWith,
      updatedAt: serverTimestamp()
    });

    // Remove device from target user's shared devices
    const targetUserRef = doc(db, 'users', targetUid);
    const targetUserDoc = await getDoc(targetUserRef);
    
    if (targetUserDoc.exists()) {
      const targetUserData = targetUserDoc.data();
      const updatedSharedDevices = { ...(targetUserData.sharedDevices || {}) };
      delete updatedSharedDevices[deviceId];
      
      batch.update(targetUserRef, {
        sharedDevices: updatedSharedDevices,
        updatedAt: serverTimestamp()
      });
    }

    // Create notification for target user about access revocation
    const notificationId = `unshare_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notificationRef = doc(db, 'notifications', targetUid, 'items', notificationId);
    
    // Get owner's name for notification
    const ownerDoc = await getDoc(doc(db, 'users', req.uid));
    const ownerName = ownerDoc.exists() ? 
      (ownerDoc.data().displayName || ownerDoc.data().email || 'Device owner') : 
      'Device owner';

    batch.set(notificationRef, {
      id: notificationId,
      title: 'Device Access Revoked',
      message: `${ownerName} has revoked your access to device ${deviceId}.`,
      type: 'device_unshare',
      deviceId: deviceId,
      ownerId: req.uid,
      ownerName: ownerName,
      createdAt: serverTimestamp(),
      read: false
    });

    // Commit all changes atomically
    await batch.commit();

    console.log(`Device ${deviceId} unshared from user ${targetUid}`);

    res.json({
      success: true,
      message: 'Device access revoked successfully'
    });

  } catch (error) {
    console.error('Error unsharing device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke device access'
    });
  }
});

/**
 * GET /api/users/:uid/accessible-devices
 * Get list of devices accessible to a user (owned + shared)
 */
router.get('/users/:uid/accessible-devices', async (req, res) => {
  try {
    const { uid } = req.params;
    const requesterId = req.uid;

    // Check if requester is the same user or admin
    const userDoc = await getDoc(doc(db, 'users', requesterId));
    const isAdmin = userDoc.exists() && userDoc.data().roles?.admin === true;

    if (requesterId !== uid && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Can only access your own devices'
      });
    }

    const targetUserRef = doc(db, 'users', uid);
    const targetUserDoc = await getDoc(targetUserRef);

    if (!targetUserDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = targetUserDoc.data();
    const ownedDevices = userData.devices || {};
    const sharedDevices = userData.sharedDevices || {};

    // Get device details for owned devices
    const ownedDevicePromises = Object.keys(ownedDevices).map(async (deviceId) => {
      const deviceDoc = await getDoc(doc(db, 'devices', deviceId));
      if (deviceDoc.exists()) {
        return {
          deviceId,
          ...deviceDoc.data(),
          accessType: 'owner'
        };
      }
      return null;
    });

    // Get device details for shared devices
    const sharedDevicePromises = Object.keys(sharedDevices).map(async (deviceId) => {
      const deviceDoc = await getDoc(doc(db, 'devices', deviceId));
      if (deviceDoc.exists()) {
        const deviceData = deviceDoc.data();
        // Verify device is still shared with this user
        if (deviceData.sharedWith && deviceData.sharedWith[uid]) {
          // Get owner info
          const ownerDoc = await getDoc(doc(db, 'users', deviceData.userId));
          const ownerName = ownerDoc.exists() ? 
            (ownerDoc.data().displayName || ownerDoc.data().email || 'Unknown') : 
            'Unknown';

          return {
            deviceId,
            ...deviceData,
            accessType: 'shared',
            ownerName: ownerName
          };
        }
      }
      return null;
    });

    const [ownedResults, sharedResults] = await Promise.all([
      Promise.all(ownedDevicePromises),
      Promise.all(sharedDevicePromises)
    ]);

    // Filter out null results and combine
    const accessibleDevices = [
      ...ownedResults.filter(device => device !== null),
      ...sharedResults.filter(device => device !== null)
    ];

    res.json({
      success: true,
      devices: accessibleDevices
    });

  } catch (error) {
    console.error('Error getting accessible devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get accessible devices'
    });
  }
});

/**
 * GET /api/devices/:deviceId/shared-with
 * Get list of users a device is shared with (owner only)
 */
router.get('/:deviceId/shared-with', verifyDeviceOwnership, async (req, res) => {
  try {
    const { deviceId } = req.params;

    const deviceDoc = await getDoc(doc(db, 'devices', deviceId));
    const deviceData = deviceDoc.data();
    const sharedWith = deviceData.sharedWith || {};

    // Get user details for each shared user
    const sharedUserPromises = Object.keys(sharedWith).map(async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        const firebaseUser = await admin.auth().getUser(uid);
        
        return {
          uid,
          email: firebaseUser.email,
          displayName: userDoc.exists() ? 
            (userDoc.data().displayName || firebaseUser.displayName || '') : 
            (firebaseUser.displayName || ''),
          sharedAt: deviceData.updatedAt || deviceData.createdAt
        };
      } catch (error) {
        console.error(`Error getting user ${uid}:`, error);
        return {
          uid,
          email: 'Unknown',
          displayName: 'Unknown User',
          error: 'Could not fetch user details'
        };
      }
    });

    const sharedUsers = await Promise.all(sharedUserPromises);

    res.json({
      success: true,
      sharedWith: sharedUsers
    });

  } catch (error) {
    console.error('Error getting shared users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shared users'
    });
  }
});

module.exports = router;
