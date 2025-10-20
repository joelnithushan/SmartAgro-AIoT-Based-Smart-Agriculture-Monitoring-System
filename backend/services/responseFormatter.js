/**
 * Response formatter service for agriculture chatbot
 * Formats DeepSeek API responses with structured sections and emojis
 */

// Agriculture emoji mapping
const AGRICULTURE_EMOJIS = {
  planting: '🌱',
  watering: '💧',
  sunlight: '☀️',
  pest: '🐛',
  harvest: '🌾',
  soil: '🌍',
  fertilizer: '🌿',
  temperature: '🌡️',
  rain: '🌧️',
  crop: '🌾',
  vegetables: '🥬',
  fruits: '🍎',
  spices: '🌶️',
  rice: '🍚',
  coconut: '🥥',
  tea: '🍃',
  warning: '⚠️',
  tip: '💡',
  success: '✅',
  info: 'ℹ️',
  step: '📝',
  season: '📅',
  equipment: '🔧',
  money: '💰',
  health: '💚',
  growth: '📈',
  problem: '❌',
  solution: '✅'
};

/**
 * Extract and format structured sections from AI response
 */
const formatStructuredResponse = (aiResponse) => {
  if (!aiResponse || typeof aiResponse !== 'string') {
    return aiResponse;
  }
  
  let formattedResponse = aiResponse;
  
  // Add emojis to common agriculture terms
  formattedResponse = addEmojisToResponse(formattedResponse);
  
  // Format sections with proper headers
  formattedResponse = formatSections(formattedResponse);
  
  // Format lists and steps
  formattedResponse = formatLists(formattedResponse);
  
  // Add visual separators for better readability
  formattedResponse = addVisualSeparators(formattedResponse);
  
  return formattedResponse;
};

/**
 * Add relevant emojis to agriculture terms
 */
const addEmojisToResponse = (text) => {
  const emojiReplacements = [
    // Planting and growing
    { pattern: /\b(plant|planting|sow|sowing|seed)\b/gi, emoji: AGRICULTURE_EMOJIS.planting },
    { pattern: /\b(water|watering|irrigation|moisture)\b/gi, emoji: AGRICULTURE_EMOJIS.watering },
    { pattern: /\b(sun|sunlight|light|shade)\b/gi, emoji: AGRICULTURE_EMOJIS.sunlight },
    { pattern: /\b(pest|insect|bug|disease)\b/gi, emoji: AGRICULTURE_EMOJIS.pest },
    { pattern: /\b(harvest|harvesting|yield|production)\b/gi, emoji: AGRICULTURE_EMOJIS.harvest },
    { pattern: /\b(soil|dirt|earth|compost)\b/gi, emoji: AGRICULTURE_EMOJIS.soil },
    { pattern: /\b(fertilizer|nutrient|npk|manure)\b/gi, emoji: AGRICULTURE_EMOJIS.fertilizer },
    { pattern: /\b(temperature|climate|weather|heat|cold)\b/gi, emoji: AGRICULTURE_EMOJIS.temperature },
    { pattern: /\b(rain|rainfall|drought|monsoon)\b/gi, emoji: AGRICULTURE_EMOJIS.rain },
    
    // Crops
    { pattern: /\b(rice|samba|nadu)\b/gi, emoji: AGRICULTURE_EMOJIS.rice },
    { pattern: /\b(coconut|king coconut|thambili)\b/gi, emoji: AGRICULTURE_EMOJIS.coconut },
    { pattern: /\b(tea|ceylon tea)\b/gi, emoji: AGRICULTURE_EMOJIS.tea },
    { pattern: /\b(vegetables?|leafy greens?)\b/gi, emoji: AGRICULTURE_EMOJIS.vegetables },
    { pattern: /\b(fruits?|mango|papaya|banana)\b/gi, emoji: AGRICULTURE_EMOJIS.fruits },
    { pattern: /\b(spices?|cinnamon|cardamom|pepper)\b/gi, emoji: AGRICULTURE_EMOJIS.spices },
    
    // Actions and states
    { pattern: /\b(warning|caution|be careful|avoid)\b/gi, emoji: AGRICULTURE_EMOJIS.warning },
    { pattern: /\b(tip|suggestion|recommend|advice)\b/gi, emoji: AGRICULTURE_EMOJIS.tip },
    { pattern: /\b(success|good|excellent|optimal)\b/gi, emoji: AGRICULTURE_EMOJIS.success },
    { pattern: /\b(step|steps|process|procedure)\b/gi, emoji: AGRICULTURE_EMOJIS.step },
    { pattern: /\b(season|timing|period|month)\b/gi, emoji: AGRICULTURE_EMOJIS.season },
    { pattern: /\b(equipment|tool|machine|tractor)\b/gi, emoji: AGRICULTURE_EMOJIS.equipment },
    { pattern: /\b(profit|income|money|cost|price)\b/gi, emoji: AGRICULTURE_EMOJIS.money },
    { pattern: /\b(health|healthy|disease|problem)\b/gi, emoji: AGRICULTURE_EMOJIS.health },
    { pattern: /\b(growth|increase|improve|better)\b/gi, emoji: AGRICULTURE_EMOJIS.growth }
  ];
  
  emojiReplacements.forEach(({ pattern, emoji }) => {
    text = text.replace(pattern, (match) => {
      // Avoid adding emoji if it's already there
      if (!match.includes(emoji)) {
        return `${emoji} ${match}`;
      }
      return match;
    });
  });
  
  return text;
};

/**
 * Format sections with proper headers
 */
const formatSections = (text) => {
  // Common section patterns
  const sectionPatterns = [
    { pattern: /\*\*(.*?)\*\*:?\s*\n/g, replacement: '## $1\n' },
    { pattern: /^(\d+\.\s*.*?)$/gm, replacement: '$1' },
    { pattern: /^([•\-\*]\s*.*?)$/gm, replacement: '$1' },
    { pattern: /(Tips?|Warnings?|Important|Note|Pro Tips?)/gi, replacement: '### $1' }
  ];
  
  sectionPatterns.forEach(({ pattern, replacement }) => {
    text = text.replace(pattern, replacement);
  });
  
  return text;
};

/**
 * Format lists and steps
 */
const formatLists = (text) => {
  // Format numbered lists
  text = text.replace(/^(\d+\.\s*.*?)$/gm, (match) => {
    return `📝 ${match}`;
  });
  
  // Format bullet points
  text = text.replace(/^([•\-\*]\s*.*?)$/gm, (match) => {
    return `• ${match.replace(/^[•\-\*]\s*/, '')}`;
  });
  
  return text;
};

/**
 * Add visual separators for better readability
 */
const addVisualSeparators = (text) => {
  // Add line breaks before major sections
  text = text.replace(/^(##\s+.*)$/gm, '\n$1\n');
  text = text.replace(/^(###\s+.*)$/gm, '\n$1\n');
  
  // Add separators between different topics
  const topicSeparators = [
    'Sri Lankan', 'Traditional', 'Modern', 'Organic', 'Seasonal', 'Regional',
    'Crop Management', 'Soil Health', 'Irrigation', 'Fertilizer', 'Pest Control'
  ];
  
  topicSeparators.forEach(topic => {
    const pattern = new RegExp(`(${topic}[^\\n]*?)(?=\\n|$)`, 'gi');
    text = text.replace(pattern, (match) => {
      if (match.includes('##') || match.includes('###')) {
        return `\n---\n${match}`;
      }
      return match;
    });
  });
  
  return text;
};

/**
 * Create a structured response template for agriculture topics
 */
const createStructuredTemplate = (topic, content) => {
  const templates = {
    cropGuide: `
🌱 **${topic} Growing Guide**

**📝 Steps:**
${content.steps || 'Step-by-step guide will be provided'}

**💡 Tips:**
${content.tips || 'Helpful tips will be provided'}

**⚠️ Warnings:**
${content.warnings || 'Important warnings will be highlighted'}

**📅 Best Time:**
${content.timing || 'Optimal timing will be specified'}
`,

    problemSolving: `
🔧 **Problem Diagnosis**

**❌ Symptoms:**
${content.symptoms || 'Problem symptoms will be identified'}

**✅ Solutions:**
${content.solutions || 'Effective solutions will be provided'}

**💡 Prevention:**
${content.prevention || 'Prevention tips will be included'}

**⚠️ Important Notes:**
${content.notes || 'Important notes will be highlighted'}
`,

    general: `
🌾 **${topic}**

${content.main || 'Detailed information will be provided'}

**💡 Key Points:**
${content.keyPoints || 'Key points will be highlighted'}

**📝 Action Items:**
${content.actions || 'Actionable steps will be provided'}
`
  };
  
  return templates.general; // Default template
};

export {
  formatStructuredResponse,
  addEmojisToResponse,
  formatSections,
  formatLists,
  addVisualSeparators,
  createStructuredTemplate,
  AGRICULTURE_EMOJIS
};
