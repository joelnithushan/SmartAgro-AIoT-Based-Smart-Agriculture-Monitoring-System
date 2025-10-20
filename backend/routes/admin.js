import express from 'express';
import { admin } from '../config/firebase.js';
// Note: Using server-side Firestore methods directly from admin.firestore()

const router = express.Router();

// Role constants
const SUPER_ADMIN_EMAIL = 'joelnithushan6@gmail.com';

// Helper function to completely delete user data from Firestore
const deleteUserDataFromFirestore = async (db, userId) => {
  try {
    console.log(`🗑️ Starting complete deletion of user data for: ${userId}`);
    
    // List of subcollections to delete
    const subcollections = [
      'alerts',
      'triggeredAlerts', 
      'chats',
      'crops',
      'fertilizers',
      'recommendations'
    ];
    
    // Delete all subcollections
    for (const subcollection of subcollections) {
      try {
        const subcollectionRef = db.collection('users').doc(userId).collection(subcollection);
        const snapshot = await subcollectionRef.get();
        
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`✅ Deleted ${snapshot.size} documents from ${subcollection}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error deleting subcollection ${subcollection}:`, error.message);
      }
    }
    
    // Delete chat messages (nested subcollection)
    try {
      const chatsRef = db.collection('users').doc(userId).collection('chats');
      const chatsSnapshot = await chatsRef.get();
      
      for (const chatDoc of chatsSnapshot.docs) {
        const messagesRef = chatDoc.ref.collection('messages');
        const messagesSnapshot = await messagesRef.get();
        
        if (!messagesSnapshot.empty) {
          const batch = db.batch();
          messagesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`✅ Deleted ${messagesSnapshot.size} messages from chat ${chatDoc.id}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error deleting chat messages:', error.message);
    }
    
    // Delete user's device requests
    try {
      const deviceRequestsRef = db.collection('deviceRequests');
      const deviceRequestsSnapshot = await deviceRequestsRef.where('userId', '==', userId).get();
      
      if (!deviceRequestsSnapshot.empty) {
        const batch = db.batch();
        deviceRequestsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`✅ Deleted ${deviceRequestsSnapshot.size} device requests`);
      }
    } catch (error) {
      console.warn('⚠️ Error deleting device requests:', error.message);
    }
    
    // Delete user's orders
    try {
      const ordersRef = db.collection('orders');
      const ordersSnapshot = await ordersRef.where('userId', '==', userId).get();
      
      if (!ordersSnapshot.empty) {
        const batch = db.batch();
        ordersSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`✅ Deleted ${ordersSnapshot.size} orders`);
      }
    } catch (error) {
      console.warn('⚠️ Error deleting orders:', error.message);
    }
    
    // Delete user's notifications
    try {
      const notificationsRef = db.collection('notifications');
      const notificationsSnapshot = await notificationsRef.where('userId', '==', userId).get();
      
      if (!notificationsSnapshot.empty) {
        const batch = db.batch();
        notificationsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`✅ Deleted ${notificationsSnapshot.size} notifications`);
      }
    } catch (error) {
      console.warn('⚠️ Error deleting notifications:', error.message);
    }
    
    // Finally, delete the main user document
    const userRef = db.collection('users').doc(userId);
    await userRef.delete();
    console.log(`✅ Deleted main user document for: ${userId}`);
    
    console.log(`🎉 Complete user data deletion finished for: ${userId}`);
  } catch (error) {
    console.error('❌ Error in deleteUserDataFromFirestore:', error);
    throw error;
  }
};

// Helper function to get Firestore instance
const getDb = () => {
  try {
    // Check if Firebase Admin SDK is properly initialized
    if (admin.apps.length === 0) {
      console.log('🔧 Firebase Admin SDK not initialized, returning null');
      return null;
    }
    
    // Try to get Firestore instance
    const db = admin.firestore();
    
    // Test if the Firestore instance is actually usable
    if (!db) {
      console.log('🔧 Firestore instance is null');
      return null;
    }
    
    console.log('✅ Firestore instance obtained and ready');
    return db;
  } catch (error) {
    console.log('🔧 Firestore not available:', error.message);
    return null;
  }
};

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization token provided');
      return res.status(401).json({ success: false, error: 'No authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('🔍 Verifying admin token...');
    
    // Check if Firebase Admin SDK is properly initialized
    if (admin.apps.length === 0) {
      // Demo mode: Allow access if token looks like a Firebase token
      if (token && token.length > 50) {
        req.adminUid = 'demo-admin-uid';
        req.adminEmail = 'joelnithushan6@gmail.com';
        console.log('🔧 Demo mode: Admin access granted');
        return next();
      } else {
        console.log('❌ Invalid token format in demo mode');
        return res.status(401).json({ success: false, error: 'Invalid token format' });
      }
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log('✅ Token verified successfully for:', decodedToken.email);
    } catch (verifyError) {
      console.error('❌ Token verification failed:', verifyError.message);
      // If Firebase Admin SDK fails, fall back to demo mode for development
      if (token && token.length > 50) {
        req.adminUid = 'demo-admin-uid';
        req.adminEmail = 'joelnithushan6@gmail.com';
        console.log('🔧 Fallback demo mode: Admin access granted');
        return next();
      } else {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
    }
    const uid = decodedToken.uid;

    // Check if user is admin by email or role
    if (decodedToken.email !== SUPER_ADMIN_EMAIL) {
      const db = getDb();
      if (!db) {
        console.log('🔧 Demo mode: Skipping role check');
        req.adminUid = uid;
        req.adminEmail = decodedToken.email;
        return next();
      }

      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        console.log('❌ User not found in Firestore');
        return res.status(403).json({ success: false, error: 'User not found' });
      }

      const userData = userDoc.data();
      if (userData.role !== 'admin') {
        console.log('❌ User is not an admin, role:', userData.role);
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      console.log('✅ Admin role verified for:', decodedToken.email);
    } else {
      console.log('✅ Super admin access granted for:', decodedToken.email);
    }

    req.adminUid = uid;
    req.adminEmail = decodedToken.email;
    next();
  } catch (error) {
    console.error('❌ Admin verification error:', error);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Apply admin middleware to all routes
router.use(verifyAdmin);

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.json({
        success: true,
        data: {
          totalUsers: 0,
          pendingRequests: 0,
          activeDevices: 0,
          rejectedRequests: 0
        }
      });
    }

    // Get users count (excluding admin)
    const usersSnapshot = await db.collection('users').get();
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalUsers = allUsers.filter(user => user.role !== 'admin').length;

    // Get device requests
    const requestsSnapshot = await db.collection('deviceRequests').get();
    const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const pendingRequests = requests.filter(req => req.status === 'pending').length;
    const rejectedRequests = requests.filter(req => req.status === 'rejected').length;

    // Get devices
    const devicesSnapshot = await db.collection('devices').get();
    const devices = devicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const activeDevices = devices.filter(device => device.assignedTo).length;

    res.json({
      success: true,
      data: {
        totalUsers,
        pendingRequests,
        activeDevices,
        rejectedRequests
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    // Demo mode: Return sample data if Firestore is not available
    const db = getDb();
    if (!db) {
      console.log('🔧 Demo mode: Returning sample users data');
      const sampleUsers = [
        {
          id: 'demo-user-1',
          email: 'user1@example.com',
          displayName: 'Demo User 1',
          role: 'user',
          emailVerified: true,
          createdAt: { seconds: Date.now() / 1000 },
          lastSignInTime: new Date().toISOString()
        },
        {
          id: 'demo-user-2',
          email: 'user2@example.com',
          displayName: 'Demo User 2',
          role: 'admin',
          emailVerified: true,
          createdAt: { seconds: Date.now() / 1000 },
          lastSignInTime: new Date().toISOString()
        }
      ];
      
      return res.json({
        success: true,
        data: sampleUsers
      });
    }

    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/admin/users/:uid/promote
 * Promote user to admin
 */
router.post('/users/:uid/promote', async (req, res) => {
  try {
    const { uid } = req.params;
    console.log('⬆️ Promote user request for UID:', uid);
    console.log('🔍 Admin UID:', req.adminUid);

    // Only super admin can promote
    if (req.adminEmail !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, error: 'Only super admin can promote users' });
    }

    if (uid === req.adminUid) {
      return res.status(400).json({ success: false, error: 'Cannot promote yourself' });
    }

    // Check if Firebase Admin SDK is properly initialized
    const db = getDb();
    if (!db) {
      console.log('❌ Firebase Admin SDK not initialized - cannot promote user');
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin SDK not initialized. Please check server configuration.'
      });
    }

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userData = userSnap.data();
    
    // Prevent modification of super admin
    if (userData.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ success: false, error: 'Cannot modify super admin' });
    }

    // Update Firestore user document
    await userRef.update({
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Updated Firestore role to admin for user: ${uid}`);

    // Set Firebase Auth custom claims
    if (admin.apps.length > 0) {
      try {
        await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
        console.log(`✅ Set custom claims for user ${uid}: role=admin`);
      } catch (claimsError) {
        console.warn('⚠️ Failed to set custom claims:', claimsError.message);
        
        // Check if it's a network connectivity issue
        if (claimsError.message.includes('ENOTFOUND') || 
            claimsError.message.includes('metadata.google.internal') ||
            claimsError.message.includes('getaddrinfo')) {
          console.log('🔧 Network connectivity issue detected - continuing with Firestore update only');
        }
      }
    } else {
      console.log('⚠️ Firebase Admin SDK not available, skipping custom claims');
    }

    res.json({
      success: true,
      message: 'User promoted to admin successfully',
      userId: uid,
      newRole: 'admin'
    });
  } catch (error) {
    console.error('❌ Error promoting user:', error);
    console.error('❌ Error details:', error.message);
    res.status(500).json({ success: false, error: `Failed to promote user: ${error.message}` });
  }
});

/**
 * POST /api/admin/users/:uid/demote
 * Demote admin to user
 */
router.post('/users/:uid/demote', async (req, res) => {
  try {
    const { uid } = req.params;
    console.log('⬇️ Demote user request for UID:', uid);
    console.log('🔍 Admin UID:', req.adminUid);

    // Only super admin can demote
    if (req.adminEmail !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, error: 'Only super admin can demote users' });
    }

    if (uid === req.adminUid) {
      return res.status(400).json({ success: false, error: 'Cannot demote yourself' });
    }

    // Check if Firebase Admin SDK is properly initialized
    const db = getDb();
    if (!db) {
      console.log('❌ Firebase Admin SDK not initialized - cannot demote user');
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin SDK not initialized. Please check server configuration.'
      });
    }

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userData = userSnap.data();
    
    // Prevent modification of super admin
    if (userData.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ success: false, error: 'Cannot modify super admin' });
    }

    // Update Firestore user document
    await userRef.update({
      role: 'user',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Updated Firestore role to user for user: ${uid}`);

    // Set Firebase Auth custom claims
    if (admin.apps.length > 0) {
      try {
        await admin.auth().setCustomUserClaims(uid, { role: 'user' });
        console.log(`✅ Set custom claims for user ${uid}: role=user`);
      } catch (claimsError) {
        console.warn('⚠️ Failed to set custom claims:', claimsError.message);
        
        // Check if it's a network connectivity issue
        if (claimsError.message.includes('ENOTFOUND') || 
            claimsError.message.includes('metadata.google.internal') ||
            claimsError.message.includes('getaddrinfo')) {
          console.log('🔧 Network connectivity issue detected - continuing with Firestore update only');
        }
      }
    } else {
      console.log('⚠️ Firebase Admin SDK not available, skipping custom claims');
    }

    res.json({
      success: true,
      message: 'User demoted successfully',
      userId: uid,
      newRole: 'user'
    });
  } catch (error) {
    console.error('❌ Error demoting user:', error);
    console.error('❌ Error details:', error.message);
    res.status(500).json({ success: false, error: `Failed to demote user: ${error.message}` });
  }
});

/**
 * DELETE /api/admin/users/:uid
 * Delete user account
 */
router.delete('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    console.log('🗑️ Delete user request for UID:', uid);
    console.log('🔍 Admin UID:', req.adminUid);

    if (uid === req.adminUid) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }

    // Check if Firebase Admin SDK is properly initialized
    const db = getDb();
    if (!db) {
      console.log('❌ Firebase Admin SDK not initialized - cannot delete user');
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin SDK not initialized. Please check server configuration.'
      });
    }

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userData = userSnap.data();
    
    // Prevent deletion of super admin
    if (userData.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ success: false, error: 'Cannot delete super admin' });
    }

    // If target is admin, only super admin can delete
    if (userData.role === 'admin' && req.adminEmail !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, error: 'Only super admin can delete admin accounts' });
    }

    // Delete user from Firebase Auth (only if Firebase Admin SDK is available)
    if (admin.apps.length > 0) {
      try {
        await admin.auth().deleteUser(uid);
        console.log(`✅ Deleted user from Firebase Auth: ${uid}`);
      } catch (authError) {
        console.warn('⚠️ Failed to delete user from Firebase Auth:', authError.message);
        
        // Check if it's a network connectivity issue
        if (authError.message.includes('ENOTFOUND') || 
            authError.message.includes('metadata.google.internal') ||
            authError.message.includes('getaddrinfo')) {
          console.log('🔧 Network connectivity issue detected - continuing with Firestore deletion only');
        }
        
        // Continue with Firestore deletion even if Auth deletion fails
        // This prevents the entire operation from failing due to network issues
      }
    } else {
      console.log('⚠️ Firebase Admin SDK not available, skipping Auth deletion');
    }

    // Delete user document and all subcollections from Firestore
    await deleteUserDataFromFirestore(db, uid);

    // Clean up Realtime Database data (if available)
    try {
      const rtdb = admin.database();
      if (rtdb) {
        // Remove user from device ownership in Realtime Database
        const devicesRef = rtdb.ref('devices');
        const devicesSnapshot = await devicesRef.once('value');
        
        if (devicesSnapshot.exists()) {
          const devices = devicesSnapshot.val();
          const updates = {};
          
          // Find devices owned by this user and unassign them
          for (const [deviceId, deviceData] of Object.entries(devices)) {
            if (deviceData.ownerId === uid) {
              updates[`devices/${deviceId}/ownerId`] = null;
              updates[`devices/${deviceId}/ownerName`] = null;
              updates[`devices/${deviceId}/ownerEmail`] = null;
              updates[`devices/${deviceId}/assignedAt`] = null;
            }
          }
          
          if (Object.keys(updates).length > 0) {
            await rtdb.ref().update(updates);
            console.log(`Cleaned up ${Object.keys(updates).length / 4} devices for user ${uid}`);
          }
        }
      }
    } catch (rtdbError) {
      console.warn('⚠️ Error cleaning up Realtime Database data:', rtdbError.message);
      // Don't fail the entire operation if RTDB cleanup fails
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ success: false, error: `Failed to delete user: ${error.message}` });
  }
});

/**
 * GET /api/admin/orders
 * Get all orders
 */
router.get('/orders', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.json({
        success: true,
        data: []
      });
    }

    const ordersSnapshot = await db.collection('deviceRequests').get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

/**
 * POST /api/admin/orders/:id/estimate
 * Estimate cost for an order
 */
router.post('/orders/:id/estimate', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceCost, serviceCharge, deliveryCharge, notes } = req.body;

    if (!deviceCost || !serviceCharge || !deliveryCharge) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: deviceCost, serviceCharge, deliveryCharge'
      });
    }

    const requestRef = db.collection('deviceRequests').doc(id);
    const requestSnap = await requestRef.get();
    
    if (!requestSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const requestData = requestSnap.data();
    if (requestData.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Order is not in pending status' });
    }

    const totalCost = parseFloat(deviceCost) + parseFloat(serviceCharge) + parseFloat(deliveryCharge);

    await requestRef.update({
      status: 'cost-estimated',
      costDetails: {
        deviceCost: parseFloat(deviceCost),
        serviceCharge: parseFloat(serviceCharge),
        deliveryCharge: parseFloat(deliveryCharge),
        totalCost: totalCost,
        notes: notes || '',
        estimatedBy: req.adminEmail,
        estimatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create notification for user
    const notificationRef = db.collection('notifications').doc(requestData.userId).collection('items').doc();
    await notificationRef.set({
      title: 'Cost Estimate Ready',
      message: `Your device request has been reviewed. Total cost: $${totalCost.toFixed(2)}`,
      type: 'cost-estimate',
      requestId: id,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Cost estimate created successfully',
      data: { totalCost, status: 'cost-estimated' }
    });
  } catch (error) {
    console.error('Error creating cost estimate:', error);
    res.status(500).json({ success: false, error: 'Failed to create cost estimate' });
  }
});

/**
 * POST /api/admin/orders/:id/assign
 * Assign device to an order
 */
router.post('/orders/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ success: false, error: 'Missing deviceId' });
    }

    const requestRef = db.collection('deviceRequests').doc(id);
    const requestSnap = await requestRef.get();
    
    if (!requestSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const requestData = requestSnap.data();
    if (requestData.status !== 'user-accepted') {
      return res.status(400).json({ 
        success: false, 
        error: 'Order must be user-accepted before device assignment' 
      });
    }

    const batch = db.batch();

    // Create device metadata
    const deviceRef = db.collection('devices').doc(deviceId);
    batch.set(deviceRef, {
      assignedTo: requestData.userId,
      assignedToName: requestData.fullName,
      assignedToEmail: requestData.email,
      status: 'active',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedBy: req.adminEmail,
      requestId: id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update request with device ID
    batch.update(requestRef, {
      deviceId: deviceId,
      status: 'device-assigned',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedBy: req.adminEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create notification for user
    const notificationRef = db.collection('notifications').doc(requestData.userId).collection('items').doc();
    batch.set(notificationRef, {
      title: 'Device Assigned',
      message: `Your device ${deviceId} has been assigned and is ready for setup.`,
      type: 'device-assigned',
      requestId: id,
      deviceId: deviceId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    res.json({
      success: true,
      message: 'Device assigned successfully',
      data: { deviceId, status: 'device-assigned' }
    });
  } catch (error) {
    console.error('Error assigning device:', error);
    res.status(500).json({ success: false, error: 'Failed to assign device' });
  }
});

/**
 * POST /api/admin/orders/:id/reject
 * Reject an order
 */
router.post('/orders/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const requestRef = db.collection('deviceRequests').doc(id);
    const requestSnap = await requestRef.get();
    
    if (!requestSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const requestData = requestSnap.data();

    await requestRef.update({
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectedBy: req.adminEmail,
      rejectionReason: reason || 'Rejected by admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create notification for user
    const notificationRef = db.collection('notifications').doc(requestData.userId).collection('items').doc();
    await notificationRef.set({
      title: 'Order Rejected',
      message: `Your device request has been rejected. Reason: ${reason || 'No reason provided'}`,
      type: 'order-rejected',
      requestId: id,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Order rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({ success: false, error: 'Failed to reject order' });
  }
});

/**
 * POST /api/admin/orders/:id/complete
 * Complete an order
 */
router.post('/orders/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const requestRef = db.collection('deviceRequests').doc(id);
    const requestSnap = await requestRef.get();
    
    if (!requestSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const requestData = requestSnap.data();
    if (requestData.status !== 'device-assigned') {
      return res.status(400).json({ 
        success: false, 
        error: 'Order must be device-assigned before completion' 
      });
    }

    await requestRef.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedBy: req.adminEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create notification for user
    const notificationRef = db.collection('notifications').doc(requestData.userId).collection('items').doc();
    await notificationRef.set({
      title: 'Order Completed',
      message: `Your device ${requestData.deviceId} setup is complete and ready for use.`,
      type: 'order-completed',
      requestId: id,
      deviceId: requestData.deviceId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Order completed successfully'
    });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ success: false, error: 'Failed to complete order' });
  }
});

/**
 * GET /api/admin/devices
 * Get all devices with Realtime Database data and user info
 */
router.get('/devices', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Get devices from Firestore
    const devicesSnapshot = await db.collection('devices').get();
    const firestoreDevices = devicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get completed device requests from devicerequests collection
    console.log('🔍 Fetching completed device requests...');
    const completedRequestsSnapshot = await db.collection('deviceRequests')
      .where('status', '==', 'completed')
      .get();
    
    console.log(`📊 Found ${completedRequestsSnapshot.docs.length} completed requests`);
    
    const completedRequests = completedRequestsSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      console.log(`📋 Processing request ${doc.id}:`, {
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        farmName: data.farmName,
        soilType: data.soilType,
        status: data.status
      });
      
      // Generate device ID in format ESP32_001, ESP32_002, etc.
      const deviceId = `ESP32_${String(index + 1).padStart(3, '0')}`;
      
      return {
        id: doc.id,
        deviceId: deviceId,
        userId: data.userId,
        userName: data.userName || data.fullName || 'Unknown',
        userEmail: data.userEmail || 'N/A',
        farmName: data.farmName || 'N/A',
        soilType: data.soilType || 'N/A',
        farmSize: data.farmSize || 0,
        sensors: data.soilMoisture || {}, // Based on your Firestore structure
        status: data.status || 'completed',
        completedAt: data.completedAt || data.updatedAt,
        assignedAt: data.assignedAt,
        costDetails: data.costDetails || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        source: 'devicerequests' // Mark as coming from devicerequests
      };
    });

    // Get devices from Realtime Database
    let rtdbDevices = {};
    try {
      const rtdb = admin.database();
      if (rtdb) {
        const devicesRef = rtdb.ref('devices');
        const devicesSnapshot = await devicesRef.once('value');
        if (devicesSnapshot.exists()) {
          rtdbDevices = devicesSnapshot.val();
        }
      }
    } catch (rtdbError) {
      console.warn('Error fetching devices from Realtime Database:', rtdbError.message);
    }

    // Combine Firestore and Realtime Database data
    const devicesWithUserInfo = [];

    // Process devices from Firestore collection
    for (const firestoreDevice of firestoreDevices) {
      const device = { ...firestoreDevice };
      device.source = 'devices'; // Mark as coming from devices collection
      
      // Get Realtime Database data for this device
      if (rtdbDevices[device.id]) {
        const rtdbData = rtdbDevices[device.id];
        device.ownerId = rtdbData.meta?.ownerId || rtdbData.ownerId;
        device.lastSeen = rtdbData.meta?.lastSeen || rtdbData.lastSeen;
        device.status = rtdbData.meta?.status || rtdbData.status || 'unknown';
        device.ownerName = rtdbData.ownerName;
        device.ownerEmail = rtdbData.ownerEmail;
        device.assignedAt = rtdbData.assignedAt;
      }

      // Fetch user information if device has an owner
      if (device.ownerId) {
        try {
          const userDoc = await db.collection('users').doc(device.ownerId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            device.userName = userData.fullName || userData.displayName || 'Unknown';
            device.userEmail = userData.email || device.ownerEmail || 'N/A';
          } else {
            device.userName = 'User not found';
            device.userEmail = device.ownerEmail || 'N/A';
          }
        } catch (error) {
          console.warn(`Error fetching user info for ${device.ownerId}:`, error.message);
          device.userName = 'Error loading user';
          device.userEmail = device.ownerEmail || 'N/A';
        }
      } else {
        device.userName = 'Unassigned';
        device.userEmail = 'N/A';
      }

      devicesWithUserInfo.push(device);
    }

    // Add completed device requests to the list
    devicesWithUserInfo.push(...completedRequests);

    console.log(`📊 Total devices to return: ${devicesWithUserInfo.length}`);
    console.log('📋 Sample device data:', devicesWithUserInfo[0]);

    res.json({
      success: true,
      data: devicesWithUserInfo
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch devices' });
  }
});

/**
 * GET /api/admin/farms
 * Get all farm data from deviceRequests collection grouped by user
 */
router.get('/farms', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    console.log('🌾 Fetching farm data from deviceRequests...');
    
    // Get all device requests (not just completed ones) to show all farm data
    const allRequestsSnapshot = await db.collection('deviceRequests').get();
    
    console.log(`📊 Found ${allRequestsSnapshot.docs.length} total device requests`);
    
    // Group farm data by user
    const farmsByUser = {};
    
    allRequestsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      
      if (!farmsByUser[userId]) {
        farmsByUser[userId] = {
          userId: userId,
          userName: data.userName || data.fullName || 'Unknown',
          userEmail: data.userEmail || 'N/A',
          farms: [],
          totalRequests: 0,
          completedRequests: 0
        };
      }
      
      // Add farm data for this request
      const farmData = {
        requestId: doc.id,
        farmName: data.farmName || 'Unnamed Farm',
        soilType: data.soilType || 'Unknown',
        farmSize: data.farmSize || 0,
        status: data.status || 'pending',
        sensors: data.soilMoisture || {},
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        completedAt: data.completedAt,
        assignedAt: data.assignedAt,
        costDetails: data.costDetails || null
      };
      
      farmsByUser[userId].farms.push(farmData);
      farmsByUser[userId].totalRequests++;
      
      if (data.status === 'completed') {
        farmsByUser[userId].completedRequests++;
      }
    });
    
    // Convert to array format
    const farmsData = Object.values(farmsByUser);
    
    console.log(`🌾 Processed farm data for ${farmsData.length} users`);
    
    res.json({
      success: true,
      data: farmsData
    });
  } catch (error) {
    console.error('Error fetching farms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch farms' });
  }
});

/**
 * GET /api/admin/farms/:userId
 * Get farm data for a specific user
 */
router.get('/farms/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    if (!db) {
      return res.json({
        success: true,
        data: null
      });
    }
    
    console.log(`🌾 Fetching farm data for user: ${userId}`);
    
    // Get all device requests for this specific user
    const userRequestsSnapshot = await db.collection('deviceRequests')
      .where('userId', '==', userId)
      .get();
    
    if (userRequestsSnapshot.empty) {
      return res.json({
        success: true,
        data: null,
        message: 'No farm data found for this user'
      });
    }
    
    const userData = {
      userId: userId,
      farms: [],
      totalRequests: userRequestsSnapshot.docs.length,
      completedRequests: 0
    };
    
    userRequestsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      const farmData = {
        requestId: doc.id,
        farmName: data.farmName || 'Unnamed Farm',
        soilType: data.soilType || 'Unknown',
        farmSize: data.farmSize || 0,
        status: data.status || 'pending',
        sensors: data.soilMoisture || {},
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        completedAt: data.completedAt,
        assignedAt: data.assignedAt,
        costDetails: data.costDetails || null
      };
      
      userData.farms.push(farmData);
      
      if (data.status === 'completed') {
        userData.completedRequests++;
      }
    });
    
    // Get user info
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userInfo = userDoc.data();
        userData.userName = userInfo.fullName || userInfo.displayName || 'Unknown';
        userData.userEmail = userInfo.email || 'N/A';
      }
    } catch (error) {
      console.warn(`Error fetching user info for ${userId}:`, error.message);
    }
    
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error fetching user farms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user farms' });
  }
});

/**
 * POST /api/admin/devices/sync-completed-requests
 * Sync completed device requests to devices collection
 */
router.post('/devices/sync-completed-requests', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    // Get all completed device requests
    const completedRequestsSnapshot = await db.collection('deviceRequests')
      .where('status', '==', 'completed')
      .get();

    const syncResults = [];
    
    for (const doc of completedRequestsSnapshot.docs) {
      const requestData = doc.data();
      const requestId = doc.id;
      
      // Check if device already exists in devices collection
      const existingDeviceQuery = await db.collection('devices')
        .where('requestId', '==', requestId)
        .get();
      
      if (existingDeviceQuery.empty) {
        // Create device record in devices collection
        const deviceData = {
          requestId: requestId,
          deviceId: requestData.deviceId,
          userId: requestData.userId,
          userName: requestData.personalInfo?.fullName || 'Unknown',
          userEmail: requestData.personalInfo?.email || 'N/A',
          farmName: requestData.farmInfo?.farmName || 'N/A',
          soilType: requestData.farmInfo?.soilType || 'N/A',
          farmSize: requestData.farmInfo?.farmSize || 0,
          sensors: requestData.paramRequirements || {},
          status: 'completed',
          completedAt: requestData.completedAt,
          assignedAt: requestData.assignedAt,
          costDetails: requestData.costDetails || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('devices').add(deviceData);
        syncResults.push({
          requestId: requestId,
          deviceId: requestData.deviceId,
          userName: requestData.personalInfo?.fullName || 'Unknown',
          status: 'synced'
        });
      } else {
        syncResults.push({
          requestId: requestId,
          deviceId: requestData.deviceId,
          userName: requestData.personalInfo?.fullName || 'Unknown',
          status: 'already_exists'
        });
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncResults.length} completed requests`,
      data: syncResults
    });
  } catch (error) {
    console.error('Error syncing completed requests:', error);
    res.status(500).json({ success: false, error: 'Failed to sync completed requests' });
  }
});

/**
 * POST /api/admin/devices/:id/unassign
 * Unassign a device
 */
router.post('/devices/:id/unassign', async (req, res) => {
  try {
    const { id } = req.params;

    const deviceRef = db.collection('devices').doc(id);
    const deviceSnap = await deviceRef.get();
    
    if (!deviceSnap.exists) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    const deviceData = deviceSnap.data();
    if (!deviceData.assignedTo) {
      return res.status(400).json({ success: false, error: 'Device is not assigned' });
    }

    const batch = db.batch();

    // Update device
    batch.update(deviceRef, {
      assignedTo: null,
      assignedToName: null,
      assignedToEmail: null,
      status: 'unassigned',
      unassignedAt: admin.firestore.FieldValue.serverTimestamp(),
      unassignedBy: req.adminEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create notification for user
    const notificationRef = db.collection('notifications').doc(deviceData.assignedTo).collection('items').doc();
    batch.set(notificationRef, {
      title: 'Device Unassigned',
      message: `Your device ${id} has been unassigned.`,
      type: 'device-unassigned',
      deviceId: id,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    res.json({
      success: true,
      message: 'Device unassigned successfully'
    });
  } catch (error) {
    console.error('Error unassigning device:', error);
    res.status(500).json({ success: false, error: 'Failed to unassign device' });
  }
});

/**
 * POST /api/admin/devices/:id/reassign
 * Reassign a device
 */
router.post('/devices/:id/reassign', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }

    const deviceRef = db.collection('devices').doc(id);
    const deviceSnap = await deviceRef.get();
    
    if (!deviceSnap.exists) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    // Get user information
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userData = userSnap.data();
    const deviceData = deviceSnap.data();

    const batch = db.batch();

    // Update device
    batch.update(deviceRef, {
      assignedTo: userId,
      assignedToName: userData.displayName || userData.fullName,
      assignedToEmail: userData.email,
      status: 'active',
      reassignedAt: admin.firestore.FieldValue.serverTimestamp(),
      reassignedBy: req.adminEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create notification for new user
    const notificationRef = db.collection('notifications').doc(userId).collection('items').doc();
    batch.set(notificationRef, {
      title: 'Device Assigned',
      message: `Device ${id} has been assigned to you.`,
      type: 'device-assigned',
      deviceId: id,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify old user if exists
    if (deviceData.assignedTo && deviceData.assignedTo !== userId) {
      const oldNotificationRef = db.collection('notifications').doc(deviceData.assignedTo).collection('items').doc();
      batch.set(oldNotificationRef, {
        title: 'Device Reassigned',
        message: `Device ${id} has been reassigned to another user.`,
        type: 'device-reassigned',
        deviceId: id,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    res.json({
      success: true,
      message: 'Device reassigned successfully'
    });
  } catch (error) {
    console.error('Error reassigning device:', error);
    res.status(500).json({ success: false, error: 'Failed to reassign device' });
  }
});

/**
 * POST /api/admin/devices/:id/status
 * Update device status
 */
router.post('/devices/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Missing status' });
    }

    const deviceRef = db.collection('devices').doc(id);
    const deviceSnap = await deviceRef.get();
    
    if (!deviceSnap.exists) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    await deviceRef.update({
      status: status,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusUpdatedBy: req.adminEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Device status updated successfully'
    });
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({ success: false, error: 'Failed to update device status' });
  }
});

/**
 * PUT /api/admin/profile
 * Update admin profile
 */
router.put('/profile', async (req, res) => {
  try {
    const { fullName, phone, profilePicture } = req.body;

    const userRef = db.collection('users').doc(req.adminUid);
    await userRef.update({
      displayName: fullName,
      fullName: fullName,
      phone: phone,
      photoURL: profilePicture,
      profilePicture: profilePicture,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

export default router;