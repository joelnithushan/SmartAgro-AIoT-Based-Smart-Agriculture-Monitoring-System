import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInUser,
  createUser,
  signOutUser,
  resetPassword,
  signInWithGoogle,
  signInWithApple,
  sendPhoneVerification,
  verifyPhoneCode,
  initializeRecaptcha,
  clearRecaptcha
} from '../config/firebase';
import { usersService } from '../services/firestoreService';
import { getUserRole } from '../services/roleService';

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
      return { success: true, user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    setError(null);
    const { error: logoutError } = await signOutUser();
    if (logoutError) {
      setError(logoutError);
      return { success: false, error: logoutError };
    }
    return { success: true };
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
