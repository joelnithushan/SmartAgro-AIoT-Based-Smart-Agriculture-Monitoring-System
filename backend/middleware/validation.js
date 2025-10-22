const VALIDATION_PATTERNS = {
  NIC_OLD: /^[0-9]{9}[vV]$/,
  NIC_NEW: /^[0-9]{12}$/,
  NAME: /^[A-Za-z ]+$/,
  EMAIL: /^[A-Za-z0-9]([A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/,
  MOBILE: /^(?:7[0-9]{8}|0[0-9]{8}|\+94[0-9]{8})$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  CROP_NAME: /^[A-Za-z0-9\s\-'\.]+$/
};

const validateNIC = (nic) => {
  if (!nic || typeof nic !== 'string') throw new Error('NIC is required');
  const trimmedNIC = nic.trim();
  if (!VALIDATION_PATTERNS.NIC_OLD.test(trimmedNIC) && !VALIDATION_PATTERNS.NIC_NEW.test(trimmedNIC)) {
    throw new Error('NIC must be either 9 digits followed by V/v or 12 digits');
  }
  return true;
};

const validateName = (name) => {
  if (!name || typeof name !== 'string') throw new Error('Name is required');
  const trimmedName = name.trim();
  if (trimmedName.length < 2) throw new Error('Name must be at least 2 characters long');
  if (!VALIDATION_PATTERNS.NAME.test(trimmedName)) throw new Error('Name can only contain letters and spaces');
  return true;
};

const validateAge = (age) => {
  if (age === null || age === undefined || age === '') throw new Error('Age is required');
  const numAge = parseInt(age);
  if (isNaN(numAge)) throw new Error('Age must be a valid number');
  if (numAge < 0 || numAge > 100) throw new Error('Age must be between 0 and 100');
  return true;
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') throw new Error('Email is required');
  const trimmedEmail = email.trim().toLowerCase();
  if (!VALIDATION_PATTERNS.EMAIL.test(trimmedEmail)) throw new Error('Please enter a valid email address');
  return true;
};

const validateMobile = (mobile) => {
  if (!mobile || typeof mobile !== 'string') throw new Error('Mobile number is required');
  const trimmedMobile = mobile.trim();
  if (!VALIDATION_PATTERNS.MOBILE.test(trimmedMobile)) throw new Error('Please enter a valid Sri Lankan mobile number');
  return true;
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') throw new Error('Password is required');
  if (password.length < 8) throw new Error('Password must be at least 8 characters long');
  if (!VALIDATION_PATTERNS.PASSWORD.test(password)) throw new Error('Password must contain uppercase, lowercase, number, and special character');
  return true;
};

const validateCropName = (cropName) => {
  if (!cropName || typeof cropName !== 'string') throw new Error('Crop name is required');
  const trimmedName = cropName.trim();
  if (trimmedName.length < 2) throw new Error('Crop name must be at least 2 characters long');
  if (!VALIDATION_PATTERNS.CROP_NAME.test(trimmedName)) throw new Error('Crop name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods');
  return true;
};

const validateUserProfile = (req, res, next) => {
  try {
    const { name, nic, age, email, mobile } = req.body;
    if (!name || !nic || !age || !email || !mobile) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    validateName(name);
    validateNIC(nic);
    validateAge(age);
    validateEmail(email);
    validateMobile(mobile);
    next();
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

const validateCropData = (req, res, next) => {
  try {
    const { cropName, variety } = req.body;
    validateCropName(cropName);
    if (variety) validateName(variety);
    next();
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

const validateSettings = (req, res, next) => {
  try {
    const { language, theme } = req.body;
    
    // Validate language
    if (language && !['en', 'ta'].includes(language)) {
      throw new Error('Language must be either "en" or "ta"');
    }
    
    // Validate theme
    if (theme && !['light', 'dark'].includes(theme)) {
      throw new Error('Theme must be either "light" or "dark"');
    }
    
    next();
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  VALIDATION_PATTERNS,
  validateNIC,
  validateName,
  validateAge,
  validateEmail,
  validateMobile,
  validatePassword,
  validateCropName,
  validateUserProfile,
  validateCropData,
  validateSettings
};
