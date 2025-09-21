// Multi-Step Form Validation Utilities
// This file contains validation functions that can be used for testing

export const validationTests = {
  // Test full name validation
  testFullName: (name) => {
    const isValid = /^[a-zA-Z\s]+$/.test(name.trim());
    return {
      isValid,
      message: isValid ? 'Valid name' : 'Name should contain only letters and spaces'
    };
  },

  // Test age validation
  testAge: (age) => {
    const numAge = parseInt(age);
    const isValid = !isNaN(numAge) && numAge >= 0 && numAge <= 100;
    return {
      isValid,
      message: isValid ? 'Valid age' : 'Age must be between 0 and 100'
    };
  },

  // Test email validation
  testEmail: (email) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.includes('@');
    return {
      isValid,
      message: isValid ? 'Valid email' : 'Please enter a valid email address'
    };
  },

  // Test mobile number validation
  testMobileNumber: (mobile) => {
    const cleanMobile = mobile.replace(/\s/g, '');
    const isValid = /^(\+94|0)[0-9]{9}$/.test(cleanMobile);
    return {
      isValid,
      message: isValid ? 'Valid mobile number' : 'Please enter a valid Sri Lankan mobile number (+94 or 0 format)'
    };
  },

  // Test farm size validation
  testFarmSize: (size) => {
    const numSize = parseFloat(size);
    const isValid = !isNaN(numSize) && numSize > 0;
    return {
      isValid,
      message: isValid ? 'Valid farm size' : 'Farm size must be a valid positive number'
    };
  },

  // Test parameter selection validation
  testParameterSelection: (parameters) => {
    const isValid = Array.isArray(parameters) && parameters.length > 0;
    return {
      isValid,
      message: isValid ? 'Valid parameter selection' : 'Please select at least one device parameter'
    };
  }
};

// Test data for validation
export const testData = {
  validPersonalDetails: {
    fullName: 'John Doe',
    age: '30',
    email: 'john@example.com',
    mobileNumber: '+94771234567',
    address: '123 Main Street, Colombo'
  },

  invalidPersonalDetails: {
    fullName: 'John123', // Invalid: contains numbers
    age: '150', // Invalid: out of range
    email: 'invalid-email', // Invalid: no @ symbol
    mobileNumber: '123456', // Invalid: wrong format
    address: '' // Invalid: empty
  },

  validFarmDetails: {
    farmName: 'Green Valley Farm',
    farmSize: '5.5',
    farmLocation: 'Kandy District'
  },

  invalidFarmDetails: {
    farmName: '', // Invalid: empty
    farmSize: '-5', // Invalid: negative
    farmLocation: '' // Invalid: empty
  },

  validDeviceConfig: {
    selectedParameters: ['soilMoisture', 'airTemperature']
  },

  invalidDeviceConfig: {
    selectedParameters: [] // Invalid: no parameters selected
  }
};

// Run all validation tests
export const runAllTests = () => {
  console.log('🧪 Running Multi-Step Form Validation Tests');
  console.log('==========================================');

  // Test valid data
  console.log('\n✅ Testing Valid Data:');
  Object.entries(testData.validPersonalDetails).forEach(([field, value]) => {
    if (validationTests[`test${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      const result = validationTests[`test${field.charAt(0).toUpperCase() + field.slice(1)}`](value);
      console.log(`  ${field}: ${result.message}`);
    }
  });

  // Test invalid data
  console.log('\n❌ Testing Invalid Data:');
  Object.entries(testData.invalidPersonalDetails).forEach(([field, value]) => {
    if (validationTests[`test${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      const result = validationTests[`test${field.charAt(0).toUpperCase() + field.slice(1)}`](value);
      console.log(`  ${field}: ${result.message}`);
    }
  });

  // Test farm details
  console.log('\n🏡 Testing Farm Details:');
  Object.entries(testData.validFarmDetails).forEach(([field, value]) => {
    if (validationTests[`test${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      const result = validationTests[`test${field.charAt(0).toUpperCase() + field.slice(1)}`](value);
      console.log(`  ${field}: ${result.message}`);
    }
  });

  // Test device configuration
  console.log('\n📱 Testing Device Configuration:');
  const paramResult = validationTests.testParameterSelection(testData.validDeviceConfig.selectedParameters);
  console.log(`  selectedParameters: ${paramResult.message}`);

  console.log('\n🎉 All validation tests completed!');
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.multiStepFormValidation = {
    validationTests,
    testData,
    runAllTests
  };
}
