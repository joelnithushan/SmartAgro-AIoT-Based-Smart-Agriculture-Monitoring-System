import React from 'react';

const AnalysisPanel = ({ recommendations, onAddCrop }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handleAddRecommendedCrop = (recommendation) => {
    // Convert recommendation to crop format
    const cropData = {
      cropName: recommendation.name,
      variety: recommendation.variety || 'AI Recommended',
      recommendedRanges: recommendation.recommendedRanges || {
        soilMoisturePct: { min: 25, max: 45 },
        airTemperature: { min: 20, max: 30 },
        airHumidity: { min: 40, max: 70 },
        soilTemperature: { min: 18, max: 28 },
        airQualityIndex: { min: 0, max: 100 }
      },
      notes: `AI Recommended: ${recommendation.reason}`,
      source: 'ai_recommended'
    };
    onAddCrop(cropData);
  };

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">🤖</span>
        <h3 className="text-lg font-semibold text-gray-900">AI Analysis Results</h3>
      </div>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Based on your current field conditions and sensor data, here are some crop recommendations 
          suitable for the Northern Province of Sri Lanka:
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-medium text-gray-900">{recommendation.name}</h4>
                  {recommendation.confidenceScore && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {Math.round(recommendation.confidenceScore * 100)}% confidence
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{recommendation.reason}</p>
                
                {recommendation.recommendation && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Recommendation:</span> {recommendation.recommendation}
                    </p>
                  </div>
                )}

                {recommendation.recommendedRanges && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Recommended Ranges:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {recommendation.recommendedRanges.soilMoisturePct && (
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="font-medium">Soil Moisture:</span> {recommendation.recommendedRanges.soilMoisturePct.min}-{recommendation.recommendedRanges.soilMoisturePct.max}%
                        </div>
                      )}
                      {recommendation.recommendedRanges.airTemperature && (
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="font-medium">Air Temp:</span> {recommendation.recommendedRanges.airTemperature.min}-{recommendation.recommendedRanges.airTemperature.max}°C
                        </div>
                      )}
                      {recommendation.recommendedRanges.airHumidity && (
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="font-medium">Humidity:</span> {recommendation.recommendedRanges.airHumidity.min}-{recommendation.recommendedRanges.airHumidity.max}%
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-4 flex flex-col space-y-2">
                <button
                  onClick={() => handleAddRecommendedCrop(recommendation)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Add Crop</span>
                </button>
                
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>📋</span>
                  <span>View Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-yellow-600 text-lg mr-2">💡</span>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Tips for Success</h4>
            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
              <li>• Consider your local climate and soil conditions when selecting crops</li>
              <li>• Start with crops that have higher confidence scores</li>
              <li>• Monitor your field conditions regularly and adjust as needed</li>
              <li>• Consult with local agricultural experts for additional guidance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
