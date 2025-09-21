/**
 * Test script to debug pump control issues
 * Run this in browser console to test pump control
 */

console.log('🧪 Testing Pump Control...');

// Test 1: Check authentication
const testAuth = () => {
  console.log('\n🔐 Testing Authentication:');
  
  // Check if Firebase auth is available
  if (typeof window !== 'undefined' && window.firebase) {
    console.log('✅ Firebase is available');
  } else {
    console.log('❌ Firebase not available - check imports');
  }
  
  // Check if user is logged in
  console.log('Check browser console for authentication logs');
  console.log('Look for: "👤 User: [email] ([uid])"');
};

// Test 2: Check Firebase rules
const testFirebaseRules = () => {
  console.log('\n🔒 Testing Firebase Rules:');
  console.log('1. Go to Firebase Console → Realtime Database → Rules');
  console.log('2. Check if rules are deployed');
  console.log('3. Verify this path allows authenticated writes:');
  console.log('   /devices/{deviceId}/control/relay/status');
  console.log('4. Should have: ".write": "auth != null"');
};

// Test 3: Check device path
const testDevicePath = () => {
  console.log('\n📡 Testing Device Path:');
  console.log('1. Go to Firebase Console → Realtime Database');
  console.log('2. Navigate to: /devices/ESP32_001/control/relay/status');
  console.log('3. Check if this path exists');
  console.log('4. Try to manually write a value to test permissions');
};

// Test 4: Check error logs
const testErrorLogs = () => {
  console.log('\n🔍 Testing Error Logs:');
  console.log('1. Open browser console (F12)');
  console.log('2. Try to control the pump');
  console.log('3. Look for these error messages:');
  console.log('   - "❌ Error toggling pump:"');
  console.log('   - "🔒 Permission denied"');
  console.log('   - "❌ Missing deviceId or database"');
  console.log('   - "❌ User not authenticated"');
};

// Test 5: Manual Firebase test
const testManualFirebase = () => {
  console.log('\n🧪 Manual Firebase Test:');
  console.log('1. Go to Firebase Console → Realtime Database');
  console.log('2. Click on "devices" → "ESP32_001" → "control" → "relay"');
  console.log('3. Click on "status"');
  console.log('4. Try to add/edit a value manually');
  console.log('5. If it works manually, the issue is in the frontend code');
  console.log('6. If it fails manually, the issue is in Firebase rules');
};

// Test 6: Check network
const testNetwork = () => {
  console.log('\n🌐 Testing Network:');
  console.log('1. Check if you can access other Firebase data');
  console.log('2. Check if sensor data is updating');
  console.log('3. Check browser network tab for failed requests');
  console.log('4. Look for 403 (Forbidden) or 401 (Unauthorized) errors');
};

// Run all tests
const runAllTests = () => {
  testAuth();
  testFirebaseRules();
  testDevicePath();
  testErrorLogs();
  testManualFirebase();
  testNetwork();
  
  console.log('\n📋 Common Solutions:');
  console.log('1. If "Permission denied": Check Firebase rules and user authentication');
  console.log('2. If "User not authenticated": Log out and log back in');
  console.log('3. If "Missing deviceId": Check if device is properly assigned');
  console.log('4. If "Database not available": Check Firebase configuration');
  console.log('5. If manual Firebase works: Check frontend code for bugs');
};

// Quick diagnostic
const quickDiagnostic = () => {
  console.log('\n⚡ Quick Diagnostic:');
  console.log('1. Try controlling the pump');
  console.log('2. Check browser console for error messages');
  console.log('3. Look for the specific error code and message');
  console.log('4. Report the exact error message for further help');
};

console.log('Run quickDiagnostic() for immediate help');
console.log('Run runAllTests() for comprehensive testing');

// Export functions for manual testing
window.testPumpControl = {
  testAuth,
  testFirebaseRules,
  testDevicePath,
  testErrorLogs,
  testManualFirebase,
  testNetwork,
  runAllTests,
  quickDiagnostic
};