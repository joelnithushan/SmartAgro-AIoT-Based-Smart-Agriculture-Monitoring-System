const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Initialize Firebase Admin SDK (for server-side operations)
if (!admin.apps.length) {
  try {
    // Try to load service account key
    const serviceAccount = require('./serviceAccountKey.json');
    
    // Check if it's a real service account or mock
    if (serviceAccount.private_key && !serviceAccount.private_key.includes('MOCK')) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
      });
      console.log('✅ Firebase Admin SDK initialized with real service account');
    } else {
      throw new Error('Mock service account detected');
    }
  } catch (error) {
    console.log('⚠️  Service account key not found or invalid. Using REST API for development.');
    console.log('   To use real Firebase Admin SDK, add a valid serviceAccountKey.json to the config directory');
    
    // Initialize without credentials for REST API usage
    admin.initializeApp({
      projectId: 'smartagro-solution',
      databaseURL: 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
    });
  }
}

// Initialize Firebase Client SDK (for client-side operations)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'REDACTED_FIREBASE_API_KEY',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'smartagro-solution.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'smartagro-solution',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'smartagro-solution.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '109717618865',
  appId: process.env.FIREBASE_APP_ID || '1:109717618865:web:8251555d53abf63f8ce290'
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
module.exports = {
  admin,
  db
};
