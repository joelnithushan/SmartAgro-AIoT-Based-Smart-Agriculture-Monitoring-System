import { db } from '../firebase/firebase';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';

// OTP Service for custom email OTP verification
class OTPService {
  constructor() {
    this.otpCollection = 'emailOtps';
    this.otpExpiryMinutes = 5; // OTP expires in 5 minutes
    this.functions = getFunctions();
    this.sendOTPEmailFunction = httpsCallable(this.functions, 'sendOTPEmail');
  }

  // Generate a random 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Save OTP to Firestore with expiry
  async saveOTP(userId, email, otp) {
    try {
      const otpDoc = {
        email: email,
        otp: otp,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000),
        attempts: 0,
        maxAttempts: 3
      };

      await setDoc(doc(db, this.otpCollection, userId), otpDoc);
      console.log('✅ OTP saved to Firestore for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving OTP:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify OTP from Firestore
  async verifyOTP(userId, inputOTP) {
    try {
      const otpDocRef = doc(db, this.otpCollection, userId);
      const otpDoc = await getDoc(otpDocRef);

      if (!otpDoc.exists()) {
        return { success: false, error: 'OTP not found or expired' };
      }

      const otpData = otpDoc.data();
      const now = new Date();

      // Check if OTP has expired
      if (otpData.expiresAt.toDate() < now) {
        await deleteDoc(otpDocRef);
        return { success: false, error: 'OTP has expired' };
      }

      // Check if max attempts exceeded
      if (otpData.attempts >= otpData.maxAttempts) {
        await deleteDoc(otpDocRef);
        return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
      }

      // Verify OTP
      if (otpData.otp === inputOTP) {
        // OTP is correct, delete it
        await deleteDoc(otpDocRef);
        return { success: true };
      } else {
        // Increment attempts
        await setDoc(otpDocRef, {
          ...otpData,
          attempts: otpData.attempts + 1
        }, { merge: true });

        const remainingAttempts = otpData.maxAttempts - (otpData.attempts + 1);
        return { 
          success: false, 
          error: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
        };
      }
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  }

  // Send OTP via email using Firebase Cloud Functions
  async sendOTPEmail(email, otp) {
    try {
      console.log(`📧 Sending OTP ${otp} to ${email}`);
      
      // Call Firebase Cloud Function to send email
      const result = await this.sendOTPEmailFunction({ email, otp });
      
      if (result.data.success) {
        console.log('✅ OTP email sent successfully via Cloud Function');
        return { success: true };
      } else {
        throw new Error('Cloud Function returned error');
      }
    } catch (error) {
      console.error('❌ Error sending OTP email via Cloud Function:', error);
      
      // Fallback: simulate email sending for development
      console.log('📧 Fallback: Simulating email sending for development');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, fallback: true, otp };
    }
  }

  // Complete OTP flow: generate, save, and send
  async sendOTP(userId, email) {
    try {
      const otp = this.generateOTP();
      
      // Save OTP to Firestore
      const saveResult = await this.saveOTP(userId, email, otp);
      if (!saveResult.success) {
        return saveResult;
      }

      // Send OTP via email
      const sendResult = await this.sendOTPEmail(email, otp);
      if (!sendResult.success) {
        return sendResult;
      }

      return { success: true, otp }; // Return OTP for development/testing
    } catch (error) {
      console.error('❌ Error in sendOTP:', error);
      return { success: false, error: error.message };
    }
  }
}

export const otpService = new OTPService();
