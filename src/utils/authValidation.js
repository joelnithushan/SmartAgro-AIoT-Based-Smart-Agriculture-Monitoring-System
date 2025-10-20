/**
 * Authentication validation utilities - Enhanced with comprehensive validation
 * Handles validation for email, password, and phone number inputs
 */

import { 
  validateEmail as validateEmailComprehensive, 
  validatePassword as validatePasswordComprehensive, 
  validateMobile as validateMobileComprehensive,
  validateName,
  validateNIC,
  validateAge,
  VALIDATION_PATTERNS 
} from './validation';

// Legacy regex patterns for backward compatibility
const EMAIL_REGEX = VALIDATION_PATTERNS.EMAIL;
const SRI_LANKAN_PHONE_REGEX = VALIDATION_PATTERNS.MOBILE;
const INTERNATIONAL_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Validate email format - Enhanced validation
 */
export const validateEmail = (email) => {
  return validateEmailComprehensive(email);
};

/**
 * Validate password strength - Enhanced validation
 */
export const validatePassword = (password) => {
  return validatePasswordComprehensive(password);
};

/**
 * Validate phone number - Enhanced validation
 */
export const validatePhoneNumber = (phoneNumber) => {
  return validateMobileComprehensive(phoneNumber);
};

/**
 * Validate name - Only alphabets and spaces
 */
export const validateNameField = (name) => {
  return validateName(name);
};

/**
 * Validate NIC - Sri Lankan format
 */
export const validateNICField = (nic) => {
  return validateNIC(nic);
};

/**
 * Validate age - Integer between 0 and 100
 */
export const validateAgeField = (age) => {
  return validateAge(age);
};

/**
 * Format phone number for Sri Lankan format
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('94')) {
    // Already in +94 format
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    // Remove leading 0 and add +94
    return `+94${cleaned.substring(1)}`;
  } else if (cleaned.length === 9) {
    // Add +94 prefix
    return `+94${cleaned}`;
  }
  
  return phoneNumber; // Return as-is if format is unclear
};

/**
 * Validate complete registration form
 */
export const validateRegistrationForm = (formData) => {
  console.log('validateRegistrationForm called with:', formData);
  const errors = {};
  
  // Validate based on registration type
  if (formData.registrationType === 'email') {
    console.log('Validating email registration');
    // Validate email for email registration
    const emailValidation = validateEmail(formData.email);
    console.log('Email validation result:', emailValidation);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }
  } else if (formData.registrationType === 'phone') {
    console.log('Validating phone registration');
    // Validate phone for phone registration
    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    console.log('Phone validation result:', phoneValidation);
    if (!phoneValidation.isValid) {
      errors.phoneNumber = phoneValidation.error;
    }
  } else {
    console.log('Validating unknown type, checking both email and phone');
    // Fallback: validate both if type is unknown
    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      console.log('Fallback email validation result:', emailValidation);
      if (!emailValidation.isValid) {
        errors.email = emailValidation.error;
      }
    }
    if (formData.phoneNumber) {
      const phoneValidation = validatePhoneNumber(formData.phoneNumber);
      console.log('Fallback phone validation result:', phoneValidation);
      if (!phoneValidation.isValid) {
        errors.phoneNumber = phoneValidation.error;
      }
    }
  }
  
  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
  }
  
  // Validate name if provided
  if (formData.name) {
    const nameValidation = validateNameField(formData.name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error;
    }
  }
  
  // Validate NIC if provided
  if (formData.nic) {
    const nicValidation = validateNICField(formData.nic);
    if (!nicValidation.isValid) {
      errors.nic = nicValidation.error;
    }
  }
  
  // Validate age if provided
  if (formData.age !== undefined && formData.age !== null && formData.age !== '') {
    const ageValidation = validateAgeField(formData.age);
    if (!ageValidation.isValid) {
      errors.age = ageValidation.error;
    }
  }
  
  const result = {
    isValid: Object.keys(errors).length === 0,
    errors
  };
  console.log('validateRegistrationForm returning:', result);
  return result;
};

/**
 * Validate user profile form
 */
export const validateUserProfileForm = (profileData) => {
  const errors = {};
  
  // Required fields
  const requiredFields = ['name', 'nic', 'age', 'email', 'mobile'];
  
  // Check for required fields
  requiredFields.forEach(field => {
    if (!profileData[field] || profileData[field] === '') {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  });
  
  // If we have errors for required fields, return early
  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors
    };
  }
  
  // Validate each field
  const nameValidation = validateNameField(profileData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }
  
  const nicValidation = validateNICField(profileData.nic);
  if (!nicValidation.isValid) {
    errors.nic = nicValidation.error;
  }
  
  const ageValidation = validateAgeField(profileData.age);
  if (!ageValidation.isValid) {
    errors.age = ageValidation.error;
  }
  
  const emailValidation = validateEmail(profileData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }
  
  const mobileValidation = validatePhoneNumber(profileData.mobile);
  if (!mobileValidation.isValid) {
    errors.mobile = mobileValidation.error;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const authValidation = {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateNameField,
  validateNICField,
  validateAgeField,
  formatPhoneNumber,
  validateRegistrationForm,
  validateUserProfileForm,
  VALIDATION_PATTERNS
};

export default authValidation;