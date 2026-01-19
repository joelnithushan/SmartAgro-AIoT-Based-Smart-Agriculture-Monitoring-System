import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment variable for Firebase project ID
process.env.GCLOUD_PROJECT = 'smartagro-solution';

// Initialize Firebase Admin SDK (for server-side operations)
if (!admin.apps.length) {
  try {
    const fs = require('fs');
    
    const mainKeyPath = path.resolve(__dirname, './serviceAccountKey.json');
    const backupKeyPath = path.resolve(__dirname, './serviceAccountKey.local.backup.json');
    
    let serviceAccount = null;
    let keyFilePath = mainKeyPath;
    
    // Try main file first
    if (fs.existsSync(mainKeyPath)) {
      serviceAccount = require('./serviceAccountKey.json');
      console.log('📋 Loaded service account from main file');
    } 
    // Fallback to backup file if main doesn't exist
    else if (fs.existsSync(backupKeyPath)) {
      serviceAccount = require('./serviceAccountKey.local.backup.json');
      keyFilePath = backupKeyPath;
      console.log('📋 Loaded service account from backup file');
      console.log('💡 Tip: Copy serviceAccountKey.local.backup.json to serviceAccountKey.json for cleaner setup');
    } else {
      throw new Error(`Service account key file not found. Expected: ${mainKeyPath} or ${backupKeyPath}`);
    }
    
    // Check if it's a real service account or mock
    if (serviceAccount.private_key && !serviceAccount.private_key.includes('MOCK')) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
      process.env.GCLOUD_PROJECT = serviceAccount.project_id;
      
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
    console.error('❌ Service account key not found or invalid. Error:', error.message);
    console.error('❌ CRITICAL: Firestore operations will FAIL without valid service account key!');
    console.error('❌ Expected file locations:');
    console.error('   - backend/config/serviceAccountKey.json');
    console.error('   - backend/config/serviceAccountKey.local.backup.json');
    
    // Initialize without credentials for REST API usage (limited functionality)
    try {
      admin.initializeApp({
        projectId: 'smartagro-solution',
        databaseURL: 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
      });
      console.log('🔗 Realtime Database URL: https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app');
      console.error('⚠️  WARNING: Firebase Admin SDK initialized WITHOUT CREDENTIALS');
      console.error('⚠️  WARNING: Firestore operations will FAIL. Please add service account key!');
    } catch (fallbackError) {
      console.error('❌ Firebase fallback initialization failed:', fallbackError.message);
    }
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
