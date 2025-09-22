/**
 * Utility functions for handling Sri Lanka timezone (Asia/Colombo)
 */

/**
 * Get current time in Sri Lanka timezone
 * @returns {Date} Current date/time in SL timezone
 */
export function getCurrentSLTime() {
  return new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
}

/**
 * Format timestamp to Sri Lanka timezone
 * @param {Date|string|number} timestamp - The timestamp to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string
 */
export function formatToSLTime(timestamp, options = {}) {
  const defaultOptions = {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  if (!timestamp) return 'N/A';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleString('en-US', formatOptions);
}

/**
 * Get current time in SL timezone for logging
 * @returns {string} Formatted time string
 */
export function getSLTimeForLogging() {
  return new Date().toLocaleString('en-US', { 
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Get timezone offset for Sri Lanka
 * @returns {string} Timezone offset string
 */
export function getSLTimezoneOffset() {
  const now = new Date();
  const slTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  const offset = (slTime.getTime() - utcTime.getTime()) / (1000 * 60 * 60);
  return `UTC+${offset}`;
}

/**
 * Check if current time is within business hours in Sri Lanka
 * @param {number} startHour - Start hour (24-hour format)
 * @param {number} endHour - End hour (24-hour format)
 * @returns {boolean} True if within business hours
 */
export function isWithinBusinessHours(startHour = 8, endHour = 18) {
  const now = new Date();
  const slTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  const currentHour = slTime.getHours();
  
  return currentHour >= startHour && currentHour < endHour;
}

/**
 * Get greeting based on current SL time
 * @returns {string} Greeting message
 */
export function getSLGreeting() {
  const now = new Date();
  const slTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  const currentHour = slTime.getHours();
  
  if (currentHour < 12) {
    return 'Good Morning';
  } else if (currentHour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
}
