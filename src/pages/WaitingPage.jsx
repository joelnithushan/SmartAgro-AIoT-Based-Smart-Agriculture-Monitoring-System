import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAIL } from '../config/config';
import toast from 'react-hot-toast';

const WaitingPage = () => {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const { 
    currentUser, 
    sendEmailVerification, 
    sendEmailOTPVerification, 
    verifyEmailOTPCode 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state or current user
  useEffect(() => {
    const email = location.state?.email || currentUser?.email;
    if (email) {
      setUserEmail(email);
    } else {
      // If no email found, redirect to login
      navigate('/login');
    }
  }, [location.state, currentUser, navigate]);

  // Check if user is already verified
  useEffect(() => {
    const checkVerificationStatus = () => {
      if (currentUser && currentUser.emailVerified) {
        // User is verified, redirect to dashboard
        if (userEmail === ADMIN_EMAIL) {
          navigate('/admin');
        } else {
          navigate('/user/dashboard');
        }
      }
    };

    // Check immediately
    checkVerificationStatus();

    // Set up interval to check every 2 seconds
    const interval = setInterval(checkVerificationStatus, 2000);

    return () => clearInterval(interval);
  }, [currentUser, userEmail, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleCheckVerification = async () => {
    setLoading(true);

    try {
      if (currentUser) {
        // Reload user to get latest emailVerified status
        await currentUser.reload();
        
        if (currentUser.emailVerified) {
          toast.success('Email verified successfully! Redirecting to dashboard...');
          setTimeout(() => {
            if (userEmail === ADMIN_EMAIL) {
              navigate('/admin');
            } else {
              navigate('/user/dashboard');
            }
          }, 1500);
        } else {
          toast.error('Email not yet verified. Please check your inbox and click the verification link.');
        }
      } else {
        toast.error('User not found. Please try logging in again.');
      }
    } catch (err) {
      toast.error('Failed to check verification status. Please try again.');
    }
    
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setCanResend(false);
    setCountdown(60);

    try {
      if (currentUser) {
        const result = await sendEmailVerification(currentUser);
        if (result.success) {
          toast.success('Verification email sent! Please check your inbox and spam folder.');
        } else {
          toast.error(result.error || 'Failed to resend verification email');
        }
      } else {
        toast.error('User not found. Please try logging in again.');
      }
    } catch (err) {
      toast.error('Failed to resend verification email.');
    }
    
    setLoading(false);
  };

  const handleUseOTP = async () => {
    setLoading(true);

    try {
      const result = await sendEmailOTPVerification(userEmail);
      if (result.success) {
        setShowOTPForm(true);
        toast.success('OTP code sent! Please check your inbox.');
        setCanResend(false);
        setCountdown(60);
        
        // Show OTP in development mode
        if (result.fallback) {
          console.log('🔑 Development OTP:', result.otp);
        }
      } else {
        toast.error(result.error || 'Failed to send OTP code');
      }
    } catch (err) {
      toast.error('Failed to send OTP code.');
    }
    
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpLoading(true);

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code.');
      setOtpLoading(false);
      return;
    }

    try {
      const result = await verifyEmailOTPCode(userEmail, otp);
      
      if (result.success) {
        toast.success('Email verified successfully! Redirecting to dashboard...');
        setTimeout(() => {
          if (userEmail === ADMIN_EMAIL) {
            navigate('/admin');
          } else {
            navigate('/user/dashboard');
          }
        }, 1500);
      } else {
        toast.error(result.error || 'OTP verification failed');
      }
    } catch (err) {
      toast.error('Failed to verify OTP. Please try again.');
    }
    
    setOtpLoading(false);
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black mb-2 text-green-600 tracking-wide drop-shadow-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            SmartAgro
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verification Required
          </h2>
          <p className="text-gray-600">
            Please verify your email address to continue
          </p>
        </div>

        {/* Waiting Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              A verification email has been sent to:
            </p>
            <p className="text-green-600 font-semibold">
              {userEmail}
            </p>
          </div>


          {/* Main Actions */}
          {!showOTPForm ? (
            <div className="space-y-4">
              <button
                onClick={handleCheckVerification}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'I have verified my email'}
              </button>

              <button
                onClick={handleResendVerification}
                disabled={loading || !canResend}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : `Resend verification email ${countdown > 0 ? `(${countdown}s)` : ''}`}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <button
                onClick={handleUseOTP}
                disabled={loading}
                className="w-full border border-green-300 text-green-700 py-3 px-4 rounded-lg hover:bg-green-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Use OTP Verification Instead'}
              </button>
            </div>
          ) : (
            /* OTP Form */
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={handleOTPChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-center text-lg tracking-widest"
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  autoComplete="one-time-code"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowOTPForm(false);
                    setOtp('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-700 font-medium">Check your email</p>
                <p className="text-xs text-blue-600 mt-1">
                  Look for an email from SmartAgro with your verification link or OTP code. 
                  Don't forget to check your spam folder!
                </p>
              </div>
            </div>
          </div>

          {/* Development OTP Display */}
          {showOTPForm && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Development Mode</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Check browser console for OTP code
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingPage;
