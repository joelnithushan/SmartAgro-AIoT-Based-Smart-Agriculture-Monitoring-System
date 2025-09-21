const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function clearTestData() {
  try {
    console.log('🧹 Clearing test data to see real ESP32 data...');
    
    const db = admin.database();
    const deviceId = 'ESP32_001';
    
    // Clear the latest sensor data
    await db.ref(`devices/${deviceId}/sensors/latest`).remove();
    console.log('✅ Cleared latest sensor data');
    
    // Clear the history
    await db.ref(`devices/${deviceId}/sensors/history`).remove();
    console.log('✅ Cleared historical data');
    
    // Clear irrigation data
    await db.ref(`devices/${deviceId}/irrigation`).remove();
    console.log('✅ Cleared irrigation data');
    
    console.log('\n🎯 Test data cleared!');
    console.log('📡 Now your ESP32 should send fresh real data');
    console.log('⏰ Wait 30-60 seconds and check your dashboard again');
    console.log('💡 If no new data appears, your ESP32 might need to be restarted');
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
  } finally {
    process.exit(0);
  }
}

clearTestData();
