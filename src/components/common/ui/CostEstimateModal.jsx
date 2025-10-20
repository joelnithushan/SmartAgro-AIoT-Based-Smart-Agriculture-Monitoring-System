import React, { useState } from 'react';
import { useCurrency } from '../../../context/CurrencyContext';
import { apiService } from '../api';
import { generateCostEstimationPDF, downloadPDF } from '../../../components/common/validations/pdfGenerator';
import toast from 'react-hot-toast';
const CostEstimateModal = ({ request, onClose, onSuccess }) => {
  const { formatCurrency, currency, convertToLKR } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [costData, setCostData] = useState({
    deviceCost: '',
    serviceCharge: '',
    deliveryCharge: '',
    notes: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Validation function for cost inputs
  const validateCostInput = (value) => {
    // Allow empty string, numbers, and decimal points
    const regex = /^(\d+\.?\d*)?$/;
    return regex.test(value);
  };

  const handleInputChange = (field, value) => {
    // Validate input - only allow numbers and decimal point
    if (!validateCostInput(value)) {
      return; // Don't update if invalid
    }

    setCostData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  const validateForm = () => {
    if (!costData.deviceCost || !costData.serviceCharge || !costData.deliveryCharge) {
      setError('Please fill in all cost fields');
      return false;
    }
    if (isNaN(costData.deviceCost) || parseFloat(costData.deviceCost) <= 0) {
      setError('Device cost must be a positive number');
      return false;
    }
    if (isNaN(costData.serviceCharge) || parseFloat(costData.serviceCharge) < 0) {
      setError('Service charge must be a non-negative number');
      return false;
    }
    if (isNaN(costData.deliveryCharge) || parseFloat(costData.deliveryCharge) < 0) {
      setError('Delivery charge must be a non-negative number');
      return false;
    }
    setError('');
    return true;
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    try {
      const result = await apiService.estimateCost(request.id, {
        deviceCost: parseFloat(costData.deviceCost),
        serviceCharge: parseFloat(costData.serviceCharge),
        deliveryCharge: parseFloat(costData.deliveryCharge),
        notes: costData.notes
      });
      setSuccess('Cost estimate created successfully!');
      setTimeout(() => {
        onSuccess && onSuccess(result);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error creating cost estimate:', error);
      setError(error.message || 'Failed to create cost estimate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!validateForm()) return;
    
    setPdfLoading(true);
    try {
      const costEstimate = {
        deviceCost: parseFloat(costData.deviceCost),
        serviceCharge: parseFloat(costData.serviceCharge),
        deliveryCharge: parseFloat(costData.deliveryCharge),
        notes: costData.notes,
        createdAt: new Date()
      };

      const { pdf, filename } = await generateCostEstimationPDF(request, costEstimate, currency);
      downloadPDF(pdf, filename);
      toast.success('PDF generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setPdfLoading(false);
    }
  };
  const totalCost = () => {
    const device = parseFloat(costData.deviceCost) || 0;
    const service = parseFloat(costData.serviceCharge) || 0;
    const delivery = parseFloat(costData.deliveryCharge) || 0;
    return device + service + delivery;
  };
  if (!request) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {}
        <div className="bg-green-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Create Cost Estimate</h2>
              <p className="text-green-100 mt-1">
                Request from {request.personalInfo?.fullName || 'Unknown User'}
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
        {}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="ml-3 text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="ml-3 text-sm text-green-800">{success}</p>
              </div>
            </div>
          )}
          {}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Farm:</span> {request.farmInfo?.farmName || 'N/A'}</p>
                <p><span className="font-medium">Size:</span> {request.farmInfo?.farmSize || 0} acres</p>
                <p><span className="font-medium">Soil Type:</span> {request.farmInfo?.soilType || 'N/A'}</p>
              </div>
              <div>
                <p><span className="font-medium">Sensors:</span></p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {request.paramRequirements?.sensors && Object.entries(request.paramRequirements.sensors)
                    .filter(([_, selected]) => selected)
                    .map(([sensor, _]) => (
                      <span key={sensor} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {sensor.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
          {}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Cost ($) *
                </label>
                <input
                  type="text"
                  value={costData.deviceCost}
                  onChange={(e) => handleInputChange('deviceCost', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.deviceCost 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Enter device cost"
                />
                {validationErrors.deviceCost && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.deviceCost}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Charge ($) *
                </label>
                <input
                  type="text"
                  value={costData.serviceCharge}
                  onChange={(e) => handleInputChange('serviceCharge', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.serviceCharge 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Enter service charge"
                />
                {validationErrors.serviceCharge && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.serviceCharge}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Charge ($) *
                </label>
                <input
                  type="text"
                  value={costData.deliveryCharge}
                  onChange={(e) => handleInputChange('deliveryCharge', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.deliveryCharge 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Enter delivery charge"
                />
                {validationErrors.deliveryCharge && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.deliveryCharge}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Cost
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-lg font-semibold text-gray-900">
                  <div className="flex justify-between">
                    <span>${totalCost().toFixed(2)}</span>
                    <span className="text-gray-600">LKR {convertToLKR(totalCost()).toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Exchange Rate: 1 USD = 303.62 LKR (approximate)
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={costData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Any additional notes about the cost estimate..."
              />
            </div>
          </div>
        </div>
        {}
        <div className="bg-gray-50 px-6 py-4 flex justify-between border-t border-gray-200 sticky bottom-0 z-20" style={{ minHeight: '80px' }}>
          <button
            onClick={handleGeneratePDF}
            disabled={pdfLoading || !costData.deviceCost || !costData.serviceCharge || !costData.deliveryCharge}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-lg"
          >
            {pdfLoading && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{pdfLoading ? 'Generating...' : 'Generate PDF'}</span>
          </button>
          
          <div className="flex space-x-3 z-30 relative">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 text-sm font-medium text-white bg-orange-500 border-2 border-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-lg"
            >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{loading ? 'Creating Estimate...' : 'Create Estimate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default CostEstimateModal;
