import * as yup from 'yup';

// Common validation patterns
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Validation schemas
const schemas = {
  // Authentication
  login: yup.object({
    email: yup.string().required('Email is required').matches(emailRegex, 'Invalid email format'),
    password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  }),

  register: yup.object({
    firstName: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters').max(50, 'First name must be less than 50 characters'),
    lastName: yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be less than 50 characters'),
    email: yup.string().required('Email is required').matches(emailRegex, 'Invalid email format'),
    password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters').matches(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    confirmPassword: yup.string().required('Please confirm your password').oneOf([yup.ref('password')], 'Passwords must match'),
    phone: yup.string().required('Phone number is required').matches(phoneRegex, 'Invalid phone number format'),
    role: yup.string().required('Role is required').oneOf(['user', 'admin'], 'Invalid role'),
  }),

  passwordReset: yup.object({
    email: yup.string().required('Email is required').matches(emailRegex, 'Invalid email format'),
  }),

  changePassword: yup.object({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: yup.string().required('New password is required').min(8, 'Password must be at least 8 characters').matches(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    confirmNewPassword: yup.string().required('Please confirm your new password').oneOf([yup.ref('newPassword')], 'Passwords must match'),
  }),

  // User Profile
  profileUpdate: yup.object({
    firstName: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters').max(50, 'First name must be less than 50 characters'),
    lastName: yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be less than 50 characters'),
    email: yup.string().required('Email is required').matches(emailRegex, 'Invalid email format'),
    phone: yup.string().required('Phone number is required').matches(phoneRegex, 'Invalid phone number format'),
    address: yup.string().max(200, 'Address must be less than 200 characters'),
    city: yup.string().max(50, 'City must be less than 50 characters'),
    state: yup.string().max(50, 'State must be less than 50 characters'),
    zipCode: yup.string().max(10, 'ZIP code must be less than 10 characters'),
    country: yup.string().max(50, 'Country must be less than 50 characters'),
  }),

  // Device Management
  deviceRegistration: yup.object({
    deviceName: yup.string().required('Device name is required').min(3, 'Device name must be at least 3 characters').max(50, 'Device name must be less than 50 characters'),
    deviceType: yup.string().required('Device type is required').oneOf(['sensor', 'actuator', 'controller'], 'Invalid device type'),
    location: yup.string().required('Location is required').min(3, 'Location must be at least 3 characters').max(100, 'Location must be less than 100 characters'),
    description: yup.string().max(200, 'Description must be less than 200 characters'),
    latitude: yup.number().required('Latitude is required').min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
    longitude: yup.number().required('Longitude is required').min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  }),

  deviceShare: yup.object({
    deviceId: yup.string().required('Device ID is required'),
    sharedWithEmail: yup.string().required('Email is required').matches(emailRegex, 'Invalid email format'),
    permissions: yup.array().of(yup.string().oneOf(['read', 'write', 'admin'])).min(1, 'At least one permission must be selected').required('Permissions are required'),
    expiresAt: yup.date().min(new Date(), 'Expiration date must be in the future').required('Expiration date is required'),
  }),

  deviceRequest: yup.object({
    deviceType: yup.string().required('Device type is required').oneOf(['sensor', 'actuator', 'controller'], 'Invalid device type'),
    quantity: yup.number().required('Quantity is required').min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100'),
    purpose: yup.string().required('Purpose is required').min(10, 'Purpose must be at least 10 characters').max(500, 'Purpose must be less than 500 characters'),
    expectedDeliveryDate: yup.date().min(new Date(), 'Expected delivery date must be in the future').required('Expected delivery date is required'),
    budget: yup.number().min(0, 'Budget cannot be negative').max(1000000, 'Budget cannot exceed 1,000,000'),
  }),

  // Admin Management
  userManagement: yup.object({
    userId: yup.string().required('User ID is required'),
    role: yup.string().required('Role is required').oneOf(['user', 'admin'], 'Invalid role'),
    status: yup.string().required('Status is required').oneOf(['active', 'inactive', 'suspended'], 'Invalid status'),
  }),

  deviceApproval: yup.object({
    requestId: yup.string().required('Request ID is required'),
    status: yup.string().required('Status is required').oneOf(['approved', 'rejected'], 'Invalid status'),
    comments: yup.string().max(500, 'Comments must be less than 500 characters'),
  }),

  // Chat and Communication
  chatMessage: yup.object({
    message: yup.string().required('Message is required').min(1, 'Message cannot be empty').max(2000, 'Message must be less than 2000 characters'),
  }),

  contactForm: yup.object({
    name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
    email: yup.string().required('Email is required').matches(emailRegex, 'Invalid email format'),
    subject: yup.string().required('Subject is required').min(5, 'Subject must be at least 5 characters').max(200, 'Subject must be less than 200 characters'),
    message: yup.string().required('Message is required').min(10, 'Message must be at least 10 characters').max(1000, 'Message must be less than 1000 characters'),
  }),

  // Crop Management
  cropSelection: yup.object({
    cropType: yup.string().required('Crop type is required'),
    variety: yup.string().required('Variety is required'),
    plantingDate: yup.date().required('Planting date is required'),
    expectedHarvestDate: yup.date().min(yup.ref('plantingDate'), 'Harvest date must be after planting date').required('Expected harvest date is required'),
    area: yup.number().required('Area is required').min(0.1, 'Area must be at least 0.1 acres').max(1000, 'Area cannot exceed 1000 acres'),
  }),

  fertilizerSchedule: yup.object({
    cropId: yup.string().required('Crop ID is required'),
    fertilizerType: yup.string().required('Fertilizer type is required'),
    applicationDate: yup.date().required('Application date is required'),
    quantity: yup.number().required('Quantity is required').min(0.1, 'Quantity must be at least 0.1 kg').max(1000, 'Quantity cannot exceed 1000 kg'),
    method: yup.string().required('Application method is required').oneOf(['broadcast', 'band', 'foliar', 'drip'], 'Invalid application method'),
  }),

  // OTP Validation
  otp: yup.object({
    otp: yup.string().required('OTP is required').length(6, 'OTP must be exactly 6 digits').matches(/^\d{6}$/, 'OTP must contain only numbers'),
  }),

  // Search and Filter
  search: yup.object({
    query: yup.string().min(2, 'Search query must be at least 2 characters').max(100, 'Search query must be less than 100 characters'),
    filters: yup.object({
      dateFrom: yup.date(),
      dateTo: yup.date().min(yup.ref('dateFrom'), 'End date must be after start date'),
      category: yup.string(),
      status: yup.string(),
    }),
  }),
};

// Validation middleware factory
export const validateRequest = (schemaName) => {
  return async (req, res, next) => {
    try {
      const schema = schemas[schemaName];
      if (!schema) {
        return res.status(400).json({
          success: false,
          error: `Validation schema '${schemaName}' not found`
        });
      }

      // Validate request body
      await schema.validate(req.body, { abortEarly: false });
      
      // Sanitize data
      req.body = sanitizeData(req.body);
      
      next();
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = {};
        error.inner.forEach((err) => {
          errors[err.path] = err.message;
        });
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: errors
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error during validation'
      });
    }
  };
};

// Sanitize data helper
const sanitizeData = (data) => {
  const sanitized = {};
  
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      // Remove potentially dangerous characters
      sanitized[key] = data[key].trim().replace(/[<>]/g, '');
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  });
  
  return sanitized;
};

// Custom validation helpers
export const validateEmail = (email) => {
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
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

// Export schemas for direct use
export { schemas };
