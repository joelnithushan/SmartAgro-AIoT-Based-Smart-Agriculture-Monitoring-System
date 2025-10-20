import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircleIcon, ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const VerifyResetOTP = () => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showResendButton, setShowResendButton] = useState(false);
  
  const { verifyPhoneOTP, sendPhoneOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state
  useEffect(() => {
    if (location.state?.phoneNumber) {
      setPhoneNumber(location.state.phoneNumber);
    }
    if (location.state?.confirmationResult) {
      setConfirmationResult(location.state.confirmationResult);
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
    
    return () => clearInterval(countdownInterval);
  }, [location.state]);
  
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };
  
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }
    
    if (!confirmationResult) {
      toast.error('Verification session expired. Please try again.');
      navigate('/forgot-password');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const result = await verifyPhoneOTP(confirmationResult, otp);
      
      if (result.success) {
        toast.success('OTP verified successfully ✅');
        navigate('/reset-password', {
          state: {
            phoneNumber: phoneNumber,
            isPhoneReset: true
          }
        });
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (!phoneNumber) {
      toast.error('Phone number not found. Please try again.');
      navigate('/forgot-password');
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
      console.error('Error resending OTP:', error);
      toast.error('Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };
  
  const handleBackToForgotPassword = () => {
    navigate('/forgot-password');
  };
  
  if (!phoneNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1920&q=80"
            alt="Smart Agriculture"
            className="w-full h-full object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8F5E9]/20 via-[#F1F8E9]/15 to-[#E8F5E9]/20" />
        </div>
        <div className="relative z-10 max-w-md w-full text-center">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Phone Number Not Found</h2>
            <p className="text-gray-700 mb-6">Unable to find phone number information. Please try again.</p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              Back to Forgot Password
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
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

      {/* OTP Verification Container */}
      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100/80 backdrop-blur-sm mb-6 shadow-lg">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold mb-2 text-[#2E7D32] tracking-wide drop-shadow-sm">
            SmartAgro
          </h1>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Verify Your Phone
          </h2>
          
          <p className="text-gray-700">
            We've sent a verification code to:
          </p>
          
          <p className="text-green-700 font-semibold text-lg mt-2">
            {phoneNumber}
          </p>
        </div>

        {/* Glassy OTP Verification Card */}
        <motion.div
          className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl p-8"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="space-y-6">
            {/* Status Message */}
            <div className="bg-green-100/60 backdrop-blur-sm border border-green-200/50 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-green-800">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="font-medium">SMS verification code sent!</span>
              </div>
            </div>
            
            {/* OTP Form */}
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-800 mb-2">
                  Enter 6-Digit Code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={otp}
                  onChange={handleOtpChange}
                  className="w-full px-4 py-4 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out text-center text-2xl tracking-widest font-mono text-gray-800"
                  placeholder="000000"
                  maxLength="6"
                  autoComplete="one-time-code"
                  autoFocus
                />
                <p className="text-xs text-gray-700 mt-2 text-center">
                  Enter the 6-digit code from your SMS
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isVerifying || otp.length !== 6}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                {isVerifying ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Verify Code</span>
                  </>
                )}
              </motion.button>
            </form>
            
            {/* Resend Code Section */}
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-700 font-medium">
                Didn't receive the code?
              </div>
              
              {showResendButton ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="text-green-700 hover:text-green-800 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
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
                </motion.button>
              ) : (
                <div className="text-sm text-gray-700 font-medium">
                  Resend code in {resendCooldown} seconds
                </div>
              )}
            </div>
            
            {/* Back Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBackToForgotPassword}
              className="w-full text-gray-700 hover:text-gray-900 py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out font-medium flex items-center justify-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Forgot Password</span>
            </motion.button>
          </div>
          
          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-white/30">
            <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Need Help?</span>
              </h4>
              <ul className="text-sm text-gray-700 space-y-2 text-left">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Check your SMS messages</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Ensure you entered the correct phone number</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Wait a few minutes for the SMS to arrive</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Try resending the code if needed</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
        
        {/* Footer */}
        <div className="text-center">
          <div className="bg-white/30 backdrop-blur-md rounded-lg p-3">
            <p className="text-sm text-gray-700 font-medium">⏱️ Verification code will expire in 10 minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetOTP;
