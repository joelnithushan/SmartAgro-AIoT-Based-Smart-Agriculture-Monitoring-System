const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const database = admin.database();

async function testFreshData() {
  console.log('🧪 Testing Fresh Data Injection...');
  const DEVICE_ID = "ESP32_001";

  try {
    // Create fresh test data with current timestamp
    const currentTime = Date.now();
    const testData = {
      soilMoistureRaw: 2500,
      soilMoisturePct: 35,
      airTemperature: 28.5,
      airHumidity: 65,
      soilTemperature: 25.2,
      airQualityIndex: 120,
      gases: {
        co2: 350,
        nh3: 15
      },
      lightDetected: 1,
      rainLevelRaw: 1800,
      relayStatus: "off",
      timestamp: currentTime
    };

    console.log('📊 Injecting fresh test data:');
    console.log(JSON.stringify(testData, null, 2));

    // Write to latest sensor data
    const latestRef = database.ref(`devices/${DEVICE_ID}/sensors/latest`);
    await latestRef.set(testData);

    // Also add to history
    const historyRef = database.ref(`devices/${DEVICE_ID}/sensors/history/${currentTime}`);
    await historyRef.set(testData);

    console.log('✅ Fresh test data injected successfully!');
    console.log('🕐 Timestamp:', currentTime);
    console.log('📱 Frontend should now show device as ONLINE with this data');

    // Wait a moment and check if data is there
    setTimeout(async () => {
      const snapshot = await latestRef.once('value');
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('✅ Data confirmed in Firebase:', JSON.stringify(data, null, 2));
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFreshData();
