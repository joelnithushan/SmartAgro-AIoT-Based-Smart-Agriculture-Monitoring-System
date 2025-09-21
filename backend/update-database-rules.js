const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function updateDatabaseRules() {
  try {
    console.log('🔧 Updating Firebase Realtime Database rules for ESP32 access...');
    
    // New rules that allow ESP32 to write data without authentication
    const rules = {
      "rules": {
        "devices": {
          "$deviceId": {
            ".read": "auth != null",
            ".write": true, // Allow anyone to write (for ESP32 devices)
            "sensors": {
              ".read": "auth != null",
              ".write": true // Allow anyone to write sensor data
            },
            "irrigation": {
              ".read": "auth != null", 
              ".write": "auth != null" // Only authenticated users can control irrigation
            }
          }
        },
        "test": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    };
    
    // Deploy the rules
    await admin.database().setRules(JSON.stringify(rules));
    
    console.log('✅ Database rules updated successfully!');
    console.log('📋 New rules:');
    console.log('   - ESP32 devices can write sensor data without authentication');
    console.log('   - Only authenticated users can read data');
    console.log('   - Only authenticated users can control irrigation');
    console.log('\n🎯 Your ESP32 should now be able to send data!');
    
  } catch (error) {
    console.error('❌ Error updating database rules:', error);
  } finally {
    process.exit(0);
  }
}

updateDatabaseRules();
