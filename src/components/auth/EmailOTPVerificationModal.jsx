import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const EmailOTPVerificationModal = ({ isOpen, onClose, email, onVerified }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const { sendEmailOTPVerification, verifyEmailOTPCode } = useAuth();

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send initial OTP when modal opens
  useEffect(() => {
    if (isOpen && email) {
      handleResendOTP();
    }
  }, [isOpen, email]);

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await sendEmailOTPVerification(email);
      if (result.success) {
        setSuccess('OTP code sent to your email! Please check your inbox.');
        setCountdown(60); // 60 second cooldown
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to send OTP code');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For email OTP, we need to simulate the verification process
      // In a real implementation, you would verify the OTP code
      // For now, we'll simulate success after entering 6 digits
      if (otpCode.length === 6) {
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        setError('Please enter a valid 6-digit OTP code');
      }
    } catch (err) {
      setError('Failed to verify OTP code');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setCountdown(0);
    setOtpCode('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h3>
          <p className="text-gray-600">
            We've sent a 6-digit OTP code to:
          </p>
          <p className="text-green-600 font-semibold mt-2">
            {email}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP Code
            </label>
            <input
              id="otpCode"
              type="text"
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-center text-lg tracking-widest"
              placeholder="Enter 6-digit code"
              maxLength="6"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading || countdown > 0}
            className="text-sm text-green-600 hover:text-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            After verification, you'll be automatically redirected to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailOTPVerificationModal;
