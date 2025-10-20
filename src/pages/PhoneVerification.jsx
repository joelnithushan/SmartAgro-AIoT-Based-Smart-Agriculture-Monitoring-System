import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { initializeRecaptcha, clearRecaptcha } from '../config/firebase';
import toast from 'react-hot-toast';

const PhoneVerification = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showResendButton, setShowResendButton] = useState(false);
  
  const recaptchaContainerRef = useRef(null);
  const { verifyPhoneOTP, sendPhoneOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize reCAPTCHA and get phone number from location state
  useEffect(() => {
    if (location.state?.phoneNumber) {
      setPhoneNumber(location.state.phoneNumber);
    }
    
    if (location.state?.confirmationResult) {
      setConfirmationResult(location.state.confirmationResult);
    }
    
    // Initialize reCAPTCHA
    if (recaptchaContainerRef.current) {
      try {
        initializeRecaptcha('recaptcha-container');
        console.log('reCAPTCHA initialized successfully');
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        toast.error('Failed to initialize verification. Please refresh the page.');
      }
    }
    
    // Start countdown timer
    const countdownInterval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowResendButton(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(countdownInterval);
      clearRecaptcha();
    };
  }, [location.state]);
  
  const handleVerificationCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setVerificationCode(value);
    }
  };
  
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }
    
    if (!confirmationResult) {
      toast.error('Verification session expired. Please try again.');
      navigate('/register');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const result = await verifyPhoneOTP(confirmationResult, verificationCode);
      
      if (result.success) {
        toast.success('Phone number verified successfully!');
        // User is automatically signed in, redirect to dashboard
        navigate('/redirect');
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying phone code:', error);
      toast.error('Failed to verify phone number. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleResendCode = async () => {
    if (!phoneNumber) {
      toast.error('Phone number not found. Please try registering again.');
      navigate('/register');
      return;
    }
    
    setIsResending(true);
    
    try {
      const result = await sendPhoneOTP(phoneNumber);
      
      if (result.success) {
        toast.success('Verification code sent successfully!');
        setConfirmationResult(result.confirmationResult);
        setResendCooldown(60);
        setShowResendButton(false);
        
        // Start countdown again
        const countdownInterval = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setShowResendButton(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(result.error || 'Failed to resend verification code');
      }
    } catch (error) {
      console.error('Error resending verification code:', error);
      toast.error('Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };
  
  const handleBackToRegister = () => {
    clearRecaptcha();
    navigate('/register');
  };
  
  if (!phoneNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Phone Number Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to find phone number information. Please try registering again.</p>
          <button
            onClick={() => navigate('/register')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Registration
          </button>
        </div>
      </div>
    );
  }
  
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

      {/* Phone Verification Container */}
      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
            <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-black mb-2 text-green-600 tracking-wide drop-shadow-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            SmartAgro
          </h1>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Phone
          </h2>
          
          <p className="text-gray-600">
            We've sent a verification code to:
          </p>
          
          <p className="text-green-600 font-semibold text-lg mt-2">
            {phoneNumber}
          </p>
        </div>

        {/* Glassy Verification Card */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-2xl p-8">
          <div className="space-y-6">
            {/* Status Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="font-medium">SMS verification code sent!</span>
              </div>
            </div>
            
            {/* Verification Form */}
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={verificationCode}
                  onChange={handleVerificationCodeChange}
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength="6"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the 6-digit code from your SMS
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isVerifying ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Verify Phone Number</span>
                  </>
                )}
              </button>
            </form>
            
            {/* Resend Code Section */}
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-600">
                Didn't receive the code?
              </div>
              
              {showResendButton ? (
                <button
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
                >
                  {isResending ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-4 w-4" />
                      <span>Resend Code</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="text-sm text-gray-500">
                  Resend code in {resendCooldown} seconds
                </div>
              )}
            </div>
            
            {/* Back Button */}
            <button
              onClick={handleBackToRegister}
              className="w-full text-gray-500 hover:text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Back to Registration
            </button>
          </div>
          
          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check your SMS messages</li>
                <li>• Make sure you entered the correct phone number</li>
                <li>• Wait a few minutes for the SMS to arrive</li>
                <li>• Try resending the code if needed</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* reCAPTCHA Container (hidden) */}
        <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Verification code will expire in 10 minutes</p>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerification;
