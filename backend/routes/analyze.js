import express from 'express';
import admin from 'firebase-admin';
const router = express.Router();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

// Gemini AI integration
const getGeminiRecommendations = async (aggregates, deviceId) => {
  try {
    const prompt = `You are an agricultural assistant. Given aggregated 24-hour sensor data for device ${deviceId}:
soilMoisture_avg: ${aggregates.soilMoisturePct?.avg || 0}%, 
soilTemperature_avg: ${aggregates.soilTemperature?.avg || 0}°C, 
airTemperature_avg: ${aggregates.airTemperature?.avg || 0}°C, 
airHumidity_avg: ${aggregates.airHumidity?.avg || 0}%, 
airQualityIndex_avg: ${aggregates.airQualityIndex?.avg || 0}

Recommend up to 5 crops from the provided local-crop list suitable for these conditions in the Northern Province of Sri Lanka. For each recommendation provide:
- Crop name
- Why it suits (1 short sentence)
- Recommended irrigation/fertilizer guidance (1 short bullet)
- Confidence score (0-1)

Return JSON with topRecommendations: [{name,reason,recommendation,confidenceScore,recommendedRanges}].

Sri Lankan crops to consider: Rice (BG 300, BG 352), Chili (Miris), Onion (Red), Tomato (Local), Brinjal (Local), Okra (Local), Cucumber (Local), Green Beans (Local), Cabbage (Local), Carrot (Local), Radish (Local), Spinach (Local), Coriander (Local), Curry Leaves (Local), Pumpkin (Local), Bitter Gourd (Local), Ridge Gourd (Local), Snake Gourd (Local), Ash Gourd (Local).`;

    // For now, return mock recommendations since Gemini API key is not available
    // In production, you would call the actual Gemini API here
    const mockRecommendations = [
      {
        name: "Rice (BG 352)",
        reason: "High-yielding variety suitable for current soil moisture and temperature conditions",
        recommendation: "Maintain consistent soil moisture between 30-50% and apply NPK fertilizer every 3 weeks",
        confidenceScore: 0.85,
        recommendedRanges: {
          soilMoisturePct: { min: 30, max: 50 },
          airTemperature: { min: 25, max: 35 },
          airHumidity: { min: 60, max: 80 },
          soilTemperature: { min: 22, max: 30 },
          airQualityIndex: { min: 0, max: 50 }
        }
      },
      {
        name: "Chili (Miris)",
        reason: "Drought tolerant and thrives in current temperature range",
        recommendation: "Water moderately and apply potassium-rich fertilizer for better fruit development",
        confidenceScore: 0.78,
        recommendedRanges: {
          soilMoisturePct: { min: 20, max: 40 },
          airTemperature: { min: 22, max: 32 },
          airHumidity: { min: 50, max: 70 },
          soilTemperature: { min: 20, max: 28 },
          airQualityIndex: { min: 0, max: 60 }
        }
      },
      {
        name: "Tomato (Local)",
        reason: "Current conditions are ideal for tomato cultivation",
        recommendation: "Provide consistent moisture and support with stakes for better yield",
        confidenceScore: 0.72,
        recommendedRanges: {
          soilMoisturePct: { min: 30, max: 50 },
          airTemperature: { min: 20, max: 30 },
          airHumidity: { min: 50, max: 70 },
          soilTemperature: { min: 18, max: 26 },
          airQualityIndex: { min: 0, max: 60 }
        }
      }
    ];

    return mockRecommendations;
  } catch (error) {
    console.error('Error getting Gemini recommendations:', error);
    throw error;
  }
};

// POST /api/v1/analyze-device
router.post('/analyze-device', async (req, res) => {
  try {
    console.log('🔍 Analyze endpoint called with:', req.body);
    const { deviceId, uid, aggregates } = req.body;

    if (!deviceId || !uid || !aggregates) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user authentication
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header or invalid format');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log('✅ Token verified for user:', decodedToken.uid);
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (decodedToken.uid !== uid) {
      console.log('❌ UID mismatch:', decodedToken.uid, 'vs', uid);
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get AI recommendations
    console.log('🤖 Getting AI recommendations...');
    const recommendations = await getGeminiRecommendations(aggregates, deviceId);
    console.log('✅ Generated recommendations:', recommendations.length);

    // Store recommendation in Firestore
    const recommendationData = {
      date: new Date().toISOString().split('T')[0],
      deviceId,
      uid,
      aggregates,
      aiText: `Analysis completed for device ${deviceId}`,
      aiStructured: recommendations,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await admin.firestore()
      .collection('users')
      .doc(uid)
      .collection('recommendations')
      .doc(recommendationData.date)
      .set(recommendationData);

    res.json({
      success: true,
      recommendations,
      message: 'Analysis completed successfully'
    });

  } catch (error) {
    console.error('Error in analyze-device endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
