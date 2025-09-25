/**
 * Test Firebase Admin SDK Initialization
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

console.log('🧪 Testing Firebase Admin SDK Initialization...\n');

// Check if admin is already initialized
console.log('📊 Current admin apps:', admin.apps.length);

if (admin.apps.length === 0) {
  console.log('🔧 Initializing Firebase Admin SDK...');
  
  try {
    // Load service account key
    const serviceAccount = require('./config/serviceAccountKey.json');
    console.log('✅ Service account key loaded');
    console.log('📋 Project ID:', serviceAccount.project_id);
    console.log('📋 Client Email:', serviceAccount.client_email);
    
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log('📊 Admin apps after initialization:', admin.apps.length);
    
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Firebase Admin SDK already initialized');
}

// Test Firestore
try {
  const db = admin.firestore();
  console.log('✅ Firestore instance created');
  
  // Test a simple read operation
  const testRef = db.collection('users').limit(1);
  console.log('✅ Firestore reference created');
  
  console.log('\n🎉 Firebase Admin SDK is working correctly!');
  console.log('📊 Ready for user management operations');
  
} catch (error) {
  console.error('❌ Firestore test failed:', error.message);
  process.exit(1);
}
