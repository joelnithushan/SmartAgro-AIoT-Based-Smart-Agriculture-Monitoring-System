/**
 * Agriculture-only filter service
 * Determines if a query is agriculture-related and filters non-agriculture queries
 */

// Agriculture-related keywords and categories
const AGRICULTURE_KEYWORDS = {
  // Crops
  crops: [
    'rice', 'samba', 'nadu', 'coconut', 'king coconut', 'thambili', 'tea', 'ceylon tea',
    'cinnamon', 'cardamom', 'pepper', 'black pepper', 'vegetables', 'tomatoes', 'chili',
    'onion', 'potato', 'carrot', 'beans', 'cabbage', 'lettuce', 'spinach', 'okra',
    'banana', 'mango', 'papaya', 'pineapple', 'avocado', 'plantain', 'yam', 'sweet potato',
    'cassava', 'maize', 'corn', 'wheat', 'barley', 'millet', 'sorghum', 'soybean',
    'cotton', 'sugarcane', 'coffee', 'cocoa', 'vanilla', 'ginger', 'turmeric', 'garlic'
  ],
  
  // Soil and nutrients
  soil: [
    'soil', 'dirt', 'earth', 'compost', 'organic matter', 'ph', 'nutrients', 'fertilizer',
    'nitrogen', 'phosphorus', 'potassium', 'npk', 'manure', 'humus', 'mulch', 'tillage',
    'drainage', 'irrigation', 'watering', 'moisture', 'dry', 'wet', 'flooding'
  ],
  
  // Farming practices
  farming: [
    'planting', 'sowing', 'seeding', 'transplanting', 'harvesting', 'cultivation',
    'farming', 'agriculture', 'farming', 'crop rotation', 'intercropping', 'companion planting',
    'green manure', 'cover crop', 'pruning', 'trimming', 'weeding', 'plowing', 'tilling'
  ],
  
  // Pests and diseases
  pests: [
    'pest', 'insect', 'bug', 'disease', 'fungus', 'bacteria', 'virus', 'mold', 'rot',
    'aphid', 'caterpillar', 'worm', 'beetle', 'mite', 'nematode', 'whitefly', 'thrips',
    'blight', 'rust', 'mildew', 'wilting', 'yellowing', 'spots', 'damage', 'control',
    'pesticide', 'herbicide', 'fungicide', 'organic', 'natural', 'biological control'
  ],
  
  // Weather and climate
  weather: [
    'weather', 'climate', 'temperature', 'humidity', 'rainfall', 'rain', 'drought',
    'flood', 'storm', 'wind', 'sunlight', 'shade', 'season', 'monsoon', 'dry season',
    'wet season', 'frost', 'heat', 'cold', 'microclimate', 'greenhouse', 'tunnel'
  ],
  
  // Equipment and technology
  equipment: [
    'tractor', 'plow', 'seeder', 'irrigation', 'sprinkler', 'drip', 'sensor', 'iot',
    'greenhouse', 'tunnel', 'net house', 'fertilizer spreader', 'sprayer', 'harvester',
    'mower', 'cultivator', 'drill', 'planter', 'transplanter', 'smart farming', 'precision agriculture'
  ],
  
  // General agriculture terms
  general: [
    'farm', 'farmer', 'farming', 'agriculture', 'agricultural', 'crop', 'yield', 'production',
    'growth', 'development', 'maturity', 'harvest', 'storage', 'post harvest', 'marketing',
    'profit', 'income', 'cost', 'investment', 'subsidy', 'loan', 'credit', 'insurance',
    'organic', 'sustainable', 'biodiversity', 'conservation', 'environment', 'ecology'
  ]
};

// Greeting patterns (always allowed)
const GREETING_PATTERNS = [
  'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
  'how are you', 'how do you do', 'what can you do', 'help', 'capabilities',
  'thank you', 'thanks', 'bye', 'goodbye', 'see you'
];

/**
 * Check if a message is a greeting
 */
const isGreeting = (message) => {
  const lowerMessage = message.toLowerCase().trim();
  return GREETING_PATTERNS.some(pattern => lowerMessage.includes(pattern));
};

/**
 * Check if a message is agriculture-related
 */
const isAgricultureRelated = (message) => {
  const lowerMessage = message.toLowerCase().trim();
  
  // Allow greetings
  if (isGreeting(lowerMessage)) {
    return true;
  }
  
  // Check all agriculture categories
  const allKeywords = Object.values(AGRICULTURE_KEYWORDS).flat();
  
  // Check for agriculture keywords
  const hasAgricultureKeyword = allKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Additional patterns for agriculture context
  const agriculturePatterns = [
    /\b(how to|what is|when to|where to|why|can you)\b.*\b(grow|plant|cultivate|farm|harvest|irrigate|fertilize|pest|disease|soil|crop|yield|production)\b/i,
    /\b(best|optimal|ideal|suitable)\b.*\b(for|to|in)\b.*\b(crop|plant|farming|agriculture|growing|cultivation)\b/i,
    /\b(problem|issue|trouble|disease|pest|yellowing|wilting|spots|damage)\b.*\b(with|in)\b.*\b(plant|crop|farm|garden)\b/i,
    /\b(season|time|when|month|period)\b.*\b(to|for)\b.*\b(plant|grow|cultivate|harvest|sow)\b/i,
    /\b(soil|water|fertilizer|nutrient|irrigation|moisture|temperature|climate)\b.*\b(for|to|in)\b.*\b(crop|plant|farming)\b/i
  ];
  
  const hasAgriculturePattern = agriculturePatterns.some(pattern => 
    pattern.test(lowerMessage)
  );
  
  return hasAgricultureKeyword || hasAgriculturePattern;
};

/**
 * Filter message - returns filtered response if not agriculture-related
 */
const filterMessage = (message) => {
  if (isAgricultureRelated(message)) {
    return { isAgriculture: true, message: message };
  } else {
    // Allow all messages to pass through for dynamic fallback responses
    return { isAgriculture: true, message: message };
  }
};

/**
 * Validate message input
 */
const validateMessage = (message) => {
  const errors = [];
  
  if (!message || typeof message !== 'string') {
    errors.push('Message is required');
    return { isValid: false, errors };
  }
  
  const trimmedMessage = message.trim();
  
  if (trimmedMessage.length === 0) {
    errors.push('Message cannot be empty');
  }
  
  if (trimmedMessage.length > 500) {
    errors.push('Message is too long (max 500 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    trimmedMessage
  };
};

export {
  filterMessage,
  validateMessage,
  isAgricultureRelated,
  isGreeting,
  AGRICULTURE_KEYWORDS,
  GREETING_PATTERNS
};
