/**
 * Relay Diagnostic Test
 * Run this in browser console to test relay control
 */

console.log('🔧 Relay Diagnostic Test...');

// Test 1: Check if ESP32 is receiving commands
const testESP32Reception = () => {
  console.log('\n📡 Testing ESP32 Command Reception:');
  console.log('1. Open ESP32 Serial Monitor (Arduino IDE → Tools → Serial Monitor)');
  console.log('2. Set baud rate to 115200');
  console.log('3. Try controlling the pump from the UI');
  console.log('4. Look for these messages in Serial Monitor:');
  console.log('   ✅ "⚡ INSTANT: Relay command received: on (Response time: XXXms)"');
  console.log('   ✅ "💧 Pump turned ON"');
  console.log('   ✅ "💧 Pump turned OFF"');
  console.log('5. If you see these messages → ESP32 is receiving commands');
  console.log('6. If you don\'t see these messages → ESP32 is not receiving commands');
};

// Test 2: Check Firebase data flow
const testFirebaseDataFlow = () => {
  console.log('\n🔥 Testing Firebase Data Flow:');
  console.log('1. Go to Firebase Console → Realtime Database');
  console.log('2. Navigate to: /devices/ESP32_001/control/relay/status');
  console.log('3. Try controlling the pump from the UI');
  console.log('4. Check if the value changes in Firebase:');
  console.log('   - Should show: {"value": "on", "requestedBy": "...", "timestamp": ...}');
  console.log('   - Should update immediately when you click the button');
  console.log('5. If Firebase updates → Frontend is working');
  console.log('6. If Firebase doesn\'t update → Frontend issue');
};

// Test 3: Check relay hardware
const testRelayHardware = () => {
  console.log('\n⚡ Testing Relay Hardware:');
  console.log('1. Check relay module connections:');
  console.log('   - VCC → ESP32 3.3V');
  console.log('   - GND → ESP32 GND');
  console.log('   - IN (or SIG) → ESP32 GPIO14');
  console.log('2. Check pump connections:');
  console.log('   - Pump positive → Relay NO (Normally Open)');
  console.log('   - Pump negative → Power supply negative');
  console.log('   - Power supply positive → Relay COM (Common)');
  console.log('3. Test relay manually:');
  console.log('   - Disconnect GPIO14 from relay');
  console.log('   - Connect GPIO14 to GND → Pump should turn ON');
  console.log('   - Connect GPIO14 to 3.3V → Pump should turn OFF');
  console.log('4. If manual test works → Relay hardware is OK');
  console.log('5. If manual test fails → Check wiring or relay module');
};

// Test 4: Check ESP32 pin output
const testESP32PinOutput = () => {
  console.log('\n📌 Testing ESP32 Pin Output:');
  console.log('1. Use a multimeter or LED to test GPIO14:');
  console.log('   - When pump should be ON: GPIO14 should be LOW (0V)');
  console.log('   - When pump should be OFF: GPIO14 should be HIGH (3.3V)');
  console.log('2. If pin output is correct → ESP32 code is working');
  console.log('3. If pin output is wrong → ESP32 code issue');
};

// Test 5: Check relay module type
const testRelayModuleType = () => {
  console.log('\n🔌 Testing Relay Module Type:');
  console.log('1. Check if your relay module is ACTIVE LOW or ACTIVE HIGH:');
  console.log('   - ACTIVE LOW: LOW signal turns relay ON');
  console.log('   - ACTIVE HIGH: HIGH signal turns relay ON');
  console.log('2. The ESP32 code assumes ACTIVE LOW relay');
  console.log('3. If your relay is ACTIVE HIGH, you need to change the code');
  console.log('4. Test: Connect relay IN pin to GND → Should hear relay click');
  console.log('5. If clicking when connected to GND → ACTIVE LOW (correct)');
  console.log('6. If clicking when connected to 3.3V → ACTIVE HIGH (needs code change)');
};

// Test 6: Check power supply
const testPowerSupply = () => {
  console.log('\n🔋 Testing Power Supply:');
  console.log('1. Check if pump power supply is adequate:');
  console.log('   - Pump voltage rating (e.g., 12V, 24V)');
  console.log('   - Pump current rating (e.g., 1A, 2A)');
  console.log('   - Power supply capacity');
  console.log('2. Check relay module rating:');
  console.log('   - Relay voltage rating (e.g., 5V, 12V)');
  console.log('   - Relay current rating (e.g., 10A, 30A)');
  console.log('3. Ensure power supply can handle pump + relay load');
};

// Test 7: Check for common issues
const testCommonIssues = () => {
  console.log('\n🚨 Common Issues Checklist:');
  console.log('1. ✅ ESP32 Serial Monitor shows command reception');
  console.log('2. ✅ Firebase updates when button is clicked');
  console.log('3. ✅ GPIO14 pin output changes (LOW for ON, HIGH for OFF)');
  console.log('4. ✅ Relay clicks when GPIO14 goes LOW');
  console.log('5. ✅ Pump power supply is adequate');
  console.log('6. ✅ Pump is connected to relay NO and COM terminals');
  console.log('7. ✅ All connections are secure');
  console.log('8. ✅ Relay module is ACTIVE LOW type');
};

// Test 8: Manual relay test
const testManualRelay = () => {
  console.log('\n🧪 Manual Relay Test:');
  console.log('1. Disconnect GPIO14 from relay module');
  console.log('2. Connect a jumper wire from GPIO14 to GND');
  console.log('3. Pump should turn ON immediately');
  console.log('4. Disconnect the jumper wire');
  console.log('5. Pump should turn OFF immediately');
  console.log('6. If this works → Relay and pump are OK, issue is in ESP32 code');
  console.log('7. If this doesn\'t work → Check wiring, relay, or pump');
};

// Run all tests
const runAllTests = () => {
  testESP32Reception();
  testFirebaseDataFlow();
  testRelayHardware();
  testESP32PinOutput();
  testRelayModuleType();
  testPowerSupply();
  testCommonIssues();
  testManualRelay();
  
  console.log('\n📋 Next Steps:');
  console.log('1. Run through each test systematically');
  console.log('2. Identify which test fails');
  console.log('3. Fix the issue based on the test results');
  console.log('4. If ESP32 receives commands but relay doesn\'t work → Hardware issue');
  console.log('5. If ESP32 doesn\'t receive commands → Software/network issue');
};

// Quick diagnostic
const quickDiagnostic = () => {
  console.log('\n⚡ Quick Diagnostic:');
  console.log('1. Try controlling the pump');
  console.log('2. Check ESP32 Serial Monitor for:');
  console.log('   - "⚡ INSTANT: Relay command received"');
  console.log('   - "💧 Pump turned ON/OFF"');
  console.log('3. If you see these messages → ESP32 is working, check hardware');
  console.log('4. If you don\'t see these messages → ESP32 is not receiving commands');
  console.log('5. Check Firebase Console for data updates');
};

console.log('Run quickDiagnostic() for immediate help');
console.log('Run runAllTests() for comprehensive testing');

// Export functions
window.relayDiagnostic = {
  testESP32Reception,
  testFirebaseDataFlow,
  testRelayHardware,
  testESP32PinOutput,
  testRelayModuleType,
  testPowerSupply,
  testCommonIssues,
  testManualRelay,
  runAllTests,
  quickDiagnostic
};
