import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// AI Service Configuration - DeepSeek only
// NOTE: API key must be provided via environment variable (DEEPSEEK_API_KEY)
// Never hard-code real keys in source control.
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek/deepseek-r1-0528-qwen3-8b:free';
const DEEPSEEK_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Determine which AI service to use (DeepSeek only)
const getPreferredAIService = () => {
  if (DEEPSEEK_API_KEY) {
    return 'deepseek';
  }
  return null;
};

// Test DeepSeek API availability
const testDeepSeekAPI = async () => {
  if (!DEEPSEEK_API_KEY) {
    console.log('⚠️  DeepSeek API key not provided');
    return false;
  }
  
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://smartagro.com',
        'X-Title': 'SmartAgro'
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'user',
            content: 'test'
          }
        ],
        max_tokens: 10
      })
    });
    
    if (response.ok) {
      console.log('✅ DeepSeek API is available and working');
      return true;
    } else {
      console.log('❌ DeepSeek API not available:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ DeepSeek API test failed:', error.message);
    return false;
  }
};

// Call DeepSeek API
const callDeepSeekAPI = async (message, systemPrompt) => {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not found in environment variables');
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://smartagro.com',
        'X-Title': 'SmartAgro'
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', response.status, errorData);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.error('Unexpected DeepSeek response format:', data);
      throw new Error('Unexpected response format from DeepSeek API');
    }
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
};

// Main AI service function
const getAIResponse = async (message, systemPrompt) => {
  const preferredService = getPreferredAIService();
  
  if (!preferredService) {
    throw new Error('No AI service configured. Please set DEEPSEEK_API_KEY');
  }

  // Use DeepSeek API
  try {
    console.log('🤖 Using DeepSeek API for AI response...');
    return await callDeepSeekAPI(message, systemPrompt);
  } catch (error) {
    console.error('❌ DeepSeek API failed:', error.message);
    throw error;
  }
};

// Test all available AI services
const testAllAIServices = async () => {
  console.log('🧪 Testing AI services...');
  
  const deepSeekAvailable = await testDeepSeekAPI();
  
  return {
    deepseek: deepSeekAvailable,
    preferred: getPreferredAIService()
  };
};

export {
  getAIResponse,
  callDeepSeekAPI,
  testDeepSeekAPI,
  testAllAIServices,
  getPreferredAIService
};