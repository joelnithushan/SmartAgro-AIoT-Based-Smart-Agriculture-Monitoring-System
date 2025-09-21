const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function checkRealDeviceData() {
  try {
    console.log('🔍 Checking for real device data from ESP32_001...');
    
    const db = admin.database();
    const deviceId = 'ESP32_001';
    
    // Check if device is sending data
    const latestRef = db.ref(`devices/${deviceId}/sensors/latest`);
    const latestSnapshot = await latestRef.once('value');
    
    if (latestSnapshot.exists()) {
      const data = latestSnapshot.val();
      console.log('✅ Device data found:');
      console.log('📊 Latest sensor data:', JSON.stringify(data, null, 2));
      
      // Check if this looks like real data or test data
      if (data.timestamp) {
        const dataTime = new Date(data.timestamp);
        const now = new Date();
        const timeDiff = now - dataTime;
        
        console.log(`⏰ Data timestamp: ${dataTime.toLocaleString()}`);
        console.log(`⏰ Current time: ${now.toLocaleString()}`);
        console.log(`⏰ Time difference: ${Math.round(timeDiff / 1000)} seconds ago`);
        
        if (timeDiff < 300000) { // Less than 5 minutes
          console.log('🟢 This appears to be recent real data from your ESP32!');
        } else {
          console.log('🟡 This data is older than 5 minutes - might be test data or device not sending recently');
        }
      }
    } else {
      console.log('❌ No device data found at devices/ESP32_001/sensors/latest');
      console.log('   This means your ESP32 is not sending data to Firebase');
    }
    
    // Check history
    const historyRef = db.ref(`devices/${deviceId}/sensors/history`);
    const historySnapshot = await historyRef.once('value');
    
    if (historySnapshot.exists()) {
      const historyData = historySnapshot.val();
      const historyKeys = Object.keys(historyData);
      console.log(`📈 Found ${historyKeys.length} historical data points`);
      
      if (historyKeys.length > 0) {
        const latestHistory = historyData[historyKeys[historyKeys.length - 1]];
        console.log('📊 Latest historical entry:', JSON.stringify(latestHistory, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking device data:', error);
  } finally {
    process.exit(0);
  }
}

checkRealDeviceData();
