const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const database = admin.database();

async function testTimestamp() {
  console.log('🕐 Testing ESP32 Timestamp Format...');
  const DEVICE_ID = "ESP32_001";

  try {
    const latestRef = database.ref(`devices/${DEVICE_ID}/sensors/latest`);
    const snapshot = await latestRef.once('value');
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('📊 Current data:', JSON.stringify(data, null, 2));
      
      if (data.timestamp) {
        const esp32Timestamp = data.timestamp;
        const currentTime = Date.now();
        const dataAge = currentTime - esp32Timestamp;
        
        console.log('\n🕐 Timestamp Analysis:');
        console.log(`   ESP32 Timestamp: ${esp32Timestamp}`);
        console.log(`   Current Time: ${currentTime}`);
        console.log(`   Data Age: ${Math.round(dataAge / 1000)} seconds`);
        
        if (dataAge < 30000) {
          console.log('✅ Data is FRESH (less than 30 seconds old)');
        } else {
          console.log('❌ Data is STALE (more than 30 seconds old)');
        }
        
        // Check if timestamp looks like Unix timestamp
        if (esp32Timestamp > 1000000000000) { // Unix timestamp in milliseconds
          console.log('✅ Timestamp format looks correct (Unix timestamp)');
        } else {
          console.log('❌ Timestamp format looks wrong (should be Unix timestamp)');
          console.log('   Expected: Large number (e.g., 1734567890123)');
          console.log('   Got: Small number (e.g., 12345)');
        }
      } else {
        console.log('❌ No timestamp found in data');
      }
    } else {
      console.log('❌ No data found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTimestamp();
