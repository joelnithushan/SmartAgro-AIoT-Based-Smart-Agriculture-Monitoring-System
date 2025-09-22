import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
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
  signInWithEmailLink
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCMVzmYa97yTF6rAPieVLefTecbAuCvRrI",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "smartagro-solution.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "smartagro-solution",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "smartagro-solution.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "109717618865",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:109717618865:web:8251555d53abf63f8ce290",
  databaseURL: "https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);

// Auth functions
export const createUser = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const signInUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signOutUser = async () => {
  try {
    console.log('🔥 Firebase: Starting signOut');
    const result = await signOut(auth);
    console.log('🔥 Firebase: signOut completed successfully');
    return { success: true };
  } catch (error) {
    console.error('🔥 Firebase: signOut error:', error);
    return { success: false, error: error.message };
  }
};
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

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

export const sendPhoneVerification = (phoneNumber) => {
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA not initialized');
  }
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

export const verifyPhoneCode = (verificationId, code) => {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  return signInWithCredential(auth, credential);
};

export const clearRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};

// Auth state listener - wrapper function that includes the auth instance
export const onAuthStateChanged = (callback) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

export default app;