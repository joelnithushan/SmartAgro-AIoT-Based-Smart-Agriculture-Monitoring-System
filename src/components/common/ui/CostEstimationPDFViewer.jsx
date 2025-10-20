import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useCurrency } from '../../../context/CurrencyContext';
import { generateCostEstimationPDF, downloadPDF } from './pdfGenerator';
import toast from 'react-hot-toast';

const CostEstimationPDFViewer = ({ request, isOpen, onClose }) => {
  const { currency, convertToLKR } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState(null);

  const generateQRData = () => {
    const costData = request?.costEstimate || request?.costDetails;
    if (!costData || !request) return;

    // Use the original LKR values (admin sends LKR, we convert to USD for display)
    // If LKR values are not found, use the USD values as LKR (since admin entered LKR but they were stored as USD)
    const deviceCostLKR = costData?.deviceCostLKR || costData?.deviceCost || 0;
    const serviceChargeLKR = costData?.serviceChargeLKR || costData?.serviceCharge || 0;
    const deliveryChargeLKR = costData?.deliveryLKR || costData?.delivery || 0;
    const totalCostLKR = deviceCostLKR + serviceChargeLKR + deliveryChargeLKR;

    // Convert LKR to USD for display
    const deviceCostUSD = deviceCostLKR / 303.62;
    const serviceChargeUSD = serviceChargeLKR / 303.62;
    const deliveryChargeUSD = deliveryChargeLKR / 303.62;
    const totalCostUSD = totalCostLKR / 303.62;

    const qrData = {
      requestId: request.id,
      customerName: request.fullName || request.personalInfo?.fullName,
      farmName: request.farmName || request.farmInfo?.farmName,
      totalCost: totalCostLKR.toFixed(2),
      totalCostUSD: totalCostUSD.toFixed(2),
      deviceCost: deviceCostLKR.toFixed(2),
      deviceCostUSD: deviceCostUSD.toFixed(2),
      serviceCharge: serviceChargeLKR.toFixed(2),
      serviceChargeUSD: serviceChargeUSD.toFixed(2),
      deliveryCharge: deliveryChargeLKR.toFixed(2),
      deliveryChargeUSD: deliveryChargeUSD.toFixed(2),
      estimateDate: costData.createdAt ? 
        new Date(costData.createdAt.seconds * 1000).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0],
      company: "SmartAgro Solutions",
      contactPhone: "+94 76 942 3167",
      notes: costData.notes || ''
    };

    setQrData(qrData);
  };

  useEffect(() => {
    const costData = request?.costEstimate || request?.costDetails;
    if (isOpen && costData) {
      generateQRData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, request]);

  // Update QR data when cost data changes
  useEffect(() => {
    if (isOpen && request) {
      generateQRData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.costEstimate, request?.costDetails, isOpen]);

  const handleDownloadPDF = async () => {
    const costData = request?.costEstimate || request?.costDetails;
    if (!costData) {
      toast.error('No cost estimation data available');
      return;
    }

    setLoading(true);
    try {
      const { pdf, filename } = await generateCostEstimationPDF(request, costData, currency);
      downloadPDF(pdf, filename);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString();
  };

  const costData = request?.costEstimate || request?.costDetails;
  
  // Debug: Log the cost data structure
  console.log('🔍 CostEstimationPDFViewer - Request:', request);
  console.log('🔍 CostEstimationPDFViewer - Cost Data:', costData);
  
  // Use the original LKR values (admin sends LKR, we convert to USD for display)
  // If LKR values are not found, use the USD values as LKR (since admin entered LKR but they were stored as USD)
  const deviceCostLKR = costData?.deviceCostLKR || costData?.deviceCost || 0;
  const serviceChargeLKR = costData?.serviceChargeLKR || costData?.serviceCharge || 0;
  const deliveryChargeLKR = costData?.deliveryLKR || costData?.delivery || 0;
  const totalCostLKR = deviceCostLKR + serviceChargeLKR + deliveryChargeLKR;
  
  console.log('🔍 CostEstimationPDFViewer - LKR Values:', {
    deviceCostLKR,
    serviceChargeLKR,
    deliveryChargeLKR,
    totalCostLKR
  });

  // Convert LKR to USD for display
  const deviceCostUSD = deviceCostLKR / 303.62;
  const serviceChargeUSD = serviceChargeLKR / 303.62;
  const deliveryChargeUSD = deliveryChargeLKR / 303.62;
  const totalCostUSD = totalCostLKR / 303.62;

  if (!isOpen || !costData) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative flex flex-col" style={{ minHeight: '600px' }}>
        {/* Header */}
        <div className="bg-green-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Cost Estimation Details</h2>
              <p className="text-green-100 mt-1">
                Request ID: {request.id}
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
          {!showQR ? (
            <>
              {/* Customer Information */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Name:</span> {request.fullName || request.personalInfo?.fullName || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {request.email || request.personalInfo?.email || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {request.mobileNumber || request.personalInfo?.mobileNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">NIC:</span> {request.nicNumber || request.personalInfo?.nicNumber || 'N/A'}</p>
                    <p><span className="font-medium">Address:</span> {request.address || request.personalInfo?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Farm Information */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Farm Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Farm Name:</span> {request.farmName || request.farmInfo?.farmName || 'N/A'}</p>
                    <p><span className="font-medium">Farm Size:</span> {request.farmSize || request.farmInfo?.farmSize || 'N/A'} acres</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Location:</span> {request.farmLocation || request.farmInfo?.farmLocation || 'N/A'}</p>
                    <p><span className="font-medium">Soil Type:</span> {request.soilType || request.farmInfo?.soilType || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Selected Parameters */}
              {request.selectedParameters && request.selectedParameters.length > 0 && (
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Device Parameters</h3>
                  <div className="flex flex-wrap gap-2">
                    {request.selectedParameters.map((param, index) => {
                      const paramNames = {
                        soilMoisture: 'Soil Moisture',
                        airHumidity: 'Air Humidity',
                        airTemperature: 'Air Temperature',
                        soilTemperature: 'Soil Temperature',
                        rainDetection: 'Rain Detection',
                        lightLevel: 'Light Level (LDR)',
                        airQuality: 'Air Quality (MQ135)',
                        waterPumpControl: 'Water Pump Control'
                      };
                      return (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          {paramNames[param] || param}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cost Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">USD</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">LKR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Device Cost</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">${deviceCostUSD.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">LKR {deviceCostLKR.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Service Charge</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">${serviceChargeUSD.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">LKR {serviceChargeLKR.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Delivery Charge</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">${deliveryChargeUSD.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">LKR {deliveryChargeLKR.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">Total Cost</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">${totalCostUSD.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">LKR {totalCostLKR.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p><strong>Exchange Rate:</strong> 1 USD = 303.62 LKR (approximate)</p>
                </div>
              </div>

              {/* Additional Notes */}
              {costData.notes && (
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Notes</h3>
                  <p className="text-gray-700">{costData.notes}</p>
                </div>
              )}

              {/* Company Information */}
              <div className="mb-6 bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Information</h3>
                <div className="text-sm text-gray-700">
                  <p><span className="font-medium">SmartAgro Solutions</span></p>
                  <p>Northern University, Kantharmadam, Sri Lanka</p>
                  <p>Phone: +94 76 942 3167 | Email: info@smartagro.lk</p>
                  <p>Website: www.smartagro.lk</p>
                </div>
              </div>
            </>
          ) : (
            /* QR Code Display */
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code - Cost Estimation Details</h3>
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <QRCode
                    value={JSON.stringify(qrData)}
                    size={200}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Scan this QR code with your mobile device to view the cost estimation details
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-semibold mb-2">QR Code contains:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Request ID and Customer Information</li>
                  <li>• Farm Details and Selected Parameters</li>
                  <li>• Complete Cost Breakdown</li>
                  <li>• Company Contact Information</li>
                  <li>• Estimation Date and Notes</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed positioning */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200 sticky bottom-0 z-20" style={{ minHeight: '80px' }}>
          <div className="text-sm text-gray-500">
            Estimate Date: {formatDate(costData.createdAt || request.estimatedAt)}
          </div>
          <div className="flex space-x-3 z-30 relative">
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-8h2m-6 0h-2m6 0h2m-6-4V4m6 4V4m0 0h2m-6 0h-2m6 0h2M6 4v1M6 4H4m2 0h2m4 0V4m0 0h2M6 4h2m0 0h2m0 0v1m0 0h2" />
              </svg>
              <span>{showQR ? 'View Details' : 'Show QR Code'}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="px-8 py-3 text-sm font-medium text-white bg-green-600 border-2 border-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-lg"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{loading ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostEstimationPDFViewer;
