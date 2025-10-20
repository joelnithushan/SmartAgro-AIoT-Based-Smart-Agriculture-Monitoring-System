/**
 * Password Strength Utility
 * Provides password strength calculation and validation
 */

// Password strength calculation
export const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', percentage: 0, color: '' };

  let score = 0;
  const checks = {
    length: false,
    lowercase: false,
    uppercase: false,
    numbers: false,
    symbols: false,
    common: false
  };

  // Length check (minimum 8 characters)
  if (password.length >= 8) {
    score += 20;
    checks.length = true;
  }

  // Character type checks
  if (/[a-z]/.test(password)) {
    score += 20;
    checks.lowercase = true;
  }

  if (/[A-Z]/.test(password)) {
    score += 20;
    checks.uppercase = true;
  }

  if (/\d/.test(password)) {
    score += 20;
    checks.numbers = true;
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 20;
    checks.symbols = true;
  }

  // Bonus for longer passwords
  if (password.length >= 12) {
    score += 10;
  }

  // Penalty for common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
    /monkey/i,
    /dragon/i,
    /master/i
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score -= 30;
    checks.common = true;
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine strength label and color
  let label, color;
  if (score < 40) {
    label = 'Weak';
    color = 'red';
  } else if (score < 70) {
    label = 'Medium';
    color = 'orange';
  } else {
    label = 'Strong';
    color = 'green';
  }

  return {
    score,
    label,
    percentage: score,
    color,
    checks,
    feedback: generatePasswordFeedback(checks, password.length)
  };
};

// Generate helpful feedback for password improvement
export const generatePasswordFeedback = (checks, length) => {
  const feedback = [];

  if (!checks.length) {
    feedback.push('Use at least 8 characters');
  }

  if (!checks.lowercase) {
    feedback.push('Add lowercase letters');
  }

  if (!checks.uppercase) {
    feedback.push('Add uppercase letters');
  }

  if (!checks.numbers) {
    feedback.push('Add numbers');
  }

  if (!checks.symbols) {
    feedback.push('Add special characters');
  }

  if (checks.common) {
    feedback.push('Avoid common words or patterns');
  }

  if (length < 12 && checks.length) {
    feedback.push('Consider using 12+ characters for better security');
  }

  return feedback;
};

// Get Tailwind color class for strength indicator
export const getStrengthColorClass = (strength) => {
  switch (strength.color) {
    case 'red':
      return 'bg-red-500';
    case 'orange':
      return 'bg-orange-500';
    case 'green':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

// Get Tailwind color class for text
export const getStrengthTextColorClass = (strength) => {
  switch (strength.color) {
    case 'red':
      return 'text-red-600';
    case 'orange':
      return 'text-orange-600';
    case 'green':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

// Validate password meets minimum requirements
export const validatePasswordStrength = (password, minStrength = 40) => {
  const strength = calculatePasswordStrength(password);
  return {
    isValid: strength.score >= minStrength,
    strength,
    message: strength.score >= minStrength 
      ? 'Password strength is acceptable' 
      : `Password is too weak. Score: ${strength.score}/100`
  };
};

// Check if password has required character types
export const hasRequiredCharacterTypes = (password) => {
  const checks = {
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSymbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    hasMinLength: password.length >= 8
  };

  const allRequired = checks.hasLowercase && checks.hasUppercase && checks.hasNumbers && checks.hasSymbols && checks.hasMinLength;

  return {
    ...checks,
    allRequired,
    missingTypes: Object.keys(checks).filter(key => key !== 'allRequired' && !checks[key])
  };
};

export default {
  calculatePasswordStrength,
  generatePasswordFeedback,
  getStrengthColorClass,
  getStrengthTextColorClass,
  validatePasswordStrength,
  hasRequiredCharacterTypes
};

