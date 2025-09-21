const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function clearOldESP32Data() {
  console.log('🧹 Clearing old ESP32 data to force fresh data...');
  
  try {
    const database = admin.database();
    
    // Clear the old sensor data
    const deviceRef = database.ref('devices/ESP32_001');
    await deviceRef.child('sensors').remove();
    
    console.log('✅ Cleared old sensor data');
    console.log('🔄 ESP32 should now send fresh data with new structure');
    console.log('⏰ Wait 12-15 seconds for new data to appear');
    
    // Wait a moment and check for new data
    setTimeout(async () => {
      console.log('\n🔍 Checking for new data...');
      const latestRef = database.ref('devices/ESP32_001/sensors/latest');
      const snapshot = await latestRef.once('value');
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('✅ New data received!');
        console.log('📊 New data structure:', JSON.stringify(data, null, 2));
        
        // Check if it has the new fields
        if (data.soilMoistureRaw && data.soilMoisturePct && data.airQualityIndex) {
          console.log('🎉 SUCCESS! ESP32 is sending new data structure!');
        } else {
          console.log('⚠️  Still old data structure - ESP32 needs to be updated');
        }
      } else {
        console.log('❌ No new data yet - ESP32 might not be running');
      }
    }, 15000);
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

clearOldESP32Data();
