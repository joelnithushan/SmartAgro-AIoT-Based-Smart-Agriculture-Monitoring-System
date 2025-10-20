import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAIL } from '../services/config';
import { validateRegistrationForm } from '../utils/authValidation';
import { initializeRecaptcha, clearRecaptcha } from '../config/firebase';
import { calculatePasswordStrength, getStrengthColorClass, getStrengthTextColorClass } from '../components/common/validations/passwordStrength';
import { validateEmailWithMailboxLayer, isValidEmailFormat, isDisposableEmail } from '../services/emailValidationService';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Register = () => {
  const [formData, setFormData] = useState({
    emailOrMobile: '', // Single input field
    password: '',
    confirmPassword: ''
  });

  const [inputType, setInputType] = useState('email'); // Auto-detected: 'email' or 'phone'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);

  const { 
    registerWithEmailAndPassword, 
    registerWithPhoneAndPassword, 
    googleSignIn, 
    appleSignIn
  } = useAuth();
  const navigate = useNavigate();
  const recaptchaContainerRef = useRef(null);

  // Initialize reCAPTCHA on component mount
  useEffect(() => {
    if (recaptchaContainerRef.current) {
      try {
        initializeRecaptcha('recaptcha-container');
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
      }
    }
    
    return () => {
      clearRecaptcha();
    };
  }, []);

  // Auto-detect input type (email or mobile)
  const detectInputType = (value) => {
    console.log('Detecting input type for:', value);
    
    // Check if input is a valid email format (use same regex as validation)
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const isEmail = emailRegex.test(value);
    console.log('Is email:', isEmail);
    
    if (isEmail) {
      return 'email';
    }
    
    // Check if input is numeric and 10-15 digits (phone number)
    const numericValue = value.replace(/\D/g, ''); // Remove non-digits
    const isPhone = numericValue.length >= 10 && numericValue.length <= 15 && /^\+?\d+$/.test(value);
    console.log('Is phone:', isPhone, 'numericValue:', numericValue);
    
    if (isPhone) {
      return 'phone';
    }
    
    // Default to 'unknown' if unclear
    console.log('Returning unknown');
    return 'unknown';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-detect input type for emailOrMobile field
    if (name === 'emailOrMobile') {
      const detectedType = detectInputType(value);
      setInputType(detectedType);
    }

    setFormData({
      ...formData,
      [name]: value
    });
    
    // Calculate password strength when password changes
    if (name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare validation data based on detected input type
    const validationData = {
      ...formData,
      email: inputType === 'email' ? formData.emailOrMobile : '',
      phoneNumber: inputType === 'phone' ? formData.emailOrMobile : '',
      registrationType: inputType
    };
    
    // Debug: Log validation data
    console.log('Validation data:', validationData);
    console.log('Input type:', inputType);
    console.log('Email value:', validationData.email);
    
    // Validate form using the validation utility
    const validation = validateRegistrationForm(validationData);
    console.log('Validation result:', validation);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      // Show first error in toast
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }
    
    setLoading(true);
    setFormErrors({});

    try {
      if (inputType === 'email') {
        // Validate email format first
        console.log('Second email validation - checking:', formData.emailOrMobile);
        const emailFormatValid = isValidEmailFormat(formData.emailOrMobile);
        console.log('isValidEmailFormat result:', emailFormatValid);
        
        if (!emailFormatValid) {
          console.log('Email format validation failed');
          toast.error('Please enter a valid email address');
          return;
        }
        console.log('Email format validation passed');

        // Check for disposable emails locally first
        if (isDisposableEmail(formData.emailOrMobile)) {
          toast.error('Invalid or temporary email. Please use a valid email address.');
          return;
        }

        // Validate email with MailboxLayer API (with fallback)
        toast.loading('Validating email address...', { id: 'email-validation' });
        
        try {
          const emailValidation = await validateEmailWithMailboxLayer(formData.emailOrMobile);
          toast.dismiss('email-validation');

          if (!emailValidation.success) {
            // If API fails completely, show warning but allow registration
            console.warn('Email validation API failed, allowing registration with warning');
            toast.warning('Email validation service unavailable. Proceeding with registration.');
          } else if (!emailValidation.isValid) {
            toast.error('Invalid or temporary email. Please use a valid email address.');
            return;
          }

          // Show warning if API had issues but still proceeding
          if (emailValidation.warning) {
            console.warn('Email validation warning:', emailValidation.warning);
          }
        } catch (error) {
          // If validation completely fails, allow registration with warning
          console.warn('Email validation error, allowing registration:', error);
          toast.dismiss('email-validation');
          toast.warning('Email validation service unavailable. Proceeding with registration.');
        }

        // Proceed with Firebase registration
        const result = await registerWithEmailAndPassword(formData.emailOrMobile, formData.password);
        
        if (result.success) {
          toast.success('Verification link sent to your email. Please check your inbox or spam folder.');
          // Navigate to waiting for verification page
          navigate('/waiting-verification', { 
            state: { 
              email: formData.emailOrMobile
            } 
          });
        } else {
          // Debug: Log the actual error message
          console.log('Registration error:', result.error);
          
          // Handle specific Firebase errors with user-friendly messages
          if (result.error && (result.error.includes('email-already-in-use') || result.error.includes('auth/email-already-in-use') || result.error.includes('Email address is already in use'))) {
            toast.error('This email is already registered. Please try signing in instead.', {
              duration: 5000,
              style: {
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca'
              }
            });
            // Show a more helpful message with link to login
            setTimeout(() => {
              toast.error('Click "Sign in here" below to access your existing account.', {
                duration: 4000,
                style: {
                  background: '#fef3c7',
                  color: '#d97706',
                  border: '1px solid #fde68a'
                }
              });
            }, 1000);
          } else if (result.error && result.error.includes('weak-password')) {
            toast.error('Password is too weak. Please choose a stronger password.');
          } else if (result.error && result.error.includes('invalid-email')) {
            toast.error('Please enter a valid email address.');
          } else {
            // Fallback: Check if it's any kind of "already in use" error
            if (result.error && (result.error.toLowerCase().includes('already') || result.error.toLowerCase().includes('in use'))) {
              toast.error('This email is already registered. Please try signing in instead.', {
                duration: 5000,
                style: {
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca'
                }
              });
              setTimeout(() => {
                toast.error('Click "Sign in here" below to access your existing account.', {
                  duration: 4000,
                  style: {
                    background: '#fef3c7',
                    color: '#d97706',
                    border: '1px solid #fde68a'
                  }
                });
              }, 1000);
            } else {
              toast.error(result.error || 'Registration failed. Please try again.');
            }
          }
        }
      } else {
        // Phone registration - send OTP first
        // Temporary: Show SMS not available message
        toast.error('SMS authentication is temporarily unavailable. Please use email registration instead.', {
          duration: 5000,
          style: {
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca'
          }
        });
        return;
        
        // Commented out until SMS is properly configured
        /*
        const recaptchaVerifier = initializeRecaptcha('recaptcha-container');
        const phoneResult = await registerWithPhoneAndPassword(formData.emailOrMobile, formData.password, recaptchaVerifier);
        
        if (phoneResult.success) {
          toast.success('SMS verification code sent!');
          // Navigate to phone verification page
          navigate('/phone-verification', {
            state: {
              phoneNumber: formData.emailOrMobile,
              confirmationResult: phoneResult.confirmationResult
            }
          });
        } else {
          // Handle specific phone registration errors
          if (phoneResult.error && (phoneResult.error.includes('SMS authentication is not enabled') || phoneResult.error.includes('not properly configured') || phoneResult.error.includes('not authorized'))) {
            toast.error('SMS authentication is not available. Please use email registration instead.', {
              duration: 6000,
              style: {
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca'
              }
            });
            // Show suggestion to switch to email
            setTimeout(() => {
              toast.error('Try entering an email address instead of a phone number.', {
                duration: 4000,
                style: {
                  background: '#fef3c7',
                  color: '#d97706',
                  border: '1px solid #fde68a'
                }
              });
            }, 2000);
            // Show additional help
            setTimeout(() => {
              toast.error('SMS may need additional Firebase configuration. Contact support if needed.', {
                duration: 4000,
                style: {
                  background: '#f0f9ff',
                  color: '#0369a1',
                  border: '1px solid #bae6fd'
                }
              });
            }, 4000);
          } else if (phoneResult.error && phoneResult.error.includes('invalid phone number')) {
            toast.error('Please enter a valid phone number with country code (e.g., +1234567890).');
          } else if (phoneResult.error && phoneResult.error.includes('too many requests')) {
            toast.error('Too many SMS requests. Please try again later or use email registration.');
          } else if (phoneResult.error && phoneResult.error.includes('reCAPTCHA verification failed')) {
            toast.error('reCAPTCHA verification failed. Please try again.');
          } else {
            toast.error(phoneResult.error || 'Failed to send SMS verification');
          }
        }
        */
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('Failed to create account. Please try again.');
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      const result = await googleSignIn();
      if (result.success) {
        toast.success('Google sign-up successful!');
        // Check if user is admin and redirect accordingly
        if (result.user?.email === ADMIN_EMAIL) {
          navigate('/admin');
        } else {
          navigate('/user/dashboard');
        }
      } else {
        toast.error(result.error || 'Google sign-up failed');
      }
    } catch (err) {
      toast.error('Failed to sign up with Google');
    }
    setLoading(false);
  };

  const handleAppleSignIn = async () => {
    setLoading(true);

    try {
      const result = await appleSignIn();
      if (result.success) {
        toast.success('Apple sign-up successful!');
        // Check if user is admin and redirect accordingly
        if (result.user?.email === ADMIN_EMAIL) {
          navigate('/admin');
        } else {
          navigate('/user/dashboard');
        }
      } else {
        toast.error(result.error || 'Apple sign-up failed');
      }
    } catch (err) {
      toast.error('Failed to sign up with Apple');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Agriculture Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1920&q=80"
          alt="Smart Farming"
          className="w-full h-full object-cover blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F5E9]/20 via-[#F1F8E9]/15 to-[#E8F5E9]/20" />
      </div>

      {/* Register Container */}
      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-[#2E7D32] tracking-wide drop-shadow-sm">
            SmartAgro
          </h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-700">
            Join thousands of farmers using smart technology
          </p>
        </div>

        {/* Glassy Register Card */}
        <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl p-8">
          {/* Social Sign Up Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-lg text-sm font-medium text-gray-800 hover:bg-white/70 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <FcGoogle className="w-5 h-5 mr-3" />
              Sign up with Google
            </button>

            <button
              onClick={handleAppleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-lg text-sm font-medium text-gray-800 hover:bg-white/70 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <FaApple className="w-5 h-5 mr-3" />
              Sign up with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white/30 backdrop-blur-sm rounded-full text-gray-700 font-medium">
                Or sign up with {inputType === 'email' ? 'email' : 'mobile'}
              </span>
            </div>
          </div>

          {/* Register Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email or Mobile Number Input (Auto-detect) */}
            <div>
              <label htmlFor="emailOrMobile" className="block text-sm font-semibold text-gray-800 mb-2">
                Email or Mobile Number
              </label>
              <input
                id="emailOrMobile"
                name="emailOrMobile"
                type="text"
                autoComplete="username"
                required
                value={formData.emailOrMobile}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white/40 backdrop-blur-sm border ${
                  formErrors.email || formErrors.phoneNumber ? 'border-red-500' : 'border-white/50'
                } rounded-lg text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out`}
                placeholder="Enter your email or mobile number"
              />
              {formData.emailOrMobile && inputType !== 'unknown' && (
                <p className="text-xs text-gray-700 mt-1">
                  {inputType === 'email' ? '📧 Email detected' : '📱 Mobile number detected'}
                  {inputType === 'phone' && ' (Include country code: +94)'}
                </p>
              )}
              {inputType === 'phone' && (
                <div className="text-xs text-amber-600 mt-1 bg-amber-50 px-2 py-1 rounded">
                  <p className="font-medium">⚠️ SMS Authentication Notice:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• SMS authentication may not be fully configured</li>
                    <li>• If SMS fails, try using email registration instead</li>
                    <li>• Make sure to include country code (e.g., +94 for Sri Lanka)</li>
                    <li>• Contact support if SMS issues persist</li>
                  </ul>
                </div>
              )}
              {(formErrors.email || formErrors.phoneNumber) && (
                <p className="text-red-600 text-sm mt-1 font-medium">
                  {formErrors.email || formErrors.phoneNumber}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 bg-white/40 backdrop-blur-sm border ${
                    formErrors.password ? 'border-red-500' : 'border-white/50'
                  } rounded-lg text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-600 text-sm mt-1 font-medium">{formErrors.password}</p>
              )}
              
              {/* Password Strength Indicator */}
              {formData.password && passwordStrength && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Password Strength:</span>
                    <span className={`font-medium ${getStrengthTextColorClass(passwordStrength)}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-2 rounded-full ${getStrengthColorClass(passwordStrength)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength.percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">To improve:</p>
                      <ul className="space-y-1">
                        {passwordStrength.feedback.slice(0, 3).map((item, index) => (
                          <li key={index} className="flex items-center space-x-1">
                            <span className="text-red-500">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-700 mt-1">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 bg-white/40 backdrop-blur-sm border ${
                    formErrors.confirmPassword ? 'border-red-500' : 'border-white/50'
                  } rounded-lg text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1 font-medium">{formErrors.confirmPassword}</p>
              )}
            </div>

            {/* Register Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-800">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-green-700 hover:text-green-800 transition-colors duration-300 ease-in-out"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* reCAPTCHA Container (hidden) */}
        <div id="recaptcha-container" ref={recaptchaContainerRef} className="flex justify-center"></div>
      </div>
    </div>
  );
};

export default Register;
