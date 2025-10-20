// MailboxLayer API service for email validation
const MAILBOXLAYER_API_KEY = 'ca9ec4ecf31e728287252e9f1ea68704';
const MAILBOXLAYER_BASE_URL = 'http://apilayer.net/api/check';

/**
 * Validates an email address using MailboxLayer API
 * @param {string} email - The email address to validate
 * @returns {Promise<Object>} - Validation result with success, isValid, and error properties
 */
export const validateEmailWithMailboxLayer = async (email) => {
  try {
    // First check if it's a known disposable email domain
    if (isDisposableEmail(email)) {
      return {
        success: true,
        isValid: false,
        error: 'Invalid or temporary email. Please use a valid email address.'
      };
    }

    const response = await fetch(
      `${MAILBOXLAYER_BASE_URL}?access_key=${MAILBOXLAYER_API_KEY}&email=${encodeURIComponent(email)}&smtp=1&format=1`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    );

    if (!response.ok) {
      console.warn('MailboxLayer API error:', response.status, response.statusText);
      // If API fails, allow the email but log the issue
      return {
        success: true,
        isValid: true,
        warning: 'Email validation service temporarily unavailable, proceeding with registration.'
      };
    }

    const data = await response.json();

    // Check if the API call was successful
    if (data.success === false) {
      console.warn('MailboxLayer API returned error:', data.error);
      // If API returns error, allow the email but log the issue
      return {
        success: true,
        isValid: true,
        warning: 'Email validation service returned error, proceeding with registration.'
      };
    }

    // Check if email is valid and not disposable
    const isValid = data.valid === true && 
                   data.disposable === false && 
                   (data.smtp_check === true || data.smtp_check === null); // Allow if SMTP check is null

    return {
      success: true,
      isValid: isValid,
      data: {
        valid: data.valid,
        disposable: data.disposable,
        smtp_check: data.smtp_check,
        catch_all: data.catch_all,
        mx_found: data.mx_found,
        did_you_mean: data.did_you_mean
      }
    };

  } catch (error) {
    console.error('MailboxLayer API error:', error);
    // If API completely fails, allow the email but log the issue
    return {
      success: true,
      isValid: true,
      warning: 'Email validation service temporarily unavailable, proceeding with registration.'
    };
  }
};

/**
 * Validates email format locally before API call
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if email format is valid
 */
export const isValidEmailFormat = (email) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

/**
 * Checks if email is from a known disposable email provider
 * @param {string} email - The email address to check
 * @returns {boolean} - True if email is from disposable provider
 */
export const isDisposableEmail = (email) => {
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
    'throwaway.email', 'temp-mail.org', 'getnada.com', 'maildrop.cc',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
};
