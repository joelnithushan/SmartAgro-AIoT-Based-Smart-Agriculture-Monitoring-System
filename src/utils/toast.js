// Toast utility to ensure all toast calls are properly handled
import toast from 'react-hot-toast';

// Create a wrapper that ensures all toast methods are available
export const toastUtils = {
  // Default toast
  default: (message, options) => toast(message, options),
  
  // Success toast
  success: (message, options) => toast.success(message, options),
  
  // Error toast
  error: (message, options) => toast.error(message, options),
  
  // Loading toast
  loading: (message, options) => toast.loading(message, options),
  
  // Info toast (using default toast)
  info: (message, options) => toast(message, options),
  
  // Warning toast (using default toast)
  warning: (message, options) => toast(message, options),
  
  // Dismiss toast
  dismiss: (toastId) => toast.dismiss(toastId),
  
  // Remove all toasts
  remove: () => toast.remove()
};

// Export individual methods for convenience
export const {
  default: toastDefault,
  success: toastSuccess,
  error: toastError,
  loading: toastLoading,
  info: toastInfo,
  warning: toastWarning,
  dismiss: toastDismiss,
  remove: toastRemove
} = toastUtils;

// Default export
export default toastUtils;
