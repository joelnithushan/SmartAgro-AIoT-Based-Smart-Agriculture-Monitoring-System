import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInUser,
  createUser,
  signOutUser,
  resetPassword,
  sendEmailVerificationToUser,
  registerWithEmail,
  registerWithPhone,
  signInWithGoogle,
  signInWithApple,
  sendPhoneVerification,
  verifyPhoneCode,
  initializeRecaptcha,
  clearRecaptcha,
  updateUserPassword
} from '../services/firebase/firebase';
import { usersService } from '../services/firebase/firestoreService';
import { getUserRole } from '../services/auth/roleService';
import { otpService } from '../services/auth/otpService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Email/Password Authentication
  const signup = async (email, password, displayName) => {
    setError(null);
    try {
      if (!createUser) {
        throw new Error('Firebase auth not available');
      }
      const { user, error: signupError } = await createUser(email, password, displayName);
      if (signupError) {
        setError(signupError);
        return { success: false, error: signupError };
      }
      
      // Automatically send email verification after successful signup
      if (user && !user.emailVerified) {
        try {
          const verificationResult = await sendEmailVerificationToUser(user);
          if (verificationResult.error) {
            console.warn('Email verification failed:', verificationResult.error);
            // Don't fail the signup if verification email fails
          } else {
            console.log('Email verification sent successfully');
          }
        } catch (verificationError) {
          console.warn('Email verification error:', verificationError);
          // Don't fail the signup if verification email fails
        }
      }
      
      return { success: true, user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      if (!signInUser) {
        throw new Error('Firebase auth not available');
      }
      const { user, error: loginError } = await signInUser(email, password);
      if (loginError) {
        setError(loginError);
        return { success: false, error: loginError };
      }
      
      // Check if email is verified (check both Firebase and Firestore)
      if (user) {
        let isEmailVerified = user.emailVerified;
        console.log('🔍 Firebase emailVerified status:', isEmailVerified);
        
        // If Firebase says email is not verified, check Firestore
        if (!isEmailVerified) {
          try {
            const userDoc = await usersService.getUser(user.uid);
            console.log('🔍 Firestore user data:', userDoc);
            isEmailVerified = userDoc?.user?.emailVerified || false;
            console.log('🔍 Firestore emailVerified status:', isEmailVerified);
          } catch (error) {
            console.warn('Failed to check email verification status from Firestore:', error);
          }
        }
        
        if (!isEmailVerified) {
          console.log('❌ Email not verified, signing out user and redirecting to verification');
          // Sign out the user since they shouldn't be authenticated
          await signOutUser();
          setError('Please verify your email address before logging in. Check your inbox for the verification code.');
          return { success: false, error: 'Email not verified', needsVerification: true, user: null };
        }
      }
      
      return { success: true, user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    setError(null);
    try {
      console.log('🔐 AuthContext: Starting logout process');
      const result = await signOutUser();
      console.log('🔐 AuthContext: signOutUser result:', result);
      
      if (result.error) {
        console.error('❌ AuthContext: Logout error:', result.error);
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      console.log('✅ AuthContext: Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext: Logout exception:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const resetUserPassword = async (email) => {
    setError(null);
    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError(resetError);
      return { success: false, error: resetError };
    }
    return { success: true };
  };

  // Email verification
  const sendEmailVerification = async (user) => {
    setError(null);
    try {
      const result = await sendEmailVerificationToUser(user);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Email OTP verification (custom OTP service)
  const sendEmailOTPVerification = async (email) => {
    setError(null);
    try {
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      
      const result = await otpService.sendOTP(currentUser.uid, email);
      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      return { success: true, fallback: result.fallback, otp: result.otp };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Verify email OTP (custom OTP service)
  const verifyEmailOTPCode = async (email, otp) => {
    setError(null);
    try {
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      
      const result = await otpService.verifyOTP(currentUser.uid, otp);
      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      // If OTP is verified, we need to mark the email as verified
      // Since we're using custom OTP, we'll update the user's emailVerified status in Firestore
      try {
        // Update user document in Firestore to mark email as verified
        try {
          await usersService.createOrUpdateUser(currentUser.uid, {
            email: currentUser.email,
            displayName: currentUser.displayName || '',
            emailVerified: true,
            lastLogin: new Date().toISOString()
          });
        } catch (error) {
          console.log('⚠️ Could not update user verification status in Firestore');
        }
        
        // Reload the user to get updated status
        await currentUser.reload();
      } catch (updateError) {
        console.warn('Failed to update email verification status:', updateError);
        // Don't fail the verification if Firestore update fails
      }
      
      return { success: true, user: currentUser };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Google Sign-in
  const googleSignIn = async () => {
    setError(null);
    const { user, error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(googleError);
      return { success: false, error: googleError };
    }
    
    // Save user with Google login method
    if (user) {
      await saveUserToFirestore(user, 'Google');
    }
    
    return { success: true, user };
  };

  // Apple Sign-in
  const appleSignIn = async () => {
    setError(null);
    const { user, error: appleError } = await signInWithApple();
    if (appleError) {
      setError(appleError);
      return { success: false, error: appleError };
    }
    
    // Save user with Apple login method
    if (user) {
      await saveUserToFirestore(user, 'Apple');
    }
    
    return { success: true, user };
  };

  // Enhanced Email Registration
  const registerWithEmailAndPassword = async (email, password) => {
    setError(null);
    try {
      const { user, error: registerError } = await registerWithEmail(email, password);
      if (registerError) {
        setError(registerError);
        return { success: false, error: registerError };
      }
      
      // Don't save to Firestore yet - wait for email verification
      console.log('✅ Email registration successful, verification email sent');
      return { success: true, user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Enhanced Phone Registration
  const registerWithPhoneAndPassword = async (phoneNumber, password, recaptchaVerifier) => {
    setError(null);
    try {
      const { confirmationResult, error: phoneError } = await registerWithPhone(phoneNumber, recaptchaVerifier);
      if (phoneError) {
        setError(phoneError);
        return { success: false, error: phoneError };
      }
      
      // Store password for later use after OTP verification
      sessionStorage.setItem('pendingPhonePassword', password);
      sessionStorage.setItem('pendingPhoneNumber', phoneNumber);
      
      return { success: true, confirmationResult };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Phone Authentication (for existing users)
  const sendPhoneOTP = async (phoneNumber) => {
    setError(null);
    try {
      const recaptchaVerifier = initializeRecaptcha('recaptcha-container');
      const { confirmationResult, error: phoneError } = await sendPhoneVerification(phoneNumber, recaptchaVerifier);
      if (phoneError) {
        setError(phoneError);
        return { success: false, error: phoneError };
      }
      return { success: true, confirmationResult };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const verifyPhoneOTP = async (confirmationResult, verificationCode) => {
    setError(null);
    try {
      const { user, error: verifyError } = await verifyPhoneCode(confirmationResult, verificationCode);
      if (verifyError) {
        setError(verifyError);
        return { success: false, error: verifyError };
      }
      
      // For new registrations, we need to create the account with the stored password
      const pendingPassword = sessionStorage.getItem('pendingPhonePassword');
      const pendingPhoneNumber = sessionStorage.getItem('pendingPhoneNumber');
      
      if (pendingPassword && pendingPhoneNumber && !user.email) {
        // This is a new phone registration - we need to create the user account
        // For phone-only accounts, we'll use the phone number as the identifier
        await saveUserToFirestore(user, 'Phone');
        
        // Clear stored data
        sessionStorage.removeItem('pendingPhonePassword');
        sessionStorage.removeItem('pendingPhoneNumber');
      } else if (user.email) {
        // This is an existing user signing in with phone
        await saveUserToFirestore(user, 'Phone');
      }
      
      clearRecaptcha();
      return { success: true, user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Save user data to Firestore
  const saveUserToFirestore = async (user, loginMethod = 'Email') => {
    try {
      // Get user role using the role service
      const role = await getUserRole(user);
      
      const userData = {
        email: user.email,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName || '',
        role: role,
        loginMethod: loginMethod,
        emailVerified: user.emailVerified,
        phoneNumberVerified: !!user.phoneNumber,
        lastLogin: new Date().toISOString()
      };

      const result = await usersService.createOrUpdateUser(user.uid, userData);
      
      if (result.success) {
        console.log('✅ User saved to Firestore with role:', role);
      } else {
        console.log('⚠️ User not saved to Firestore (permission issue), continuing with auth');
      }
    } catch (error) {
      console.log('⚠️ User not saved to Firestore (permission issue), continuing with auth');
      // Don't throw error, just log it - auth should still work
    }
  };

  // Forgot Password Functions
  const sendPasswordResetOTPCode = async (emailOrPhone, type) => {
    setError(null);
    try {
      if (type === 'email') {
        // Call backend API for email OTP
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/password-reset/send-email-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: emailOrPhone }),
        });

        const result = await response.json();
        
        if (!result.success) {
          setError(result.error);
          return { success: false, error: result.error };
        }
        
        // Generate a verification ID for our flow
        const verificationId = `email_reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return { 
          success: true, 
          verificationId,
          message: result.message
        };
      } else {
        // For phone, we need to use phone auth but for password reset
        // This is a custom implementation since Firebase doesn't have phone-based password reset
        const recaptchaVerifier = initializeRecaptcha('recaptcha-container');
        const { confirmationResult, error: phoneError } = await sendPhoneVerification(emailOrPhone, recaptchaVerifier);
        
        if (phoneError) {
          setError(phoneError);
          return { success: false, error: phoneError };
        }
        
        return { 
          success: true, 
          verificationId: confirmationResult.verificationId,
          confirmationResult 
        };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const verifyPasswordResetOTPCode = async (verificationId, otp, emailOrPhone, type) => {
    setError(null);
    try {
      if (type === 'email') {
        // Call backend API for email OTP verification
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/password-reset/verify-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: emailOrPhone, 
            otp: otp 
          }),
        });

        const result = await response.json();
        
        if (!result.success) {
          setError(result.error);
          return { success: false, error: result.error };
        }
        
        return { 
          success: true, 
          resetToken: result.resetToken,
          message: result.message
        };
      } else {
        // For phone, verify the OTP
        const { user, error: verifyError } = await verifyPhoneCode(verificationId, otp);
        if (verifyError) {
          setError(verifyError);
          return { success: false, error: verifyError };
        }
        
        const resetToken = `reset_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return { 
          success: true, 
          user,
          resetToken,
          message: 'Phone verification successful'
        };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const resetPasswordWithOTP = async (emailOrPhone, type, verificationId, newPassword, resetToken) => {
    setError(null);
    try {
      if (type === 'email') {
        // Call backend API for email-based password reset
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/password-reset/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            resetToken: resetToken, 
            newPassword: newPassword 
          }),
        });

        const result = await response.json();
        
        if (!result.success) {
          setError(result.error);
          return { success: false, error: result.error };
        }
        
        return { 
          success: true, 
          message: result.message
        };
      } else {
        // For phone-based reset, we already have the verified user
        // We can update their password directly
        if (!currentUser) {
          return { success: false, error: 'User not authenticated' };
        }
        
        const result = await updateUserPassword(currentUser, newPassword);
        if (!result.success) {
          setError(result.error);
          return { success: false, error: result.error };
        }
        
        // Log the password reset action
        try {
          await usersService.createOrUpdateUser(currentUser.uid, {
            [`logs.${Date.now()}`]: {
              action: 'password_reset',
              timestamp: new Date().toISOString(),
              method: 'phone_otp'
            }
          });
        } catch (logError) {
          console.log('⚠️ Could not log password reset action in Firestore');
          // Don't fail the reset if logging fails
        }
        
        return { 
          success: true, 
          message: 'Password reset successful. You are now logged in.'
        };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Set up auth state listener
  useEffect(() => {
    // Check if auth is available
    if (!onAuthStateChanged) {
      console.error('❌ Firebase auth not available');
      setLoading(false);
      return;
    }
    
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (!isMounted) return;
      
      try {
        setCurrentUser(user);
        
        if (user) {
          // Get user role and update state
          const role = await getUserRole(user);
          if (isMounted) {
            setUserRole(role);
            setIsAdminUser(role === 'admin');
          }
          
          // Save user data to Firestore when they sign in (only if verified)
          if (user.emailVerified || user.phoneNumber) {
            await saveUserToFirestore(user, user.email ? 'Email' : 'Phone');
          }
          
          // Debug logging
          console.log('🔍 Auth Debug Info:');
          console.log('  Current user email:', user.email);
          console.log('  User role:', role);
          console.log('  Is admin:', role === 'admin');
        } else {
          if (isMounted) {
            setUserRole(null);
            setIsAdminUser(false);
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = {
    user: currentUser,
    currentUser,
    loading,
    error,
    userRole,
    isAdmin: isAdminUser,
    isAdminUser,
    signup,
    login,
    logout,
    resetUserPassword,
    sendEmailVerification,
    sendEmailOTPVerification,
    verifyEmailOTPCode,
    googleSignIn,
    appleSignIn,
    registerWithEmailAndPassword,
    registerWithPhoneAndPassword,
    sendPhoneOTP,
    verifyPhoneOTP,
    sendPasswordResetOTP: sendPasswordResetOTPCode,
    verifyPasswordResetOTP: verifyPasswordResetOTPCode,
    resetPasswordWithOTP,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
