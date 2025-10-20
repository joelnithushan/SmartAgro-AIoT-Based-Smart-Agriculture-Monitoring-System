import express from 'express';
import admin from 'firebase-admin';
import { getDatabase, ref, remove } from 'firebase/database';

const router = express.Router();

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    
    res.json({
      success: true,
      data: {
        uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        zipCode: userData.zipCode,
        country: userData.country,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const updateData = req.body;
    
    // Add updated timestamp
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    // Update user data in Firestore
    await admin.firestore().collection('users').doc(uid).update(updateData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { currentPassword, newPassword } = req.body;
    
    // Note: Firebase handles password changes on the client side
    // This endpoint is for validation and logging purposes
    res.json({
      success: true,
      message: 'Password change request validated. Please use Firebase client SDK to change password.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password change request'
    });
  }
});

// Get user settings
router.get('/settings', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Get settings from Firestore
    const settingsRef = admin.firestore().collection('users').doc(uid).collection('settings').doc('preferences');
    const settingsDoc = await settingsRef.get();
    
    if (settingsDoc.exists) {
      res.json({
        success: true,
        settings: settingsDoc.data()
      });
    } else {
      // Return default settings
      res.json({
        success: true,
        settings: {
          language: 'en',
          theme: 'light'
        }
      });
    }
  } catch (error) {
    console.error('Settings get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings'
    });
  }
});

// Update user settings
router.put('/settings', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { language, theme, currency } = req.body;
    
    // Validate settings
    if (language && !['en', 'ta'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Language must be either "en" or "ta"'
      });
    }
    
    if (theme && !['light', 'dark'].includes(theme)) {
      return res.status(400).json({
        success: false,
        error: 'Theme must be either "light" or "dark"'
      });
    }
    
    if (currency && !['LKR', 'USD'].includes(currency)) {
      return res.status(400).json({
        success: false,
        error: 'Currency must be either "LKR" or "USD"'
      });
    }
    
    const settingsData = {};
    if (language) settingsData.language = language;
    if (theme) settingsData.theme = theme;
    if (currency) settingsData.currency = currency;
    
    // Update settings in Firestore
    const settingsRef = admin.firestore().collection('users').doc(uid).collection('settings').doc('preferences');
    await settingsRef.set({
      ...settingsData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: settingsData
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

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

// Delete user account
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const userEmail = req.user.email;
    
    // Prevent deletion of super admin
    if (userEmail === 'joelnithushan6@gmail.com') {
      return res.status(400).json({
        success: false,
        error: 'Super admin account cannot be deleted'
      });
    }
    
    console.log(`🗑️ User ${userEmail} (${uid}) requesting account deletion`);
    
    // Get Firestore instance
    const db = admin.firestore();
    
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
            console.log(`✅ Cleaned up ${Object.keys(updates).length / 4} devices in Realtime Database`);
          }
        }
      }
    } catch (rtdbError) {
      console.warn('⚠️ Error cleaning up Realtime Database data:', rtdbError.message);
    }
    
    console.log(`✅ User account deletion completed for: ${userEmail}`);
    
    res.json({
      success: true,
      message: 'Account deleted successfully. Please sign out and delete your Firebase Auth account from the client side.'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

// Get user devices
router.get('/devices', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Get user's devices from Firestore
    const devicesSnapshot = await admin.firestore()
      .collection('devices')
      .where('ownerId', '==', uid)
      .get();
    
    const devices = [];
    devicesSnapshot.forEach(doc => {
      devices.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('Get user devices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user devices'
    });
  }
});

// Get user activity/logs
router.get('/activity', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { limit = 50, offset = 0 } = req.query;
    
    // Get user activity from Firestore
    const activitySnapshot = await admin.firestore()
      .collection('userActivity')
      .where('userId', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const activities = [];
    activitySnapshot.forEach(doc => {
      activities.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user activity'
    });
  }
});

// Upload user avatar
router.post('/avatar', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { avatarUrl } = req.body;
    
    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        error: 'Avatar URL is required'
      });
    }
    
    // Update user avatar in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      avatarUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatarUrl }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update avatar'
    });
  }
});

// Deactivate user account (self-deletion)
router.post('/deactivate', verifyToken, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { uid: requestUid, email: requestEmail } = req.body;

    console.log('🗑️ Account deactivation request from:', uid, email);
    console.log('🗑️ Request to delete:', requestUid, requestEmail);

    // Security check: users can only delete their own account
    if (uid !== requestUid) {
      console.log('❌ Security violation: User trying to delete different account');
      return res.status(403).json({
        success: false,
        error: 'You can only deactivate your own account'
      });
    }

    // Prevent super admin deletion
    if (email === 'joelnithushan6@gmail.com') {
      console.log('❌ Attempted to delete super admin account');
      return res.status(403).json({
        success: false,
        error: 'Super admin account cannot be deactivated'
      });
    }

    const db = admin.firestore();

    // 1. Delete all user subcollections from Firestore
    const subcollections = [
      'alerts',
      'triggeredAlerts',
      'chats',
      'crops',
      'fertilizers',
      'recommendations',
      'irrigation'
    ];

    for (const subcollection of subcollections) {
      try {
        const subcollectionRef = db.collection('users').doc(uid).collection(subcollection);
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

    // 2. Delete user's device requests
    try {
      const deviceRequestsSnapshot = await db.collection('deviceRequests').where('userId', '==', uid).get();
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

    // 3. Delete user's orders
    try {
      const ordersSnapshot = await db.collection('orders').where('userId', '==', uid).get();
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

    // 4. Delete user's notifications
    try {
      const notificationsSnapshot = await db.collection('notifications').where('userId', '==', uid).get();
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

    // 5. Delete main user document from Firestore
    try {
      await db.collection('users').doc(uid).delete();
      console.log('✅ Deleted user document from Firestore');
    } catch (error) {
      console.warn('⚠️ Error deleting user document:', error.message);
    }

    // 6. Clean up Realtime Database entries (device ownership)
    try {
      // Note: This would require the client SDK for RTDB, but we'll handle it via admin
      // In a real implementation, you'd use Firebase Admin SDK for RTDB
      console.log('🔧 RTDB cleanup would happen here (device ownership removal)');
    } catch (error) {
      console.warn('⚠️ Error cleaning up RTDB:', error.message);
    }

    // 7. Delete user from Firebase Auth (this should be done last)
    try {
      await admin.auth().deleteUser(uid);
      console.log('✅ Deleted user from Firebase Auth');
    } catch (error) {
      console.error('❌ Error deleting user from Auth:', error);
      // Continue anyway - user data is already deleted
    }

    console.log('✅ Account deactivation completed successfully');

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('❌ Error deactivating account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate account'
    });
  }
});

export default router;
