const express = require('express');
const { db, admin } = require('../config/firebase');
const { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, getDocs, serverTimestamp, writeBatch } = require('firebase/firestore');
const router = express.Router();

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check if user is admin by email or role
    if (decodedToken.email !== 'joelnithushan6@gmail.com') {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        return res.status(403).json({ success: false, error: 'User not found' });
      }

      const userData = userDoc.data();
      if (userData.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
    }

    req.adminUid = uid;
    req.adminEmail = decodedToken.email;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
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
    // Get users count (excluding admin)
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalUsers = allUsers.filter(user => user.role !== 'admin').length;

    // Get device requests
    const requestsQuery = query(collection(db, 'deviceRequests'));
    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const pendingRequests = requests.filter(req => req.status === 'pending').length;
    const rejectedRequests = requests.filter(req => req.status === 'rejected').length;

    // Get devices
    const devicesQuery = query(collection(db, 'devices'));
    const devicesSnapshot = await getDocs(devicesQuery);
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
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
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

    if (uid === req.adminUid) {
      return res.status(400).json({ success: false, error: 'Cannot promote yourself' });
    }

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await updateDoc(userRef, {
      role: 'admin',
      updatedAt: serverTimestamp()
    });

    res.json({
      success: true,
      message: 'User promoted to admin successfully'
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ success: false, error: 'Failed to promote user' });
  }
});

/**
 * POST /api/admin/users/:uid/demote
 * Demote admin to user
 */
router.post('/users/:uid/demote', async (req, res) => {
  try {
    const { uid } = req.params;

    if (uid === req.adminUid) {
      return res.status(400).json({ success: false, error: 'Cannot demote yourself' });
    }

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await updateDoc(userRef, {
      role: 'user',
      updatedAt: serverTimestamp()
    });

    res.json({
      success: true,
      message: 'User demoted successfully'
    });
  } catch (error) {
    console.error('Error demoting user:', error);
    res.status(500).json({ success: false, error: 'Failed to demote user' });
  }
});

/**
 * DELETE /api/admin/users/:uid
 * Delete user account
 */
router.delete('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    if (uid === req.adminUid) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }

    // Delete user from Firebase Auth
    await admin.auth().deleteUser(uid);

    // Delete user document from Firestore
    await deleteDoc(doc(db, 'users', uid));

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

/**
 * GET /api/admin/orders
 * Get all orders
 */
router.get('/orders', async (req, res) => {
  try {
    const ordersQuery = query(collection(db, 'deviceRequests'));
    const ordersSnapshot = await getDocs(ordersQuery);
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

    const requestRef = doc(db, 'deviceRequests', id);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const requestData = requestSnap.data();
    if (requestData.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Order is not in pending status' });
    }

    const totalCost = parseFloat(deviceCost) + parseFloat(serviceCharge) + parseFloat(deliveryCharge);

    await updateDoc(requestRef, {
      status: 'cost-estimated',
      costDetails: {
        deviceCost: parseFloat(deviceCost),
        serviceCharge: parseFloat(serviceCharge),
        deliveryCharge: parseFloat(deliveryCharge),
        totalCost: totalCost,
        notes: notes || '',
        estimatedBy: req.adminEmail,
        estimatedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    // Create notification for user
    const notificationRef = doc(collection(db, 'notifications', requestData.userId, 'items'));
    await setDoc(notificationRef, {
      title: 'Cost Estimate Ready',
      message: `Your device request has been reviewed. Total cost: $${totalCost.toFixed(2)}`,
      type: 'cost-estimate',
      requestId: id,
      read: false,
      createdAt: serverTimestamp()
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

    const requestRef = doc(db, 'deviceRequests', id);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const requestData = requestSnap.data();
    if (requestData.status !== 'user-accepted') {
      return res.status(400).json({ 
        success: false, 
        error: 'Order must be user-accepted before device assignment' 
      });
    }

    const batch = writeBatch(db);

    // Create device metadata
    const deviceRef = doc(db, 'devices', deviceId);
    batch.set(deviceRef, {
      assignedTo: requestData.userId,
      assignedToName: requestData.fullName,
      assignedToEmail: requestData.email,
      status: 'active',
      assignedAt: serverTimestamp(),
      assignedBy: req.adminEmail,
      requestId: id,
      createdAt: serverTimestamp()
    });

    // Update request with device ID
    batch.update(requestRef, {
      deviceId: deviceId,
      status: 'device-assigned',
      assignedAt: serverTimestamp(),
      assignedBy: req.adminEmail,
      updatedAt: serverTimestamp()
    });

    // Create notification for user
    const notificationRef = doc(collection(db, 'notifications', requestData.userId, 'items'));
    batch.set(notificationRef, {
      title: 'Device Assigned',
      message: `Your device ${deviceId} has been assigned and is ready for setup.`,
      type: 'device-assigned',
      requestId: id,
      deviceId: deviceId,
      read: false,
      createdAt: serverTimestamp()
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

    const requestRef = doc(db, 'deviceRequests', id);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const requestData = requestSnap.data();

    await updateDoc(requestRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      rejectedBy: req.adminEmail,
      rejectionReason: reason || 'Rejected by admin',
      updatedAt: serverTimestamp()
    });

    // Create notification for user
    const notificationRef = doc(collection(db, 'notifications', requestData.userId, 'items'));
    await setDoc(notificationRef, {
      title: 'Order Rejected',
      message: `Your device request has been rejected. Reason: ${reason || 'No reason provided'}`,
      type: 'order-rejected',
      requestId: id,
      read: false,
      createdAt: serverTimestamp()
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

    const requestRef = doc(db, 'deviceRequests', id);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const requestData = requestSnap.data();
    if (requestData.status !== 'device-assigned') {
      return res.status(400).json({ 
        success: false, 
        error: 'Order must be device-assigned before completion' 
      });
    }

    await updateDoc(requestRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      completedBy: req.adminEmail,
      updatedAt: serverTimestamp()
    });

    // Create notification for user
    const notificationRef = doc(collection(db, 'notifications', requestData.userId, 'items'));
    await setDoc(notificationRef, {
      title: 'Order Completed',
      message: `Your device ${requestData.deviceId} setup is complete and ready for use.`,
      type: 'order-completed',
      requestId: id,
      deviceId: requestData.deviceId,
      read: false,
      createdAt: serverTimestamp()
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
 * Get all devices
 */
router.get('/devices', async (req, res) => {
  try {
    const devicesQuery = query(collection(db, 'devices'));
    const devicesSnapshot = await getDocs(devicesQuery);
    const devices = devicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch devices' });
  }
});

/**
 * POST /api/admin/devices/:id/unassign
 * Unassign a device
 */
router.post('/devices/:id/unassign', async (req, res) => {
  try {
    const { id } = req.params;

    const deviceRef = doc(db, 'devices', id);
    const deviceSnap = await getDoc(deviceRef);
    
    if (!deviceSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    const deviceData = deviceSnap.data();
    if (!deviceData.assignedTo) {
      return res.status(400).json({ success: false, error: 'Device is not assigned' });
    }

    const batch = writeBatch(db);

    // Update device
    batch.update(deviceRef, {
      assignedTo: null,
      assignedToName: null,
      assignedToEmail: null,
      status: 'unassigned',
      unassignedAt: serverTimestamp(),
      unassignedBy: req.adminEmail,
      updatedAt: serverTimestamp()
    });

    // Create notification for user
    const notificationRef = doc(collection(db, 'notifications', deviceData.assignedTo, 'items'));
    batch.set(notificationRef, {
      title: 'Device Unassigned',
      message: `Your device ${id} has been unassigned.`,
      type: 'device-unassigned',
      deviceId: id,
      read: false,
      createdAt: serverTimestamp()
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

    const deviceRef = doc(db, 'devices', id);
    const deviceSnap = await getDoc(deviceRef);
    
    if (!deviceSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    // Get user information
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userData = userSnap.data();
    const deviceData = deviceSnap.data();

    const batch = writeBatch(db);

    // Update device
    batch.update(deviceRef, {
      assignedTo: userId,
      assignedToName: userData.displayName || userData.fullName,
      assignedToEmail: userData.email,
      status: 'active',
      reassignedAt: serverTimestamp(),
      reassignedBy: req.adminEmail,
      updatedAt: serverTimestamp()
    });

    // Create notification for new user
    const notificationRef = doc(collection(db, 'notifications', userId, 'items'));
    batch.set(notificationRef, {
      title: 'Device Assigned',
      message: `Device ${id} has been assigned to you.`,
      type: 'device-assigned',
      deviceId: id,
      read: false,
      createdAt: serverTimestamp()
    });

    // Notify old user if exists
    if (deviceData.assignedTo && deviceData.assignedTo !== userId) {
      const oldNotificationRef = doc(collection(db, 'notifications', deviceData.assignedTo, 'items'));
      batch.set(oldNotificationRef, {
        title: 'Device Reassigned',
        message: `Device ${id} has been reassigned to another user.`,
        type: 'device-reassigned',
        deviceId: id,
        read: false,
        createdAt: serverTimestamp()
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

    const deviceRef = doc(db, 'devices', id);
    const deviceSnap = await getDoc(deviceRef);
    
    if (!deviceSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    await updateDoc(deviceRef, {
      status: status,
      statusUpdatedAt: serverTimestamp(),
      statusUpdatedBy: req.adminEmail,
      updatedAt: serverTimestamp()
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

    const userRef = doc(db, 'users', req.adminUid);
    await updateDoc(userRef, {
      displayName: fullName,
      fullName: fullName,
      phone: phone,
      photoURL: profilePicture,
      profilePicture: profilePicture,
      updatedAt: serverTimestamp()
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

module.exports = router;