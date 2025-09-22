import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAIL } from '../config/config';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [devOTP, setDevOTP] = useState('');

  const { sendEmailVerification, sendEmailOTPVerification, verifyEmailOTPCode, currentUser } = useAuth();
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

  // Auto-send OTP if coming from protected route
  useEffect(() => {
    if (location.state?.fromProtectedRoute && userEmail) {
      sendEmailOTPVerification(userEmail);
    }
  }, [location.state?.fromProtectedRoute, userEmail, sendEmailOTPVerification]);

  // Start countdown timer
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

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code.');
      setLoading(false);
      return;
    }

    try {
      const result = await verifyEmailOTPCode(userEmail, otp);
      
      if (result.success) {
        toast.success('Email verified successfully!');
        setTimeout(() => {
          // Check if user is admin and redirect accordingly
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
    
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setCanResend(false);
    setCountdown(60);

    try {
      const result = await sendEmailOTPVerification(userEmail);
      if (result.success) {
        toast.success('New OTP code sent! Please check your inbox.');
        // For development, show the OTP in console
        if (result.fallback) {
          console.log('🔑 Development OTP:', result.otp);
          setDevOTP(result.otp);
        }
      } else {
        toast.error(result.error || 'Failed to resend OTP code');
      }
    } catch (err) {
      toast.error('Failed to resend OTP code.');
    }
    
    setLoading(false);
  };

  const handleGoBack = () => {
    navigate('/register');
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
            Verify Your Email
          </h2>
          <p className="text-gray-600">
            We've sent a verification code to your email
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Enter the 6-digit code sent to:
            </p>
            <p className="text-green-600 font-semibold">
              {userEmail}
            </p>
          </div>


          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
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
                onClick={handleGoBack}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-3">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading || !canResend}
              className={`font-medium text-green-600 hover:text-green-500 transition-colors duration-200 ${
                !canResend ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Resend Code {countdown > 0 && `(${countdown}s)`}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-700 font-medium">Check your email</p>
                <p className="text-xs text-blue-600 mt-1">
                  Look for an email from SmartAgro with your 6-digit verification code.
                </p>
              </div>
            </div>
          </div>

          {/* Development OTP Display */}
          {devOTP && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Development Mode</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    OTP Code: <span className="font-mono font-bold text-lg">{devOTP}</span>
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

export default VerifyOTP;
