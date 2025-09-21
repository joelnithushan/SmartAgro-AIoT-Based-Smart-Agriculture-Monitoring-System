const { db } = require('../config/firebase');
const { collection, query, where, getDocs } = require('firebase/firestore');

/**
 * Check if user can request more devices (max 3 active requests)
 * @param {string} userId - User ID to check
 * @returns {Promise<{canRequest: boolean, activeCount: number, message: string}>}
 */
async function checkDeviceRequestLimit(userId) {
  try {
    console.log('🔍 Checking device request limit for user:', userId);
    
    // Query for active device requests
    const requestsQuery = query(
      collection(db, 'deviceRequests'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(requestsQuery);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Count active requests (pending, cost-estimated, user-accepted, device-assigned)
    const activeStatuses = ['pending', 'cost-estimated', 'user-accepted', 'device-assigned'];
    const activeRequests = requests.filter(req => activeStatuses.includes(req.status));
    const activeCount = activeRequests.length;
    
    console.log(`📊 User has ${activeCount} active requests out of ${requests.length} total`);
    
    if (activeCount >= 3) {
      return {
        canRequest: false,
        activeCount,
        message: 'You have reached the maximum limit of 3 active device requests. Please wait for existing requests to be processed or cancelled.'
      };
    }
    
    return {
      canRequest: true,
      activeCount,
      message: `You can request ${3 - activeCount} more device(s).`
    };
    
  } catch (error) {
    console.error('❌ Error checking device request limit:', error);
    return {
      canRequest: false,
      activeCount: 0,
      message: 'Unable to verify device request limit. Please try again.'
    };
  }
}

/**
 * Get user's device request summary
 * @param {string} userId - User ID
 * @returns {Promise<{total: number, active: number, assigned: number, cancelled: number}>}
 */
async function getUserDeviceRequestSummary(userId) {
  try {
    const requestsQuery = query(
      collection(db, 'deviceRequests'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(requestsQuery);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const activeStatuses = ['pending', 'cost-estimated', 'user-accepted', 'device-assigned'];
    
    return {
      total: requests.length,
      active: requests.filter(req => activeStatuses.includes(req.status)).length,
      assigned: requests.filter(req => req.status === 'assigned').length,
      cancelled: requests.filter(req => req.status === 'cancelled' || req.status === 'user-rejected').length
    };
    
  } catch (error) {
    console.error('❌ Error getting user device request summary:', error);
    return {
      total: 0,
      active: 0,
      assigned: 0,
      cancelled: 0
    };
  }
}

module.exports = {
  checkDeviceRequestLimit,
  getUserDeviceRequestSummary
};
