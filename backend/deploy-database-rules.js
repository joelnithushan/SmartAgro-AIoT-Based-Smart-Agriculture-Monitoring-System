const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function deployDatabaseRules() {
  try {
    console.log('🚀 Deploying Firebase Realtime Database rules...');
    
    // Read the rules file
    const rules = JSON.parse(fs.readFileSync('./database.rules.json', 'utf8'));
    
    // Deploy the rules
    await admin.database().setRules(JSON.stringify(rules));
    
    console.log('✅ Database rules deployed successfully!');
    console.log('📋 Rules summary:');
    console.log('   - devices/{deviceId} - Read/Write for authenticated users');
    console.log('   - devices/{deviceId}/sensors - Read/Write for authenticated users');
    console.log('   - devices/{deviceId}/irrigation - Read/Write for authenticated users');
    console.log('   - test - Read/Write for authenticated users');
    
  } catch (error) {
    console.error('❌ Error deploying database rules:', error);
  } finally {
    process.exit(0);
  }
}

deployDatabaseRules();
