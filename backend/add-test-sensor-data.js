const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function addTestSensorData() {
  try {
    console.log('🔧 Adding test sensor data to Firebase Realtime Database...');
    
    const db = admin.database();
    const deviceId = 'ESP32_001';
    
    // Add test sensor data
    const testSensorData = {
      soilMoisture: 65,
      soilTemperature: 25.5,
      airTemperature: 28.2,
      humidity: 75,
      gasLevel: 350,
      rainSensor: 0,
      rainLevel: 0,
      lightSensor: 1,
      lightLevel: 85,
      waterPump: false,
      timestamp: new Date().toISOString()
    };
    
    // Write to latest sensor data
    await db.ref(`devices/${deviceId}/sensors/latest`).set(testSensorData);
    console.log('✅ Test sensor data added to latest');
    
    // Add some historical data
    const historyData = {
      [Date.now()]: {
        soilMoisture: 65,
        soilTemperature: 25.5,
        airTemperature: 28.2,
        humidity: 75,
        gasLevel: 350,
        timestamp: new Date().toISOString()
      },
      [Date.now() - 300000]: { // 5 minutes ago
        soilMoisture: 63,
        soilTemperature: 25.2,
        airTemperature: 27.8,
        humidity: 73,
        gasLevel: 340,
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      [Date.now() - 600000]: { // 10 minutes ago
        soilMoisture: 61,
        soilTemperature: 24.8,
        airTemperature: 27.5,
        humidity: 71,
        gasLevel: 330,
        timestamp: new Date(Date.now() - 600000).toISOString()
      }
    };
    
    await db.ref(`devices/${deviceId}/sensors/history`).set(historyData);
    console.log('✅ Test historical data added');
    
    // Add irrigation status
    const irrigationData = {
      autoMode: false,
      pumpStatus: 'off',
      lastWatered: null,
      lastUpdated: new Date().toISOString()
    };
    
    await db.ref(`devices/${deviceId}/irrigation`).set(irrigationData);
    console.log('✅ Test irrigation data added');
    
    console.log('\n🎉 Test data successfully added!');
    console.log('📊 Data structure:');
    console.log(`   devices/${deviceId}/sensors/latest - Latest sensor readings`);
    console.log(`   devices/${deviceId}/sensors/history - Historical data (3 entries)`);
    console.log(`   devices/${deviceId}/irrigation - Irrigation control data`);
    
    console.log('\n💡 Now check your dashboard at http://localhost:3000/user/dashboard');
    console.log('   You should see the real-time sensor data displayed!');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    process.exit(0);
  }
}

addTestSensorData();
