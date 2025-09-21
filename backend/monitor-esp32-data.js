const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function monitorESP32Data() {
  try {
    console.log('🔍 Monitoring ESP32_001 for new data...');
    console.log('⏰ Checking every 10 seconds for 2 minutes...\n');
    
    const db = admin.database();
    const deviceId = 'ESP32_001';
    let checkCount = 0;
    const maxChecks = 12; // 2 minutes
    
    const checkInterval = setInterval(async () => {
      checkCount++;
      console.log(`📡 Check ${checkCount}/${maxChecks} - ${new Date().toLocaleTimeString()}`);
      
      try {
        // Check latest sensor data
        const latestRef = db.ref(`devices/${deviceId}/sensors/latest`);
        const latestSnapshot = await latestRef.once('value');
        
        if (latestSnapshot.exists()) {
          const data = latestSnapshot.val();
          console.log('✅ NEW DATA RECEIVED!');
          console.log('📊 Sensor readings:');
          console.log(`   Soil Moisture: ${data.soilMoisture}%`);
          console.log(`   Air Temperature: ${data.airTemperature}°C`);
          console.log(`   Soil Temperature: ${data.soilTemperature}°C`);
          console.log(`   Humidity: ${data.humidity}%`);
          console.log(`   Air Quality: ${data.gasLevel}`);
          console.log(`   Rain: ${data.rainSensor ? 'Yes' : 'No'}`);
          console.log(`   Light: ${data.lightSensor ? 'On' : 'Off'}`);
          console.log(`   Water Pump: ${data.waterPump ? 'On' : 'Off'}`);
          console.log(`   Timestamp: ${data.timestamp}`);
          console.log('\n🎉 Your ESP32 is working! Check your dashboard now!');
          clearInterval(checkInterval);
          process.exit(0);
        } else {
          console.log('⏳ No data yet...');
        }
        
        // Check if we've reached max checks
        if (checkCount >= maxChecks) {
          console.log('\n❌ No data received after 2 minutes');
          console.log('🔧 Troubleshooting steps:');
          console.log('   1. Check ESP32 Serial Monitor for error messages');
          console.log('   2. Verify WiFi connection');
          console.log('   3. Check Firebase URL in code');
          console.log('   4. Restart ESP32 device');
          clearInterval(checkInterval);
          process.exit(0);
        }
        
      } catch (error) {
        console.log(`❌ Error checking data: ${error.message}`);
      }
    }, 10000); // Check every 10 seconds
    
  } catch (error) {
    console.error('❌ Error setting up monitoring:', error);
    process.exit(1);
  }
}

monitorESP32Data();
