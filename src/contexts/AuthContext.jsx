import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInUser,
  createUser,
  signOutUser,
  resetPassword,
  sendEmailVerificationToUser,
  sendEmailOTP,
  verifyEmailOTP,
  signInWithGoogle,
  signInWithApple,
  sendPhoneVerification,
  verifyPhoneCode,
  initializeRecaptcha,
  clearRecaptcha
} from '../config/firebase';
import { usersService } from '../services/firestoreService';
import { getUserRole } from '../services/roleService';
import { otpService } from '../services/otpService';

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
        await usersService.createOrUpdateUser(currentUser.uid, {
          email: currentUser.email,
          displayName: currentUser.displayName || '',
          emailVerified: true,
          lastLogin: new Date().toISOString()
        });
        
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

  // Phone Authentication
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
    const { user, error: verifyError } = await verifyPhoneCode(confirmationResult, verificationCode);
    if (verifyError) {
      setError(verifyError);
      return { success: false, error: verifyError };
    }
    clearRecaptcha();
    return { success: true, user };
  };

  // Save user data to Firestore
  const saveUserToFirestore = async (user, loginMethod = 'Email') => {
    try {
      // Get user role using the role service
      const role = await getUserRole(user);
      
      const userData = {
        email: user.email,
        displayName: user.displayName || '',
        role: role,
        loginMethod: loginMethod,
        lastLogin: new Date().toISOString()
      };

      const result = await usersService.createOrUpdateUser(user.uid, userData);
      
      if (result.success) {
        console.log('✅ User saved to Firestore with role:', role);
      } else {
        console.error('❌ Error saving user to Firestore:', result.error);
      }
    } catch (error) {
      console.error('❌ Error saving user to Firestore:', error);
      // Don't throw error, just log it - auth should still work
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
    
    const unsubscribe = onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get user role and update state
        const role = await getUserRole(user);
        setUserRole(role);
        setIsAdminUser(role === 'admin');
        
        // Save user data to Firestore when they sign in
        await saveUserToFirestore(user, 'Email');
        
        // Debug logging
        console.log('🔍 Auth Debug Info:');
        console.log('  Current user email:', user.email);
        console.log('  User role:', role);
        console.log('  Is admin:', role === 'admin');
      } else {
        setUserRole(null);
        setIsAdminUser(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
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
    sendPhoneOTP,
    verifyPhoneOTP,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
