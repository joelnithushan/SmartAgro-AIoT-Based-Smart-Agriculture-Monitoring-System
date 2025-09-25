import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply token verification to all routes
router.use(verifyToken);

// POST /api/recommendations/analyze-now
router.post('/analyze-now', async (req, res) => {
  try {
    const { deviceId, userId } = req.body;
    
    if (!deviceId || !userId) {
      return res.status(400).json({ 
        error: 'Device ID and User ID are required' 
      });
    }

    console.log(`🔍 Running analysis for device: ${deviceId}, user: ${userId}`);

    // Get device data from Firestore
    const db = admin.firestore();
    const deviceDoc = await db.collection('devices').doc(deviceId).get();
    
    if (!deviceDoc.exists) {
      return res.status(404).json({ 
        error: 'Device not found' 
      });
    }

    const deviceData = deviceDoc.data();
    
    // Get user's crops
    const cropsSnapshot = await db.collection('crops')
      .where('userId', '==', userId)
      .get();
    
    const crops = cropsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (crops.length === 0) {
      return res.status(400).json({ 
        error: 'No crops found. Please add crops first.' 
      });
    }

    // Get latest sensor data from Realtime Database
    let sensorData = {};
    try {
      const rtdb = admin.database();
      const sensorRef = rtdb.ref(`devices/${deviceId}/sensors/latest`);
      const sensorSnapshot = await sensorRef.once('value');
      
      if (sensorSnapshot.exists()) {
        sensorData = sensorSnapshot.val();
      }
    } catch (rtdbError) {
      console.warn('Could not fetch sensor data from Realtime Database:', rtdbError.message);
    }

    // Get Gemini AI recommendations based on current field conditions
    const geminiRecommendations = await getGeminiRecommendations(sensorData, crops, deviceData);

    // Generate basic recommendations as fallback
    const basicRecommendations = generateRecommendations(sensorData, crops);

    // Combine Gemini and basic recommendations
    const allRecommendations = [
      ...geminiRecommendations,
      ...basicRecommendations
    ];

    // Save recommendations to Firestore
    const recommendationData = {
      userId,
      deviceId,
      sensorData,
      crops: crops.map(crop => ({ id: crop.id, name: crop.name })),
      recommendations: allRecommendations,
      geminiRecommendations,
      basicRecommendations,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    };

    await db.collection('recommendations').add(recommendationData);

    console.log(`✅ Analysis completed for user: ${userId}`);

    res.json({
      success: true,
      message: 'Analysis completed successfully',
      recommendations: allRecommendations,
      geminiRecommendations,
      sensorData,
      cropsCount: crops.length
    });

  } catch (error) {
    console.error('Error running analysis:', error);
    res.status(500).json({ 
      error: 'Failed to run analysis',
      details: error.message 
    });
  }
});

// GET /api/recommendations/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.uid !== userId) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    const db = admin.firestore();
    const recommendationsSnapshot = await db.collection('recommendations')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recommendations = recommendationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recommendations',
      details: error.message 
    });
  }
});

// Helper function to get Gemini AI recommendations
async function getGeminiRecommendations(sensorData, crops, deviceData) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not configured, skipping AI recommendations');
      return [];
    }

    // Prepare sensor data for Gemini
    const sensorInfo = {
      soilMoisture: sensorData.soilMoisture || 'Not available',
      temperature: sensorData.temperature || 'Not available',
      humidity: sensorData.humidity || 'Not available',
      lightLevel: sensorData.lightLevel || 'Not available',
      ph: sensorData.ph || 'Not available',
      timestamp: sensorData.timestamp || new Date().toISOString()
    };

    // Prepare crop information
    const cropInfo = crops.map(crop => ({
      name: crop.name || 'Unknown',
      type: crop.type || 'Unknown',
      plantingDate: crop.plantingDate || 'Unknown',
      growthStage: crop.growthStage || 'Unknown',
      variety: crop.variety || 'Unknown'
    }));

    // Prepare device/farm information
    const farmInfo = {
      location: deviceData.location || 'Unknown',
      farmName: deviceData.farmName || 'Unknown',
      farmSize: deviceData.farmSize || 'Unknown',
      soilType: deviceData.soilType || 'Unknown'
    };

    // Create the prompt for Gemini
    const prompt = `You are an expert agricultural consultant. Based on the current field conditions and crop data provided, give specific, actionable recommendations for optimal crop management.

**Current Field Conditions:**
- Soil Moisture: ${sensorInfo.soilMoisture}%
- Temperature: ${sensorInfo.temperature}°C
- Humidity: ${sensorInfo.humidity}%
- Light Level: ${sensorInfo.lightLevel}
- pH Level: ${sensorInfo.ph}
- Timestamp: ${sensorInfo.timestamp}

**Farm Information:**
- Location: ${farmInfo.location}
- Farm Name: ${farmInfo.farmName}
- Farm Size: ${farmInfo.farmSize} acres
- Soil Type: ${farmInfo.soilType}

**Crop Information:**
${cropInfo.map(crop => `
- Crop: ${crop.name} (${crop.type})
- Variety: ${crop.variety}
- Planting Date: ${crop.plantingDate}
- Growth Stage: ${crop.growthStage}
`).join('')}

**Please provide recommendations in the following JSON format:**
{
  "recommendations": [
    {
      "type": "irrigation|fertilization|pest_control|harvesting|general",
      "priority": "high|medium|low",
      "title": "Brief title",
      "message": "Detailed explanation",
      "action": "Specific action to take",
      "reasoning": "Why this recommendation is important",
      "timeline": "When to implement",
      "expectedOutcome": "What to expect"
    }
  ]
}

Focus on:
1. Immediate actions needed based on current sensor readings
2. Crop-specific care for the current growth stage
3. Seasonal considerations
4. Preventive measures for potential issues
5. Optimization opportunities

Provide 3-5 specific, actionable recommendations.`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const geminiResponse = data.candidates[0].content.parts[0].text;
    console.log('🤖 Gemini Response:', geminiResponse);

    // Try to parse JSON response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        
        // Format recommendations for our system
        const formattedRecommendations = parsedResponse.recommendations.map(rec => ({
          type: rec.type || 'general',
          priority: rec.priority || 'medium',
          title: rec.title || 'AI Recommendation',
          message: rec.message || 'AI-generated recommendation',
          action: rec.action || 'Follow AI guidance',
          reasoning: rec.reasoning || 'Based on current field conditions',
          timeline: rec.timeline || 'As soon as possible',
          expectedOutcome: rec.expectedOutcome || 'Improved crop health',
          source: 'gemini_ai',
          timestamp: new Date().toISOString()
        }));

        console.log(`✅ Generated ${formattedRecommendations.length} AI recommendations`);
        return formattedRecommendations;
      } else {
        throw new Error('No JSON found in Gemini response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      
      // Fallback: create a general recommendation from the text response
      return [{
        type: 'general',
        priority: 'medium',
        title: 'AI Analysis Complete',
        message: 'Gemini AI has analyzed your field conditions and provided insights.',
        action: 'Review the detailed analysis below',
        reasoning: 'Based on current sensor data and crop information',
        timeline: 'Immediate review recommended',
        expectedOutcome: 'Better understanding of field conditions',
        source: 'gemini_ai',
        rawResponse: geminiResponse,
        timestamp: new Date().toISOString()
      }];
    }

  } catch (error) {
    console.error('Error getting Gemini recommendations:', error);
    
    // Return a fallback recommendation
    return [{
      type: 'general',
      priority: 'low',
      title: 'AI Analysis Unavailable',
      message: 'Unable to get AI recommendations at this time.',
      action: 'Using basic recommendations instead',
      reasoning: 'Technical issue with AI service',
      timeline: 'Will retry on next analysis',
      expectedOutcome: 'Basic recommendations provided',
      source: 'fallback',
      error: error.message,
      timestamp: new Date().toISOString()
    }];
  }
}

// Helper function to generate recommendations
function generateRecommendations(sensorData, crops) {
  const recommendations = [];

  // Soil moisture recommendations
  if (sensorData.soilMoisture !== undefined) {
    if (sensorData.soilMoisture < 30) {
      recommendations.push({
        type: 'irrigation',
        priority: 'high',
        title: 'Low Soil Moisture',
        message: 'Soil moisture is low. Consider watering your crops.',
        action: 'Increase irrigation frequency or duration',
        value: sensorData.soilMoisture,
        threshold: 30
      });
    } else if (sensorData.soilMoisture > 80) {
      recommendations.push({
        type: 'irrigation',
        priority: 'medium',
        title: 'High Soil Moisture',
        message: 'Soil moisture is high. Check for overwatering.',
        action: 'Reduce irrigation frequency or improve drainage',
        value: sensorData.soilMoisture,
        threshold: 80
      });
    }
  }

  // Temperature recommendations
  if (sensorData.temperature !== undefined) {
    if (sensorData.temperature < 15) {
      recommendations.push({
        type: 'temperature',
        priority: 'high',
        title: 'Low Temperature',
        message: 'Temperature is below optimal range for most crops.',
        action: 'Consider using greenhouse or protective covers',
        value: sensorData.temperature,
        threshold: 15
      });
    } else if (sensorData.temperature > 35) {
      recommendations.push({
        type: 'temperature',
        priority: 'high',
        title: 'High Temperature',
        message: 'Temperature is above optimal range. Monitor for heat stress.',
        action: 'Provide shade or increase ventilation',
        value: sensorData.temperature,
        threshold: 35
      });
    }
  }

  // Humidity recommendations
  if (sensorData.humidity !== undefined) {
    if (sensorData.humidity < 40) {
      recommendations.push({
        type: 'humidity',
        priority: 'medium',
        title: 'Low Humidity',
        message: 'Low humidity may cause plant stress.',
        action: 'Consider misting or increasing humidity',
        value: sensorData.humidity,
        threshold: 40
      });
    } else if (sensorData.humidity > 80) {
      recommendations.push({
        type: 'humidity',
        priority: 'medium',
        title: 'High Humidity',
        message: 'High humidity may promote fungal diseases.',
        action: 'Improve ventilation and air circulation',
        value: sensorData.humidity,
        threshold: 80
      });
    }
  }

  // General crop recommendations
  if (crops.length > 0) {
    recommendations.push({
      type: 'general',
      priority: 'low',
      title: 'Crop Management',
      message: `You have ${crops.length} crop(s) registered. Monitor their growth stages.`,
      action: 'Review crop-specific care requirements',
      cropsCount: crops.length
    });
  }

  // Default recommendation if no specific issues found
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'general',
      priority: 'low',
      title: 'All Systems Normal',
      message: 'Your crops appear to be in good condition based on current sensor data.',
      action: 'Continue regular monitoring and maintenance',
      status: 'healthy'
    });
  }

  return recommendations;
}

export default router;