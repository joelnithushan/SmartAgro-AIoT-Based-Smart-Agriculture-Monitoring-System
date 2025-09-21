/**
 * Debug script to test online/offline detection
 * Run this in browser console to debug the issue
 */

console.log('🔍 Debugging Online/Offline Detection...');

// Test the online detection logic
const testOnlineDetection = (lastSeen) => {
  const now = Date.now();
  console.log('Current time:', now);
  console.log('LastSeen value:', lastSeen);
  
  // If timestamp is very small (< 1000000000), it's likely millis() from ESP32
  if (lastSeen < 1000000000) {
    console.log('✅ Detected ESP32 millis() timestamp');
    console.log('This means device is running and sending updates');
    return true;
  }
  
  // Handle Unix timestamps
  let normalizedLastSeen = lastSeen;
  if (lastSeen < 1000000000000) {
    normalizedLastSeen = lastSeen * 1000;
    console.log('Converted seconds to milliseconds:', normalizedLastSeen);
  }
  
  const timeDiff = now - normalizedLastSeen;
  const isOnline = timeDiff < 20000; // 20 seconds
  
  console.log('Time difference:', Math.round(timeDiff/1000), 'seconds');
  console.log('Is online:', isOnline);
  
  return isOnline;
};

// Test with different timestamp values
console.log('\n🧪 Testing with different timestamp values:');

// Test 1: ESP32 millis() timestamp (should be online)
console.log('\nTest 1: ESP32 millis() timestamp (50000ms since boot)');
testOnlineDetection(50000);

// Test 2: Recent Unix timestamp (should be online)
console.log('\nTest 2: Recent Unix timestamp (5 seconds ago)');
testOnlineDetection(Math.floor((Date.now() - 5000) / 1000));

// Test 3: Old Unix timestamp (should be offline)
console.log('\nTest 3: Old Unix timestamp (30 seconds ago)');
testOnlineDetection(Math.floor((Date.now() - 30000) / 1000));

// Test 4: Very old timestamp (should be offline)
console.log('\nTest 4: Very old timestamp (1 hour ago)');
testOnlineDetection(Math.floor((Date.now() - 3600000) / 1000));

console.log('\n📋 Instructions:');
console.log('1. Check browser console for online detection logs');
console.log('2. Look for "🕐 Device online check" messages');
console.log('3. Verify the lastSeen value from Firebase');
console.log('4. Check if ESP32 is sending regular updates');

// Function to check Firebase data
const checkFirebaseData = async () => {
  console.log('\n🔍 Checking Firebase data...');
  console.log('Go to Firebase Console → Realtime Database');
  console.log('Check: /devices/ESP32_001/meta/lastSeen');
  console.log('Check: /devices/ESP32_001/sensors/latest');
  console.log('Look for recent updates in both paths');
};

checkFirebaseData();
