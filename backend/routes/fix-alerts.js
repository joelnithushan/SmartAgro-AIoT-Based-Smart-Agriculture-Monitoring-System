import express from 'express';
import { admin } from '../config/firebase.js';

const router = express.Router();

// Fix alert system endpoint
router.post('/fix-alert-system', async (req, res) => {
  try {
    const userId = '2WkBa1yCo3eF9MkBdTef5ga5yC43';
    const alertId = 'ep9LOKYU9Wj1XGHplUSR';
    
    console.log('🔧 FIXING ALERT SYSTEM IMMEDIATELY');
    console.log('=' .repeat(50));
    
    const db = admin.firestore();
    
    // Create a working alert
    const alertData = {
      parameter: 'soilMoisturePct',
      comparison: '<',
      threshold: 30,
      type: 'sms',
      value: '+94756429811', // Your phone number
      active: true,
      critical: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save the alert to Firestore
    await db.collection('users').doc(userId).collection('alerts').doc(alertId).set(alertData);
    
    console.log('✅ Alert created successfully!');
    console.log('📊 Alert data:', JSON.stringify(alertData, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Alert system fixed!',
      alertId: alertId,
      userId: userId,
      alertData: alertData
    });
    
  } catch (error) {
    console.error('❌ Error fixing alert system:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fix alert system',
      details: error.message 
    });
  }
});

export default router;



