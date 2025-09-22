const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp();

// Email configuration (you'll need to set up your email service)
const transporter = nodemailer.createTransporter({
  service: 'gmail', // or your preferred email service
  auth: {
    user: functions.config().email.user, // Set via: firebase functions:config:set email.user="your-email@gmail.com"
    pass: functions.config().email.password // Set via: firebase functions:config:set email.password="your-app-password"
  }
});

// Cloud Function to send OTP email
exports.sendOTPEmail = functions.https.onCall(async (data, context) => {
  try {
    const { email, otp } = data;

    if (!email || !otp) {
      throw new functions.https.HttpsError('invalid-argument', 'Email and OTP are required');
    }

    const mailOptions = {
      from: functions.config().email.user,
      to: email,
      subject: 'SmartAgro - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SmartAgro</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Email Verification</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thank you for registering with SmartAgro! To complete your registration, please use the verification code below:
            </p>
            
            <div style="background: white; border: 2px solid #10B981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="color: #10B981; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">${otp}</h3>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                SmartAgro - Smart Agriculture Monitoring System<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`✅ OTP email sent to: ${email}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});

// Cloud Function to send password reset email
exports.sendPasswordResetEmail = functions.https.onCall(async (data, context) => {
  try {
    const { email, resetLink } = data;

    if (!email || !resetLink) {
      throw new functions.https.HttpsError('invalid-argument', 'Email and reset link are required');
    }

    const mailOptions = {
      from: functions.config().email.user,
      to: email,
      subject: 'SmartAgro - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SmartAgro</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You requested to reset your password for your SmartAgro account. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                SmartAgro - Smart Agriculture Monitoring System<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Password reset email sent to: ${email}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});
