const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Initialize Firebase Client
const firebaseConfig = {
  apiKey: "AIzaSyCJ2h2RhIxcwRqbx3iqLQcE4XUccUqts10",
  authDomain: "smartagro-4.firebaseapp.com",
  projectId: "smartagro-4",
  storageBucket: "smartagro-4.firebasestorage.app",
  messagingSenderId: "191266982920",
  appId: "1:191266982920:web:1d441bb5e52d24f6ad55bd",
  measurementId: "G-D3PY03XGGP",
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function testConnection() {
  console.log('🔍 Testing Firebase Realtime Database connection...');
  
  try {
    // Test basic connection
    const testRef = ref(database, 'test');
    await get(testRef);
    console.log('✅ Basic connection successful');
    
    // Test devices path
    const devicesRef = ref(database, 'devices');
    const devicesSnapshot = await get(devicesRef);
    
    if (devicesSnapshot.exists()) {
      console.log('✅ Devices path exists');
      const devicesData = devicesSnapshot.val();
      console.log('📱 Available devices:', Object.keys(devicesData));
      
      // Check ESP32_001 specifically
      if (devicesData.ESP32_001) {
        console.log('✅ ESP32_001 device found');
        console.log('📊 Device data structure:', Object.keys(devicesData.ESP32_001));
        
        if (devicesData.ESP32_001.sensors) {
          console.log('✅ Sensors data found');
          if (devicesData.ESP32_001.sensors.latest) {
            console.log('✅ Latest sensor data:', devicesData.ESP32_001.sensors.latest);
          } else {
            console.log('❌ No latest sensor data');
          }
        } else {
          console.log('❌ No sensors data found');
        }
      } else {
        console.log('❌ ESP32_001 device not found');
      }
    } else {
      console.log('❌ No devices path found');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
  }
}

testConnection().then(() => process.exit(0));
