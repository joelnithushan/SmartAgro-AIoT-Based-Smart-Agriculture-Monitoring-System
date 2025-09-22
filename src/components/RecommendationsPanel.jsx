import React from 'react';

const RecommendationsPanel = ({ recommendations, onAnalyzeNow, isLoading }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
        <button
          onClick={onAnalyzeNow}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Now'}
        </button>
      </div>
      
      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-lg font-medium mb-2">No recommendations yet</p>
          <p className="text-sm">Click "Analyze Now" to get AI-powered crop recommendations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={rec.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">
                  Recommendation for {formatDate(rec.createdAt)}
                </h4>
                <span className="text-xs text-gray-500">
                  {rec.deviceId ? `Device: ${rec.deviceId}` : 'General'}
                </span>
              </div>
              
              <div className="prose prose-sm max-w-none">
                {rec.recommendation ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: rec.recommendation.replace(/\n/g, '<br>') 
                    }} 
                  />
                ) : (
                  <p className="text-gray-600">No recommendation text available</p>
                )}
              </div>
              
              {rec.summary && (
                <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                  <h5 className="font-medium text-blue-900 mb-1">Summary</h5>
                  <p className="text-blue-800 text-sm">{rec.summary}</p>
                </div>
              )}
              
              {rec.actions && rec.actions.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-gray-900 mb-2">Recommended Actions</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {rec.actions.map((action, actionIndex) => (
                      <li key={actionIndex}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPanel;