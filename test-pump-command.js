// Test script to manually send pump commands to Firebase
// Run this in browser console to test pump control

// Replace with your Firebase config
const firebaseConfig = {
  // Your Firebase config here
};

// Replace with your device ID
const DEVICE_ID = "ESP32_001";

// Replace with your Firebase Realtime Database URL
const FIREBASE_URL = "https://your-project-id-default-rtdb.firebaseio.com";

// Test function to send pump command
async function testPumpCommand(status) {
  console.log(`🧪 Testing pump command: ${status}`);
  
  try {
    const response = await fetch(`${FIREBASE_URL}/devices/${DEVICE_ID}/control/relay/status.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: status,
        requestedBy: "test-user",
        requestedByEmail: "test@example.com",
        timestamp: Date.now()
      })
    });
    
    if (response.ok) {
      console.log(`✅ Successfully sent pump ${status} command`);
      console.log(`📡 Response status: ${response.status}`);
      
      // Check what was actually written
      const checkResponse = await fetch(`${FIREBASE_URL}/devices/${DEVICE_ID}/control/relay/status.json`);
      const data = await checkResponse.json();
      console.log(`📦 Data written to Firebase:`, data);
      
    } else {
      console.error(`❌ Failed to send pump command: ${response.status}`);
      const errorText = await response.text();
      console.error(`❌ Error details:`, errorText);
    }
    
  } catch (error) {
    console.error(`❌ Network error:`, error);
  }
}

// Test function to check current relay status
async function checkRelayStatus() {
  console.log(`🔍 Checking current relay status...`);
  
  try {
    const response = await fetch(`${FIREBASE_URL}/devices/${DEVICE_ID}/control/relay/status.json`);
    const data = await response.json();
    
    console.log(`📦 Current relay status:`, data);
    
    if (data && data.value) {
      console.log(`💧 Pump is currently: ${data.value}`);
    } else {
      console.log(`📭 No relay status found (null or empty)`);
    }
    
  } catch (error) {
    console.error(`❌ Error checking relay status:`, error);
  }
}

// Test function to check device online status
async function checkDeviceOnline() {
  console.log(`🔍 Checking device online status...`);
  
  try {
    const response = await fetch(`${FIREBASE_URL}/devices/${DEVICE_ID}/meta/lastSeen.json`);
    const data = await response.json();
    
    console.log(`📦 Last seen timestamp:`, data);
    
    if (data) {
      const now = Date.now();
      const timeDiff = now - data;
      const isOnline = timeDiff < 20000; // 20 seconds
      
      console.log(`🕐 Time since last seen: ${Math.round(timeDiff/1000)}s`);
      console.log(`📡 Device is: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    } else {
      console.log(`📭 No lastSeen data found`);
    }
    
  } catch (error) {
    console.error(`❌ Error checking device status:`, error);
  }
}

// Usage instructions
console.log(`
🚰 PUMP CONTROL TEST SCRIPT
============================

To test pump control:

1. Check current status:
   checkRelayStatus()

2. Turn pump ON:
   testPumpCommand("on")

3. Turn pump OFF:
   testPumpCommand("off")

4. Check device online:
   checkDeviceOnline()

5. Check all at once:
   checkRelayStatus()
   checkDeviceOnline()
   testPumpCommand("on")
   setTimeout(() => testPumpCommand("off"), 3000)

Make sure to:
- Replace FIREBASE_URL with your actual Firebase URL
- Replace DEVICE_ID with your actual device ID
- Check ESP32 Serial Monitor for response
`);

// Auto-run initial checks
checkRelayStatus();
checkDeviceOnline();
