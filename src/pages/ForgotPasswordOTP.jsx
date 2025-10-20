import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ForgotPasswordOTP = () => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [inputType, setInputType] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showResendButton, setShowResendButton] = useState(false);
  
  const { verifyPasswordResetOTP, sendPasswordResetOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state
  useEffect(() => {
    if (location.state?.emailOrPhone) {
      setEmailOrPhone(location.state.emailOrPhone);
    }
    if (location.state?.type) {
      setInputType(location.state.type);
    }
    if (location.state?.verificationId) {
      setVerificationId(location.state.verificationId);
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
    
    setIsVerifying(true);
    
    try {
      const result = await verifyPasswordResetOTP(verificationId, otp, emailOrPhone, inputType);
      
      if (result.success) {
        toast.success('Verification successful! You can now reset your password.');
        navigate('/reset-password', {
          state: {
            emailOrPhone: emailOrPhone,
            type: inputType,
            verificationId: verificationId,
            resetToken: result.resetToken
          }
        });
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (!emailOrPhone || !inputType) {
      toast.error('Missing information. Please try again from the beginning.');
      navigate('/forgot-password');
      return;
    }
    
    setIsResending(true);
    
    try {
      const result = await sendPasswordResetOTP(emailOrPhone, inputType);
      
      if (result.success) {
        toast.success('Verification code sent successfully!');
        setVerificationId(result.verificationId);
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
  
  if (!emailOrPhone || !inputType) {
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Missing Information</h2>
            <p className="text-gray-700 mb-6">Unable to find verification details. Please try again.</p>
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

      {/* OTP Container */}
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
            Enter Verification Code
          </h2>
          
          <p className="text-gray-700">
            We've sent a verification code to:
          </p>
          
          <p className="text-green-700 font-semibold text-lg mt-2 break-all">
            {emailOrPhone}
          </p>
        </div>

        {/* Glassy OTP Verification Card */}
        <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl p-8">
          <div className="space-y-6">
            {/* Status Message */}
            <div className="bg-green-100/60 backdrop-blur-sm border border-green-200/50 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-green-800">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="font-medium">Verification code sent successfully!</span>
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
                />
                <p className="text-xs text-gray-700 mt-2 text-center">
                  Enter the 6-digit code from your {inputType === 'email' ? 'email' : 'SMS'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifying || otp.length !== 6}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                {isVerifying ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Verify Code</span>
                  </>
                )}
              </button>
            </form>
            
            {/* Resend Code Section */}
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-700 font-medium">
                Didn't receive the code?
              </div>
              
              {showResendButton ? (
                <button
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="text-green-700 hover:text-green-800 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
                >
                  {isResending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Resend Code</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="text-sm text-gray-700 font-medium">
                  Resend code in {resendCooldown} seconds
                </div>
              )}
            </div>
            
            {/* Back Button */}
            <button
              onClick={handleBackToForgotPassword}
              className="w-full text-gray-700 hover:text-gray-900 py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out font-medium flex items-center justify-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Forgot Password</span>
            </button>
          </div>
          
          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-white/30">
            <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Need Help?</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Check your {inputType === 'email' ? 'email inbox and spam folder' : 'SMS messages'}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Ensure you entered the correct {inputType === 'email' ? 'email address' : 'phone number'}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Wait a few minutes for the code to arrive</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Try resending the code if needed</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
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

export default ForgotPasswordOTP;
