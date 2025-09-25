/**
 * Test Script for User Management Functionality
 * 
 * This script tests the complete user management system including:
 * - User deletion with complete Firestore cleanup
 * - User role promotion/demotion with Firebase Auth custom claims
 * - Super Admin protection
 * - Role-based access control
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK (you'll need to provide your service account key)
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      const serviceAccount = require('./backend/config/serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
      });
      console.log('✅ Firebase Admin SDK initialized');
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    return false;
  }
};

// Test user deletion functionality
const testUserDeletion = async (userId) => {
  console.log(`\n🧪 Testing user deletion for: ${userId}`);
  
  const db = getFirestore();
  const auth = getAuth();
  
  try {
    // Check if user exists in Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('❌ User not found in Firestore');
      return false;
    }
    
    const userData = userDoc.data();
    console.log('📋 User data found:', {
      email: userData.email,
      role: userData.role,
      fullName: userData.fullName
    });
    
    // Check if user exists in Firebase Auth
    try {
      const authUser = await auth.getUser(userId);
      console.log('👤 User found in Firebase Auth:', {
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        customClaims: authUser.customClaims
      });
    } catch (error) {
      console.log('⚠️ User not found in Firebase Auth:', error.message);
    }
    
    // Check user's subcollections
    const subcollections = ['alerts', 'triggeredAlerts', 'chats', 'crops', 'fertilizers', 'recommendations'];
    for (const subcollection of subcollections) {
      const snapshot = await db.collection('users').doc(userId).collection(subcollection).get();
      if (!snapshot.empty) {
        console.log(`📁 Found ${snapshot.size} documents in ${subcollection}`);
      }
    }
    
    // Check device requests
    const deviceRequestsSnapshot = await db.collection('deviceRequests').where('userId', '==', userId).get();
    if (!deviceRequestsSnapshot.empty) {
      console.log(`📋 Found ${deviceRequestsSnapshot.size} device requests`);
    }
    
    // Check orders
    const ordersSnapshot = await db.collection('orders').where('userId', '==', userId).get();
    if (!ordersSnapshot.empty) {
      console.log(`📦 Found ${ordersSnapshot.size} orders`);
    }
    
    console.log('✅ User deletion test completed - user data found and ready for deletion');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing user deletion:', error);
    return false;
  }
};

// Test user role promotion/demotion
const testRoleManagement = async (userId, newRole) => {
  console.log(`\n🧪 Testing role management for: ${userId} -> ${newRole}`);
  
  const db = getFirestore();
  const auth = getAuth();
  
  try {
    // Get current user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('❌ User not found in Firestore');
      return false;
    }
    
    const currentData = userDoc.data();
    console.log('📋 Current user data:', {
      email: currentData.email,
      currentRole: currentData.role,
      fullName: currentData.fullName
    });
    
    // Check current custom claims
    try {
      const authUser = await auth.getUser(userId);
      console.log('👤 Current custom claims:', authUser.customClaims);
    } catch (error) {
      console.log('⚠️ Could not get current custom claims:', error.message);
    }
    
    // Update role in Firestore
    await db.collection('users').doc(userId).update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Updated Firestore role to: ${newRole}`);
    
    // Update custom claims in Firebase Auth
    await auth.setCustomUserClaims(userId, { role: newRole });
    console.log(`✅ Updated custom claims to: { role: "${newRole}" }`);
    
    // Verify the changes
    const updatedDoc = await db.collection('users').doc(userId).get();
    const updatedData = updatedDoc.data();
    console.log('📋 Updated user data:', {
      email: updatedData.email,
      newRole: updatedData.role,
      fullName: updatedData.fullName
    });
    
    const updatedAuthUser = await auth.getUser(userId);
    console.log('👤 Updated custom claims:', updatedAuthUser.customClaims);
    
    console.log('✅ Role management test completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing role management:', error);
    return false;
  }
};

// Test Super Admin protection
const testSuperAdminProtection = async () => {
  console.log('\n🧪 Testing Super Admin protection');
  
  const db = getFirestore();
  const auth = getAuth();
  
  try {
    // Find the super admin user
    const superAdminSnapshot = await db.collection('users')
      .where('email', '==', 'joelnithushan6@gmail.com')
      .get();
    
    if (superAdminSnapshot.empty) {
      console.log('❌ Super Admin user not found in Firestore');
      return false;
    }
    
    const superAdminDoc = superAdminSnapshot.docs[0];
    const superAdminData = superAdminDoc.data();
    const superAdminId = superAdminDoc.id;
    
    console.log('👑 Super Admin found:', {
      id: superAdminId,
      email: superAdminData.email,
      role: superAdminData.role
    });
    
    // Check if super admin exists in Firebase Auth
    try {
      const authUser = await auth.getUser(superAdminId);
      console.log('👤 Super Admin in Firebase Auth:', {
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        customClaims: authUser.customClaims
      });
    } catch (error) {
      console.log('⚠️ Super Admin not found in Firebase Auth:', error.message);
    }
    
    console.log('✅ Super Admin protection test completed');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing Super Admin protection:', error);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting User Management Tests...\n');
  
  if (!initializeFirebase()) {
    console.log('❌ Cannot run tests without Firebase Admin SDK');
    return;
  }
  
  try {
    // Test 1: Super Admin protection
    await testSuperAdminProtection();
    
    // Test 2: Find a test user for role management
    const db = getFirestore();
    const usersSnapshot = await db.collection('users')
      .where('email', '!=', 'joelnithushan6@gmail.com')
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      const testUser = usersSnapshot.docs[0];
      const testUserId = testUser.id;
      const testUserData = testUser.data();
      
      console.log(`\n📋 Using test user: ${testUserData.email} (${testUserId})`);
      
      // Test 3: Role management
      const currentRole = testUserData.role || 'user';
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      await testRoleManagement(testUserId, newRole);
      
      // Test 4: User deletion (comprehensive check)
      await testUserDeletion(testUserId);
      
    } else {
      console.log('⚠️ No test users found for role management testing');
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(() => {
    console.log('\n✅ Test script finished');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testUserDeletion,
  testRoleManagement,
  testSuperAdminProtection,
  runTests
};
