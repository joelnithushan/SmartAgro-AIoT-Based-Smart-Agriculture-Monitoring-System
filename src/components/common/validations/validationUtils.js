// Validation utility functions
export const validateEmail = (email) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  return passwordRegex.test(password);
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
  return value && value.toString().length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return value && value.toString().length <= maxLength;
};

export const validateNumber = (value, min = null, max = null) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

export const validateDate = (date, minDate = null, maxDate = null) => {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return false;
  if (minDate && dateObj < new Date(minDate)) return false;
  if (maxDate && dateObj > new Date(maxDate)) return false;
  return true;
};

export const validateFile = (file, maxSize = 5 * 1024 * 1024, allowedTypes = []) => {
  if (!file) return false;
  if (file.size > maxSize) return false;
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) return false;
  return true;
};

// Form validation helpers
export const getFieldError = (errors, fieldName) => {
  return errors[fieldName]?.message || '';
};

export const hasFieldError = (errors, fieldName) => {
  return !!errors[fieldName];
};

export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
};

// Custom validation messages
export const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  password: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must be less than ${max} characters`,
  min: (min) => `Must be at least ${min}`,
  max: (max) => `Must be less than ${max}`,
  match: 'Values must match',
  date: 'Please enter a valid date',
  fileSize: (maxSize) => `File size must be less than ${maxSize / (1024 * 1024)}MB`,
  fileType: 'Please select a valid file type',
};

// Real-time validation helpers
export const validateField = (value, rules) => {
  const errors = [];
  
  if (rules.required && !validateRequired(value)) {
    errors.push(validationMessages.required);
  }
  
  if (rules.email && value && !validateEmail(value)) {
    errors.push(validationMessages.email);
  }
  
  if (rules.phone && value && !validatePhone(value)) {
    errors.push(validationMessages.phone);
  }
  
  if (rules.password && value && !validatePassword(value)) {
    errors.push(validationMessages.password);
  }
  
  if (rules.minLength && value && !validateMinLength(value, rules.minLength)) {
    errors.push(validationMessages.minLength(rules.minLength));
  }
  
  if (rules.maxLength && value && !validateMaxLength(value, rules.maxLength)) {
    errors.push(validationMessages.maxLength(rules.maxLength));
  }
  
  if (rules.min !== undefined && value && !validateNumber(value, rules.min)) {
    errors.push(validationMessages.min(rules.min));
  }
  
  if (rules.max !== undefined && value && !validateNumber(value, null, rules.max)) {
    errors.push(validationMessages.max(rules.max));
  }
  
  return errors;
};

// Server-side validation helpers
export const validateServerData = (data, schema) => {
  try {
    schema.validateSync(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    const errors = {};
    error.inner.forEach((err) => {
      errors[err.path] = err.message;
    });
    return { isValid: false, errors };
  }
};

// Sanitization helpers
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeFormData = (data) => {
  const sanitized = {};
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      sanitized[key] = sanitizeInput(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  });
  return sanitized;
};

// Format validation helpers
export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  return phone;
};

export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = new Date(date);
  return dateObj.toISOString().split('T')[0];
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Validation status helpers
export const getValidationStatus = (errors, touched, fieldName) => {
  if (!touched[fieldName]) return 'default';
  if (errors[fieldName]) return 'error';
  return 'success';
};

export const getFieldClassName = (errors, touched, fieldName, baseClass = '') => {
  const status = getValidationStatus(errors, touched, fieldName);
  const statusClasses = {
    default: '',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-500 focus:border-green-500 focus:ring-green-500'
  };
  return `${baseClass} ${statusClasses[status]}`.trim();
};
