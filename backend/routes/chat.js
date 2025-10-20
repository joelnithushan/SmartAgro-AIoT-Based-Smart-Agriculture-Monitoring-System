import express from 'express';
import { db, admin } from '../config/firebase.js';
import { collection, doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, query, where, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { getAIResponse, testAllAIServices } from '../services/aiService.js';
const router = express.Router();

// Helper function to get message count
const getMessageCount = async (userId, chatId) => {
  try {
    const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
    const messagesSnapshot = await getDocs(messagesRef);
    return messagesSnapshot.size;
  } catch (error) {
    console.error('Error getting message count:', error);
    return 0;
  }
};

// Test AI services on startup
let AI_SERVICES_AVAILABLE = { deepseek: false };
testAllAIServices().then(services => {
  AI_SERVICES_AVAILABLE = services;
  console.log('🤖 AI Services Status:', services);
});

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For testing, allow requests without token
      req.uid = 'test-user';
      req.user = { uid: 'test-user', email: 'test@example.com' };
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    // For testing, allow requests even with invalid token
    req.uid = 'test-user';
    req.user = { uid: 'test-user', email: 'test@example.com' };
    next();
  }
};

// Enhanced AI system prompt for agriculture + general Q&A
const getSystemPrompt = (sensorData, cropData) => {
  let context = `You are AgroBot, a smart AI assistant specialized in agriculture, particularly Sri Lankan agriculture, but also capable of general Q&A. 

For agriculture-related questions (farming, crops, soil, irrigation, fertilizers, pests, weather, IoT sensors): 
- Provide detailed, practical advice with actionable tips
- Consider Sri Lankan climate, seasons (Maha/Yala), and local crops
- Mention traditional Sri Lankan farming practices when relevant
- Include information about local varieties like Samba rice, Ceylon tea, coconut, etc.

For general questions: Provide concise, helpful answers.

Be friendly, informative, and always helpful. Keep responses clear and well-structured. Use emojis occasionally to make responses more engaging.`;

  if (sensorData) {
    context += `\n\nCurrent sensor readings:`;
    if (sensorData.temperature) context += `\n- Temperature: ${sensorData.temperature}°C`;
    if (sensorData.humidity) context += `\n- Humidity: ${sensorData.humidity}%`;
    if (sensorData.soilMoisture) context += `\n- Soil Moisture: ${sensorData.soilMoisture}%`;
    if (sensorData.ph) context += `\n- Soil pH: ${sensorData.ph}`;
    if (sensorData.lightIntensity) context += `\n- Light Intensity: ${sensorData.lightIntensity} lux`;
  }

  if (cropData) {
    context += `\n\nCrop information:`;
    if (cropData.type) context += `\n- Crop Type: ${cropData.type}`;
    if (cropData.stage) context += `\n- Growth Stage: ${cropData.stage}`;
    if (cropData.plantingDate) context += `\n- Planting Date: ${cropData.plantingDate}`;
  }

  return context;
};



// Function to get intelligent responses for common questions
const getCannedResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return 'Hello! I\'m your SmartAgro AI assistant, specialized in Sri Lankan agriculture. I can help you with farming advice, crop management, soil health, irrigation, and much more. What would you like to know about farming today? 🌱';
  }
  
  // How are you responses
  if (lowerMessage.includes('how are you') || lowerMessage.includes('how do you do')) {
    return 'I\'m doing great, thank you for asking! I\'m here and ready to help you with all your farming questions. Whether it\'s about rice cultivation, coconut farming, or any other agricultural topic, I\'m here to assist you. What can I help you with today? 😊';
  }
  
  // What can you do responses
  if (lowerMessage.includes('what can you do') || lowerMessage.includes('help') || lowerMessage.includes('capabilities')) {
    return 'I\'m your specialized farming assistant! Here\'s what I can help you with:\n\n🌾 **Crop Management**: Rice, coconut, tea, spices, vegetables\n🌱 **Soil Health**: pH testing, nutrient management, organic matter\n💧 **Irrigation**: Water management, timing, efficiency tips\n🌿 **Fertilizers**: NPK ratios, organic options, application timing\n🐛 **Pest Control**: Natural methods, companion planting, organic solutions\n🌡️ **Climate**: Temperature management, seasonal planning\n🇱🇰 **Sri Lankan Agriculture**: Traditional practices, local varieties, regional advice\n\nWhat specific topic interests you?';
  }
  
  // Thank you responses
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return 'You\'re very welcome! 😊 I\'m always here to help with your farming questions. Whether it\'s about crop management, soil health, irrigation, or any other agricultural topic, feel free to ask anytime. Happy farming! 🌱';
  }
  
  // Goodbye responses
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
    return 'Goodbye! 👋 It was great helping you with your farming questions today. Remember, I\'m always here whenever you need agricultural advice. Wishing you successful harvests and happy farming! 🌾✨';
  }
  
  // Sri Lankan rice farming
  if (lowerMessage.includes('rice') || lowerMessage.includes('samba') || lowerMessage.includes('nadu')) {
    return '🌾 **Sri Lankan Rice Farming** - Excellent choice! Here\'s what you need to know:\n\n**Seasons & Varieties:**\n• **Samba Rice**: Grown in Maha season (Oct-Mar) - the main season\n• **Nadu Rice**: Grown in Yala season (Apr-Sep) - shorter season\n\n**Optimal Conditions:**\n• **Soil Moisture**: 80-95% for best growth\n• **Temperature**: 24-32°C is ideal\n• **Traditional Varieties**: Better adapted to local climate\n\n**Pro Tips:**\n• Use traditional varieties like Bg 300, Bg 352 for better yield\n• Consider the Maha season for higher production\n• Monitor soil moisture regularly during critical growth stages\n\nWould you like specific advice on any particular aspect of rice farming?';
  }
  
  // Coconut farming
  if (lowerMessage.includes('coconut') || lowerMessage.includes('king coconut') || lowerMessage.includes('thambili')) {
    return '🥥 **Coconut Farming** - The "Tree of Life"! Here\'s your guide:\n\n**Growing Conditions:**\n• **Regions**: Coastal and low country areas work best\n• **Temperature**: 26-32°C is optimal\n• **Soil Moisture**: Maintain 60-80% moisture\n• **Production**: Year-round with proper care\n\n**Special Varieties:**\n• **King Coconut (Thambili)**: Perfect for refreshing drinks\n• **Traditional Varieties**: Better disease resistance\n\n**Key Tips:**\n• Plant in well-drained soil\n• Regular watering during dry periods\n• Harvest when nuts are mature but not overripe\n• Consider intercropping with other crops\n\nNeed advice on coconut plantation management or harvesting techniques?';
  }
  
  // Tea farming
  if (lowerMessage.includes('tea') || lowerMessage.includes('ceylon')) {
    return '🍃 **Ceylon Tea** - World-famous quality! Here\'s what makes it special:\n\n**Growing Regions:**\n• **Hill Country**: Nuwara Eliya, Kandy, Dimbula\n• **Elevation**: Higher elevations produce premium quality\n\n**Optimal Conditions:**\n• **Temperature**: 18-24°C for best flavor\n• **Humidity**: 80-90% humidity preferred\n• **Sun Exposure**: Partial shade is ideal\n\n**Peak Seasons:**\n• **Best Quality**: March-May and September-November\n• **Harvest Timing**: Early morning plucking for premium quality\n\n**Pro Tips:**\n• Regular pruning maintains bush health\n• Proper drainage prevents root diseases\n• Quality over quantity - focus on premium grades\n\nInterested in specific tea cultivation techniques or processing methods?';
  }
  
  // Spices
  if (lowerMessage.includes('cinnamon') || lowerMessage.includes('cardamom') || lowerMessage.includes('pepper')) {
    return '🌿 **Sri Lankan Spices** - The Spice Island\'s treasures!\n\n**Ceylon Cinnamon:**\n• **Region**: Southwestern coast (Galle, Matara)\n• **Unique**: True cinnamon, not cassia\n• **Quality**: Sweet, delicate flavor\n\n**Cardamom:**\n• **Region**: Hill country (Kandy, Matale)\n• **Nickname**: "Queen of Spices"\n• **Growing**: Shade-loving, high humidity\n\n**Black Pepper:**\n• **Region**: Wet zone areas\n• **Nickname**: "King of Spices"\n• **Growing**: Climbing vine, needs support\n\n**General Tips:**\n• All spices grow year-round with proper care\n• Organic cultivation enhances flavor\n• Proper drying preserves essential oils\n• Consider intercropping for better yields\n\nWhich spice would you like to learn more about?';
  }
  
  // Soil health
  if (lowerMessage.includes('soil') && (lowerMessage.includes('health') || lowerMessage.includes('quality'))) {
    return '🌱 **Soil Health Management** - Foundation of successful farming!\n\n**Testing & Analysis:**\n• **pH Level**: 6.0-7.0 is ideal for most crops\n• **Nutrient Testing**: Check NPK levels regularly\n• **Organic Matter**: Aim for 3-5% organic content\n\n**Improvement Strategies:**\n• **Compost**: Add well-decomposed organic matter\n• **Drainage**: Ensure proper water flow\n• **Crop Rotation**: Prevent nutrient depletion\n• **Minimal Tillage**: Preserve soil structure\n\n**Sri Lankan Considerations:**\n• **Monsoon Patterns**: Plan for heavy rainfall\n• **Tropical Climate**: Faster organic matter decomposition\n• **Traditional Methods**: Incorporate local practices\n\n**Quick Tips:**\n• Test soil before each planting season\n• Use cover crops to improve soil structure\n• Avoid over-tilling to preserve beneficial microorganisms\n\nWould you like specific advice on soil testing or improvement techniques?';
  }
  
  // Irrigation
  if (lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
    return '💧 **Smart Irrigation Management** - Water is life for your crops!\n\n**Timing & Frequency:**\n• **Best Time**: Early morning (6-8 AM) to reduce evaporation\n• **Check Depth**: Test soil moisture 2-3 inches deep\n• **Weekly Needs**: Most crops need 1-2 inches per week\n\n**Efficient Methods:**\n• **Drip Irrigation**: Most water-efficient system\n• **Mulching**: Reduces evaporation by 50%\n• **Smart Scheduling**: Based on weather and soil conditions\n\n**Sri Lankan Seasons:**\n• **Maha Season** (Oct-Mar): Higher rainfall, less irrigation needed\n• **Yala Season** (Apr-Sep): Drier period, more irrigation required\n\n**Pro Tips:**\n• Monitor weather forecasts\n• Use soil moisture sensors if available\n• Group plants by water needs\n• Consider rainwater harvesting\n\nNeed advice on setting up an irrigation system or water management for specific crops?';
  }
  
  // Fertilizers
  if (lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrients')) {
    return '🌿 **Fertilizer & Nutrient Management** - Feed your soil, feed your crops!\n\n**Soil Testing First:**\n• **Essential**: Test soil to know exact nutrient needs\n• **NPK Analysis**: Nitrogen, Phosphorus, Potassium levels\n• **pH Testing**: Affects nutrient availability\n\n**NPK Guidelines:**\n• **Nitrogen (N)**: For leafy growth and green color\n• **Phosphorus (P)**: For root development and flowering\n• **Potassium (K)**: For disease resistance and fruit quality\n• **Balanced NPK**: 10-10-10 for general crops\n\n**Organic Options:**\n• **Compost**: Slow-release nutrients\n• **Manure**: Rich in organic matter\n• **Green Manure**: Cover crops for soil improvement\n• **Traditional Methods**: Local organic practices\n\n**Application Tips:**\n• **Timing**: Apply before planting and during growth stages\n• **Method**: Incorporate into soil, avoid direct contact with roots\n• **Quantity**: Follow soil test recommendations\n\nInterested in organic farming methods or specific fertilizer recommendations?';
  }
  
  // Pest control
  if (lowerMessage.includes('pest') || lowerMessage.includes('insects') || lowerMessage.includes('disease')) {
    return '🐛 **Pest & Disease Management** - Protect your crops naturally!\n\n**Prevention Strategies:**\n• **Regular Inspection**: Check plants weekly for early signs\n• **Healthy Plants**: Strong plants resist pests better\n• **Clean Environment**: Remove debris and weeds\n\n**Natural Control Methods:**\n• **Beneficial Insects**: Ladybugs, lacewings, praying mantis\n• **Companion Planting**: Marigolds deter many pests\n• **Neem Oil**: Organic pest control spray\n• **Garlic/Chili Sprays**: Natural repellents\n\n**Immediate Actions:**\n• **Remove Affected Parts**: Cut off diseased leaves/stems\n• **Isolate Problems**: Prevent spread to healthy plants\n• **Early Treatment**: Act quickly when problems appear\n\n**Traditional Sri Lankan Methods:**\n• **Local Knowledge**: Use traditional pest control practices\n• **Natural Repellents**: Local plant-based solutions\n• **Cultural Practices**: Crop rotation and timing\n\n**Pro Tips:**\n• Identify pests correctly before treatment\n• Use multiple control methods together\n• Monitor effectiveness and adjust approach\n\nNeed help identifying specific pests or diseases in your crops?';
  }
  
  // Temperature/climate
  if (lowerMessage.includes('temperature') || lowerMessage.includes('climate') || lowerMessage.includes('weather')) {
    return '🌡️ **Temperature & Climate Management** - Work with nature, not against it!\n\n**Optimal Temperatures:**\n• **Most Vegetables**: 18-24°C for best growth\n• **Tropical Crops**: 24-30°C (coconut, banana)\n• **Cool Season Crops**: 15-20°C (lettuce, cabbage)\n\n**Protection Methods:**\n• **Row Covers**: Protect from extreme temperatures\n• **Shade Cloth**: Reduce heat stress in summer\n• **Mulching**: Regulate soil temperature\n• **Greenhouses**: Control environment completely\n\n**Sri Lankan Climate:**\n• **Tropical**: High humidity, consistent warmth\n• **Maha Season**: Cooler, more comfortable for many crops\n• **Yala Season**: Warmer, need heat-tolerant varieties\n• **Monsoon**: Plan for heavy rainfall periods\n\n**Seasonal Planning:**\n• **Planting Calendar**: Time crops for optimal weather\n• **Variety Selection**: Choose climate-adapted varieties\n• **Microclimates**: Use different areas for different crops\n\n**Pro Tips:**\n• Monitor soil temperature for planting timing\n• Use weather forecasts for planning\n• Create microclimates with strategic planting\n\nNeed advice on seasonal planting or climate-adapted crop selection?';
  }
  
  // General Sri Lankan agriculture
  if (lowerMessage.includes('sri lanka') || lowerMessage.includes('local') || lowerMessage.includes('traditional')) {
    return '🇱🇰 **Sri Lankan Agriculture** - Rich traditions meet modern innovation!\n\n**Traditional Crops:**\n• **Rice**: Samba, Nadu varieties\n• **Coconut**: "Tree of Life" - multiple uses\n• **Tea**: World-famous Ceylon tea\n• **Spices**: Cinnamon, cardamom, pepper\n\n**Seasonal Patterns:**\n• **Maha Season** (Oct-Mar): Main growing season\n• **Yala Season** (Apr-Sep): Secondary season\n• **Monsoon Planning**: Work with rainfall patterns\n\n**Regional Variations:**\n• **Hill Country**: Tea, vegetables, temperate crops\n• **Low Country**: Rice, coconut, tropical fruits\n• **Dry Zone**: Drought-resistant crops, irrigation\n\n**Traditional Practices:**\n• **Organic Methods**: Natural fertilizers, pest control\n• **Local Varieties**: Climate-adapted seeds\n• **Cultural Knowledge**: Generations of farming wisdom\n• **Sustainable Methods**: Working with nature\n\n**Modern Integration:**\n• **Smart Technology**: IoT sensors, data-driven decisions\n• **Improved Varieties**: Higher yields, disease resistance\n• **Efficient Methods**: Water conservation, precision farming\n\n**Pro Tips:**\n• Combine traditional wisdom with modern technology\n• Use local varieties for better adaptation\n• Respect seasonal patterns and climate\n• Learn from experienced local farmers\n\nWhat aspect of Sri Lankan agriculture interests you most?';
  }
  
  // Thank you responses
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return 'You\'re very welcome! 😊 I\'m always here to help with your farming questions. Whether it\'s about crop management, soil health, irrigation, or any other agricultural topic, feel free to ask anytime. Happy farming! 🌱';
  }
  
  // Goodbye responses
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
    return 'Goodbye! 👋 It was great helping you with your farming questions today. Remember, I\'m always here whenever you need agricultural advice. Wishing you successful harvests and happy farming! 🌾✨';
  }
  
  // General questions and responses
  if (lowerMessage.includes('what') && (lowerMessage.includes('weather') || lowerMessage.includes('climate'))) {
    return '🌤️ **Weather & Climate for Farming**:\n\n**Sri Lankan Climate:**\n• **Tropical**: High humidity, consistent warmth\n• **Maha Season** (Oct-Mar): Cooler, more comfortable for many crops\n• **Yala Season** (Apr-Sep): Warmer, need heat-tolerant varieties\n• **Monsoon**: Plan for heavy rainfall periods\n\n**Weather Tips:**\n• Monitor forecasts for planting timing\n• Use row covers for protection\n• Plan irrigation around rainfall patterns\n• Consider microclimates in your area\n\nNeed specific weather advice for your crops?';
  }
  
  if (lowerMessage.includes('when') && lowerMessage.includes('plant')) {
    return '🌱 **Planting Timing Guide**:\n\n**General Guidelines:**\n• **Maha Season** (Oct-Mar): Best for most crops\n• **Yala Season** (Apr-Sep): Shorter season, choose quick-maturing varieties\n• **Soil Temperature**: 15-20°C for most vegetables\n• **Weather**: Plant after heavy rains, avoid extreme heat\n\n**Specific Crops:**\n• **Rice**: Maha season for Samba, Yala for Nadu\n• **Vegetables**: Year-round with proper care\n• **Spices**: Can plant year-round\n• **Tea**: Best in cooler months\n\nWhat specific crop are you planning to plant?';
  }
  
  if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('trouble')) {
    return '🔧 **Farming Problem Solver**:\n\nI can help you diagnose and solve farming issues! Common problems include:\n\n**Plant Issues:**\n• Yellowing leaves → Nutrient deficiency\n• Wilting → Water or root problems\n• Spots on leaves → Disease or pest damage\n• Poor growth → Soil or environmental issues\n\n**Quick Solutions:**\n• Check soil moisture and drainage\n• Test soil pH and nutrients\n• Inspect for pests and diseases\n• Review watering schedule\n\n**Tell me more details:**\n• What crop is affected?\n• What symptoms do you see?\n• When did the problem start?\n• Any recent changes in care?\n\nI\'ll help you find the solution! 🌱';
  }
  
  if (lowerMessage.includes('best') && (lowerMessage.includes('crop') || lowerMessage.includes('plant'))) {
    return '🌾 **Best Crops for Sri Lanka**:\n\n**Traditional Favorites:**\n• **Rice**: Samba & Nadu varieties\n• **Coconut**: "Tree of Life" - multiple uses\n• **Tea**: World-famous Ceylon tea\n• **Spices**: Cinnamon, cardamom, pepper\n\n**High-Value Crops:**\n• **Vegetables**: Year-round production\n• **Fruits**: Mango, papaya, banana\n• **Herbs**: Gotukola, kankun\n• **Flowers**: For export markets\n\n**Considerations:**\n• **Climate Zone**: Hill country vs low country\n• **Season**: Maha vs Yala season\n• **Market Demand**: Local vs export\n• **Your Experience**: Start with familiar crops\n\nWhat\'s your farming experience level and location?';
  }
  
  if (lowerMessage.includes('money') || lowerMessage.includes('profit') || lowerMessage.includes('income')) {
    return '💰 **Profitable Farming in Sri Lanka**:\n\n**High-Profit Crops:**\n• **Spices**: Cinnamon, cardamom (export value)\n• **Tea**: Premium grades for export\n• **Vegetables**: Year-round income\n• **Flowers**: High-value export market\n\n**Income Strategies:**\n• **Diversification**: Multiple crops reduce risk\n• **Value Addition**: Process raw materials\n• **Direct Sales**: Farmers markets, online\n• **Export Focus**: Higher prices for quality\n\n**Cost Management:**\n• **Organic Methods**: Reduce input costs\n• **Efficient Irrigation**: Save water and money\n• **Group Farming**: Share equipment costs\n• **Government Schemes**: Access subsidies\n\nWhat type of farming are you interested in?';
  }
  
  // Default response with more personality
  return '🌱 Hello! I\'m your SmartAgro AI assistant, specialized in Sri Lankan agriculture. I can help you with:\n\n• **Crop Management**: Rice, coconut, tea, spices, vegetables\n• **Soil Health**: Testing, improvement, organic methods\n• **Irrigation**: Water management, efficiency tips\n• **Fertilizers**: NPK guidance, organic options\n• **Pest Control**: Natural methods, disease prevention\n• **Climate**: Temperature management, seasonal planning\n• **Traditional Practices**: Sri Lankan farming wisdom\n\nWhat specific farming topic would you like to explore? I\'m here to provide detailed, practical advice! 😊';
};

/**
 * POST /api/chat
 * Send a message to the AI chatbot
 */
router.post('/', async (req, res) => {
  try {
    const { message, chatId, sensorData, cropData } = req.body;
    const userId = req.uid || 'test-user'; // Fallback for testing
    
    console.log('Chat request received:', { message: message?.substring(0, 50), userId, hasAuth: !!req.uid });
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    console.log('Chat request:', { userId, message: message.substring(0, 50) + '...', chatId });

    // Get system prompt with context
    const systemPrompt = getSystemPrompt(sensorData, cropData);
    
    // Get AI response using the new AI service
    let aiResponse;
    
    try {
      console.log('🤖 Using AI service for response...');
      aiResponse = await getAIResponse(message, systemPrompt);
      console.log('✅ AI service successful - got real AI response');
    } catch (aiError) {
      console.error('❌ AI service failed:', aiError.message);
      console.error('❌ AI service error details:', aiError);
      // Fall through to canned response
    }
    
    // If AI service failed, use canned response
    if (!aiResponse) {
      console.log('🤖 Using canned response...');
      aiResponse = getCannedResponse(message);
    }
    
    // If no chatId provided, create a new chat session
    let currentChatId = chatId;
    if (!currentChatId) {
      const chatTitle = message.length > 50 ? message.substring(0, 47) + '...' : message;
      const newChatRef = doc(collection(db, `users/${userId}/chats`));
      currentChatId = newChatRef.id;
      
      await setDoc(newChatRef, {
        title: chatTitle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messageCount: 2, // user + bot message
        lastMessage: aiResponse.substring(0, 100) + (aiResponse.length > 100 ? '...' : ''),
        messages: [
          {
            id: Date.now(),
            sender: 'user',
            text: message,
            timestamp: serverTimestamp()
          },
          {
            id: Date.now() + 1,
            sender: 'bot', 
            text: aiResponse,
            timestamp: serverTimestamp()
          }
        ]
      });
    } else {
      // Update existing chat
      const chatRef = doc(db, `users/${userId}/chats/${currentChatId}`);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const messages = chatData.messages || [];
        
        messages.push(
          {
            id: Date.now(),
            sender: 'user',
            text: message,
            timestamp: serverTimestamp()
          },
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: aiResponse,
            timestamp: serverTimestamp()
          }
        );
        
        await updateDoc(chatRef, {
          messages: messages,
          updatedAt: serverTimestamp(),
          messageCount: messages.length,
          lastMessage: aiResponse.substring(0, 100) + (aiResponse.length > 100 ? '...' : '')
        });
      }
    }

    res.json({ 
      success: true, 
      reply: aiResponse,
      chatId: currentChatId
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process chat message' 
    });
  }
});

/**
 * GET /api/chat/history
 * Get user's chat history/sessions
 */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    
    const chatsRef = collection(db, `users/${userId}/chats`);
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const chats = [];
    snapshot.forEach(doc => {
      const chatData = doc.data();
      chats.push({
        chatId: doc.id,
        title: chatData.title || 'Untitled Chat',
        updatedAt: chatData.updatedAt,
        messageCount: chatData.messageCount || 0,
        lastMessage: chatData.lastMessage || 'No messages yet'
      });
    });
    
    res.json({ 
      success: true, 
      chats 
    });
    
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chat history' 
    });
  }
});

/**
 * GET /api/chat/faqs
 * Get FAQ questions from Firestore
 */
router.get('/faqs', verifyToken, async (req, res) => {
  try {
    const faqsRef = collection(db, 'faqs');
    const snapshot = await getDocs(faqsRef);
    const faqs = [];
    
    snapshot.forEach(doc => {
      faqs.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });
    
    // If no FAQs in database, return default ones
    if (faqs.length === 0) {
      const defaultFaqs = [
        { id: '1', question: 'How can I improve my soil health?', category: 'Soil', answer: 'Test soil pH, add organic matter, and ensure proper drainage.' },
        { id: '2', question: 'What fertilizer should I use?', category: 'Fertilizer', answer: 'Use balanced NPK fertilizers based on soil test results.' },
        { id: '3', question: 'How often should I water my crops?', category: 'Irrigation', answer: 'Water when soil moisture drops below 40% for most crops.' },
        { id: '4', question: 'How to prevent pests naturally?', category: 'Pest Control', answer: 'Use companion planting, beneficial insects, and organic sprays.' },
        { id: '5', question: 'What temperature is best for tomatoes?', category: 'Temperature', answer: 'Tomatoes prefer temperatures between 18-24°C for optimal growth.' },
        { id: '6', question: 'How to increase crop yield?', category: 'General', answer: 'Optimize irrigation, fertilization, spacing, and pest management.' }
      ];
      return res.json({ success: true, faqs: defaultFaqs });
    }
    
    res.json({ 
      success: true, 
      faqs 
    });
    
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch FAQs' 
    });
  }
});

/**
 * GET /api/chat/:chatId
 * Get a specific chat conversation
 */
router.get('/:chatId', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const { chatId } = req.params;
    
    const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      return res.status(404).json({ 
        success: false, 
        error: 'Chat not found' 
      });
    }
    
    const chatData = chatDoc.data();
    res.json({ 
      success: true, 
      chat: {
        chatId,
        ...chatData,
        messages: chatData.messages || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chat' 
    });
  }
});

/**
 * DELETE /api/chat/:chatId
 * Delete a chat conversation
 */
router.delete('/:chatId', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const { chatId } = req.params;
    
    const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
    await deleteDoc(chatRef);
    
    res.json({ 
      success: true, 
      message: 'Chat deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete chat' 
    });
  }
});

/**
 * POST /api/chat/test
 * Test endpoint without authentication
 */
router.post('/test', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    console.log('Test chat request:', message);

    // Try to use AI service first
    let aiResponse;
    try {
      console.log('🤖 Using AI service for test endpoint...');
      const systemPrompt = `You are AgroBot, a smart AI assistant specialized in agriculture, particularly Sri Lankan agriculture. Provide helpful, detailed, and practical advice about farming, crops, soil, irrigation, and agricultural practices. Be conversational and friendly.`;
      aiResponse = await getAIResponse(message, systemPrompt);
      console.log('✅ AI service successful for test endpoint');
    } catch (aiError) {
      console.error('❌ AI service failed for test endpoint:', aiError.message);
      console.log('🤖 AI service not available, using canned response...');
      aiResponse = getCannedResponse(message);
    }

    // Generate a test chat ID for testing purposes
    const testChatId = `test-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({ 
      success: true, 
      reply: aiResponse,
      source: aiResponse ? 'ai-service' : 'canned-response',
      chatId: testChatId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process test message' 
    });
  }
});

/**
 * GET /api/chat/history
 * Get user's chat history
 */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const chatsRef = collection(db, `users/${userId}/chats`);
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));
    const chatsSnapshot = await getDocs(q);
    
    const chats = [];
    chatsSnapshot.forEach((doc) => {
      chats.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      chats: chats
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history'
    });
  }
});

/**
 * GET /api/chat/messages/:chatId
 * Get messages for a specific chat
 */
router.get('/messages/:chatId', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const chatId = req.params.chatId;
    
    const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const messagesSnapshot = await getDocs(q);
    
    const messages = [];
    messagesSnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages'
    });
  }
});

/**
 * DELETE /api/chat/:chatId
 * Delete a chat
 */
router.delete('/:chatId', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const chatId = req.params.chatId;
    
    // Delete all messages in the chat
    const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
    const messagesSnapshot = await getDocs(messagesRef);
    
    const deletePromises = [];
    messagesSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    
    // Delete the chat document
    await deleteDoc(doc(db, `users/${userId}/chats/${chatId}`));
    
    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete chat'
    });
  }
});

/**
 * PUT /api/chat/message/:messageId
 * Edit a message
 */
router.put('/message/:messageId', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const messageId = req.params.messageId;
    const { content, chatId } = req.body;
    
    if (!content || !chatId) {
      return res.status(400).json({
        success: false,
        error: 'Content and chatId are required'
      });
    }
    
    // Update the message
    const messageRef = doc(db, `users/${userId}/chats/${chatId}/messages/${messageId}`);
    await updateDoc(messageRef, {
      content: content,
      edited: true,
      editedAt: serverTimestamp()
    });
    
    res.json({
      success: true,
      message: 'Message updated successfully'
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update message'
    });
  }
});

export default router;