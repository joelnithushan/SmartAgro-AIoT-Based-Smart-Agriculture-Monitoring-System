import { ref, update, get } from 'firebase/database';
import { database } from '../config/firebase';

/**
 * Devices Service Module
 * 
 * This module provides atomic operations for device management and order processing.
 * All operations use Firebase's update() method to ensure atomicity across multiple paths.
 * 
 * IMPORTANT: These functions assume the caller has already verified admin authentication.
 * No auth checks are performed within this module.
 * 
 * @author Firebase Expert
 * @version 1.0.0
 */

/**
 * Generates a unique notification ID using timestamp and random string
 * @returns {string} Unique notification identifier
 */
const generateNotificationId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `notif_${timestamp}_${random}`;
};

/**
 * Assigns a device to a user and updates all related records atomically
 * 
 * This function performs an atomic multi-path update to ensure data consistency:
 * - Creates device record with user assignment
 * - Updates request status to "device-assigned"
 * - Links device to user's device list
 * - Creates notification for the user
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.db - Firebase Realtime Database instance (optional, defaults to imported database)
 * @param {string} params.requestId - Unique request identifier
 * @param {string} params.deviceId - Unique device identifier
 * @param {string} params.userId - User ID to assign device to
 * @param {string} params.adminEmail - Email of admin performing the assignment
 * @returns {Promise<Object>} Firebase update result
 * @throws {Error} If required parameters are missing or operation fails
 * 
 * @example
 * ```javascript
 * try {
 *   const result = await assignDeviceToUser({
 *     requestId: 'req_123456',
 *     deviceId: 'dev_ABC123',
 *     userId: 'user_789',
 *     adminEmail: 'admin@company.com'
 *   });
 *   console.log('Device assigned successfully:', result);
 * } catch (error) {
 *   console.error('Failed to assign device:', error.message);
 * }
 * ```
 */
export const assignDeviceToUser = async ({ 
  db = database, 
  requestId, 
  deviceId, 
  userId, 
  adminEmail 
}) => {
  // Input validation
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

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    throw new Error('adminEmail must be a valid email address');
  }

  try {
    // Generate unique notification ID
    const notificationId = generateNotificationId();
    
    // Current timestamp for consistency across all updates
    const currentTimestamp = Date.now();
    
    // Build atomic multi-path update object
    // Using update() ensures all changes succeed or all fail together
    const updates = {
      // Create device record
      [`/devices/${deviceId}`]: {
        userId: userId,
        status: "active",
        createdAt: currentTimestamp,
        assignedBy: adminEmail,
        requestId: requestId // Link back to original request
      },
      
      // Update request status and assignment info
      [`/deviceRequests/${requestId}/deviceId`]: deviceId,
      [`/deviceRequests/${requestId}/status`]: "device-assigned",
      [`/deviceRequests/${requestId}/assignedAt`]: currentTimestamp,
      [`/deviceRequests/${requestId}/assignedBy`]: adminEmail,
      [`/deviceRequests/${requestId}/updatedAt`]: currentTimestamp,
      
      // Link device to user's device list
      [`/users/${userId}/devices/${deviceId}`]: true,
      
      // Create notification for user
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

    // Perform atomic update
    // This ensures either all updates succeed or none do, preventing partial state
    const result = await update(ref(db), updates);
    
    console.log(`Device ${deviceId} successfully assigned to user ${userId}`);
    return result;
    
  } catch (error) {
    console.error('Error in assignDeviceToUser:', error);
    
    // Provide more specific error messages based on Firebase error codes
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

/**
 * Marks an order as completed and updates related records
 * 
 * This function updates the request status to "completed" and records
 * completion metadata. It's designed to be called after device assignment.
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.db - Firebase Realtime Database instance (optional, defaults to imported database)
 * @param {string} params.requestId - Unique request identifier
 * @param {string} params.adminEmail - Email of admin completing the order
 * @returns {Promise<Object>} Firebase update result
 * @throws {Error} If required parameters are missing or operation fails
 * 
 * @example
 * ```javascript
 * try {
 *   const result = await markOrderCompleted({
 *     requestId: 'req_123456',
 *     adminEmail: 'admin@company.com'
 *   });
 *   console.log('Order completed successfully:', result);
 * } catch (error) {
 *   console.error('Failed to complete order:', error.message);
 * }
 * ```
 */
export const markOrderCompleted = async ({ 
  db = database, 
  requestId, 
  adminEmail 
}) => {
  // Input validation
  if (!requestId || typeof requestId !== 'string') {
    throw new Error('requestId is required and must be a string');
  }
  if (!adminEmail || typeof adminEmail !== 'string') {
    throw new Error('adminEmail is required and must be a string');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    throw new Error('adminEmail must be a valid email address');
  }

  try {
    // Current timestamp for consistency
    const currentTimestamp = Date.now();
    
    // Build update object for order completion
    const updates = {
      [`/deviceRequests/${requestId}/status`]: "completed",
      [`/deviceRequests/${requestId}/completedAt`]: currentTimestamp,
      [`/deviceRequests/${requestId}/completedBy`]: adminEmail,
      [`/deviceRequests/${requestId}/updatedAt`]: currentTimestamp
    };

    // Perform atomic update
    const result = await update(ref(db), updates);
    
    console.log(`Order ${requestId} successfully marked as completed`);
    return result;
    
  } catch (error) {
    console.error('Error in markOrderCompleted:', error);
    
    // Provide more specific error messages based on Firebase error codes
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

/**
 * UTILITY FUNCTIONS
 * These can be used for additional device management operations
 */

/**
 * Gets device information by device ID
 * @param {string} deviceId - Device identifier
 * @returns {Promise<Object|null>} Device data or null if not found
 */
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

/**
 * Gets all devices assigned to a user
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} Object with device IDs as keys
 */
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

/*
 * IMPORTANT NOTES ABOUT ATOMICITY AND RACE CONDITIONS:
 * 
 * 1. ATOMICITY: The update() method ensures that either all specified paths are updated
 *    successfully, or none are updated at all. This prevents partial state corruption.
 * 
 * 2. RACE CONDITIONS: While update() is atomic, race conditions can still occur if:
 *    - Multiple admins try to assign the same device simultaneously
 *    - A user's request is being processed while they're making changes
 *    - Network issues cause retries that overlap with original operations
 * 
 * 3. MITIGATION STRATEGIES:
 *    - Use database security rules to prevent unauthorized writes
 *    - Implement client-side optimistic locking with timestamps
 *    - Add retry logic with exponential backoff for network failures
 *    - Consider using Firebase Functions for complex multi-step operations
 * 
 * 4. MONITORING: Always log operations and monitor for:
 *    - Failed updates due to permission issues
 *    - Network timeouts and retries
 *    - Unexpected data states that might indicate race conditions
 * 
 * 5. TESTING: Test these functions with:
 *    - Concurrent operations on the same request/device
 *    - Network interruption scenarios
 *    - Invalid input data
 *    - Permission denied scenarios
 */

/*
 * EXAMPLE USAGE IN A REACT COMPONENT:
 * 
 * ```javascript
 * import { assignDeviceToUser, markOrderCompleted } from '../services/devicesService';
 * 
 * const handleAssignDevice = async (requestId, deviceId, userId) => {
 *   try {
 *     setLoading(true);
 *     
 *     // Get current admin email from auth context
 *     const adminEmail = auth.currentUser?.email;
 *     if (!adminEmail) {
 *       throw new Error('Admin authentication required');
 *     }
 *     
 *     // Assign device atomically
 *     await assignDeviceToUser({
 *       requestId,
 *       deviceId,
 *       userId,
 *       adminEmail
 *     });
 *     
 *     // Show success message
 *     toast.success('Device assigned successfully!');
 *     
 *   } catch (error) {
 *     console.error('Assignment failed:', error);
 *     toast.error(`Failed to assign device: ${error.message}`);
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * 
 * const handleCompleteOrder = async (requestId) => {
 *   try {
 *     setLoading(true);
 *     
 *     const adminEmail = auth.currentUser?.email;
 *     if (!adminEmail) {
 *       throw new Error('Admin authentication required');
 *     }
 *     
 *     await markOrderCompleted({
 *       requestId,
 *       adminEmail
 *     });
 *     
 *     toast.success('Order completed successfully!');
 *     
 *   } catch (error) {
 *     console.error('Completion failed:', error);
 *     toast.error(`Failed to complete order: ${error.message}`);
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * ```
 */
