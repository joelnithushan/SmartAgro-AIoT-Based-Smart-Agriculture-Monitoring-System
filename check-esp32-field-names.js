const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function checkESP32FieldNames() {
  try {
    console.log('🔍 Checking ESP32 field names...');
    
    const db = admin.database();
    const deviceId = 'ESP32_001';
    
    const latestRef = db.ref(`devices/${deviceId}/sensors/latest`);
    const latestSnapshot = await latestRef.once('value');
    
    if (latestSnapshot.exists()) {
      const data = latestSnapshot.val();
      console.log('📊 ESP32 is sending these field names:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\n🔧 Field mapping needed:');
      console.log('ESP32 sends → Frontend expects');
      console.log(`airTemp (${data.airTemp}) → airTemperature`);
      console.log(`airHumidity (${data.airHumidity}) → humidity`);
      console.log(`soilTemp (${data.soilTemp}) → soilTemperature`);
      console.log(`gasLevel (${data.gasLevel}) → gasLevel ✓`);
      console.log(`rain (${data.rain}) → rainSensor`);
      console.log(`light (${data.light}) → lightSensor`);
      console.log(`pumpStatus (${data.pumpStatus}) → waterPump`);
      
    } else {
      console.log('❌ No data found');
    }
    
  } catch (error) {
    console.error('❌ Error checking field names:', error);
  } finally {
    process.exit(0);
  }
}

checkESP32FieldNames();
