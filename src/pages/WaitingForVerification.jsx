import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const WaitingForVerification = () => {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { currentUser, sendEmailVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state or current user
  useEffect(() => {
    const email = location.state?.email || currentUser?.email;
    if (email) {
      setUserEmail(email);
    } else {
      // If no email found, redirect to login
      toast.error('No email found for verification. Please log in or register again.');
      navigate('/login');
    }
  }, [location.state, currentUser, navigate]);

  // Periodically check if user is verified
  useEffect(() => {
    let interval;
    if (currentUser && userEmail) {
      interval = setInterval(async () => {
        await currentUser.reload(); // Reload user to get latest status
        if (currentUser.emailVerified) {
          toast.success('Email verified successfully! Redirecting to dashboard...');
          clearInterval(interval);
          setTimeout(() => {
            navigate('/user/dashboard');
          }, 1500);
        }
      }, 5000); // Check every 5 seconds
    }

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

  const handleResendVerification = async () => {
    setLoading(true);
    setCanResend(false);
    setCountdown(60); // Reset countdown

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

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Agriculture Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1530210124551-ab211c98d3b3?auto=format&fit=crop&w=1920&q=80"
          alt="Smart Farming"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-green-900 opacity-70"></div>
      </div>

      <motion.div
        className="max-w-md w-full space-y-8 relative z-10 p-8 bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-2xl"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black mb-2 text-white tracking-wide drop-shadow-md" style={{ fontFamily: 'Poppins, sans-serif' }}>
            SmartAgro
          </h1>
          <h2 className="text-2xl font-bold text-white mb-2">
            Waiting for Verification
          </h2>
          <p className="text-gray-200">
            A verification link has been sent to:
          </p>
          <p className="text-green-300 font-semibold text-lg mt-2 break-all">
            {userEmail}
          </p>
        </div>

        {/* Verification Instructions */}
        <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center text-white border border-white/40 shadow-inner">
          <p className="text-sm mb-2">
            Please check your inbox (and spam folder!) for the verification email.
          </p>
          <p className="text-sm font-medium">
            Click the link in the email to verify your account.
          </p>
        </div>

        {/* Resend Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleResendVerification}
          disabled={loading || !canResend}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin mr-3" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5 mr-3" />
              <span>Resend Verification Email {countdown > 0 ? `(${countdown}s)` : ''}</span>
            </>
          )}
        </motion.button>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-200">
            Already verified?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-green-300 hover:text-green-100 transition-colors duration-200"
            >
              Go to Login
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default WaitingForVerification;
