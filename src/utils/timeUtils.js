/**
 * Frontend utility functions for handling Sri Lanka timezone (Asia/Colombo)
 */

/**
 * Format timestamp to Sri Lanka timezone
 * @param {Date|string|number|object} timestamp - The timestamp to format
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
  
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    // Firestore timestamp
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleString('en-US', formatOptions);
}

/**
 * Get current time in Sri Lanka timezone
 * @returns {string} Current time string
 */
export function getCurrentSLTime() {
  return new Date().toLocaleString('en-US', { 
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Get relative time (e.g., "2 hours ago") in SL timezone
 * @param {Date|string|number|object} timestamp - The timestamp
 * @returns {string} Relative time string
 */
export function getRelativeSLTime(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatToSLTime(timestamp, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

/**
 * Check if timestamp is today in SL timezone
 * @param {Date|string|number|object} timestamp - The timestamp
 * @returns {boolean} True if timestamp is today
 */
export function isTodayInSL(timestamp) {
  if (!timestamp) return false;
  
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  const now = new Date();
  const today = new Date(now.toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' }));
  const timestampDate = new Date(date.toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' }));
  
  return today.getTime() === timestampDate.getTime();
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

/**
 * Format time for display in alerts
 * @param {Date|string|number|object} timestamp - The timestamp
 * @returns {string} Formatted time string
 */
export function formatAlertTime(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return formatToSLTime(timestamp, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
