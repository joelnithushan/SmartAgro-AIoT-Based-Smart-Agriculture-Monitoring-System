import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const EmailVerificationModal = ({ isOpen, onClose, user, onVerified }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { sendEmailVerification } = useAuth();

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check if user is verified
  useEffect(() => {
    if (user && user.emailVerified) {
      onVerified();
    }
  }, [user, onVerified]);

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await sendEmailVerification(user);
      if (result.success) {
        setSuccess('Verification email sent! Please check your inbox.');
        setCountdown(60); // 60 second cooldown
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to send verification email');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setCountdown(0);
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
            We've sent a verification link to:
          </p>
          <p className="text-green-600 font-semibold mt-2">
            {user?.email}
          </p>
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ Verification email sent automatically! Please check your inbox.
            </p>
          </div>
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

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Please check your email and click the verification link to activate your account.
            </p>
            <p className="text-xs text-gray-500">
              Don't see the email? Check your spam folder.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={loading || countdown > 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            After verification, you'll be automatically redirected to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
