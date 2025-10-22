// Direct test of alert processing
const admin = require('firebase-admin');

// Use existing Firebase Admin app
console.log('✅ Using existing Firebase Admin app');

const db = admin.firestore();

async function testDirectAlert() {
  try {
    console.log('🧪 Testing direct alert processing...');
    
    // Test sensor data
    const testSensorData = {
      soilMoistureRaw: 2824,  // This should convert to ~24%
      soilMoisturePct: 24,     // Direct percentage
      airTemperature: 29.8,
      airHumidity: 46,
      soilTemperature: 28.625
    };
    
    const deviceId = 'ESP32_001';
    const testUserId = 'test-user-123'; // Use a test user ID
    
    console.log('📊 Test sensor data:', testSensorData);
    console.log('👤 Test user ID:', testUserId);
    console.log('📱 Test device ID:', deviceId);
    
    // Create a test alert for the user
    const testAlert = {
      parameter: 'soilMoisturePct',
      comparison: '<',
      threshold: 30,
      type: 'email',
      value: 'test@example.com',
      active: true,
      critical: false,
      createdAt: new Date()
    };
    
    console.log('📝 Creating test alert...');
    await db.collection('users').doc(testUserId).collection('alerts').add(testAlert);
    console.log('✅ Test alert created');
    
    // Create a test device assignment
    console.log('📱 Creating test device assignment...');
    await db.collection('devices').doc(deviceId).set({
      ownerId: testUserId,
      assignedTo: testUserId,
      status: 'active',
      createdAt: new Date()
    });
    console.log('✅ Test device assignment created');
    
    // Now test the alert processing
    console.log('🔍 Processing alerts...');
    
    // Import and use the alert processor
    const { processAlerts } = require('./functions/alertProcessor.js');
    await processAlerts(testSensorData, deviceId);
    
    console.log('✅ Alert processing completed!');
    console.log('📱 Check your UI for triggered alerts in the "Triggered Alerts" section');
    console.log('🔍 Check Firestore collections:');
    console.log('   - triggered_alerts/{userId}/alerts');
    console.log('   - users/{userId}/triggeredAlerts');
    
  } catch (error) {
    console.error('❌ Error in direct alert test:', error);
  }
}

// Run the test
testDirectAlert();
