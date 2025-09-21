/**
 * Test script to verify ESP32 relay control
 * Run this in browser console on the dashboard page
 */

async function testESP32Relay() {
  console.log('🧪 Testing ESP32 Relay Control...');
  
  try {
    // Import Firebase functions
    const { ref, update, get } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
    
    // Get database instance
    const database = firebase.database();
    const deviceId = "ESP32_001";
    
    // Test 1: Check current relay status
    console.log('📖 Step 1: Checking current relay status...');
    const currentRef = ref(database, `devices/${deviceId}/control/relay/status`);
    const currentSnapshot = await get(currentRef);
    console.log('Current relay status:', currentSnapshot.val());
    
    // Test 2: Send ON command
    console.log('📤 Step 2: Sending ON command...');
    const onPayload = {
      value: "on",
      requestedBy: "test-user",
      requestedByEmail: "test@example.com",
      timestamp: Date.now()
    };
    
    await update(currentRef, onPayload);
    console.log('✅ ON command sent:', onPayload);
    
    // Test 3: Wait and check if ESP32 processed it
    console.log('⏳ Step 3: Waiting for ESP32 to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const afterSnapshot = await get(currentRef);
    console.log('Relay status after 3 seconds:', afterSnapshot.val());
    
    // Test 4: Send OFF command
    console.log('📤 Step 4: Sending OFF command...');
    const offPayload = {
      value: "off",
      requestedBy: "test-user",
      requestedByEmail: "test@example.com",
      timestamp: Date.now()
    };
    
    await update(currentRef, offPayload);
    console.log('✅ OFF command sent:', offPayload);
    
    // Test 5: Final check
    console.log('⏳ Step 5: Final check...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalSnapshot = await get(currentRef);
    console.log('Final relay status:', finalSnapshot.val());
    
    console.log('🎯 Test complete! Check ESP32 Serial Monitor for relay control messages.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run if Firebase is available
if (typeof firebase !== 'undefined') {
  console.log('✅ Firebase detected. Run: testESP32Relay()');
} else {
  console.log('❌ Firebase not detected. Make sure you\'re on the dashboard page.');
}

// Export for manual testing
window.testESP32Relay = testESP32Relay;
