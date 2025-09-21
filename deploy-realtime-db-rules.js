const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function deployRealtimeDatabaseRules() {
  try {
    console.log('🔒 Deploying Firebase Realtime Database security rules...');
    
    // Read the rules file
    const rules = JSON.parse(fs.readFileSync('./firebase-realtime-db-rules.json', 'utf8'));
    
    // Deploy the rules
    await admin.database().setRules(JSON.stringify(rules));
    
    console.log('✅ Realtime Database security rules deployed successfully!');
    console.log('📋 Rules summary:');
    console.log('   - Users can only access devices assigned to them');
    console.log('   - Device ownership verified through users/{uid}/devices/{deviceId}');
    console.log('   - Admins have full access to device requests');
    console.log('   - Users can only read/write their own profile data');
    console.log('   - Sensor data protected by device ownership');
    console.log('   - Control commands restricted to device owners');
    console.log('   - Schedules managed by device owners only');
    
    console.log('\n🔐 Security features:');
    console.log('   - Device access control based on ownership');
    console.log('   - Sensor data protection');
    console.log('   - Irrigation control restricted to device owners');
    console.log('   - Schedule management limited to device owners');
    console.log('   - Event logging protected by ownership');
    console.log('   - Meta data access controlled');
    
    console.log('\n📊 Firebase paths protected:');
    console.log('   - /devices/{deviceId}/sensors/latest');
    console.log('   - /devices/{deviceId}/sensors/history/{timestamp}');
    console.log('   - /devices/{deviceId}/control/relay');
    console.log('   - /devices/{deviceId}/control/irrigation');
    console.log('   - /devices/{deviceId}/schedules/{scheduleId}');
    console.log('   - /devices/{deviceId}/meta');
    console.log('   - /devices/{deviceId}/irrigation/events/{eventId}');
    
  } catch (error) {
    console.error('❌ Error deploying Realtime Database security rules:', error);
  } finally {
    process.exit(0);
  }
}

deployRealtimeDatabaseRules();
