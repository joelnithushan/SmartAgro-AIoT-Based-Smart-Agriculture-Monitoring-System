// Manual test of alert processing using the running server
const fetch = require('node-fetch');

async function testAlertTrigger() {
  try {
    console.log('🧪 Testing alert trigger through server...');
    
    // Test sensor data
    const testSensorData = {
      soilMoistureRaw: 2824,  // This should convert to ~24%
      soilMoisturePct: 24,     // Direct percentage
      airTemperature: 29.8,
      airHumidity: 46,
      soilTemperature: 28.625
    };
    
    const deviceId = 'ESP32_001';
    
    console.log('📊 Test sensor data:', testSensorData);
    console.log('📱 Test device ID:', deviceId);
    
    // First, let's create test data in Firestore
    console.log('📝 Creating test data in Firestore...');
    
    // We need to use the server's Firebase instance
    // Let's try to trigger the alert processing directly
    const response = await fetch('http://localhost:5000/process-alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sensorData: testSensorData,
        deviceId: deviceId
      })
    });
    
    const result = await response.json();
    console.log('📊 Server response:', result);
    
    if (result.success) {
      console.log('✅ Alert processing initiated successfully!');
      console.log('📱 Check your UI for triggered alerts in the "Triggered Alerts" section');
    } else {
      console.log('❌ Alert processing failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error in manual alert test:', error);
  }
}

// Run the test
testAlertTrigger();
