/**
 * Test Firebase Communication
 * Run this in browser console to test Firebase data flow
 */

console.log('🔥 Testing Firebase Communication...');

// Test 1: Check if Firebase is accessible
const testFirebaseAccess = () => {
  console.log('\n📡 Test 1: Firebase Access');
  console.log('1. Go to Firebase Console → Realtime Database');
  console.log('2. Navigate to: /devices/ESP32_001/control/relay/status');
  console.log('3. Check if this path exists');
  console.log('4. If path doesn\'t exist → Create it manually');
  console.log('5. If path exists → Check if it has data');
};

// Test 2: Test manual Firebase write
const testManualFirebaseWrite = () => {
  console.log('\n✍️ Test 2: Manual Firebase Write');
  console.log('1. Go to Firebase Console → Realtime Database');
  console.log('2. Navigate to: /devices/ESP32_001/control/relay/status');
  console.log('3. Click "Add child" or edit existing data');
  console.log('4. Add this JSON:');
  console.log('   {"value": "on", "requestedBy": "test", "timestamp": ' + Date.now() + '}');
  console.log('5. Save the data');
  console.log('6. Check ESP32 Serial Monitor for:');
  console.log('   "⚡ INSTANT: Relay command received: on"');
  console.log('7. If ESP32 responds → Firebase communication works');
  console.log('8. If ESP32 doesn\'t respond → ESP32 issue');
};

// Test 3: Test frontend Firebase write
const testFrontendFirebaseWrite = () => {
  console.log('\n🖥️ Test 3: Frontend Firebase Write');
  console.log('1. Open browser console (F12)');
  console.log('2. Try controlling the pump from UI');
  console.log('3. Look for these messages:');
  console.log('   "🔄 Attempting to control pump: on for device: ESP32_001"');
  console.log('   "✅ Instant relay status updated: on"');
  console.log('4. Check Firebase Console for data updates');
  console.log('5. If frontend writes but ESP32 doesn\'t respond → ESP32 issue');
  console.log('6. If frontend doesn\'t write → Frontend issue');
};

// Test 4: Check Firebase rules
const testFirebaseRules = () => {
  console.log('\n🔒 Test 4: Firebase Rules');
  console.log('1. Go to Firebase Console → Realtime Database → Rules');
  console.log('2. Check if rules are deployed');
  console.log('3. Look for this path in rules:');
  console.log('   /devices/{deviceId}/control/relay/status');
  console.log('4. Should have: ".read": "auth != null"');
  console.log('5. Should have: ".write": "auth != null"');
  console.log('6. If rules are missing → Deploy the rules');
  console.log('7. If rules are wrong → Fix the rules');
};

// Test 5: Check device ID
const testDeviceId = () => {
  console.log('\n🆔 Test 5: Device ID');
  console.log('1. Check ESP32 Serial Monitor for device ID');
  console.log('2. Look for: "DEVICE_ID = ESP32_001"');
  console.log('3. Check Firebase Console path:');
  console.log('   /devices/ESP32_001/control/relay/status');
  console.log('4. Ensure device ID matches exactly');
  console.log('5. Check for typos or case mismatches');
};

// Test 6: Check network connectivity
const testNetworkConnectivity = () => {
  console.log('\n🌐 Test 6: Network Connectivity');
  console.log('1. Check if ESP32 can send sensor data to Firebase');
  console.log('2. Look in Firebase Console: /devices/ESP32_001/sensors/latest');
  console.log('3. If sensor data is updating → Network is working');
  console.log('4. If sensor data is not updating → Network issue');
  console.log('5. Check ESP32 Serial Monitor for WiFi connection');
};

// Test 7: Check ESP32 response
const testESP32Response = () => {
  console.log('\n📱 Test 7: ESP32 Response');
  console.log('1. Open ESP32 Serial Monitor (115200 baud)');
  console.log('2. Look for these messages every 200ms:');
  console.log('   "🔍 Checking for relay commands: ..."');
  console.log('   "📡 HTTP Response Code: 200"');
  console.log('3. If you see these messages → ESP32 is checking');
  console.log('4. If you don\'t see these messages → ESP32 issue');
  console.log('5. Try controlling the pump and look for:');
  console.log('   "⚡ INSTANT: Relay command received: on"');
};

// Test 8: Check JSON format
const testJSONFormat = () => {
  console.log('\n📄 Test 8: JSON Format');
  console.log('1. Check Firebase Console for relay status data');
  console.log('2. Should look like:');
  console.log('   {"value": "on", "requestedBy": "user-id", "timestamp": 1234567890}');
  console.log('3. If data is malformed → Fix frontend code');
  console.log('4. If data is correct → Check ESP32 JSON parsing');
};

// Run all tests
const runAllTests = () => {
  testFirebaseAccess();
  testManualFirebaseWrite();
  testFrontendFirebaseWrite();
  testFirebaseRules();
  testDeviceId();
  testNetworkConnectivity();
  testESP32Response();
  testJSONFormat();
  
  console.log('\n📋 Summary:');
  console.log('1. If manual Firebase write works but ESP32 doesn\'t respond → ESP32 issue');
  console.log('2. If frontend can\'t write to Firebase → Frontend/Firebase rules issue');
  console.log('3. If ESP32 doesn\'t check for commands → ESP32 code issue');
  console.log('4. If ESP32 checks but gets no response → Firebase/network issue');
};

// Quick diagnostic
const quickDiagnostic = () => {
  console.log('\n⚡ Quick Diagnostic:');
  console.log('1. Try controlling the pump');
  console.log('2. Check ESP32 Serial Monitor for:');
  console.log('   - "🔍 Checking for relay commands"');
  console.log('   - "⚡ INSTANT: Relay command received"');
  console.log('3. Check Firebase Console for data updates');
  console.log('4. Check browser console for errors');
  console.log('5. Report what you see in each location');
};

console.log('Run quickDiagnostic() for immediate help');
console.log('Run runAllTests() for comprehensive testing');

// Export functions
window.firebaseTest = {
  testFirebaseAccess,
  testManualFirebaseWrite,
  testFrontendFirebaseWrite,
  testFirebaseRules,
  testDeviceId,
  testNetworkConnectivity,
  testESP32Response,
  testJSONFormat,
  runAllTests,
  quickDiagnostic
};
