import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "REDACTED_FIREBASE_API_KEY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "smartagro-solution.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "smartagro-solution",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "smartagro-solution.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "109717618865",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:109717618865:web:8251555d53abf63f8ce290",
  databaseURL: "https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase with error handling
let app, auth, db, database, storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  database = getDatabase(app);
  storage = getStorage(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Create mock objects for graceful degradation
  app = null;
  auth = null;
  db = null;
  database = null;
  storage = null;
}

export { 
  auth, 
  db, 
  database, 
  storage,
  // Firestore functions
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  setDoc
};

// Auth functions with error handling
export const createUser = (email, password) => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInUser = (email, password) => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  return signInWithEmailAndPassword(auth, email, password);
};
export const signOutUser = async () => {
  try {
    if (!auth) {
      console.log('⚠️ Firebase auth not initialized, skipping signOut');
      return { success: true };
    }
    console.log('🔥 Firebase: Starting signOut');
    await signOut(auth);
    console.log('🔥 Firebase: signOut completed successfully');
    return { success: true };
  } catch (error) {
    console.error('🔥 Firebase: signOut error:', error);
    return { success: false, error: error.message };
  }
};
export const resetPassword = (email) => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  return sendPasswordResetEmail(auth, email);
};

// Email verification
export const sendEmailVerificationToUser = async (user) => {
  try {
    console.log('📧 Firebase: Sending email verification');
    await sendEmailVerification(user);
    console.log('📧 Firebase: Email verification sent successfully');
    return { success: true };
  } catch (error) {
    console.error('📧 Firebase: Email verification error:', error);
    return { success: false, error: error.message };
  }
};

// Email registration with immediate verification sending
export const registerWithEmail = async (email, password) => {
  try {
    console.log('📧 Firebase: Creating user with email:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send verification email immediately
    await sendEmailVerification(user);
    console.log('📧 Firebase: Email verification sent to:', email);
    
    return { success: true, user };
  } catch (error) {
    console.error('📧 Firebase: Email registration error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email address is already registered. Please try signing in instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please choose a stronger password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email registration is currently disabled. Please contact support.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Email OTP verification
export const sendEmailOTP = async (email) => {
  try {
    console.log('📧 Firebase: Sending email OTP to:', email);
    const actionCodeSettings = {
      url: `${window.location.origin}/verify-email`,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    console.log('📧 Firebase: Email OTP sent successfully');
    return { success: true };
  } catch (error) {
    console.error('📧 Firebase: Email OTP error:', error);
    return { success: false, error: error.message };
  }
};

// Verify email OTP
export const verifyEmailOTP = async (email, emailLink) => {
  try {
    console.log('📧 Firebase: Verifying email OTP');
    if (isSignInWithEmailLink(auth, emailLink)) {
      const result = await signInWithEmailLink(auth, email, emailLink);
      console.log('📧 Firebase: Email OTP verified successfully');
      return { success: true, user: result.user };
    } else {
      return { success: false, error: 'Invalid email link' };
    }
  } catch (error) {
    console.error('📧 Firebase: Email OTP verification error:', error);
    return { success: false, error: error.message };
  }
};

// Google Auth
export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// Apple Auth
export const signInWithApple = () => {
  const provider = new OAuthProvider('apple.com');
  return signInWithPopup(auth, provider);
};

// Phone Auth
let recaptchaVerifier = null;

export const initializeRecaptcha = (elementId) => {
  recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    }
  });
  return recaptchaVerifier;
};

export const sendPhoneVerification = (phoneNumber, recaptchaVerifierInstance) => {
  if (!recaptchaVerifierInstance) {
    throw new Error('reCAPTCHA not initialized');
  }
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierInstance);
};

export const verifyPhoneCode = (verificationId, code) => {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  return signInWithCredential(auth, credential);
};

// Phone registration with OTP
export const registerWithPhone = async (phoneNumber, recaptchaVerifierInstance) => {
  try {
    console.log('📱 Firebase: Sending OTP to phone:', phoneNumber);
    const confirmationResult = await sendPhoneVerification(phoneNumber, recaptchaVerifierInstance);
    console.log('📱 Firebase: OTP sent successfully');
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('📱 Firebase: Phone registration error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'SMS authentication is not enabled for your region. Please use email registration instead.';
    } else if (error.code === 'auth/invalid-phone-number') {
      errorMessage = 'Please enter a valid phone number with country code (e.g., +1234567890).';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many SMS requests. Please try again later.';
    } else if (error.code === 'auth/quota-exceeded') {
      errorMessage = 'SMS quota exceeded. Please try again later or use email registration.';
    } else if (error.code === 'auth/captcha-check-failed') {
      errorMessage = 'reCAPTCHA verification failed. Please try again.';
    } else if (error.code === 'auth/invalid-app-credential') {
      errorMessage = 'SMS authentication is not properly configured. Please use email registration instead.';
    } else if (error.code === 'auth/app-not-authorized') {
      errorMessage = 'SMS authentication is not authorized for this app. Please use email registration instead.';
    }
    
    return { success: false, error: errorMessage };
  }
};

export const clearRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};

// Password Reset Functions
export const sendPasswordResetOTP = async (email) => {
  try {
    console.log('📧 Firebase: Sending password reset email to:', email);
    await sendPasswordResetEmail(auth, email);
    console.log('📧 Firebase: Password reset email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('📧 Firebase: Password reset email error:', error);
    return { success: false, error: error.message };
  }
};

export const verifyPasswordResetOTP = async (oobCode) => {
  try {
    console.log('📧 Firebase: Verifying password reset code');
    await verifyPasswordResetCode(auth, oobCode);
    console.log('📧 Firebase: Password reset code verified successfully');
    return { success: true };
  } catch (error) {
    console.error('📧 Firebase: Password reset code verification error:', error);
    return { success: false, error: error.message };
  }
};

export const confirmPasswordResetWithCode = async (oobCode, newPassword) => {
  try {
    console.log('📧 Firebase: Confirming password reset');
    await confirmPasswordReset(auth, oobCode, newPassword);
    console.log('📧 Firebase: Password reset confirmed successfully');
    return { success: true };
  } catch (error) {
    console.error('📧 Firebase: Password reset confirmation error:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserPassword = async (user, newPassword) => {
  try {
    console.log('📧 Firebase: Updating user password');
    await updatePassword(user, newPassword);
    console.log('📧 Firebase: Password updated successfully');
    return { success: true };
  } catch (error) {
    console.error('📧 Firebase: Password update error:', error);
    return { success: false, error: error.message };
  }
};

// Auth state listener - wrapper function that includes the auth instance
export const onAuthStateChanged = (callback) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

export default app;