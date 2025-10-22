import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { generateCostEstimationPDF, downloadPDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

const companyDetails = {
  name: "SmartAgro Solutions",
  address: "Northern University, Kantharmadam, Sri Lanka",
  phone: "+94 76 942 3167",
  email: "info@smartagro.lk",
  website: "www.smartagro.lk",
  regNo: "PV 12345-2024"
};

const CostEstimationPDFOnly = ({ request, isOpen, onClose }) => {
  const { currency, convertToLKR } = useCurrency();
  const [loading, setLoading] = useState(false);

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
      toast.error('Failed to download PDF: ' + error.message);
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
  if (!isOpen || !costData || !request) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative flex flex-col" style={{ minHeight: '600px' }}>
        {/* Header */}
        <div className="bg-green-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">PDF Download - Request #{request.id.slice(-8)}</h2>
              <p className="text-green-100 mt-1">
                Download your cost estimation as a PDF document
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
          <div className="space-y-6">
            {/* Company Information */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Information</h3>
              <div className="text-sm text-gray-700">
                <p><span className="font-medium">Name:</span> {companyDetails.name}</p>
                <p><span className="font-medium">Address:</span> {companyDetails.address}</p>
                <p><span className="font-medium">Phone:</span> {companyDetails.phone}</p>
                <p><span className="font-medium">Email:</span> {companyDetails.email}</p>
                <p><span className="font-medium">Website:</span> {companyDetails.website}</p>
                <p><span className="font-medium">Registration No:</span> {companyDetails.regNo}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p><span className="font-medium">Full Name:</span> {request.fullName || request.personalInfo?.fullName || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {request.email || request.personalInfo?.email || 'N/A'}</p>
                  <p><span className="font-medium">Mobile:</span> {request.mobileNumber || request.personalInfo?.mobileNumber || 'N/A'}</p>
                </div>
                <div>
                  <p><span className="font-medium">NIC:</span> {request.nicNumber || request.personalInfo?.nicNumber || 'N/A'}</p>
                  <p><span className="font-medium">Age:</span> {request.age || request.personalInfo?.age || 'N/A'}</p>
                  <p><span className="font-medium">Address:</span> {request.address || request.personalInfo?.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Farm Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Farm Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p><span className="font-medium">Farm Name:</span> {request.farmName || request.farmInfo?.farmName || 'N/A'}</p>
                  <p><span className="font-medium">Location:</span> {request.farmLocation || request.farmInfo?.farmLocation || 'N/A'}</p>
                  <p><span className="font-medium">Size:</span> {request.farmSize ? `${request.farmSize} acres` : 'N/A'}</p>
                </div>
                <div>
                  <p><span className="font-medium">Soil Type:</span> {request.soilType || request.farmInfo?.soilType || 'N/A'}</p>
                  <p><span className="font-medium">Additional Farm Info:</span> {request.additionalFarmInfo || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Selected Parameters */}
            {request.selectedParameters?.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Device Parameters</h3>
                <div className="flex flex-wrap gap-2">
                  {request.selectedParameters.map((param, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {param.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Breakdown Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
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
                    <td className="px-6 py-4 text-sm text-gray-900">Delivery</td>
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

            {/* Additional Notes */}
            {costData.notes && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Notes</h3>
                <p className="text-gray-700">{costData.notes}</p>
              </div>
            )}

            {/* PDF Preview Info */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3">📄 PDF Document Includes</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>• Complete company information and contact details</p>
                <p>• Customer and farm details</p>
                <p>• Detailed cost breakdown table</p>
                <p>• QR code for quick access to digital version</p>
                <p>• Professional formatting for records</p>
                <p>• Date: {formatDate(costData.createdAt || request.estimatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed positioning */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200 sticky bottom-0 z-20" style={{ minHeight: '80px' }}>
          <div className="text-sm text-gray-500">
            Estimate Date: {formatDate(costData.createdAt || request.estimatedAt)}
          </div>
          <div className="flex space-x-3 z-30 relative">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-md"
            >
              Cancel
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
              <span>{loading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostEstimationPDFOnly;
