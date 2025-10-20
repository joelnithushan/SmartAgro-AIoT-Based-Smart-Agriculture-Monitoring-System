import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_EMAIL } from '../../services/config';
import { CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const EmailVerification = () => {
  const [userEmail, setUserEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('waiting'); // 'waiting', 'verified', 'failed'

  const { 
    currentUser, 
    sendEmailVerification 
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

  // Auto-check verification status every 5 seconds
  useEffect(() => {
    if (!currentUser || !userEmail) return;

    const checkVerificationStatus = async () => {
      try {
        // Reload user to get latest emailVerified status
        await currentUser.reload();
        
        if (currentUser.emailVerified) {
          setVerificationStatus('verified');
          toast.success('Email verified successfully! Redirecting to dashboard...');
          
          setTimeout(() => {
            if (userEmail === ADMIN_EMAIL) {
              navigate('/admin');
            } else {
              navigate('/user/dashboard');
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    // Check immediately
    checkVerificationStatus();

    // Set up interval to check every 5 seconds
    const interval = setInterval(checkVerificationStatus, 5000);

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
    setIsChecking(true);

    try {
      if (currentUser) {
        // Reload user to get latest emailVerified status
        await currentUser.reload();
        
        if (currentUser.emailVerified) {
          setVerificationStatus('verified');
          toast.success('Email verified successfully! Redirecting to dashboard...');
          
          setTimeout(() => {
            if (userEmail === ADMIN_EMAIL) {
              navigate('/admin');
            } else {
              navigate('/user/dashboard');
            }
          }, 2000);
        } else {
          setVerificationStatus('waiting');
          toast.error('Email not yet verified. Please check your inbox and click the verification link.');
        }
      } else {
        toast.error('User not found. Please try logging in again.');
      }
    } catch (err) {
      console.error('Error checking verification:', err);
      toast.error('Failed to check verification status. Please try again.');
    }
    
    setIsChecking(false);
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setCanResend(false);
    setCountdown(60);

    try {
      if (currentUser) {
        const result = await sendEmailVerification(currentUser);
        if (result.success) {
          toast.success('Verification email sent! Please check your inbox and spam folder.');
          setVerificationStatus('waiting');
        } else {
          toast.error(result.error || 'Failed to resend verification email');
          setVerificationStatus('failed');
        }
      } else {
        toast.error('User not found. Please try logging in again.');
      }
    } catch (err) {
      console.error('Error resending verification:', err);
      toast.error('Failed to resend verification email.');
      setVerificationStatus('failed');
    }
    
    setIsResending(false);
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const pulse = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
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

      {/* Email Verification Container */}
      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.div
            className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100/80 backdrop-blur-sm mb-6 shadow-lg"
            variants={verificationStatus === 'verified' ? pulse : {}}
            animate={verificationStatus === 'verified' ? "animate" : ""}
          >
            {verificationStatus === 'verified' ? (
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            ) : verificationStatus === 'failed' ? (
              <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
            ) : (
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </motion.div>
          
          <h1 className="text-4xl font-bold mb-2 text-[#2E7D32] tracking-wide drop-shadow-sm">
            SmartAgro
          </h1>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {verificationStatus === 'verified' ? 'Email Verified!' : 'Verify Your Email'}
          </h2>
          
          <p className="text-gray-700">
            {verificationStatus === 'verified' 
              ? 'Your email has been successfully verified. Redirecting...'
              : 'Please verify your email address to continue'
            }
          </p>
        </div>

        {/* Glassy Verification Card */}
        <motion.div
          className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl p-8"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="text-center mb-6">
            <p className="text-sm text-gray-700 mb-2">
              {verificationStatus === 'verified' 
                ? 'Verification complete!'
                : 'Verification link has been sent to:'
              }
            </p>
            <p className="text-green-700 font-semibold text-lg break-all">
              {userEmail}
            </p>
          </div>

          {/* Status Message */}
          {verificationStatus === 'waiting' && (
            <div className="bg-blue-100/60 backdrop-blur-sm border border-blue-200/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-blue-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Check your email inbox and spam folder</span>
              </div>
            </div>
          )}

          {verificationStatus === 'verified' && (
            <div className="bg-green-100/60 backdrop-blur-sm border border-green-200/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-green-800">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="font-medium">Email verification successful!</span>
              </div>
            </div>
          )}

          {verificationStatus === 'failed' && (
            <div className="bg-red-100/60 backdrop-blur-sm border border-red-200/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-red-800">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="font-medium">Verification failed. Please try again.</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {verificationStatus !== 'verified' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckVerification}
                  disabled={isChecking}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  {isChecking ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>I have verified my email</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResendVerification}
                  disabled={isResending || !canResend}
                  className="w-full border border-white/50 text-gray-700 py-3 px-4 rounded-lg hover:bg-white/20 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isResending ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>
                        Resend verification email {countdown > 0 && `(${countdown}s)`}
                      </span>
                    </>
                  )}
                </motion.button>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoToLogin}
              className="w-full text-gray-700 hover:text-gray-900 py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out font-medium"
            >
              Back to Login
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
                  <span>Check your email inbox and spam/junk folder</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Click the verification link in the email</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Wait a few minutes for the email to arrive</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Contact support if you continue having issues</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmailVerification;