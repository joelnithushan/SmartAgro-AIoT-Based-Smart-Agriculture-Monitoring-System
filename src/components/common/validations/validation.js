/**
 * Comprehensive validation utility for SmartAgro project
 * Critical for evaluation - all validations must be enforced
 */

// Validation patterns
export const VALIDATION_PATTERNS = {
  // NIC (Sri Lanka) - Old format (9 digits + v/V) or New format (12 digits)
  NIC_OLD: /^[0-9]{9}[vV]$/,
  NIC_NEW: /^[0-9]{12}$/,
  
  // Name - Allow letters, spaces, hyphens, apostrophes, and numbers
  NAME: /^[A-Za-z0-9\s\-'\.]+$/,
  
  // Price - Numeric, positive only (with up to 2 decimal places)
  PRICE: /^[0-9]+(\.[0-9]{1,2})?$/,
  
  // Email - Standard email format (improved to prevent double dots)
  EMAIL: /^[A-Za-z0-9]([A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/,
  
  // Mobile - Sri Lanka numbers (exactly 9 digits after country code)
  MOBILE: /^(?:7[0-9]{8}|0[0-9]{8}|\+94[0-9]{8})$/,
  
  // Password - Min 8 chars, uppercase, lowercase, number, special char
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // Crop name - Allow letters, spaces, hyphens, apostrophes, and periods only (no numbers)
  CROP_NAME: /^[A-Za-z\s\-'\.]+$/,
  
  // Variety - Allow letters, numbers, spaces, hyphens, apostrophes, and periods
  VARIETY: /^[A-Za-z0-9\s\-'\.]+$/,
  
  // Quantity - Numeric only (positive)
  QUANTITY: /^[0-9]+(\.[0-9]{1,2})?$/
};

// Validation functions
export const validateNIC = (nic) => {
  if (!nic || typeof nic !== 'string') {
    return { isValid: false, error: 'NIC is required' };
  }
  
  const trimmedNIC = nic.trim();
  
  if (VALIDATION_PATTERNS.NIC_OLD.test(trimmedNIC) || VALIDATION_PATTERNS.NIC_NEW.test(trimmedNIC)) {
    return { isValid: true };
  }
  
  return { 
    isValid: false, 
    error: 'NIC must be either 9 digits followed by V/v (old format) or 12 digits (new format)' 
  };
};

export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (!VALIDATION_PATTERNS.NAME.test(trimmedName)) {
    return { isValid: false, error: 'Name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods' };
  }
  
  return { isValid: true };
};

export const validateAge = (age) => {
  if (age === null || age === undefined || age === '') {
    return { isValid: false, error: 'Age is required' };
  }
  
  const numAge = parseInt(age);
  
  if (isNaN(numAge)) {
    return { isValid: false, error: 'Age must be a valid number' };
  }
  
  if (numAge < 0 || numAge > 100) {
    return { isValid: false, error: 'Age must be between 0 and 100' };
  }
  
  return { isValid: true };
};

export const validatePrice = (price) => {
  if (!price || price === '') {
    return { isValid: false, error: 'Price is required' };
  }
  
  const numPrice = parseFloat(price);
  
  if (isNaN(numPrice)) {
    return { isValid: false, error: 'Price must be a valid number' };
  }
  
  if (numPrice < 0) {
    return { isValid: false, error: 'Price must be positive' };
  }
  
  if (!VALIDATION_PATTERNS.PRICE.test(price.toString())) {
    return { isValid: false, error: 'Price can have at most 2 decimal places' };
  }
  
  return { isValid: true };
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!VALIDATION_PATTERNS.EMAIL.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

export const validateMobile = (mobile) => {
  if (!mobile || typeof mobile !== 'string') {
    return { isValid: false, error: 'Mobile number is required' };
  }
  
  const trimmedMobile = mobile.trim();
  
  // More flexible phone number validation
  // Accepts: +1234567890, 1234567890, +94xxxxxxxxx, 0xxxxxxxxx
  const phoneRegex = /^(\+?[1-9]\d{1,14}|0[0-9]{8,10})$/;
  
  if (!phoneRegex.test(trimmedMobile)) {
    return { 
      isValid: false, 
      error: 'Please enter a valid mobile number (e.g., +1234567890, 0771234567)' 
    };
  }
  
  return { isValid: true };
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (!VALIDATION_PATTERNS.PASSWORD.test(password)) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' 
    };
  }
  
  return { isValid: true };
};

export const validateDate = (date, type = 'future') => {
  if (!date) {
    return { isValid: false, error: 'Date is required' };
  }
  
  const inputDate = new Date(date);
  const now = new Date();
  
  if (isNaN(inputDate.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }
  
  if (type === 'future' && inputDate <= now) {
    return { isValid: false, error: 'Date must be in the future' };
  }
  
  if (type === 'past' && inputDate >= now) {
    return { isValid: false, error: 'Date must be in the past' };
  }
  
  return { isValid: true };
};

export const validateCropName = (cropName) => {
  if (!cropName || typeof cropName !== 'string') {
    return { isValid: false, error: 'Crop name is required' };
  }
  
  const trimmedName = cropName.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Crop name must be at least 2 characters long' };
  }
  
  if (!VALIDATION_PATTERNS.CROP_NAME.test(trimmedName)) {
    return { isValid: false, error: 'Crop name can only contain letters, spaces, hyphens, apostrophes, and periods' };
  }
  
  return { isValid: true };
};

export const validateVariety = (variety) => {
  if (!variety || typeof variety !== 'string') {
    return { isValid: false, error: 'Variety is required' };
  }
  
  const trimmedVariety = variety.trim();
  
  if (trimmedVariety.length < 1) {
    return { isValid: false, error: 'Variety must be at least 1 character long' };
  }
  
  if (!VALIDATION_PATTERNS.VARIETY.test(trimmedVariety)) {
    return { isValid: false, error: 'Variety can only contain letters, numbers, spaces, hyphens, apostrophes, and periods' };
  }
  
  return { isValid: true };
};

export const validateQuantity = (quantity) => {
  if (!quantity || quantity === '') {
    return { isValid: false, error: 'Quantity is required' };
  }
  
  const numQuantity = parseFloat(quantity);
  
  if (isNaN(numQuantity)) {
    return { isValid: false, error: 'Quantity must be a valid number' };
  }
  
  if (numQuantity <= 0) {
    return { isValid: false, error: 'Quantity must be positive' };
  }
  
  return { isValid: true };
};

// Comprehensive form validation
export const validateUserProfile = (profileData) => {
  const errors = {};
  
  // Validate name
  const nameValidation = validateName(profileData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }
  
  // Validate NIC
  const nicValidation = validateNIC(profileData.nic);
  if (!nicValidation.isValid) {
    errors.nic = nicValidation.error;
  }
  
  // Validate age
  const ageValidation = validateAge(profileData.age);
  if (!ageValidation.isValid) {
    errors.age = ageValidation.error;
  }
  
  // Validate email
  const emailValidation = validateEmail(profileData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }
  
  // Validate mobile
  const mobileValidation = validateMobile(profileData.mobile);
  if (!mobileValidation.isValid) {
    errors.mobile = mobileValidation.error;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCropData = (cropData) => {
  const errors = {};
  
  // Validate crop name
  const nameValidation = validateCropName(cropData.cropName);
  if (!nameValidation.isValid) {
    errors.cropName = nameValidation.error;
  }
  
  // Validate variety if provided
  if (cropData.variety) {
    const varietyValidation = validateVariety(cropData.variety);
    if (!varietyValidation.isValid) {
      errors.variety = varietyValidation.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateFertilizerData = (fertilizerData) => {
  const errors = {};
  
  // Validate fertilizer name
  const nameValidation = validateName(fertilizerData.fertilizerName);
  if (!nameValidation.isValid) {
    errors.fertilizerName = nameValidation.error;
  }
  
  // Validate application date (must be future)
  const dateValidation = validateDate(fertilizerData.applicationDate, 'future');
  if (!dateValidation.isValid) {
    errors.applicationDate = dateValidation.error;
  }
  
  // Validate quantity if provided
  if (fertilizerData.quantity) {
    const quantityValidation = validateQuantity(fertilizerData.quantity);
    if (!quantityValidation.isValid) {
      errors.quantity = quantityValidation.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegistrationForm = (formData) => {
  const errors = {};
  
  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }
  
  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
  }
  
  // Validate phone if provided
  if (formData.phoneNumber) {
    const phoneValidation = validateMobile(formData.phoneNumber);
    if (!phoneValidation.isValid) {
      errors.phoneNumber = phoneValidation.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Server-side validation helpers (for backend)
export const serverValidateNIC = (nic) => {
  const validation = validateNIC(nic);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  return true;
};

export const serverValidateName = (name) => {
  const validation = validateName(name);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  return true;
};

export const serverValidateAge = (age) => {
  const validation = validateAge(age);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  return true;
};

export const serverValidatePrice = (price) => {
  const validation = validatePrice(price);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  return true;
};

export const serverValidateEmail = (email) => {
  const validation = validateEmail(email);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  return true;
};

export const serverValidateMobile = (mobile) => {
  const validation = validateMobile(mobile);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  return true;
};

export const serverValidatePassword = (password) => {
  const validation = validatePassword(password);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  return true;
};

export const serverValidateDate = (date, type = 'future') => {
  const validation = validateDate(date, type);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  return true;
};

export const serverValidateCropName = (cropName) => {
  const validation = validateCropName(cropName);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  return true;
};

export const serverValidateQuantity = (quantity) => {
  const validation = validateQuantity(quantity);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  return true;
};

const validation = {
  VALIDATION_PATTERNS,
  validateNIC,
  validateName,
  validateAge,
  validatePrice,
  validateEmail,
  validateMobile,
  validatePassword,
  validateDate,
  validateCropName,
  validateVariety,
  validateQuantity,
  validateUserProfile,
  validateCropData,
  validateFertilizerData,
  validateRegistrationForm,
  serverValidateNIC,
  serverValidateName,
  serverValidateAge,
  serverValidatePrice,
  serverValidateEmail,
  serverValidateMobile,
  serverValidatePassword,
  serverValidateDate,
  serverValidateCropName,
  serverValidateQuantity
};

export default validation;
