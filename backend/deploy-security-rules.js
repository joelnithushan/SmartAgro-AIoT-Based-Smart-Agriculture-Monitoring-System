const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function deploySecurityRules() {
  try {
    console.log('🔒 Deploying Firebase Realtime Database security rules...');
    
    // Read the rules file
    const rules = JSON.parse(fs.readFileSync('./database-security-rules.json', 'utf8'));
    
    // Deploy the rules
    await admin.database().setRules(JSON.stringify(rules));
    
    console.log('✅ Security rules deployed successfully!');
    console.log('📋 Rules summary:');
    console.log('   - Users can only access devices assigned to them');
    console.log('   - Device ownership verified through users/{uid}/devices/{deviceId}');
    console.log('   - Admins have full access to device requests');
    console.log('   - Users can only read/write their own profile data');
    
    console.log('\n🔐 Security features:');
    console.log('   - Device access control based on ownership');
    console.log('   - Sensor data protection');
    console.log('   - Irrigation control restricted to device owners');
    console.log('   - Schedule management limited to device owners');
    
  } catch (error) {
    console.error('❌ Error deploying security rules:', error);
  } finally {
    process.exit(0);
  }
}

deploySecurityRules();
