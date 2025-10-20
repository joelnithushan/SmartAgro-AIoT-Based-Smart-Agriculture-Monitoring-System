import express from 'express';
import { admin } from '../config/firebase.js';
import { getAIResponse } from '../services/aiService.js';

const router = express.Router();

// Helper function to verify user authentication
const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Analyze device data with Gemini AI
router.post('/analyze-device', verifyUser, async (req, res) => {
  try {
    const { deviceId, uid, aggregates } = req.body;
    
    // Verify user owns the device or has permission
    if (req.user.uid !== uid) {
      return res.status(403).json({ error: 'Unauthorized access to device data' });
    }

    console.log('🔍 Analyzing device data for:', deviceId, 'User:', uid);
    console.log('📊 Aggregates:', aggregates);

    // Build Gemini prompt
    const prompt = `You are an agricultural assistant. Given aggregated 24-hour sensor data for device ${deviceId}:
soilMoisture_avg: ${aggregates.soilMoisture_avg}%, soilTemperature_avg: ${aggregates.soilTemperature_avg}°C, airTemperature_avg: ${aggregates.airTemp_avg}°C, airHumidity_avg: ${aggregates.airHumidity_avg}%, airQualityIndex_avg: ${aggregates.aqi_avg}

Recommend up to 5 crops from the following local-crop list suitable for these conditions in the Northern Province of Sri Lanka:
- Rice (varieties: Bg 352, At 362, Bw 367)
- Tomato (varieties: Cherry, Roma, Beefsteak)
- Chili (varieties: MI-2, Bullet, Cayenne)
- Onion (varieties: Red Creole, Yellow Granex)
- Cabbage (varieties: Copenhagen Market, Golden Acre)
- Eggplant (varieties: Long Purple, Black Beauty)
- Carrot (varieties: Nantes, Chantenay)
- Lettuce (varieties: Iceberg, Romaine)
- Spinach (varieties: Space, Bloomsdale)
- Radish (varieties: Cherry Belle, White Icicle)

For each recommendation provide:
- Crop name
- Why it suits (1 short sentence)
- Recommended irrigation/fertilizer guidance (1 short bullet)
- Confidence score (0-1)

Return JSON with topRecommendations: [{"name":"cropName","reason":"why it suits","recommendation":"irrigation/fertilizer guidance","confidenceScore":0.8}].`;

    // Call AI service
    const aiText = await getAIResponse('', prompt);
    console.log('🤖 AI response:', aiText);

    let recommendations = [];
      
    // Try to extract JSON from the response
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        if (jsonData.topRecommendations) {
          recommendations = jsonData.topRecommendations;
        }
      }
    } catch (jsonError) {
      console.log('⚠️ Could not parse JSON from AI response, using fallback');
      // Fallback: create recommendations based on conditions
      recommendations = generateFallbackRecommendations(aggregates);
    }

    // If no recommendations found, use fallback
    if (recommendations.length === 0) {
      recommendations = generateFallbackRecommendations(aggregates);
    }

    // Store recommendation in Firestore
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const recommendationData = {
      date: today,
      deviceId: deviceId,
      aggregates: aggregates,
      aiText: aiText,
      topRecommendations: recommendations,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(uid).collection('recommendations').doc(today).set(recommendationData);

    console.log('✅ Analysis completed and stored');

    res.json({
      success: true,
      topRecommendations: recommendations,
      aiText: aiText.length > 500 ? aiText.substring(0, 500) + '...' : aiText,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing device:', error);
    res.status(500).json({ error: 'Failed to analyze device data' });
  }
});

// Fallback recommendation generator
function generateFallbackRecommendations(aggregates) {
  const { soilMoisture_avg, airTemp_avg, airHumidity_avg, soilTemperature_avg, aqi_avg } = aggregates;
  
  const recommendations = [];
  
  // Rice - high moisture tolerance
  if (soilMoisture_avg > 60 && airTemp_avg >= 25 && airTemp_avg <= 35) {
    recommendations.push({
      name: "Rice",
      reason: "High soil moisture and warm temperatures are ideal for rice cultivation",
      recommendation: "Maintain water levels and apply NPK fertilizer during tillering stage",
      confidenceScore: 0.9
    });
  }
  
  // Tomato - moderate conditions
  if (soilMoisture_avg >= 50 && soilMoisture_avg <= 80 && airTemp_avg >= 20 && airTemp_avg <= 30) {
    recommendations.push({
      name: "Tomato",
      reason: "Moderate moisture and temperature conditions suit tomato growth",
      recommendation: "Regular watering and balanced fertilizer application every 2 weeks",
      confidenceScore: 0.8
    });
  }
  
  // Chili - drought tolerant
  if (soilMoisture_avg >= 40 && airTemp_avg >= 22 && airTemp_avg <= 35) {
    recommendations.push({
      name: "Chili",
      reason: "Heat tolerant crop suitable for current temperature conditions",
      recommendation: "Water moderately and apply potassium-rich fertilizer during fruiting",
      confidenceScore: 0.7
    });
  }
  
  // Cabbage - cool season
  if (airTemp_avg <= 25 && airHumidity_avg >= 60) {
    recommendations.push({
      name: "Cabbage",
      reason: "Cool temperatures and high humidity favor cabbage growth",
      recommendation: "Ensure consistent moisture and apply nitrogen fertilizer for leaf development",
      confidenceScore: 0.8
    });
  }
  
  // Lettuce - cool and moist
  if (airTemp_avg <= 22 && soilMoisture_avg >= 60) {
    recommendations.push({
      name: "Lettuce",
      reason: "Cool temperatures and adequate moisture are perfect for lettuce",
      recommendation: "Maintain consistent soil moisture and use organic compost",
      confidenceScore: 0.9
    });
  }
  
  // If no specific matches, add general recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      name: "Mixed Vegetables",
      reason: "Current conditions are suitable for various vegetable crops",
      recommendation: "Start with hardy vegetables and adjust irrigation based on crop needs",
      confidenceScore: 0.6
    });
  }
  
  return recommendations.slice(0, 5); // Return max 5 recommendations
}

export default router;
