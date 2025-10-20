import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePhoneNumber } from '../utils/authValidation';
import { sendPasswordResetOTP, initializeRecaptcha, clearRecaptcha } from '../config/firebase';
import { ArrowLeftIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [inputType, setInputType] = useState('email'); // 'email' or 'phone'
  
  const { sendPhoneOTP } = useAuth();
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setEmailOrPhone(value);
    setValidationError('');
    
    // Auto-detect input type with proper validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const numericValue = value.replace(/\D/g, '');
    
    if (emailRegex.test(value)) {
      setInputType('email');
    } else if (numericValue.length >= 10 && numericValue.length <= 15 && /^\+?\d+$/.test(value)) {
      setInputType('phone');
    } else {
      setInputType('unknown');
    }
  };

  const validateInput = () => {
    if (!emailOrPhone.trim()) {
      setValidationError('Email or phone number is required');
      return false;
    }

    if (inputType === 'email') {
      const emailValidation = validateEmail(emailOrPhone);
      if (!emailValidation.isValid) {
        setValidationError(emailValidation.error);
        return false;
      }
    } else {
      const phoneValidation = validatePhoneNumber(emailOrPhone);
      if (!phoneValidation.isValid) {
        setValidationError(phoneValidation.error);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateInput()) {
      return;
    }

    setIsLoading(true);

    try {
      if (inputType === 'email') {
        // Use Firebase sendPasswordResetEmail for email
        const result = await sendPasswordResetOTP(emailOrPhone);
        
        if (result.success) {
          toast.success('Password reset email sent successfully to your registered address ✅');
          navigate('/login');
        } else {
          toast.error(result.error || 'Failed to send password reset email');
        }
      } else {
        // Use Firebase PhoneAuthProvider for mobile
        const recaptchaVerifier = initializeRecaptcha('recaptcha-container');
        const result = await sendPhoneOTP(emailOrPhone);
        
        if (result.success) {
          toast.success('OTP sent to your registered number ✅');
          navigate('/verify-reset-otp', {
            state: {
              phoneNumber: emailOrPhone,
              confirmationResult: result.confirmationResult
            }
          });
        } else {
          toast.error(result.error || 'Failed to send OTP');
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Agriculture Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1920&q=80"
          alt="Smart Agriculture"
          className="w-full h-full object-cover blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F5E9]/20 via-[#F1F8E9]/15 to-[#E8F5E9]/20" />
      </div>

      {/* Forgot Password Container */}
      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100/80 backdrop-blur-sm mb-6 shadow-lg">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 text-[#2E7D32] tracking-wide drop-shadow-sm">
            SmartAgro
          </h1>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Forgot Password?
          </h2>
          
          <p className="text-gray-700">
            No worries! Enter your email or phone number and we'll send you a verification code.
          </p>
        </div>

        {/* Glassy Forgot Password Card */}
        <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-semibold text-gray-800 mb-2">
                Email or Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {inputType === 'email' ? (
                    <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                  ) : (
                    <DevicePhoneMobileIcon className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <input
                  id="emailOrPhone"
                  name="emailOrPhone"
                  type={inputType === 'email' ? 'email' : 'tel'}
                  autoComplete={inputType === 'email' ? 'email' : 'tel'}
                  required
                  value={emailOrPhone}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white/40 backdrop-blur-sm border ${
                    validationError ? 'border-red-500' : 'border-white/50'
                  } rounded-lg text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out`}
                  placeholder={inputType === 'email' ? 'Enter your email address' : 'Enter your phone number (+94)'}
                />
              </div>
              {validationError && (
                <p className="text-red-600 text-sm mt-1 font-medium">{validationError}</p>
              )}
              {emailOrPhone && inputType !== 'unknown' && (
                <p className="text-xs text-gray-700 mt-1">
                  {inputType === 'email' 
                    ? '📧 Email detected - We\'ll send a verification code'
                    : '📱 Mobile detected - We\'ll send an SMS code'
                  }
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending Code...</span>
                </>
              ) : (
                <span>Send Verification Code</span>
              )}
            </button>
          </form>
          
          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="text-gray-700 hover:text-gray-900 py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out flex items-center space-x-2 mx-auto font-medium"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
        
        {/* Help Text */}
        <div className="text-center">
          <div className="bg-white/30 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Need Help?</span>
            </h4>
            <ul className="text-sm text-gray-700 space-y-2 text-left">
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">•</span>
                <span>Use the email or phone number from registration</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">•</span>
                <span>Check your email inbox and spam folder</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">•</span>
                <span>Include country code for phone (+94 for Sri Lanka)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">•</span>
                <span>Contact support if issues continue</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
