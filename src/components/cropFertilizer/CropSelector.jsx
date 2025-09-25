import React, { useState } from 'react';

const CropSelector = ({ predefinedCrops, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter crops based on search term and category
  const filteredCrops = predefinedCrops.filter(crop => {
    const matchesSearch = crop.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.variety.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    
    // Simple categorization based on crop type
    const isVegetable = ['Tomato', 'Brinjal', 'Okra', 'Cucumber', 'Green Beans', 'Cabbage', 'Carrot', 'Radish', 'Spinach', 'Pumpkin', 'Bitter Gourd', 'Ridge Gourd', 'Snake Gourd', 'Ash Gourd'].includes(crop.cropName);
    const isHerb = ['Coriander', 'Curry Leaves'].includes(crop.cropName);
    const isSpice = ['Chili', 'Onion'].includes(crop.cropName);
    const isGrain = crop.cropName.includes('Rice');
    
    if (selectedCategory === 'vegetables' && isVegetable) return matchesSearch;
    if (selectedCategory === 'herbs' && isHerb) return matchesSearch;
    if (selectedCategory === 'spices' && isSpice) return matchesSearch;
    if (selectedCategory === 'grains' && isGrain) return matchesSearch;
    
    return false;
  });

  const categories = [
    { value: 'all', label: 'All Crops' },
    { value: 'grains', label: 'Grains' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'herbs', label: 'Herbs' },
    { value: 'spices', label: 'Spices' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Browse Predefined Crops</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search crops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Crops List */}
        <div className="px-6 py-4 overflow-y-auto max-h-96">
          {filteredCrops.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No crops found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCrops.map((crop, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => onSelect(crop)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{crop.cropName}</h3>
                      <p className="text-sm text-gray-600">{crop.variety}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(crop);
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  {crop.notes && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{crop.notes}</p>
                  )}

                  <div className="text-xs text-gray-600">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Soil Moisture:</span> {crop.recommendedRanges.soilMoisturePct.min}-{crop.recommendedRanges.soilMoisturePct.max}%
                      </div>
                      <div>
                        <span className="font-medium">Air Temp:</span> {crop.recommendedRanges.airTemperature.min}-{crop.recommendedRanges.airTemperature.max}°C
                      </div>
                      <div>
                        <span className="font-medium">Humidity:</span> {crop.recommendedRanges.airHumidity.min}-{crop.recommendedRanges.airHumidity.max}%
                      </div>
                      <div>
                        <span className="font-medium">Soil Temp:</span> {crop.recommendedRanges.soilTemperature.min}-{crop.recommendedRanges.soilTemperature.max}°C
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropSelector;
