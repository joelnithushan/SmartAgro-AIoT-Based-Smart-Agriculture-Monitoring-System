import twilio from 'twilio';

// Initialize Twilio client only if credentials are available
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID !== 'placeholder' && 
    process.env.TWILIO_AUTH_TOKEN !== 'placeholder-twilio-auth-token') {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio client initialized successfully');
  } catch (error) {
    console.log('⚠️  Twilio client initialization failed:', error.message);
    twilioClient = null;
  }
} else {
  console.log('⚠️  Twilio credentials not configured - SMS features will be disabled');
}

/**
 * Send SMS alert using Twilio
 * @param {Object} alert - Alert configuration
 * @param {number} currentValue - Current sensor value
 * @param {string} deviceId - Device ID
 * @returns {Promise<boolean>} Success status
 */
export async function sendSMSAlert(alert, currentValue, deviceId) {
  try {
    if (!twilioClient) {
      console.log('📱 Twilio client not available, logging SMS content instead');
      logSMSContent(alert, currentValue, deviceId);
      return true;
    }

    const message = generateSMSMessage(alert, currentValue, deviceId);
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    console.log('📱 Sending SMS alert to:', alert.value);
    console.log('📱 From number:', fromNumber);
    
    const response = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: alert.value
    });
    
    console.log('✅ SMS sent successfully:', response.sid);
    return true;
  } catch (error) {
    console.error('❌ Error sending SMS alert:', error);
    
    // Log the SMS content for debugging
    logSMSContent(alert, currentValue, deviceId);
    return false;
  }
}

/**
 * Generate SMS message content
 */
function generateSMSMessage(alert, currentValue, deviceId) {
  const criticalPrefix = alert.critical ? '🚨 CRITICAL: ' : '🔔 ';
  const parameterLabel = getParameterLabel(alert.parameter);
  const comparisonLabel = getComparisonLabel(alert.comparison);
  
  // Keep SMS message concise (under 160 characters for single SMS)
  let message = `${criticalPrefix}Farm Alert\n`;
  message += `${parameterLabel}: ${currentValue} ${comparisonLabel} ${alert.threshold}\n`;
  message += `Device: ${deviceId}\n`;
  message += `Time: ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' })}`;
  
  // Add recommendation if there's space
  const recommendation = getSMSRecommendation(alert.parameter, currentValue, alert.threshold);
  if (message.length + recommendation.length < 150) {
    message += `\n${recommendation}`;
  }
  
  return message;
}

/**
 * Get SMS recommendation (concise)
 */
function getSMSRecommendation(parameter, currentValue, threshold) {
  switch (parameter) {
    case 'soilMoisturePct':
      if (currentValue < threshold) {
        return 'Check irrigation system';
      } else {
        return 'Check for overwatering';
      }
      
    case 'soilTemperature':
    case 'airTemperature':
      if (currentValue > threshold) {
        return 'Check for heat stress';
      } else {
        return 'Check for cold stress';
      }
      
    case 'airHumidity':
      if (currentValue > threshold) {
        return 'Check ventilation';
      } else {
        return 'Check humidity levels';
      }
      
    case 'airQualityIndex':
    case 'co2':
    case 'nh3':
      if (currentValue > threshold) {
        return 'Check air quality';
      }
      break;
      
    default:
      return 'Check device status';
  }
  
  return 'Check system';
}

/**
 * Log SMS content when Twilio is not configured
 */
function logSMSContent(alert, currentValue, deviceId) {
  const smsContent = {
    to: alert.value,
    message: generateSMSMessage(alert, currentValue, deviceId)
  };
  
  console.log('📱 SMS content (Twilio not configured):', smsContent);
}

/**
 * Get parameter label (shortened for SMS)
 */
function getParameterLabel(parameter) {
  const labels = {
    soilMoisturePct: 'Soil Moisture',
    soilTemperature: 'Soil Temp',
    airTemperature: 'Air Temp',
    airHumidity: 'Humidity',
    airQualityIndex: 'Air Quality',
    co2: 'CO2',
    nh3: 'NH3'
  };
  return labels[parameter] || parameter;
}

/**
 * Get comparison label (shortened for SMS)
 */
function getComparisonLabel(comparison) {
  const labels = {
    '>': '>',
    '<': '<',
    '>=': '>=',
    '<=': '<='
  };
  return labels[comparison] || comparison;
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return false;
  }
  
  // Add country code if not present (assuming US +1)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // Add + if not present
  if (!phoneNumber.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return phoneNumber;
}

/**
 * Test Twilio connection
 */
export async function testTwilioConnection() {
  try {
    if (!twilioClient) {
      return { success: false, error: 'Twilio client not initialized' };
    }
    
    // Try to fetch account info to test connection
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    return { 
      success: true, 
      accountSid: account.sid,
      friendlyName: account.friendlyName,
      status: account.status
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
