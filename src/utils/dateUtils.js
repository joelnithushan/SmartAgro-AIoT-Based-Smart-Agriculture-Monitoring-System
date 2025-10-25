/**
 * Utility functions for date formatting and handling
 */

/**
 * Format alert dates with comprehensive handling of different date formats
 * @param {any} dateField - The date field from Firestore or other sources
 * @returns {string} Formatted date string or fallback message
 */
export const formatAlertDate = (dateField) => {
  try {
    if (!dateField) return 'Unknown';
    
    let date;
    
    // Handle Firestore Timestamp
    if (dateField.seconds) {
      date = new Date(dateField.seconds * 1000);
    }
    // Handle Firestore Timestamp with toDate method
    else if (dateField.toDate && typeof dateField.toDate === 'function') {
      date = dateField.toDate();
    }
    // Handle regular Date object or ISO string
    else if (dateField instanceof Date) {
      date = dateField;
    }
    // Handle ISO string or timestamp
    else if (typeof dateField === 'string' || typeof dateField === 'number') {
      date = new Date(dateField);
    }
    // Handle object with _seconds property (Firestore format)
    else if (dateField._seconds) {
      date = new Date(dateField._seconds * 1000);
    }
    else {
      console.warn('Unknown date format:', dateField);
      return 'Invalid Date';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateField);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error, dateField);
    return 'Invalid Date';
  }
};

/**
 * Format date for display with custom options
 * @param {any} dateField - The date field to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateField, options = {}) => {
  try {
    if (!dateField) return 'Unknown';
    
    let date;
    
    // Handle Firestore Timestamp
    if (dateField.seconds) {
      date = new Date(dateField.seconds * 1000);
    }
    // Handle Firestore Timestamp with toDate method
    else if (dateField.toDate && typeof dateField.toDate === 'function') {
      date = dateField.toDate();
    }
    // Handle regular Date object
    else if (dateField instanceof Date) {
      date = dateField;
    }
    // Handle ISO string or timestamp
    else if (typeof dateField === 'string' || typeof dateField === 'number') {
      date = new Date(dateField);
    }
    // Handle object with _seconds property (Firestore format)
    else if (dateField._seconds) {
      date = new Date(dateField._seconds * 1000);
    }
    else {
      console.warn('Unknown date format:', dateField);
      return 'Invalid Date';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateField);
      return 'Invalid Date';
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error formatting date:', error, dateField);
    return 'Invalid Date';
  }
};

/**
 * Format date and time for display
 * @param {any} dateField - The date field to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateField) => {
  return formatDate(dateField, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param {any} dateField - The date field to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateField) => {
  try {
    if (!dateField) return 'Unknown';
    
    let date;
    
    // Handle Firestore Timestamp
    if (dateField.seconds) {
      date = new Date(dateField.seconds * 1000);
    }
    // Handle Firestore Timestamp with toDate method
    else if (dateField.toDate && typeof dateField.toDate === 'function') {
      date = dateField.toDate();
    }
    // Handle regular Date object
    else if (dateField instanceof Date) {
      date = dateField;
    }
    // Handle ISO string or timestamp
    else if (typeof dateField === 'string' || typeof dateField === 'number') {
      date = new Date(dateField);
    }
    // Handle object with _seconds property (Firestore format)
    else if (dateField._seconds) {
      date = new Date(dateField._seconds * 1000);
    }
    else {
      console.warn('Unknown date format:', dateField);
      return 'Invalid Date';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateField);
      return 'Invalid Date';
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
      return formatDate(dateField);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error, dateField);
    return 'Invalid Date';
  }
};





