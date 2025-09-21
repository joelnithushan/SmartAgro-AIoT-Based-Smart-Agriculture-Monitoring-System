/**
 * Test script to verify pump control communication between frontend and ESP32
 * Run this in the browser console to test Firebase communication
 */

// Test function to simulate pump control
async function testPumpControl(status) {
  console.log(`🧪 Testing pump control: ${status}`);
  
  try {
    // Import Firebase functions (assuming they're available globally)
    const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
    
    // Get the database instance (you'll need to replace this with your actual database instance)
    const database = firebase.database(); // Adjust this based on your Firebase setup
    
    const deviceId = "ESP32_001";
    const controlPayload = {
      value: status,
      requestedBy: "test-user",
      requestedByEmail: "test@example.com",
      timestamp: Date.now()
    };
    
    console.log(`📦 Sending payload:`, controlPayload);
    
    const relayStatusRef = ref(database, `devices/${deviceId}/control/relay/status`);
    await update(relayStatusRef, controlPayload);
    
    console.log(`✅ Pump control command sent successfully`);
    
    // Check what was actually written
    setTimeout(async () => {
      const snapshot = await relayStatusRef.once('value');
      console.log(`📖 What ESP32 should see:`, snapshot.val());
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error testing pump control:', error);
  }
}

// Test both ON and OFF commands
console.log('🧪 Pump Control Test Script Loaded');
console.log('Run: testPumpControl("on") or testPumpControl("off")');

// Auto-test if Firebase is available
if (typeof firebase !== 'undefined') {
  console.log('✅ Firebase detected, ready for testing');
} else {
  console.log('❌ Firebase not detected. Make sure you\'re on the dashboard page.');
}
