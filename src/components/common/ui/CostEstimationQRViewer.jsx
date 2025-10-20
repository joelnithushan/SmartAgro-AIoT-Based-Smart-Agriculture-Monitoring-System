import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useCurrency } from '../../../context/CurrencyContext';

const companyDetails = {
  name: "SmartAgro Solutions",
  address: "Northern University, Kantharmadam, Sri Lanka",
  phone: "+94 76 942 3167",
  email: "info@smartagro.lk",
  website: "www.smartagro.lk",
  regNo: "PV 12345-2024"
};

const CostEstimationQRViewer = ({ request, isOpen, onClose }) => {
  const { formatCurrency } = useCurrency();
  const [qrData, setQrData] = useState(null);

  const generateQRData = () => {
    const costData = request?.costEstimate || request?.costDetails;
    if (!costData || !request) return;

    const totalCost = (costData.deviceCost || 0) + 
                     (costData.serviceCharge || 0) + 
                     (costData.deliveryCharge || costData.delivery || 0);

    const qrData = {
      requestId: request.id,
      customerName: request.fullName || request.personalInfo?.fullName,
      farmName: request.farmName || request.farmInfo?.farmName,
      totalCost: totalCost.toFixed(2),
      estimateDate: costData.createdAt ? 
        new Date(costData.createdAt.seconds * 1000).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0],
      company: companyDetails.name,
      contactPhone: companyDetails.phone,
      deviceCost: costData.deviceCost?.toFixed(2) || '0.00',
      serviceCharge: costData.serviceCharge?.toFixed(2) || '0.00',
      deliveryCharge: (costData.deliveryCharge || costData.delivery)?.toFixed(2) || '0.00',
      notes: costData.notes || ''
    };

    setQrData(qrData);
  };

  useEffect(() => {
    if (isOpen && request) {
      generateQRData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, request]);

  const costData = request?.costEstimate || request?.costDetails;
  if (!isOpen || !costData || !request) return null;

  const totalCost = (costData.deviceCost || 0) + 
                   (costData.serviceCharge || 0) + 
                   (costData.deliveryCharge || costData.delivery || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative flex flex-col" style={{ minHeight: '500px' }}>
        {/* Header */}
        <div className="bg-green-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">QR Code - Request #{request.id.slice(-8)}</h2>
              <p className="text-green-100 mt-1">
                Scan to view cost estimation details
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-green-100 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* QR Code */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md">
              {qrData ? (
                <QRCode value={JSON.stringify(qrData)} size={300} level="H" />
              ) : (
                <div className="w-[300px] h-[300px] bg-gray-100 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Generating QR Code...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cost Summary */}
            <div className="bg-gray-50 rounded-lg p-4 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">Cost Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Device Cost:</span>
                  <span className="font-medium">{formatCurrency(costData.deviceCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Charge:</span>
                  <span className="font-medium">{formatCurrency(costData.serviceCharge)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="font-medium">{formatCurrency(costData.deliveryCharge || costData.delivery)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-green-600">{formatCurrency(totalCost)}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center max-w-md">
              <p className="text-sm text-gray-600">
                📱 Scan this QR code with your mobile device to view the complete cost estimation details, 
                including company information and contact details.
              </p>
            </div>

            {/* Company Info */}
            <div className="bg-green-50 rounded-lg p-4 w-full max-w-md">
              <h4 className="font-semibold text-green-800 mb-2">Company Information</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p><span className="font-medium">Name:</span> {companyDetails.name}</p>
                <p><span className="font-medium">Phone:</span> {companyDetails.phone}</p>
                <p><span className="font-medium">Email:</span> {companyDetails.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed positioning */}
        <div className="bg-gray-50 px-6 py-4 flex justify-center border-t border-gray-200 sticky bottom-0 z-20" style={{ minHeight: '80px' }}>
          <button
            onClick={onClose}
            className="px-8 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostEstimationQRViewer;
