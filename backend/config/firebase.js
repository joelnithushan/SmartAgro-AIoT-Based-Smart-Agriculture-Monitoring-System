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
// Firebase Web API keys are PUBLIC and safe to expose. Fallbacks ensure app works.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCMVzmYa97yTF6rAPieVLefTecbAuCvRrI",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "smartagro-solution.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "smartagro-solution",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "smartagro-solution.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "109717618865",
  appId: process.env.FIREBASE_APP_ID || "1:109717618865:web:8251555d53abf63f8ce290"
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
