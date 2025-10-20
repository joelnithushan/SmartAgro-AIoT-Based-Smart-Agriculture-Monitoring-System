/**
 * Comprehensive error handling utility
 * Handles all types of errors including extension-related errors
 */

import React from 'react';

// Error types
export const ERROR_TYPES = {
  EXTENSION: 'extension',
  NETWORK: 'network',
  FIREBASE: 'firebase',
  API: 'api',
  UNKNOWN: 'unknown'
};

// Error classification
export const classifyError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;
  
  const errorMessage = error.toString().toLowerCase();
  const errorStack = error.stack ? error.stack.toLowerCase() : '';
  
  // Extension-related errors
  if (errorMessage.includes('chrome-extension://') ||
      errorMessage.includes('extension://') ||
      errorMessage.includes('caffeine') ||
      errorMessage.includes('quillbot') ||
      errorMessage.includes('invalid/') ||
      errorStack.includes('chrome-extension://') ||
      errorStack.includes('extension://')) {
    return ERROR_TYPES.EXTENSION;
  }
  
  // Network errors
  if (errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('err_failed')) {
    return ERROR_TYPES.NETWORK;
  }
  
  // Firebase errors
  if (errorMessage.includes('firebase') ||
      errorMessage.includes('auth') ||
      errorMessage.includes('firestore') ||
      errorMessage.includes('permission')) {
    return ERROR_TYPES.FIREBASE;
  }
  
  // API errors
  if (errorMessage.includes('api') ||
      errorMessage.includes('http') ||
      errorMessage.includes('status')) {
    return ERROR_TYPES.API;
  }
  
  return ERROR_TYPES.UNKNOWN;
};

// Error handler
export const handleError = (error, context = 'Unknown') => {
  const errorType = classifyError(error);
  
  // Don't log extension-related errors
  if (errorType === ERROR_TYPES.EXTENSION) {
    return;
  }
  
  // Log other errors with context
  console.error(`❌ Error in ${context}:`, {
    type: errorType,
    message: error.message || error.toString(),
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
};

// Global error handler setup
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    handleError(event.error, 'Global Error');
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, 'Unhandled Promise Rejection');
  });
  
  // Handle console errors from extensions
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    const errorType = classifyError({ toString: () => message });
    
    if (errorType === ERROR_TYPES.EXTENSION) {
      return; // Suppress extension errors
    }
    
    originalConsoleError.apply(console, args);
  };
  
  // Handle fetch errors from extensions
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (
      url.includes('chrome-extension://') ||
      url.includes('extension://') ||
      url.includes('invalid/')
    )) {
      return Promise.reject(new Error('Extension request blocked'));
    }
    return originalFetch.apply(this, args);
  };
};

// React error boundary helper
export const createErrorBoundary = (Component) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      handleError(error, 'React Error Boundary');
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                Please refresh the page to try again.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
};

// Safe async wrapper
export const safeAsync = async (asyncFunction, context = 'Async Operation') => {
  try {
    return await asyncFunction();
  } catch (error) {
    handleError(error, context);
    return null;
  }
};

// Safe promise wrapper
export const safePromise = (promise, context = 'Promise Operation') => {
  return promise.catch(error => {
    handleError(error, context);
    return null;
  });
};
