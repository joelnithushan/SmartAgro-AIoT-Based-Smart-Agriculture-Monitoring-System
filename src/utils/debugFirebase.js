import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const debugFirebaseCollections = async () => {
  console.log('🔍 Debugging Firebase collections...');
  
  try {
    // Check users collection
    console.log('👥 Checking users collection...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    console.log('👥 Users count:', usersSnapshot.size);
    
    if (usersSnapshot.size > 0) {
      usersSnapshot.forEach((doc) => {
        console.log('👤 User:', doc.id, doc.data());
      });
    }

    // Check deviceRequests collection
    console.log('📋 Checking deviceRequests collection...');
    const requestsRef = collection(db, 'deviceRequests');
    const requestsSnapshot = await getDocs(requestsRef);
    console.log('📋 Requests count:', requestsSnapshot.size);
    
    if (requestsSnapshot.size > 0) {
      requestsSnapshot.forEach((doc) => {
        console.log('📝 Request:', doc.id, doc.data());
      });
    }

    // Check devices collection
    console.log('📱 Checking devices collection...');
    const devicesRef = collection(db, 'devices');
    const devicesSnapshot = await getDocs(devicesRef);
    console.log('📱 Devices count:', devicesSnapshot.size);
    
    if (devicesSnapshot.size > 0) {
      devicesSnapshot.forEach((doc) => {
        console.log('📱 Device:', doc.id, doc.data());
      });
    }

    return {
      success: true,
      users: usersSnapshot.size,
      requests: requestsSnapshot.size,
      devices: devicesSnapshot.size
    };
  } catch (error) {
    console.error('❌ Error debugging Firebase collections:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
