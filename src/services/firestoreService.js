import { 
  collection, 
  addDoc, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Device Requests Service
export const deviceRequestsService = {
  // Create a new device request
  async createRequest(userId, requestData) {
    try {
      const requestRef = await addDoc(collection(db, 'deviceRequests'), {
        userId: userId,
        fullName: requestData.fullName,
        email: requestData.email,
        nic: requestData.nic,
        location: requestData.location,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Device request created with ID:', requestRef.id);
      return { success: true, requestId: requestRef.id };
    } catch (error) {
      console.error('❌ Error creating device request:', error);
      
      // If it's a permission error, provide helpful guidance
      if (error.code === 'permission-denied' || error.message.includes('permission')) {
        console.error('🚨 Firebase permission denied. Please check IMMEDIATE_FIX.md for setup instructions.');
        return { 
          success: false, 
          error: 'Firebase permissions not configured. Please check IMMEDIATE_FIX.md for setup instructions.',
          code: 'FIREBASE_SETUP_REQUIRED'
        };
      }
      
      return { success: false, error: error.message };
    }
  },

  // Get user's device requests
  async getUserRequests(userId) {
    try {
      const q = query(
        collection(db, 'deviceRequests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, requests };
    } catch (error) {
      console.error('❌ Error getting user requests:', error);
      return { success: false, error: error.message, requests: [] };
    }
  },

  // Get all device requests (admin only)
  async getAllRequests() {
    try {
      const q = query(
        collection(db, 'deviceRequests'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, requests };
    } catch (error) {
      console.error('❌ Error getting all requests:', error);
      return { success: false, error: error.message, requests: [] };
    }
  },

  // Update request status
  async updateRequestStatus(requestId, status, additionalData = {}) {
    try {
      const requestRef = doc(db, 'deviceRequests', requestId);
      await updateDoc(requestRef, {
        status: status,
        updatedAt: serverTimestamp(),
        ...additionalData
      });
      
      console.log('✅ Request status updated:', requestId, status);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating request status:', error);
      return { success: false, error: error.message };
    }
  },

  // Update request data (user only, pending status required)
  async updateRequest(requestId, userId, requestData) {
    try {
      // First check if request exists and belongs to user with pending status
      const requestRef = doc(db, 'deviceRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Request not found' };
      }
      
      const existingData = requestDoc.data();
      if (existingData.userId !== userId) {
        return { success: false, error: 'Unauthorized to update this request' };
      }
      
      if (existingData.status !== 'pending') {
        return { success: false, error: 'Cannot update request after it has been processed by admin' };
      }
      
      // Update the request
      await updateDoc(requestRef, {
        fullName: requestData.fullName,
        email: requestData.email,
        nic: requestData.nic,
        location: requestData.location,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Request updated by user:', requestId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating request:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancel request (user only, pending status required) - DELETE from Firestore
  async cancelRequest(requestId, userId) {
    try {
      // First check if request exists and belongs to user with pending status
      const requestRef = doc(db, 'deviceRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Request not found' };
      }
      
      const existingData = requestDoc.data();
      if (existingData.userId !== userId) {
        return { success: false, error: 'Unauthorized to cancel this request' };
      }
      
      if (existingData.status !== 'pending') {
        return { success: false, error: 'Cannot cancel request after it has been processed by admin' };
      }
      
      // DELETE the request completely from Firestore (user cancel rule)
      await deleteDoc(requestRef);
      
      console.log('✅ Request deleted by user:', requestId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelling request:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin cancel request - mark as cancelled, keep in DB
  async adminCancelRequest(requestId, adminId) {
    try {
      const requestRef = doc(db, 'deviceRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Request not found' };
      }
      
      // Update status to cancelled (admin cancel rule)
      await updateDoc(requestRef, {
        status: 'cancelled',
        cancelledBy: adminId,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Request cancelled by admin:', requestId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelling request:', error);
      return { success: false, error: error.message };
    }
  },

  // Assign device to user with proper linking
  async assignDevice(requestId, deviceId, adminId) {
    try {
      const requestRef = doc(db, 'deviceRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Request not found' };
      }
      
      const requestData = requestDoc.data();
      
      // Update request with device assignment
      await updateDoc(requestRef, {
        status: 'assigned',
        assignedDeviceId: deviceId,
        assignedAt: serverTimestamp(),
        assignedBy: adminId,
        updatedAt: serverTimestamp()
      });
      
      // Update user's devices list
      const userRef = doc(db, 'users', requestData.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userDevices = userData.devices || [];
        
        if (!userDevices.includes(deviceId)) {
          await updateDoc(userRef, {
            devices: [...userDevices, deviceId],
            updatedAt: serverTimestamp()
          });
        }
      }
      
      // Update device collection with assignment info
      const deviceRef = doc(db, 'devices', deviceId);
      await updateDoc(deviceRef, {
        assignedTo: requestData.userId,
        assignedAt: serverTimestamp(),
        status: 'assigned',
        assignedBy: adminId,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Device assigned with full linking:', deviceId, 'to user:', requestData.userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error assigning device:', error);
      return { success: false, error: error.message };
    }
  },

  // Store sensor data in Firestore
  async storeSensorData(deviceId, sensorData) {
    try {
      const sensorRef = doc(db, 'devices', deviceId, 'sensorData', Date.now().toString());
      await setDoc(sensorRef, {
        ...sensorData,
        timestamp: serverTimestamp(),
        deviceId: deviceId
      });
      
      // Also update the latest sensor data
      const latestRef = doc(db, 'devices', deviceId);
      await updateDoc(latestRef, {
        latestSensorData: sensorData,
        lastSensorUpdate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Sensor data stored for device:', deviceId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error storing sensor data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get sensor data for a device
  async getSensorData(deviceId, limit = 100) {
    try {
      const sensorDataRef = collection(db, 'devices', deviceId, 'sensorData');
      const q = query(sensorDataRef, orderBy('timestamp', 'desc'), limit(limit));
      const snapshot = await getDocs(q);
      
      const sensorData = [];
      snapshot.forEach(doc => {
        sensorData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, data: sensorData };
    } catch (error) {
      console.error('❌ Error getting sensor data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single request by ID (for editing)
  async getRequest(requestId, userId) {
    try {
      const requestRef = doc(db, 'deviceRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Request not found' };
      }
      
      const requestData = requestDoc.data();
      if (requestData.userId !== userId) {
        return { success: false, error: 'Unauthorized to access this request' };
      }
      
      return { 
        success: true, 
        data: {
          id: requestDoc.id,
          ...requestData
        }
      };
    } catch (error) {
      console.error('❌ Error getting request:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to user's requests (real-time)
  subscribeToUserRequests(userId, callback) {
    console.log('🔄 Setting up Firestore subscription for userId:', userId);
    
    // Remove limit to get all user's requests
    const q = query(
      collection(db, 'deviceRequests'),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      console.log('📋 Firestore snapshot received for user requests, size:', snapshot.size);
      const requests = [];
      snapshot.forEach((doc) => {
        const requestData = doc.data();
        console.log('📄 Request document:', doc.id, requestData);
        requests.push({
          id: doc.id,
          ...requestData
        });
      });
      console.log('✅ Total requests found for user:', requests.length);
      callback(requests);
    }, (error) => {
      console.error('❌ Error in user requests subscription:', error);
      console.error('❌ Error details:', error.code, error.message);
      callback([]);
    });
  },

  // Subscribe to all requests (admin only)
  subscribeToAllRequests(callback) {
    console.log('🔄 Setting up all requests subscription...');
    
    const requestsRef = collection(db, 'deviceRequests');

    return onSnapshot(requestsRef, (snapshot) => {
      const requests = [];
      snapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort manually by createdAt
      requests.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return new Date(bTime) - new Date(aTime);
      });
      
      console.log('📥 All requests loaded:', requests.length);
      callback(requests);
    }, (error) => {
      console.error('❌ Error in all requests subscription:', error);
      callback([]);
    });
  }
};

// Users Service
export const usersService = {
  // Create or update user
  async createOrUpdateUser(userId, userData) {
    try {
      console.log('🔄 Creating/updating user:', userId, userData);
      const userRef = doc(db, 'users', userId);
      
      // Use setDoc with merge: true to create or update
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ User created/updated successfully:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating/updating user:', error);
      console.error('❌ Error details:', error.code, error.message);
      return { success: false, error: error.message };
    }
  },

  // Get user by ID
  async getUser(userId) {
    try {
      console.log('🔍 Getting user:', userId);
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ User found:', userId);
        return { success: true, user: { id: userDoc.id, ...userData } };
      } else {
        console.log('❌ User not found:', userId);
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all users (admin only)
  async getAllUsers() {
    try {
      console.log('🔍 Loading all users...');
      
      // First try without ordering to avoid index issues
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort manually by createdAt
      users.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return new Date(bTime) - new Date(aTime);
      });
      
      console.log('✅ Loaded users:', users.length);
      return { success: true, users };
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      // Check if it's a permission error
      if (error.code === 'permission-denied') {
        console.error('🚨 Permission denied - check Firestore security rules');
        return { 
          success: false, 
          error: 'Permission denied. Please check Firestore security rules. See FIRESTORE_SECURITY_RULES_FIX.md for instructions.', 
          users: [] 
        };
      }
      
      return { success: false, error: error.message, users: [] };
    }
  },

  // Update user role
  async updateUserRole(userId, role) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: role,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ User role updated:', userId, role);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete user account (admin only)
  async deleteUser(userId) {
    try {
      console.log('🗑️ Deleting user account:', userId);
      
      // Delete from Firestore users collection
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      
      console.log('✅ User deleted from Firestore:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to all users (admin only)
  subscribeToAllUsers(callback) {
    console.log('🔄 Setting up Firestore subscription for users collection');
    
    // Try simple query first (without orderBy to avoid index issues)
    const q = query(collection(db, 'users'));

    return onSnapshot(q, (snapshot) => {
      console.log('📊 Firestore users snapshot received, size:', snapshot.size);
      const users = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        console.log('👤 User document:', doc.id, userData);
        users.push({
          id: doc.id,
          ...userData
        });
      });
      
      // Sort users manually by createdAt (newest first)
      users.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return new Date(bTime) - new Date(aTime);
      });
      
      console.log('✅ Processed and sorted users array:', users.length);
      console.log('👥 All users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
      callback(users);
    }, (error) => {
      console.error('❌ Error in users subscription:', error);
      console.error('❌ Error details:', error.code, error.message);
      if (error.code === 'failed-precondition') {
        console.error('🚨 This is likely a missing index error. Trying simple query without orderBy.');
      }
      callback([]);
    });
  }
};

// Sensor Data Service
export const sensorDataService = {
  // Add sensor data
  async addSensorData(deviceId, sensorData) {
    try {
      const sensorRef = await addDoc(collection(db, 'sensorData'), {
        deviceId: deviceId,
        ...sensorData,
        timestamp: serverTimestamp()
      });
      
      console.log('✅ Sensor data added:', sensorRef.id);
      return { success: true, sensorId: sensorRef.id };
    } catch (error) {
      console.error('❌ Error adding sensor data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get sensor data for a device
  async getDeviceSensorData(deviceId, limitCount = 100) {
    try {
      const q = query(
        collection(db, 'sensorData'),
        where('deviceId', '==', deviceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const sensorData = [];
      querySnapshot.forEach((doc) => {
        sensorData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, sensorData };
    } catch (error) {
      console.error('❌ Error getting sensor data:', error);
      return { success: false, error: error.message, sensorData: [] };
    }
  },

  // Subscribe to device sensor data (real-time)
  subscribeToDeviceSensorData(deviceId, callback, limitCount = 50) {
    const q = query(
      collection(db, 'sensorData'),
      where('deviceId', '==', deviceId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const sensorData = [];
      snapshot.forEach((doc) => {
        sensorData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(sensorData);
    }, (error) => {
      console.error('❌ Error in sensor data subscription:', error);
      callback([]);
    });
  }
};

