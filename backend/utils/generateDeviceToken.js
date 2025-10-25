import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../config/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
    });
    console.log('✅ Firebase Admin initialized for token generation');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

/**
 * Generate a custom token for ESP32 device
 * @param {string} deviceId - Unique device identifier
 * @param {string} userId - Optional user ID to associate with device
 * @returns {Promise<string>} Custom token
 */
export async function generateDeviceToken(deviceId, userId = null) {
  try {
    // Create a custom token with device-specific claims
    const customToken = await admin.auth().createCustomToken(userId || 'device', {
      deviceId: deviceId,
      role: 'device',
      type: 'esp32'
    });
    
    console.log(`✅ Generated token for device: ${deviceId}`);
    return customToken;
  } catch (error) {
    console.error('❌ Error generating device token:', error);
    throw error;
  }
}

/**
 * Generate a service account token for direct Firebase access
 * @returns {Promise<string>} Service account access token
 */
export async function generateServiceAccountToken() {
  try {
    // Get access token using service account
    const serviceAccount = require('../config/serviceAccountKey.json');
    const { GoogleAuth } = require('google-auth-library');
    
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/firebase.database']
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    console.log('✅ Generated service account access token');
    return accessToken.token;
  } catch (error) {
    console.error('❌ Error generating service account token:', error);
    throw error;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  const deviceId = args[1] || 'ESP32_001';
  
  if (command === 'device') {
    generateDeviceToken(deviceId)
      .then(token => {
        console.log('\n🔑 Device Token:');
        console.log(token);
        console.log('\n📝 Add this to your ESP32 code:');
        console.log(`const char* FIREBASE_AUTH_TOKEN = "${token}";`);
      })
      .catch(console.error);
  } else if (command === 'service') {
    generateServiceAccountToken()
      .then(token => {
        console.log('\n🔑 Service Account Token:');
        console.log(token);
        console.log('\n📝 Add this to your ESP32 code:');
        console.log(`const char* FIREBASE_AUTH_TOKEN = "${token}";`);
      })
      .catch(console.error);
  } else {
    console.log('Usage:');
    console.log('  node generateDeviceToken.js device [deviceId]  - Generate device token');
    console.log('  node generateDeviceToken.js service           - Generate service account token');
    console.log('\nExamples:');
    console.log('  node generateDeviceToken.js device ESP32_001');
    console.log('  node generateDeviceToken.js service');
  }
}
