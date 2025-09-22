// Test utility for OTP Service
// This file is for development/testing purposes only

import { otpService } from '../services/otpService';

export const testOTPService = async () => {
  console.log('🧪 Testing OTP Service...');
  
  const testEmail = 'test@example.com';
  
  try {
    // Test 1: Generate OTP
    console.log('Test 1: Generating OTP...');
    const otp = otpService.generateOTP();
    console.log('✅ Generated OTP:', otp);
    
    // Test 2: Save OTP
    console.log('Test 2: Saving OTP to Firestore...');
    const saveResult = await otpService.saveOTP(testEmail, otp);
    console.log('✅ Save result:', saveResult);
    
    // Test 3: Verify correct OTP
    console.log('Test 3: Verifying correct OTP...');
    const verifyResult = await otpService.verifyOTP(testEmail, otp);
    console.log('✅ Verify result:', verifyResult);
    
    // Test 4: Verify incorrect OTP
    console.log('Test 4: Verifying incorrect OTP...');
    const wrongOTP = '123456';
    const wrongResult = await otpService.verifyOTP(testEmail, wrongOTP);
    console.log('✅ Wrong OTP result:', wrongResult);
    
    console.log('🎉 All OTP Service tests completed!');
    
  } catch (error) {
    console.error('❌ OTP Service test failed:', error);
  }
};

// Uncomment the line below to run tests in development
// testOTPService();
