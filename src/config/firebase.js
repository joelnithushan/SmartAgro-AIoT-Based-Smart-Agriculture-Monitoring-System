import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  onAuthStateChanged as firebaseOnAuthStateChanged
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
export const createUser = createUserWithEmailAndPassword;
export const signInUser = signInWithEmailAndPassword;
export const signOutUser = signOut;
export const resetPassword = sendPasswordResetEmail;

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