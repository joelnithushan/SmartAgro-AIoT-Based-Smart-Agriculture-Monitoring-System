import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase/firebase';
import { useCurrency } from '../../../context/CurrencyContext';
import CostEstimationPDFViewer from './CostEstimationPDFViewer';
import toast from 'react-hot-toast';
const CostEstimationCard = ({ request, onUpdate }) => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const handleAccept = async () => {
    setLoading(true);
    try {
      const requestRef = doc(db, 'deviceRequests', request.id);
      await updateDoc(requestRef, {
        status: 'user-accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Cost estimation accepted! Admin will assign your device soon.');
      onUpdate();
    } catch (error) {
      console.error('Error accepting cost estimation:', error);
      toast.error('Failed to accept cost estimation');
    } finally {
      setLoading(false);
    }
  };
  const handleReject = async () => {
    setLoading(true);
    try {
      const requestRef = doc(db, 'deviceRequests', request.id);
      await updateDoc(requestRef, {
        status: 'user-rejected',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Cost estimation rejected. You can request a new device.');
      onUpdate();
    } catch (error) {
      console.error('Error rejecting cost estimation:', error);
      toast.error('Failed to reject cost estimation');
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Cost Estimation - Request #{request.id.slice(-8)}
          </h3>
          <p className="text-sm text-gray-500">
            Estimated on {formatDate(request.estimatedAt)}
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Cost Estimated
        </span>
      </div>
      {}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Cost Breakdown</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Device Cost:</span>
            <span className="font-medium">{formatCurrency(request.costDetails?.deviceCost || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service Charge:</span>
            <span className="font-medium">{formatCurrency(request.costDetails?.serviceCharge || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery:</span>
            <span className="font-medium">{formatCurrency(request.costDetails?.deliveryCharge || 0)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between text-base font-semibold">
              <span className="text-gray-900">Total Cost:</span>
              <span className="text-green-600">{formatCurrency(request.costDetails?.totalCost || 0)}</span>
            </div>
          </div>
        </div>
      </div>
      {}
      {request.costDetails?.notes && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Admin Notes</h4>
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            {request.costDetails.notes}
          </p>
        </div>
      )}
      {}
      {/* PDF and QR Options */}
      <div className="flex space-x-3 mb-4">
        <button
          onClick={() => setShowPDFViewer(true)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>View PDF & QR</span>
        </button>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          {loading ? 'Processing...' : 'Accept & Proceed'}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          {loading ? 'Processing...' : 'Reject'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        By accepting, you agree to the cost and will be assigned a device once payment is processed.
      </p>

      {/* PDF Viewer Modal */}
      <CostEstimationPDFViewer
        request={request}
        isOpen={showPDFViewer}
        onClose={() => setShowPDFViewer(false)}
      />
    </div>
  );
};
export default CostEstimationCard;
