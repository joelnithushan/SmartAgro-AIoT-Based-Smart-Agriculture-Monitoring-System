import express from 'express';
import { sendEmailAlert } from '../services/emailService.js';
import { sendSMSAlert, testTwilioConnection, validatePhoneNumber } from '../services/smsService.js';

const router = express.Router();

/**
 * Test email notification
 */
router.post('/test-email', async (req, res) => {
  try {
    const { email, parameter = 'soilMoisturePct', currentValue = 25, threshold = 30 } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const testAlert = {
      type: 'email',
      value: email,
      parameter: parameter,
      threshold: threshold,
      comparison: '<',
      critical: false,
      active: true
    };

    const success = await sendEmailAlert(testAlert, currentValue, 'ESP32_001');
    
    res.json({
      success: success,
      message: success ? 'Test email sent successfully' : 'Failed to send test email',
      alert: testAlert,
      currentValue: currentValue
    });
  } catch (error) {
    console.error('Error testing email:', error);
    res.status(500).json({ error: 'Failed to test email notification' });
  }
});

/**
 * Test SMS notification
 */
router.post('/test-sms', async (req, res) => {
  try {
    const { phoneNumber, parameter = 'soilMoisturePct', currentValue = 25, threshold = 30 } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Validate and format phone number
    const formattedPhone = validatePhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const testAlert = {
      type: 'sms',
      value: formattedPhone,
      parameter: parameter,
      threshold: threshold,
      comparison: '<',
      critical: false,
      active: true
    };

    const success = await sendSMSAlert(testAlert, currentValue, 'ESP32_001');
    
    res.json({
      success: success,
      message: success ? 'Test SMS sent successfully' : 'Failed to send test SMS',
      alert: testAlert,
      currentValue: currentValue,
      formattedPhone: formattedPhone
    });
  } catch (error) {
    console.error('Error testing SMS:', error);
    res.status(500).json({ error: 'Failed to test SMS notification' });
  }
});

/**
 * Test Twilio connection
 */
router.get('/test-twilio', async (req, res) => {
  try {
    const result = await testTwilioConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing Twilio connection:', error);
    res.status(500).json({ error: 'Failed to test Twilio connection' });
  }
});

/**
 * Validate phone number
 */
router.post('/validate-phone', (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const formattedPhone = validatePhoneNumber(phoneNumber);
    
    res.json({
      valid: !!formattedPhone,
      formatted: formattedPhone,
      original: phoneNumber
    });
  } catch (error) {
    console.error('Error validating phone number:', error);
    res.status(500).json({ error: 'Failed to validate phone number' });
  }
});

/**
 * Get notification service status
 */
router.get('/status', (req, res) => {
  const status = {
    sendgrid: {
      configured: !!process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'Not configured'
    },
    twilio: {
      configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not configured'
    }
  };

  res.json(status);
});

export default router;
