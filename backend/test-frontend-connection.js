const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const database = admin.database();

async function testFrontendConnection() {
  console.log('🔍 Testing Frontend Connection...');
  const DEVICE_ID = "ESP32_001";

  try {
    // Test if we can read the data that frontend should see
    const latestRef = database.ref(`devices/${DEVICE_ID}/sensors/latest`);
    const snapshot = await latestRef.once('value');
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('📊 Data that frontend should see:');
      console.log(JSON.stringify(data, null, 2));
      
      // Simulate frontend timestamp check
      const dataTimestamp = data.timestamp || 0;
      const currentTime = Date.now();
      const dataAge = currentTime - dataTimestamp;
      const isDataFresh = dataAge < 30000; // 30 seconds
      
      console.log('\n🕐 Frontend Timestamp Check:');
      console.log(`   Data Timestamp: ${dataTimestamp}`);
      console.log(`   Current Time: ${currentTime}`);
      console.log(`   Data Age: ${Math.round(dataAge / 1000)} seconds`);
      console.log(`   Is Fresh: ${isDataFresh ? 'YES' : 'NO'}`);
      console.log(`   Device Status: ${isDataFresh ? 'ONLINE' : 'OFFLINE'}`);
      
      if (isDataFresh) {
        console.log('✅ Frontend should show device as ONLINE with real data');
      } else {
        console.log('❌ Frontend should show device as OFFLINE with all zeros');
      }
    } else {
      console.log('❌ No data found - frontend will show device as offline');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFrontendConnection();
