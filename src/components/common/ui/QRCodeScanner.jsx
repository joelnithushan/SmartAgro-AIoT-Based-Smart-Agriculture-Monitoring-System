import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { useCurrency } from '../../../context/CurrencyContext';

const QRCodeScanner = ({ qrData, onClose }) => {
  const { formatCurrency } = useCurrency();
  const [showDetails, setShowDetails] = useState(false);

  if (!qrData) return null;

  const parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden relative flex flex-col" style={{ minHeight: '400px' }}>
        {/* Header */}
        <div className="bg-green-600 text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Cost Estimation</h2>
            <button
              onClick={onClose}
              className="text-green-100 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {!showDetails ? (
            <div className="text-center">
              <div className="mb-4">
                <QRCode
                  value={typeof qrData === 'string' ? qrData : JSON.stringify(qrData)}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="text-gray-600 mb-4">
                QR Code for Cost Estimation
              </p>
              <button
                onClick={() => setShowDetails(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                View Details
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Name:</span> {parsedData.customerName || 'N/A'}</p>
                  <p><span className="font-medium">Farm:</span> {parsedData.farmName || 'N/A'}</p>
                  <p><span className="font-medium">Request ID:</span> {parsedData.requestId || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-semibold text-gray-900 mb-2">Cost Breakdown</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Device Cost:</span>
                    <span>{formatCurrency(parsedData.deviceCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge:</span>
                    <span>{formatCurrency(parsedData.serviceCharge)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    <span>{formatCurrency(parsedData.deliveryCharge)}</span>
                  </div>
                  <div className="border-t pt-1 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Cost:</span>
                      <span>{formatCurrency(parsedData.totalCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {parsedData.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-700">{parsedData.notes}</p>
                </div>
              )}

              <div className="bg-green-50 rounded-lg p-3">
                <h3 className="font-semibold text-gray-900 mb-2">Company Information</h3>
                <div className="text-sm text-gray-700">
                  <p><span className="font-medium">{parsedData.company || 'SmartAgro Solutions'}</span></p>
                  <p>Phone: {parsedData.contactPhone || '+94 11 234 5678'}</p>
                  <p>Date: {parsedData.estimateDate || 'N/A'}</p>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Show QR Code
              </button>
            </div>
          )}
        </div>

        {/* Footer - Fixed positioning */}
        <div className="bg-gray-50 px-4 py-3 flex justify-center border-t border-gray-200 sticky bottom-0 z-20" style={{ minHeight: '60px' }}>
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
