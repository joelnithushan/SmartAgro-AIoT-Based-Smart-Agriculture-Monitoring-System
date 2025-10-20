import React from 'react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "red",
  loading = false,
  confirmClass = null, // Support custom confirm button classes
  type = "warning" // New prop for different modal types
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  // Enhanced color classes with gradients and shadows
  const defaultColorClasses = {
    red: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-lg hover:shadow-red-500/25',
    green: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500 shadow-lg hover:shadow-green-500/25',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-blue-500/25',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500 shadow-lg hover:shadow-orange-500/25'
  };

  // Icon and styling configurations for different modal types
  const modalConfigs = {
    warning: {
      iconBg: 'bg-amber-50',
      iconRing: 'ring-amber-100',
      iconColor: 'text-amber-600',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    danger: {
      iconBg: 'bg-red-50',
      iconRing: 'ring-red-100',
      iconColor: 'text-red-600',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    },
    info: {
      iconBg: 'bg-blue-50',
      iconRing: 'ring-blue-100',
      iconColor: 'text-blue-600',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    success: {
      iconBg: 'bg-green-50',
      iconRing: 'ring-green-100',
      iconColor: 'text-green-600',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const config = modalConfigs[type] || modalConfigs.warning;
  
  // Use custom class if provided, otherwise use default
  const buttonClass = confirmClass || defaultColorClasses[confirmColor] || defaultColorClasses.red;

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto" style={{ zIndex: 99999 }}>
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-10 px-4" style={{ marginTop: '40px' }}>
        {/* Enhanced backdrop with blur effect */}
        <div 
          className="fixed inset-0 transition-all duration-300 bg-gray-900/80 backdrop-blur-sm"
          onClick={!loading ? onClose : undefined}
          style={{ zIndex: 99998 }}
        />
        
        {/* Enhanced modal container with maximum priority */}
        <div 
          className="relative bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-out w-full max-w-lg mx-4 border border-gray-100"
          style={{ zIndex: 99999 }}
        >
          {/* Modal content with improved spacing */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-start space-x-4">
              {/* Dynamic icon with better styling */}
              <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${config.iconBg} ring-4 ${config.iconRing}`}>
                <div className={config.iconColor}>
                  {config.icon}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Enhanced title styling */}
                <h3 className="text-xl font-semibold text-gray-900 leading-6 break-words">
                  {title}
                </h3>
                <div className="mt-3">
                  {/* Enhanced message styling with proper text wrapping */}
                  <p className="text-sm text-gray-600 leading-relaxed break-words whitespace-normal">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced button area with better spacing and styling */}
          <div className="bg-gray-50/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            {/* Cancel button with enhanced styling */}
            <button
              type="button"
              disabled={loading}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-gray-300 shadow-sm px-6 py-3 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
            >
              {cancelText}
            </button>
            
            {/* Confirm button with enhanced styling */}
            <button
              type="button"
              disabled={loading}
              className={`w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 active:scale-95 ${buttonClass} ${
                loading ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
              }`}
              onClick={handleConfirm}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Processing...
                </div>
              ) : (
                <span className="flex items-center">
                  {confirmText}
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ConfirmModal;
