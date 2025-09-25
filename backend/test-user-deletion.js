/**
 * Test User Deletion Functionality
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/admin';

// Test user deletion endpoint
const testUserDeletion = async () => {
  console.log('🧪 Testing User Deletion Endpoint...\n');
  
  try {
    // First, let's get the list of users to find a test user
    console.log('📋 Getting list of users...');
    const usersResponse = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token-for-demo',
        'Content-Type': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      console.log('❌ Failed to get users list:', usersResponse.status);
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log('✅ Users list retrieved successfully');
    console.log('📊 Total users:', usersData.length);
    
    if (usersData.length === 0) {
      console.log('⚠️ No users found to test deletion');
      return;
    }
    
    // Find a test user (not the super admin)
    const testUser = usersData.find(user => 
      user.email !== 'joelnithushan6@gmail.com' && 
      user.role !== 'admin'
    );
    
    if (!testUser) {
      console.log('⚠️ No suitable test user found (all users are admins or super admin)');
      return;
    }
    
    console.log('🎯 Test user found:', {
      id: testUser.id,
      email: testUser.email,
      role: testUser.role
    });
    
    // Test user deletion
    console.log('\n🗑️ Testing user deletion...');
    const deleteResponse = await fetch(`${BASE_URL}/users/${testUser.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer test-token-for-demo',
        'Content-Type': 'application/json'
      }
    });
    
    const deleteResult = await deleteResponse.json();
    
    if (deleteResponse.ok) {
      console.log('✅ User deletion successful!');
      console.log('📋 Response:', deleteResult);
    } else {
      console.log('❌ User deletion failed:', deleteResponse.status);
      console.log('📋 Error:', deleteResult);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Test user promotion endpoint
const testUserPromotion = async () => {
  console.log('\n🧪 Testing User Promotion Endpoint...\n');
  
  try {
    // Get users list
    const usersResponse = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token-for-demo',
        'Content-Type': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      console.log('❌ Failed to get users list:', usersResponse.status);
      return;
    }
    
    const usersData = await usersResponse.json();
    
    // Find a regular user to promote
    const testUser = usersData.find(user => 
      user.email !== 'joelnithushan6@gmail.com' && 
      user.role === 'user'
    );
    
    if (!testUser) {
      console.log('⚠️ No regular user found to test promotion');
      return;
    }
    
    console.log('🎯 Test user for promotion:', {
      id: testUser.id,
      email: testUser.email,
      currentRole: testUser.role
    });
    
    // Test user promotion
    console.log('\n⬆️ Testing user promotion...');
    const promoteResponse = await fetch(`${BASE_URL}/users/${testUser.id}/promote`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token-for-demo',
        'Content-Type': 'application/json'
      }
    });
    
    const promoteResult = await promoteResponse.json();
    
    if (promoteResponse.ok) {
      console.log('✅ User promotion successful!');
      console.log('📋 Response:', promoteResult);
    } else {
      console.log('❌ User promotion failed:', promoteResponse.status);
      console.log('📋 Error:', promoteResult);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting User Management Tests...\n');
  
  await testUserDeletion();
  await testUserPromotion();
  
  console.log('\n🎉 Tests completed!');
};

runTests().catch(console.error);
