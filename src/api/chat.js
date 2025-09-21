// Backend API endpoint for AI chatbot functionality
// This is a simple Express.js route that can be integrated into your backend

const express = require('express');
const router = express.Router();

// TODO: Replace with your actual OpenAI API key for production
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Fallback responses based on keywords
const getFallbackResponse = (message, sensorData = null, cropData = null) => {
  const lowerMessage = message.toLowerCase();
  
  // Irrigation-related responses
  if (lowerMessage.includes('irrigation') || lowerMessage.includes('water') || lowerMessage.includes('moisture')) {
    if (sensorData && sensorData.soilMoisture < 30) {
      return "Your soil moisture is quite low at " + sensorData.soilMoisture.toFixed(1) + "%. I recommend increasing irrigation frequency or duration to maintain optimal soil moisture levels.";
    } else if (sensorData && sensorData.soilMoisture > 70) {
      return "Your soil moisture is high at " + sensorData.soilMoisture.toFixed(1) + "%. Consider reducing irrigation to prevent overwatering and root issues.";
    } else {
      return "For optimal irrigation, monitor your soil moisture levels regularly. Most crops prefer soil moisture between 40-70%. Adjust watering based on weather conditions and plant growth stage.";
    }
  }
  
  // Soil-related responses
  if (lowerMessage.includes('soil') || lowerMessage.includes('ph') || lowerMessage.includes('nutrient')) {
    return "Soil health is crucial for plant growth. Monitor pH levels (6.0-7.0 is ideal for most crops), ensure proper drainage, and consider soil testing for nutrient analysis. Organic matter and proper fertilization can improve soil structure.";
  }
  
  // Fertilizer-related responses
  if (lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrient') || lowerMessage.includes('npk')) {
    return "Fertilizer application should be based on soil tests and crop requirements. Use balanced NPK fertilizers (10-10-10 or 20-20-20) during active growth. Apply according to manufacturer instructions and avoid over-fertilization.";
  }
  
  // Temperature-related responses
  if (lowerMessage.includes('temperature') || lowerMessage.includes('temp') || lowerMessage.includes('heat')) {
    if (sensorData) {
      return `Current air temperature is ${sensorData.airTemp.toFixed(1)}°C and soil temperature is ${sensorData.soilTemp.toFixed(1)}°C. Most crops prefer air temperatures between 18-25°C and soil temperatures between 15-22°C.`;
    }
    return "Temperature control is important for plant health. Most crops prefer air temperatures between 18-25°C. Use ventilation, shading, or heating as needed to maintain optimal growing conditions.";
  }
  
  // Humidity-related responses
  if (lowerMessage.includes('humidity') || lowerMessage.includes('moisture')) {
    if (sensorData) {
      return `Current humidity is ${sensorData.airHumidity.toFixed(1)}%. Most crops prefer humidity levels between 50-80%. High humidity can lead to fungal issues, while low humidity can cause water stress.`;
    }
    return "Humidity levels affect plant transpiration and disease susceptibility. Most crops prefer 50-80% relative humidity. Use ventilation and proper spacing to manage humidity levels.";
  }
  
  // Crop-specific responses
  if (lowerMessage.includes('tomato')) {
    return "Tomatoes prefer warm temperatures (18-24°C), consistent moisture (40-70% soil moisture), and well-draining soil. Provide support for vines and ensure adequate spacing for air circulation.";
  }
  
  if (lowerMessage.includes('rice')) {
    return "Rice requires warm temperatures (20-35°C), high humidity (70-90%), and consistent water levels (60-90% soil moisture). It's a water-intensive crop that thrives in flooded conditions.";
  }
  
  if (lowerMessage.includes('corn')) {
    return "Corn grows best in warm temperatures (15-30°C) with moderate moisture (30-60% soil moisture). Ensure adequate spacing and provide support for tall varieties. Regular watering during flowering is crucial.";
  }
  
  // General farming advice
  if (lowerMessage.includes('pest') || lowerMessage.includes('disease')) {
    return "Prevent pests and diseases through proper plant spacing, good air circulation, and regular monitoring. Use integrated pest management (IPM) strategies and consider organic solutions when possible.";
  }
  
  if (lowerMessage.includes('harvest') || lowerMessage.includes('yield')) {
    return "Harvest timing is crucial for quality and yield. Monitor plant maturity indicators, weather conditions, and market demand. Proper post-harvest handling maintains quality and extends shelf life.";
  }
  
  // Default response
  return "I'm here to help with your farming questions! Ask me about irrigation, soil health, fertilization, temperature control, or specific crop care. I can also analyze your current sensor data to provide personalized advice.";
};

// Call OpenAI API (if available)
const callOpenAI = async (message, sensorData = null, cropData = null) => {
  if (!OPENAI_API_KEY) {
    return null; // No API key available
  }
  
  try {
    const systemPrompt = `You are an expert agricultural consultant helping farmers with smart farming. 
    Current sensor data: ${sensorData ? JSON.stringify(sensorData) : 'No sensor data available'}
    Active crop: ${cropData ? cropData.cropType : 'No active crop'}
    
    Provide helpful, practical advice for smart farming, irrigation, soil management, and crop care. Keep responses concise and actionable.`;
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null; // Fall back to canned responses
  }
};

// Main chat endpoint
router.post('/api/chat', async (req, res) => {
  try {
    const { userId, message, sensorData, cropData } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId and message' 
      });
    }
    
    // Try OpenAI first (if available)
    let reply = await callOpenAI(message, sensorData, cropData);
    
    // Fall back to canned responses if OpenAI fails or is unavailable
    if (!reply) {
      reply = getFallbackResponse(message, sensorData, cropData);
    }
    
    res.json({ 
      reply,
      timestamp: new Date().toISOString(),
      source: reply === getFallbackResponse(message, sensorData, cropData) ? 'fallback' : 'openai'
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      reply: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.'
    });
  }
});

// Quick help endpoint for irrigation suggestions
router.post('/api/chat/irrigation-suggestion', async (req, res) => {
  try {
    const { userId, sensorData, cropData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required field: userId' 
      });
    }
    
    let suggestion = '';
    
    if (cropData && sensorData) {
      const soilMoisture = sensorData.soilMoisture;
      const cropType = cropData.cropType;
      const targetMin = cropData.parameters?.soilMoistureMin || 40;
      const targetMax = cropData.parameters?.soilMoistureMax || 70;
      
      if (soilMoisture < targetMin) {
        suggestion = `Your ${cropType} crop needs more water. Current soil moisture is ${soilMoisture.toFixed(1)}%, but the target range is ${targetMin}-${targetMax}%. I recommend increasing irrigation frequency or duration. Consider watering for 15-20 minutes every 2-3 days.`;
      } else if (soilMoisture > targetMax) {
        suggestion = `Your ${cropType} crop may be overwatered. Current soil moisture is ${soilMoisture.toFixed(1)}%, which exceeds the target range of ${targetMin}-${targetMax}%. Reduce irrigation frequency and ensure proper drainage.`;
      } else {
        suggestion = `Your ${cropType} crop's soil moisture looks good at ${soilMoisture.toFixed(1)}% (target: ${targetMin}-${targetMax}%). Continue current irrigation schedule, but monitor for changes in weather or plant growth.`;
      }
    } else if (sensorData) {
      const soilMoisture = sensorData.soilMoisture;
      if (soilMoisture < 30) {
        suggestion = `Your soil moisture is low at ${soilMoisture.toFixed(1)}%. Consider increasing irrigation frequency. Most crops prefer soil moisture between 40-70%.`;
      } else if (soilMoisture > 70) {
        suggestion = `Your soil moisture is high at ${soilMoisture.toFixed(1)}%. Consider reducing irrigation to prevent overwatering.`;
      } else {
        suggestion = `Your soil moisture looks good at ${soilMoisture.toFixed(1)}%. Continue monitoring and adjust irrigation based on weather conditions.`;
      }
    } else {
      suggestion = 'I need sensor data to provide specific irrigation advice. Please ensure your sensors are connected and providing data.';
    }
    
    res.json({ 
      reply: suggestion,
      timestamp: new Date().toISOString(),
      source: 'irrigation-helper'
    });
    
  } catch (error) {
    console.error('Irrigation suggestion error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      reply: 'I apologize, but I cannot provide irrigation suggestions at this time. Please try again later.'
    });
  }
});

module.exports = router;

// Usage example:
// 1. Add this to your main Express app:
//    const chatRoutes = require('./src/api/chat');
//    app.use('/', chatRoutes);
//
// 2. Set environment variable for OpenAI (optional):
//    OPENAI_API_KEY=your_openai_api_key_here
//
// 3. The endpoints will be available at:
//    POST /api/chat
//    POST /api/chat/irrigation-suggestion
