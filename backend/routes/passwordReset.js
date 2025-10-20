const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

/**
 * Send password reset OTP via email
 * POST /api/password-reset/send-email-otp
 */
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if user exists
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // Generate OTP (6-digit code)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in Firestore with expiration (10 minutes)
      const otpData = {
        email: email,
        otp: otp,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attempts: 0,
        maxAttempts: 3,
        verified: false
      };

      await admin.firestore().collection('passwordResetOTPs').doc(email).set(otpData);

      // TODO: Send OTP via email service (SendGrid, AWS SES, etc.)
      // For now, we'll just log it for development
      console.log(`Password reset OTP for ${email}: ${otp}`);
      
      // In production, you would send the actual email here
      // await sendPasswordResetEmail(email, otp);

      res.json({
        success: true,
        message: 'Password reset OTP sent successfully',
        // Remove this in production - only for development
        development: {
          otp: otp,
          expiresIn: '10 minutes'
        }
      });

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists or not for security
        res.json({
          success: true,
          message: 'If the email exists, a password reset code has been sent'
        });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send password reset code'
    });
  }
});

/**
 * Verify password reset OTP
 * POST /api/password-reset/verify-otp
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    // Get OTP data from Firestore
    const otpDoc = await admin.firestore().collection('passwordResetOTPs').doc(email).get();

    if (!otpDoc.exists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    const otpData = otpDoc.data();
    const now = new Date();

    // Check if OTP is expired
    if (now > otpData.expiresAt.toDate()) {
      // Clean up expired OTP
      await admin.firestore().collection('passwordResetOTPs').doc(email).delete();
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.'
      });
    }

    // Check if maximum attempts exceeded
    if (otpData.attempts >= otpData.maxAttempts) {
      // Clean up after max attempts
      await admin.firestore().collection('passwordResetOTPs').doc(email).delete();
      return res.status(400).json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new OTP.'
      });
    }

    // Check if OTP is already verified
    if (otpData.verified) {
      return res.status(400).json({
        success: false,
        error: 'OTP has already been used'
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      // Increment attempts
      await admin.firestore().collection('passwordResetOTPs').doc(email).update({
        attempts: admin.firestore.FieldValue.increment(1)
      });

      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        attemptsLeft: otpData.maxAttempts - (otpData.attempts + 1)
      });
    }

    // Mark OTP as verified
    await admin.firestore().collection('passwordResetOTPs').doc(email).update({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Generate reset token
    const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store reset token with expiration (15 minutes)
    await admin.firestore().collection('passwordResetTokens').doc(resetToken).set({
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      used: false
    });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: resetToken,
      expiresIn: '15 minutes'
    });

  } catch (error) {
    console.error('Error verifying password reset OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});

/**
 * Reset password with verified OTP
 * POST /api/password-reset/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check for uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Get reset token data
    const tokenDoc = await admin.firestore().collection('passwordResetTokens').doc(resetToken).get();

    if (!tokenDoc.exists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    const tokenData = tokenDoc.data();
    const now = new Date();

    // Check if token is expired
    if (now > tokenData.expiresAt.toDate()) {
      // Clean up expired token
      await admin.firestore().collection('passwordResetTokens').doc(resetToken).delete();
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired. Please request a new password reset.'
      });
    }

    // Check if token is already used
    if (tokenData.used) {
      return res.status(400).json({
        success: false,
        error: 'Reset token has already been used'
      });
    }

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(tokenData.email);

    // Update password using Firebase Admin SDK
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });

    // Mark token as used
    await admin.firestore().collection('passwordResetTokens').doc(resetToken).update({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Clean up OTP data
    await admin.firestore().collection('passwordResetOTPs').doc(tokenData.email).delete();

    // Log password reset action in user's logs
    try {
      await admin.firestore().collection('users').doc(userRecord.uid).update({
        [`logs.${Date.now()}`]: {
          action: 'password_reset',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          method: 'email_otp',
          ipAddress: req.ip || req.connection.remoteAddress
        }
      });
    } catch (logError) {
      console.warn('Failed to log password reset action:', logError);
      // Don't fail the reset if logging fails
    }

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

/**
 * Clean up expired tokens and OTPs (can be called by a cron job)
 * POST /api/password-reset/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    const now = new Date();
    
    // Clean up expired OTPs
    const expiredOTPs = await admin.firestore()
      .collection('passwordResetOTPs')
      .where('expiresAt', '<', now)
      .get();

    const otpBatch = admin.firestore().batch();
    expiredOTPs.forEach(doc => {
      otpBatch.delete(doc.ref);
    });

    // Clean up expired tokens
    const expiredTokens = await admin.firestore()
      .collection('passwordResetTokens')
      .where('expiresAt', '<', now)
      .get();

    const tokenBatch = admin.firestore().batch();
    expiredTokens.forEach(doc => {
      tokenBatch.delete(doc.ref);
    });

    await Promise.all([otpBatch.commit(), tokenBatch.commit()]);

    res.json({
      success: true,
      message: `Cleaned up ${expiredOTPs.size} expired OTPs and ${expiredTokens.size} expired tokens`
    });

  } catch (error) {
    console.error('Error cleaning up expired data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired data'
    });
  }
});

module.exports = router;
