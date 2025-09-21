const admin = require('firebase-admin');
const serviceAccount = require('./backend/config/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const database = admin.database();

async function test() {
  console.log('Testing...');
  const currentTime = Date.now();
  
  const testData = {
    soilMoisturePct: 50,
    airTemperature: 25,
    timestamp: currentTime
  };

  try {
    await database.ref('devices/ESP32_001/sensors/latest').set(testData);
    console.log('✅ Data written with timestamp:', currentTime);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
