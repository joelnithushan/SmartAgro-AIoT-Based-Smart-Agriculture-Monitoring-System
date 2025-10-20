import React from 'react';

const AnalysisResults = ({ results, onAddRecommendedCrop, onClose }) => {
  if (!results || !results.topRecommendations) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Analysis Results</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">🤖</span>
          <h4 className="font-medium text-blue-900">AI Crop Recommendations</h4>
        </div>
        <p className="text-sm text-blue-700">
          Based on your current environmental conditions, here are the recommended crops:
        </p>
      </div>

      <div className="space-y-4">
        {results.topRecommendations.map((recommendation, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h4 className="font-medium text-gray-900 mr-3">{recommendation.name}</h4>
                  {recommendation.confidenceScore && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      recommendation.confidenceScore >= 0.8 
                        ? 'bg-green-100 text-green-800' 
                        : recommendation.confidenceScore >= 0.6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {Math.round(recommendation.confidenceScore * 100)}% confidence
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Why it's suitable:</strong> {recommendation.reason}
                </p>
                
                {recommendation.recommendation && (
                  <p className="text-sm text-gray-600">
                    <strong>Growing tips:</strong> {recommendation.recommendation}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => onAddRecommendedCrop(recommendation)}
                className="ml-4 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                Add Crop
              </button>
            </div>
          </div>
        ))}
      </div>

      {results.aiText && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Additional Analysis</h4>
          <p className="text-sm text-gray-700">{results.aiText}</p>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        Analysis generated on {new Date(results.createdAt || Date.now()).toLocaleString()}
      </div>
    </div>
  );
};

export default AnalysisResults;
