const express = require('express');
const { db, admin } = require('../config/firebase');
const { collection, doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, query, where, orderBy, getDocs, deleteDoc } = require('firebase/firestore');
const router = express.Router();

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
};

// Enhanced AI system prompt for agriculture + general Q&A
const getSystemPrompt = (sensorData, cropData) => {
  let context = `You are AgroBot, a smart AI assistant specialized in agriculture but also capable of general Q&A. 

For agriculture-related questions (farming, crops, soil, irrigation, fertilizers, pests, weather, IoT sensors): Provide detailed, practical advice with actionable tips.

For general questions: Provide concise, helpful answers.

Be friendly, informative, and always helpful. Keep responses clear and well-structured.`;

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

// Function to call Gemini API
const callGeminiAPI = async (message, systemPrompt) => {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not found in environment variables');
    return 'I apologize, but the AI service is not properly configured. Please check the server configuration.';
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nUser question: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.8,
          topK: 10
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error('Unexpected Gemini response format:', data);
      return 'I apologize, but I received an unexpected response format. Please try again.';
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again later.';
  }
};

// Function to get canned responses for common questions
const getCannedResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('soil') && lowerMessage.includes('health')) {
    return 'To improve soil health: 1) Test soil pH (ideal 6.0-7.0 for most crops), 2) Add organic matter like compost, 3) Ensure proper drainage, 4) Rotate crops, 5) Avoid over-tilling.';
  }
  
  if (lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
    return 'Watering tips: 1) Water early morning to reduce evaporation, 2) Check soil moisture 2-3 inches deep, 3) Most crops need 1-2 inches per week, 4) Use drip irrigation for efficiency, 5) Mulch around plants to retain moisture.';
  }
  
  if (lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrients')) {
    return 'Fertilizer guidance: 1) Test soil first to know nutrient needs, 2) Use balanced NPK (10-10-10) for general crops, 3) Apply nitrogen for leafy growth, 4) Phosphorus for root development, 5) Potassium for disease resistance.';
  }
  
  if (lowerMessage.includes('pest') || lowerMessage.includes('insects')) {
    return 'Pest management: 1) Inspect plants regularly, 2) Use beneficial insects like ladybugs, 3) Companion planting (marigolds deter pests), 4) Neem oil for organic control, 5) Remove affected plant parts immediately.';
  }
  
  if (lowerMessage.includes('temperature') || lowerMessage.includes('climate')) {
    return 'Temperature management: 1) Most vegetables prefer 65-75°F (18-24°C), 2) Use row covers for protection, 3) Provide shade in extreme heat, 4) Monitor soil temperature for planting, 5) Consider greenhouse for year-round growing.';
  }
  
  return 'I can help you with questions about farming, crops, soil health, irrigation, fertilizers, pest control, and agricultural sensors. What specific farming topic would you like to know about?';
};

/**
 * POST /api/chat
 * Send a message to the AI chatbot
 */
router.post('/', async (req, res) => {
  try {
    const { message, chatId, sensorData, cropData } = req.body;
    const userId = req.uid || 'test-user'; // Fallback for testing
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    console.log('Chat request:', { userId, message: message.substring(0, 50) + '...', chatId });

    // Get system prompt with context
    const systemPrompt = getSystemPrompt(sensorData, cropData);
    
    // Get AI response
    let aiResponse;
    try {
      aiResponse = await callGeminiAPI(message, systemPrompt);
    } catch (error) {
      console.error('AI API failed, using canned response:', error);
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

module.exports = router;