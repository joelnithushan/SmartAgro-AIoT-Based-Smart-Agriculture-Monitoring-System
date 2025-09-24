import React, { useState } from 'react';
import { cropDatabase, getCropCategories, getCropsByCategory, getSriLankanCrops } from '../data/cropDatabase';

const EnhancedCropSelector = ({ crops, selectedCrop, onCropSelect, onEditCrop, onDeleteCrop, onAddCrop }) => {
  const [showPredefinedCrops, setShowPredefinedCrops] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', ...getCropCategories()];

  const filteredPredefinedCrops = () => {
    let filtered = Object.entries(cropDatabase);
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(([key, crop]) => crop.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(([key, crop]) => 
        crop.name.toLowerCase().includes(query) ||
        crop.variety.toLowerCase().includes(query) ||
        crop.category.toLowerCase().includes(query)
      );
    }
    
    return filtered.map(([key, crop]) => ({ key, ...crop }));
  };

  const handleAddPredefinedCrop = (cropData) => {
    // Create a new crop object with the predefined data
    const newCrop = {
      cropName: cropData.name,
      variety: cropData.variety,
      notes: `${cropData.description} | Category: ${cropData.category} | Season: ${cropData.growingSeason}`,
      recommendedRanges: cropData.recommendedRanges,
      category: cropData.category,
      growingSeason: cropData.growingSeason,
      waterNeeds: cropData.waterNeeds,
      lightNeeds: cropData.lightNeeds
    };
    
    // Call the onAddCrop function with the predefined data
    onAddCrop(newCrop);
    setShowPredefinedCrops(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🌱 Crop Management</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPredefinedCrops(!showPredefinedCrops)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            📚 Browse Crops
          </button>
          <button
            onClick={onAddCrop}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
          >
            ➕ Add Custom
          </button>
        </div>
      </div>

      {/* Predefined Crops Section */}
      {showPredefinedCrops && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-md font-semibold text-blue-900 mb-3">📚 Predefined Crops Database</h4>
          
          {/* Sri Lankan Crops Highlight */}
          <div className="mb-4 p-3 bg-green-100 rounded-lg border border-green-300">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">🇱🇰</span>
              <h5 className="font-semibold text-green-800">Sri Lankan Crops Available!</h5>
            </div>
            <p className="text-sm text-green-700 mb-2">
              Browse {getSriLankanCrops().length} traditional Sri Lankan crops including:
            </p>
            <div className="flex flex-wrap gap-1 text-xs">
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🍚 Samba Rice</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🌽 Maize</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🥥 Coconut</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🍃 Ceylon Tea</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🌿 Cinnamon</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🥜 Groundnut</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🥬 Gotukola</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🧅 Red Onion</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🌶️ Chili</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🌾 Kurakkan</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🥭 Mango</span>
              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">🍈 Papaya</span>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="Search crops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Crops Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {filteredPredefinedCrops().map((crop) => (
              <div
                key={crop.key}
                className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{crop.name}</h5>
                    <p className="text-xs text-gray-600">{crop.variety}</p>
                    <p className="text-xs text-blue-600">{crop.category}</p>
                  </div>
                  <button
                    onClick={() => handleAddPredefinedCrop(crop)}
                    className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                    title="Add this crop"
                  >
                    ➕
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <div>🌡️ Temp: {crop.recommendedRanges.airTemperature.min}°-{crop.recommendedRanges.airTemperature.max}°C</div>
                  <div>💧 Humidity: {crop.recommendedRanges.airHumidity.min}-{crop.recommendedRanges.airHumidity.max}%</div>
                  <div>🌱 Soil: {crop.recommendedRanges.soilMoisturePct.min}-{crop.recommendedRanges.soilMoisturePct.max}%</div>
                  <div>📅 Season: {crop.growingSeason}</div>
                  {crop.region && (
                    <div className="text-blue-600 font-medium">📍 {crop.region}</div>
                  )}
                  {crop.category.includes('Sri Lankan') && (
                    <div className="text-green-600 font-medium">🇱🇰 Sri Lankan</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-blue-600">
            💡 Click ➕ to add any crop with pre-configured parameter ranges
          </div>
        </div>
      )}

      {/* User's Custom Crops */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">🌾 Your Crops</h4>
        
        {crops.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">🌱</div>
            <p className="font-medium">No crops added yet</p>
            <p className="text-sm">Browse predefined crops or add a custom one</p>
          </div>
        ) : (
          <div className="space-y-2">
            {crops.map((crop) => (
              <div
                key={crop.id}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedCrop?.id === crop.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onCropSelect && onCropSelect(crop)}
                  >
                    <h5 className="font-medium text-gray-900">{crop.cropName}</h5>
                    <p className="text-sm text-gray-600">{crop.variety}</p>
                    {crop.category && (
                      <p className="text-xs text-blue-600">{crop.category}</p>
                    )}
                    {crop.recommendedRanges && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                          🌡️ {crop.recommendedRanges.airTemperature?.min || 'N/A'}°-{crop.recommendedRanges.airTemperature?.max || 'N/A'}°C
                        </span>
                        <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                          💧 {crop.recommendedRanges.airHumidity?.min || 'N/A'}-{crop.recommendedRanges.airHumidity?.max || 'N/A'}%
                        </span>
                        <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                          🌱 {crop.recommendedRanges.soilMoisturePct?.min || 'N/A'}-{crop.recommendedRanges.soilMoisturePct?.max || 'N/A'}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCrop && onEditCrop(crop);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                      title="Edit crop"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCrop && onDeleteCrop(crop.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-100 transition-colors"
                      title="Delete crop"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCropSelector;
