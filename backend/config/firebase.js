import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Set environment variable for Firebase project ID
process.env.GOOGLE_APPLICATION_CREDENTIALS = './config/serviceAccountKey.json';
process.env.GCLOUD_PROJECT = 'smartagro-solution';

// Initialize Firebase Admin SDK (for server-side operations)
if (!admin.apps.length) {
  try {
    // Try to load service account key
    const serviceAccount = require('./serviceAccountKey.json');
    
    // Check if it's a real service account or mock
    if (serviceAccount.private_key && !serviceAccount.private_key.includes('MOCK')) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
    });
    console.log('🔗 Realtime Database URL: https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app');
      console.log('✅ Firebase Admin SDK initialized with real service account');
      console.log('🔧 Project ID:', serviceAccount.project_id);
      console.log('🔧 Client Email:', serviceAccount.client_email);
    } else {
      throw new Error('Mock service account detected');
    }
  } catch (error) {
    console.log('⚠️  Service account key not found or invalid. Error:', error.message);
    
    // Initialize without credentials for REST API usage
    admin.initializeApp({
      projectId: 'smartagro-solution',
      databaseURL: 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
    });
    console.log('🔗 Realtime Database URL: https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app');
    console.log('⚠️  Firebase Admin SDK initialized without credentials (demo mode)');
  }
}

// Initialize Firebase Client SDK (for client-side operations)
// All values are expected from environment variables.
// Do NOT hard-code real Firebase keys in the repo.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.log('⚠️  Firebase client initialization failed. Using mock configuration.');
  // Mock db for development
  db = null;
}

// Export both admin and client instances
export { admin, db };
