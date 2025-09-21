const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.firebaseio.com/'
});

// Initialize Firebase Client
const firebaseConfig = {
  apiKey: "AIzaSyCJ2h2RhIxcwRqbx3iqLQcE4XUccUqts10",
  authDomain: "smartagro-4.firebaseapp.com",
  projectId: "smartagro-4",
  storageBucket: "smartagro-4.firebasestorage.app",
  messagingSenderId: "191266982920",
  appId: "1:191266982920:web:1d441bb5e52d24f6ad55bd",
  measurementId: "G-D3PY03XGGP",
  databaseURL: 'https://smartagro-4-default-rtdb.firebaseio.com/'
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function debugDeviceData() {
  console.log('🔍 Debugging Device Data Issues...\n');

  try {
    // 1. Check Firestore for user's device assignment
    console.log('📋 Step 1: Checking Firestore for device assignments...');
    const db = admin.firestore();
    
    // Check for joelnithushan4@gmail.com user
    const usersSnapshot = await db.collection('users').where('email', '==', 'joelnithushan4@gmail.com').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User joelnithushan4@gmail.com not found in users collection');
    } else {
      usersSnapshot.forEach(doc => {
        console.log('✅ User found:', doc.id, doc.data());
      });
    }

    // Check deviceRequests for ESP32_001 assignment
    const requestsSnapshot = await db.collection('deviceRequests').where('deviceId', '==', 'ESP32_001').get();
    
    if (requestsSnapshot.empty) {
      console.log('❌ No device requests found with deviceId: ESP32_001');
    } else {
      console.log('✅ Device requests with ESP32_001:');
      requestsSnapshot.forEach(doc => {
        console.log('  - Request ID:', doc.id);
        console.log('  - User ID:', doc.data().userId);
        console.log('  - Status:', doc.data().status);
        console.log('  - Device ID:', doc.data().deviceId);
        console.log('  - Farm Name:', doc.data().farmName);
        console.log('  - Created:', doc.data().createdAt?.toDate?.() || 'N/A');
        console.log('  ---');
      });
    }

    // 2. Check Firebase Realtime Database for sensor data
    console.log('\n📡 Step 2: Checking Firebase Realtime Database for sensor data...');
    
    // Check if devices/ESP32_001 exists
    const deviceRef = ref(database, 'devices/ESP32_001');
    const deviceSnapshot = await get(deviceRef);
    
    if (!deviceSnapshot.exists()) {
      console.log('❌ No data found at devices/ESP32_001 in Realtime Database');
      console.log('   This means your ESP32 device is not sending data to Firebase');
    } else {
      console.log('✅ Device ESP32_001 found in Realtime Database:');
      const deviceData = deviceSnapshot.val();
      console.log('   Device data structure:', Object.keys(deviceData));
      
      // Check sensors/latest
      if (deviceData.sensors && deviceData.sensors.latest) {
        console.log('✅ Latest sensor data found:');
        console.log('   Data:', deviceData.sensors.latest);
      } else {
        console.log('❌ No latest sensor data found at devices/ESP32_001/sensors/latest');
      }
      
      // Check sensors/history
      if (deviceData.sensors && deviceData.sensors.history) {
        const historyKeys = Object.keys(deviceData.sensors.history);
        console.log(`✅ Sensor history found: ${historyKeys.length} records`);
        if (historyKeys.length > 0) {
          console.log('   Latest history entry:', deviceData.sensors.history[historyKeys[historyKeys.length - 1]]);
        }
      } else {
        console.log('❌ No sensor history found at devices/ESP32_001/sensors/history');
      }
      
      // Check irrigation
      if (deviceData.irrigation) {
        console.log('✅ Irrigation data found:', deviceData.irrigation);
      } else {
        console.log('❌ No irrigation data found at devices/ESP32_001/irrigation');
      }
    }

    // 3. Check all devices in Realtime Database
    console.log('\n📱 Step 3: Checking all devices in Realtime Database...');
    const devicesRef = ref(database, 'devices');
    const devicesSnapshot = await get(devicesRef);
    
    if (!devicesSnapshot.exists()) {
      console.log('❌ No devices collection found in Realtime Database');
    } else {
      const devicesData = devicesSnapshot.val();
      const deviceIds = Object.keys(devicesData);
      console.log(`✅ Found ${deviceIds.length} devices in Realtime Database:`);
      deviceIds.forEach(deviceId => {
        console.log(`   - ${deviceId}`);
        if (devicesData[deviceId].sensors && devicesData[deviceId].sensors.latest) {
          console.log(`     Latest data: ${JSON.stringify(devicesData[deviceId].sensors.latest)}`);
        }
      });
    }

    // 4. Recommendations
    console.log('\n💡 Recommendations:');
    console.log('1. If no data in Realtime Database:');
    console.log('   - Check ESP32 WiFi connection');
    console.log('   - Verify Firebase Realtime Database URL in ESP32 code');
    console.log('   - Check ESP32 serial monitor for error messages');
    console.log('   - Ensure ESP32 is sending data to correct path: devices/ESP32_001/sensors/latest');
    
    console.log('\n2. If data exists but dashboard shows nothing:');
    console.log('   - Check browser console for JavaScript errors');
    console.log('   - Verify Firebase configuration in frontend');
    console.log('   - Check if deviceId is correctly assigned in Firestore');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    process.exit(0);
  }
}

debugDeviceData();
