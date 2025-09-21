// Toast polyfill to ensure all toast methods are available
import toast from 'react-hot-toast';

// Add missing toast methods if they don't exist
if (!toast.info) {
  toast.info = toast;
}

if (!toast.warning) {
  toast.warning = toast;
}

if (!toast.debug) {
  toast.debug = toast;
}

// Export the enhanced toast
export default toast;
