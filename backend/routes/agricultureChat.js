/**
 * Enhanced Agriculture Chatbot Routes
 * Handles agriculture-only queries with structured responses and chat history
 */

import express from 'express';
import fetch from 'node-fetch';
import { verifyToken } from '../middleware/auth.js';
import { filterMessage, validateMessage } from '../services/agricultureFilter.js';
import { formatStructuredResponse } from '../services/responseFormatter.js';
import { getAIResponse } from '../services/aiService.js';
import { 
  createChatSession, 
  addMessageToChat, 
  getUserChatHistory, 
  getChatMessages,
  editMessage,
  deleteChat,
  deleteMessage,
  updateChatTitle
} from '../services/chatHistory.js';

const router = express.Router();

// AI service configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'REDACTED_DEEPSEEK_API_KEY';
// Gemini removed - using DeepSeek only

// Check if any AI service is available
if (!DEEPSEEK_API_KEY) {
  console.warn('⚠️ No AI service API keys found. Chatbot will use fallback responses.');
}

/**
 * Generate dynamic fallback response based on user message
 */
const generateFallbackResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `Hello! 👋 I'm your SmartAgro farming assistant! I can help you with farming questions about crops, soil, irrigation, pests, and more. What would you like to know?`;
  }
  
  // Rice farming
  if (lowerMessage.includes('rice') || lowerMessage.includes('samba') || lowerMessage.includes('nadu')) {
    return `🌾 **Rice Farming in Sri Lanka**

**Popular Varieties:**
• **Samba** - Traditional long grain, aromatic
• **Nadu** - Short grain, high yield
• **Basmati** - Premium quality

**Growing Tips:**
• Plant during **Maha season** (October-March)
• Use **flood irrigation** for best results
• Apply **NPK fertilizer** at 2-3 week intervals
• Control **brown plant hopper** with proper water management

**Harvest Time:** 3-4 months after planting
**Yield:** 3-5 tons per hectare

Need more specific advice about rice farming?`;
  }
  
  // Coconut farming
  if (lowerMessage.includes('coconut') || lowerMessage.includes('coconut tree')) {
    return `🥥 **Coconut Farming Guide**

**Varieties:**
• **King Coconut** - For drinking
• **Tall varieties** - For oil production
• **Dwarf varieties** - For home gardens

**Planting:**
• Space: 8m x 8m apart
• Best time: **Maha season** (October-March)
• Soil: Well-drained, sandy loam

**Care:**
• Water regularly for first 2 years
• Apply **organic manure** annually
• Control **coconut mite** with neem oil
• Prune old fronds

**Harvest:** 5-7 years for first yield
**Lifespan:** 60-80 years

Any specific coconut farming questions?`;
  }
  
  // Tea farming
  if (lowerMessage.includes('tea') || lowerMessage.includes('ceylon tea')) {
    return `🍃 **Ceylon Tea Cultivation**

**Growing Conditions:**
• **Altitude:** 600m+ above sea level
• **Climate:** Cool, humid
• **Soil:** Well-drained, acidic (pH 4.5-5.5)

**Planting:**
• Use **clonal cuttings** for best quality
• Space: 1.2m x 0.6m
• Best time: **Maha season**

**Care:**
• **Pruning:** Every 3-4 years
• **Fertilizer:** NPK + trace elements
• **Pest control:** Tea mosquito bug, red spider mite

**Harvest:** 3-4 years for first plucking
**Plucking:** Every 7-10 days

Need more tea farming details?`;
  }
  
  // Soil health
  if (lowerMessage.includes('soil') || lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrient')) {
    return `🌱 **Soil Health & Fertilization**

**Soil Testing:**
• Check **pH levels** (6.0-7.0 ideal)
• Test for **NPK** levels
• Check **organic matter** content

**Fertilizer Guide:**
• **Nitrogen (N):** For leaf growth
• **Phosphorus (P):** For root development
• **Potassium (K):** For fruit quality

**Organic Options:**
• **Compost:** Improves soil structure
• **Manure:** Adds nutrients
• **Green manure:** Legumes for nitrogen

**Application:**
• **Timing:** Before planting, during growth
• **Method:** Broadcast or band placement
• **Amount:** Based on soil test results

Want specific soil advice for your crops?`;
  }
  
  // Irrigation
  if (lowerMessage.includes('water') || lowerMessage.includes('irrigation') || lowerMessage.includes('drought')) {
    return `💧 **Water Management & Irrigation**

**Irrigation Methods:**
• **Flood irrigation:** For rice, traditional
• **Drip irrigation:** Water-efficient
• **Sprinkler:** For vegetables
• **Furrow:** For row crops

**Water Conservation:**
• **Mulching:** Reduces evaporation
• **Timing:** Early morning/evening
• **Frequency:** Based on soil type
• **Rainwater harvesting:** Store monsoon water

**Drought Management:**
• Choose **drought-resistant** varieties
• Use **mulch** to retain moisture
• **Reduce planting** during dry periods
• **Water storage** for critical periods

Need irrigation advice for specific crops?`;
  }
  
  // Pest control
  if (lowerMessage.includes('pest') || lowerMessage.includes('disease') || lowerMessage.includes('insect')) {
    return `🐛 **Pest & Disease Control**

**Common Pests:**
• **Aphids:** Use neem oil spray
• **Caterpillars:** Hand picking, Bt spray
• **Whitefly:** Yellow sticky traps
• **Mites:** Sulfur spray

**Disease Prevention:**
• **Crop rotation:** Break pest cycles
• **Healthy soil:** Strong plant immunity
• **Proper spacing:** Good air circulation
• **Clean tools:** Prevent spread

**Organic Control:**
• **Neem oil:** Natural pesticide
• **Garlic spray:** Repellent
• **Companion planting:** Natural barriers
• **Beneficial insects:** Ladybugs, lacewings

**Chemical Control:**
• Use **registered pesticides** only
• Follow **safety guidelines**
• **Rotate chemicals** to prevent resistance

Having specific pest problems?`;
  }
  
  // Chilli/Pepper farming
  if (lowerMessage.includes('chilli') || lowerMessage.includes('chili') || lowerMessage.includes('pepper') || lowerMessage.includes('plant chilli') || lowerMessage.includes('grow chilli')) {
    return `🌶️ **Chilli Farming Guide**

**Popular Varieties:**
• **Green Chilli** - For daily cooking
• **Red Chilli** - For drying and powder
• **Capsicum** - Sweet peppers
• **Bird's Eye** - Very hot variety

**Planting Process:**
• **Seedling:** Start in nursery (3-4 weeks)
• **Transplant:** When 4-6 inches tall
• **Spacing:** 45cm x 30cm apart
• **Best time:** Maha season (Oct-Mar)

**Growing Conditions:**
• **Soil:** Well-drained, fertile
• **pH:** 6.0-7.0
• **Sunlight:** Full sun (6-8 hours)
• **Temperature:** 20-30°C ideal

**Care & Maintenance:**
• **Watering:** Regular, avoid waterlogging
• **Fertilizer:** NPK 15:15:15 every 2 weeks
• **Support:** Stakes for tall varieties
• **Pruning:** Remove lower leaves

**Harvest:** 2-3 months after transplant
**Yield:** 8-12 tons per hectare

Need specific chilli farming advice?`;
  }
  
  // Vegetable farming
  if (lowerMessage.includes('vegetable') || lowerMessage.includes('tomato') || lowerMessage.includes('onion') || lowerMessage.includes('carrot') || lowerMessage.includes('cabbage')) {
    return `🥬 **Vegetable Farming Guide**

**Popular Vegetables:**
• **Tomato** - High value crop
• **Onion** - Essential kitchen crop
• **Carrot** - Root vegetable
• **Cabbage** - Leafy vegetable
• **Beans** - Legume family

**Growing Tips:**
• **Soil preparation:** Well-drained, organic matter
• **Seedling:** Use quality seeds
• **Spacing:** Follow variety requirements
• **Watering:** Consistent moisture

**Seasonal Planning:**
• **Maha season:** Oct-Mar (cool season crops)
• **Yala season:** Apr-Sep (warm season crops)
• **Succession planting:** Continuous harvest

**Common Issues:**
• **Pests:** Aphids, caterpillars
• **Diseases:** Fungal infections
• **Nutrient deficiency:** Yellow leaves

Need advice for specific vegetables?`;
  }
  
  // Fruit farming
  if (lowerMessage.includes('fruit') || lowerMessage.includes('mango') || lowerMessage.includes('papaya') || lowerMessage.includes('banana') || lowerMessage.includes('orange')) {
    return `🍊 **Fruit Farming Guide**

**Popular Fruits:**
• **Mango** - King of fruits
• **Papaya** - Quick growing
• **Banana** - High nutrition
• **Orange** - Citrus family
• **Guava** - Hardy fruit

**Planting:**
• **Grafting:** For better varieties
• **Spacing:** Based on tree size
• **Soil:** Well-drained, fertile
• **Watering:** Regular, deep watering

**Care:**
• **Pruning:** Shape and health
• **Fertilizer:** Organic + chemical
• **Pest control:** Integrated approach
• **Harvest timing:** Peak ripeness

**Harvest Period:**
• **Mango:** Mar-Jun
• **Papaya:** Year-round
• **Banana:** 9-12 months
• **Orange:** Dec-Mar

Need specific fruit farming advice?`;
  }
  
  // General agriculture response
  return `🌱 I'm your SmartAgro farming assistant! I can help you with:

**📝 Farming Topics:**
• Crop management and cultivation
• Soil health and improvement  
• Irrigation and water management
• Pest and disease control
• Fertilizer and nutrient management
• Seasonal planning and timing
• Traditional Sri Lankan practices

**💡 What would you like to know?**

Please ask me specific questions about farming, and I'll provide detailed, practical advice! 🌾`;
};

/**
 * Enhanced system prompt for agriculture-only responses
 */
const getAgricultureSystemPrompt = () => {
  return `You are AgroBot, a specialized AI assistant for agriculture and farming, particularly Sri Lankan agriculture.

CRITICAL INSTRUCTIONS:
- ONLY answer agriculture, farming, crop management, soil health, irrigation, pest control, and related questions
- For non-agriculture queries, politely redirect to agriculture topics
- Always provide structured, practical advice with clear sections
- Use relevant emojis to make responses engaging and readable
- Focus on actionable steps and specific recommendations
- Consider Sri Lankan climate, seasons (Maha/Yala), and local practices

RESPONSE FORMAT:
- Use clear headings (## for main topics, ### for subtopics)
- Include numbered steps for processes
- Add bullet points for lists and tips
- Use emojis strategically (🌱 for planting, 💧 for watering, etc.)
- Keep responses concise but comprehensive
- Include warnings and important notes where relevant

SRI LANKAN AGRICULTURE FOCUS:
- Traditional crops: Rice (Samba/Nadu), Coconut, Tea, Spices
- Seasonal patterns: Maha (Oct-Mar) and Yala (Apr-Sep) seasons
- Local varieties and traditional practices
- Climate considerations and monsoon patterns
- Regional differences (Hill Country, Low Country, Dry Zone)

Be helpful, accurate, and always focused on practical farming advice.`;
};


/**
 * POST /api/agriculture-chat
 * Send a message to the agriculture chatbot
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { message, chatId, editMessageId } = req.body;
    const userId = req.uid;
    
    console.log('🤖 Agriculture chat request:', { 
      userId, 
      message: message?.substring(0, 50) + '...', 
      chatId,
      hasEditMessage: !!editMessageId 
    });
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Validate message input
    const validation = validateMessage(message);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message',
        details: validation.errors
      });
    }
    
    const trimmedMessage = validation.trimmedMessage;
    
    // Filter for agriculture-only content
    const filterResult = filterMessage(trimmedMessage);
    
    if (!filterResult.isAgriculture) {
      return res.json({
        success: true,
        reply: filterResult.message,
        chatId: chatId,
        isAgriculture: false,
        originalMessage: filterResult.originalMessage
      });
    }
    
    // Handle message editing
    if (editMessageId && chatId) {
      try {
        await editMessage(userId, chatId, editMessageId, trimmedMessage);
        console.log('Message edited successfully');
      } catch (editError) {
        console.error('Error editing message:', editError);
        // Continue with normal flow even if edit fails
      }
    }
    
    // Get AI response
    let aiResponse;
    try {
      const systemPrompt = getAgricultureSystemPrompt();
      const rawResponse = await getAIResponse(trimmedMessage, systemPrompt);
      
      // Format the response with structure and emojis
      aiResponse = formatStructuredResponse(rawResponse);
      
      console.log('✅ AI service response formatted successfully');
    } catch (aiError) {
      console.error('❌ AI service failed:', aiError.message);
      
      // Fallback response for agriculture queries
      aiResponse = generateFallbackResponse(trimmedMessage);
    }
    
    // Handle chat history
    let currentChatId = chatId;
    
    if (!currentChatId) {
      // Create new chat session
      try {
        const chatTitle = trimmedMessage.length > 50 ? 
          trimmedMessage.substring(0, 47) + '...' : 
          trimmedMessage;
        
        currentChatId = await createChatSession(userId, chatTitle, trimmedMessage, aiResponse);
        console.log('✅ New chat session created:', currentChatId);
      } catch (error) {
        console.error('Error creating chat session:', error);
        console.log('⚠️  Chat session not saved (database permission issue)');
        // Continue without saving to database - this is OK for demo
      }
    } else {
      // Add messages to existing chat
      try {
        await addMessageToChat(userId, currentChatId, trimmedMessage, 'user');
        await addMessageToChat(userId, currentChatId, aiResponse, 'bot');
        console.log('✅ Messages added to existing chat:', currentChatId);
      } catch (error) {
        console.error('Error adding messages to chat:', error);
        console.log('⚠️  Messages not saved (database permission issue)');
        // Continue without saving to database - this is OK for demo
      }
    }
    
    res.json({
      success: true,
      reply: aiResponse,
      chatId: currentChatId,
      isAgriculture: true,
      edited: !!editMessageId
    });
    
  } catch (error) {
    console.error('Agriculture chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process agriculture chat message',
      details: error.message
    });
  }
});

/**
 * GET /api/agriculture-chat/history
 * Get user's chat history
 */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    console.log(`📚 Fetching chat history for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const chats = await getUserChatHistory(userId);
    console.log(`📚 Found ${chats.length} chats for user ${userId}`);
    
    res.json({
      success: true,
      chats: chats.map(chat => ({
        id: chat.id,
        title: chat.title || 'Untitled Chat',
        updatedAt: chat.updatedAt,
        messageCount: chat.messageCount || 0,
        lastMessage: chat.lastMessage || 'No messages yet'
      }))
    });
    
  } catch (error) {
    console.error('❌ Error fetching chat history:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Return empty chat history instead of 500 error
    res.json({
      success: true,
      chats: []
    });
  }
});

/**
 * GET /api/agriculture-chat/messages/:chatId
 * Get messages for a specific chat
 */
router.get('/messages/:chatId', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const { chatId } = req.params;
    
    const messages = await getChatMessages(userId, chatId);
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        createdAt: msg.createdAt,
        edited: msg.edited || false,
        editedAt: msg.editedAt
      }))
    });
    
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat messages'
    });
  }
});

/**
 * PUT /api/agriculture-chat/messages/:messageId
 * Edit a message
 */
router.put('/messages/:messageId', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const { messageId } = req.params;
    const { content, chatId } = req.body;
    
    if (!content || !chatId) {
      return res.status(400).json({
        success: false,
        error: 'Content and chatId are required'
      });
    }
    
    // Validate the new content
    const validation = validateMessage(content);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message content',
        details: validation.errors
      });
    }
    
    await editMessage(userId, chatId, messageId, validation.trimmedMessage);
    
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

/**
 * DELETE /api/agriculture-chat/:chatId
 * Delete a chat
 */
router.delete('/:chatId', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const { chatId } = req.params;
    
    await deleteChat(userId, chatId);
    
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
 * DELETE /api/agriculture-chat/messages/:messageId
 * Delete a specific message
 */
router.delete('/messages/:messageId', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const { messageId } = req.params;
    const { chatId } = req.query;
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'chatId is required'
      });
    }
    
    await deleteMessage(userId, chatId, messageId);
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

/**
 * PUT /api/agriculture-chat/:chatId/title
 * Update chat title
 */
router.put('/:chatId/title', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;
    const { chatId } = req.params;
    const { title } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    await updateChatTitle(userId, chatId, title.trim());
    
    res.json({
      success: true,
      message: 'Chat title updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating chat title:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update chat title'
    });
  }
});

/**
 * GET /api/agriculture-chat/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Agriculture Chatbot',
    status: 'healthy',
    features: [
      'Agriculture-only filtering',
      'Structured response formatting',
      'Chat history management',
      'Message editing',
      'Gemini AI integration'
    ],
    timestamp: new Date().toISOString()
  });
});

export default router;
