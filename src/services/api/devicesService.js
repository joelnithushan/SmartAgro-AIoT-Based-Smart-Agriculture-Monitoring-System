import { ref, update, get } from 'firebase/database';
import { database } from './firebase';
const generateNotificationId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `notif_${timestamp}_${random}`;
};
export const assignDeviceToUser = async ({ 
  db = database, 
  requestId, 
  deviceId, 
  userId, 
  adminEmail 
}) => {
  if (!requestId || typeof requestId !== 'string') {
    throw new Error('requestId is required and must be a string');
  }
  if (!deviceId || typeof deviceId !== 'string') {
    throw new Error('deviceId is required and must be a string');
  }
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId is required and must be a string');
  }
  if (!adminEmail || typeof adminEmail !== 'string') {
    throw new Error('adminEmail is required and must be a string');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    throw new Error('adminEmail must be a valid email address');
  }
  try {
    const notificationId = generateNotificationId();
    const currentTimestamp = Date.now();
    const updates = {
      [`/devices/${deviceId}`]: {
        userId: userId,
        status: "active",
        createdAt: currentTimestamp,
        assignedBy: adminEmail,
        requestId: requestId 
      },
      [`/deviceRequests/${requestId}/deviceId`]: deviceId,
      [`/deviceRequests/${requestId}/status`]: "device-assigned",
      [`/deviceRequests/${requestId}/assignedAt`]: currentTimestamp,
      [`/deviceRequests/${requestId}/assignedBy`]: adminEmail,
      [`/deviceRequests/${requestId}/updatedAt`]: currentTimestamp,
      [`/users/${userId}/devices/${deviceId}`]: true,
      [`/notifications/${userId}/${notificationId}`]: {
        title: "Device Assigned",
        message: `Your device ${deviceId} has been successfully assigned to your account.`,
        type: "device_assignment",
        deviceId: deviceId,
        requestId: requestId,
        createdAt: currentTimestamp,
        read: false
      }
    };
    const result = await update(ref(db), updates);
    console.log(`Device ${deviceId} successfully assigned to user ${userId}`);
    return result;
  } catch (error) {
    console.error('Error in assignDeviceToUser:', error);
    if (error.code) {
      switch (error.code) {
        case 'PERMISSION_DENIED':
          throw new Error('Permission denied: Check database security rules');
        case 'NETWORK_ERROR':
          throw new Error('Network error: Check internet connection');
        case 'UNAVAILABLE':
          throw new Error('Database temporarily unavailable');
        default:
          throw new Error(`Firebase error (${error.code}): ${error.message}`);
      }
    }
    throw new Error(`Failed to assign device: ${error.message}`);
  }
};
export const markOrderCompleted = async ({ 
  db = database, 
  requestId, 
  adminEmail 
}) => {
  if (!requestId || typeof requestId !== 'string') {
    throw new Error('requestId is required and must be a string');
  }
  if (!adminEmail || typeof adminEmail !== 'string') {
    throw new Error('adminEmail is required and must be a string');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    throw new Error('adminEmail must be a valid email address');
  }
  try {
    const currentTimestamp = Date.now();
    const updates = {
      [`/deviceRequests/${requestId}/status`]: "completed",
      [`/deviceRequests/${requestId}/completedAt`]: currentTimestamp,
      [`/deviceRequests/${requestId}/completedBy`]: adminEmail,
      [`/deviceRequests/${requestId}/updatedAt`]: currentTimestamp
    };
    const result = await update(ref(db), updates);
    console.log(`Order ${requestId} successfully marked as completed`);
    return result;
  } catch (error) {
    console.error('Error in markOrderCompleted:', error);
    if (error.code) {
      switch (error.code) {
        case 'PERMISSION_DENIED':
          throw new Error('Permission denied: Check database security rules');
        case 'NETWORK_ERROR':
          throw new Error('Network error: Check internet connection');
        case 'UNAVAILABLE':
          throw new Error('Database temporarily unavailable');
        default:
          throw new Error(`Firebase error (${error.code}): ${error.message}`);
      }
    }
    throw new Error(`Failed to complete order: ${error.message}`);
  }
};
export const getDeviceInfo = async (deviceId) => {
  if (!deviceId || typeof deviceId !== 'string') {
    throw new Error('deviceId is required and must be a string');
  }
  try {
    const deviceRef = ref(database, `devices/${deviceId}`);
    const snapshot = await get(deviceRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting device info:', error);
    throw new Error(`Failed to get device info: ${error.message}`);
  }
};
export const getUserDevices = async (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId is required and must be a string');
  }
  try {
    const userDevicesRef = ref(database, `users/${userId}/devices`);
    const snapshot = await get(userDevicesRef);
    return snapshot.exists() ? snapshot.val() : {};
  } catch (error) {
    console.error('Error getting user devices:', error);
    throw new Error(`Failed to get user devices: ${error.message}`);
  }
};
