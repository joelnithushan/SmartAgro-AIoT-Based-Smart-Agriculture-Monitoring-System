// Quick token generator for ESP32
const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
  databaseURL: 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function generateToken() {
  try {
    // Generate a custom token for ESP32 device
    const customToken = await admin.auth().createCustomToken('ESP32_001', {
      deviceId: 'ESP32_001',
      role: 'device',
      type: 'esp32'
    });
    
    console.log('🔑 Firebase Auth Token Generated!');
    console.log('================================');
    console.log('Copy this token to your ESP32 code:');
    console.log('');
    console.log(`const char* FIREBASE_AUTH_TOKEN = "${customToken}";`);
    console.log('');
    console.log('✅ Your ESP32 should now be able to connect to Firebase!');
    
  } catch (error) {
    console.error('❌ Error generating token:', error);
  }
}

generateToken();
