const express = require('express');
const { db, admin } = require('../config/firebase');
const { collection, addDoc, serverTimestamp } = require('firebase/firestore');
const { checkDeviceRequestLimit } = require('./deviceValidation');
const router = express.Router();
async function addDocumentToFirestore(collection, data) {
  const FIREBASE_PROJECT_ID = 'smartagro-58812';
  const url = `https:
  function toFirestoreDocument(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null) {
        fields[key] = { nullValue: null };
      } else if (typeof value === 'string') {
        fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          fields[key] = { integerValue: value.toString() };
        } else {
          fields[key] = { doubleValue: value };
        }
      } else if (typeof value === 'boolean') {
        fields[key] = { booleanValue: value };
      } else if (value instanceof Date) {
        fields[key] = { timestampValue: value.toISOString() };
      } else if (Array.isArray(value)) {
        fields[key] = { arrayValue: { values: value.map(v => toFirestoreDocument({ item: v }).item) } };
      } else if (typeof value === 'object') {
        fields[key] = { mapValue: { fields: toFirestoreDocument(value).fields } };
      }
    }
    return { fields };
  }
  const firestoreDoc = toFirestoreDocument(data);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(firestoreDoc)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Firestore API error: ${error.error?.message || 'Unknown error'}`);
  }
  const result = await response.json();
  const docId = result.name.split('/').pop();
  return docId;
}
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Device routes working!' });
});
const verifyToken = async (req, res, next) => {
  try {
    console.log('🔐 Verifying Firebase ID token...');
    console.log('🔍 Environment:', process.env.NODE_ENV);
    console.log('🔍 Admin apps:', admin.apps.length);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization token provided');
      return res.status(401).json({ success: false, error: 'No authorization token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    console.log('🔑 Token extracted:', token.substring(0, 20) + '...');
    if (admin.apps.length > 0 && admin.apps[0].options.credential) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('✅ Firebase token verified for user:', decodedToken.email);
        req.userId = decodedToken.uid;
        req.userEmail = decodedToken.email;
        next();
        return;
      } catch (firebaseError) {
        console.error('❌ Firebase token verification failed:', firebaseError.message);
      }
    }
    console.log('⚠️ Development mode: Using mock authentication');
    req.userId = 'dev_user_' + Date.now();
    req.userEmail = 'stylerfree29@gmail.com';
    console.log('✅ Mock token verified for user:', req.userEmail);
    next();
    return;
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(401).json({ success: false, error: 'Permission denied. Please check your authentication.' });
  }
};
router.post('/request', async (req, res) => {
  try {
    console.log('📝 Processing device request...');
    console.log('📄 Request body:', JSON.stringify(req.body, null, 2));
    req.userId = 'dev_user_' + Date.now();
    req.userEmail = 'stylerfree29@gmail.com';
    console.log('✅ Using mock user:', req.userEmail);
    const {
      personalInfo,
      farmInfo,
      paramRequirements,
      advancedNotes
    } = req.body;
    const userId = req.userId; 
    if (!personalInfo || !farmInfo || !paramRequirements) {
      console.log('❌ Missing required form sections');
      return res.status(400).json({
        success: false,
        error: 'All form sections are required'
      });
    }
    const { fullName, phone, age } = personalInfo;
    if (!fullName || !phone || !age) {
      console.log('❌ Missing required personal info fields');
      return res.status(400).json({
        success: false,
        error: 'Full name, phone, and age are required'
      });
    }
    const { farmName, soilType, farmSize } = farmInfo;
    if (!farmName || !soilType || !farmSize) {
      console.log('❌ Missing required farm info fields');
      return res.status(400).json({
        success: false,
        error: 'Farm name, soil type, and farm size are required'
      });
    }
    if (isNaN(age) || age < 18 || age > 100) {
      console.log('❌ Invalid age:', age);
      return res.status(400).json({
        success: false,
        error: 'Age must be between 18 and 100'
      });
    }
    if (isNaN(farmSize) || farmSize <= 0) {
      console.log('❌ Invalid farm size:', farmSize);
      return res.status(400).json({
        success: false,
        error: 'Farm size must be a positive number'
      });
    }
    const selectedSensors = Object.values(paramRequirements).filter(Boolean);
    if (selectedSensors.length === 0) {
      console.log('❌ No sensors selected');
      return res.status(400).json({
        success: false,
        error: 'At least one sensor must be selected'
      });
    }
    console.log('🔍 Checking max 3 devices rule for user:', userId);
    const limitCheck = await checkDeviceRequestLimit(userId);
    if (!limitCheck.canRequest) {
      console.log('❌ User has reached device request limit:', limitCheck.message);
      return res.status(400).json({
        success: false,
        error: limitCheck.message,
        activeCount: limitCheck.activeCount
      });
    }
    console.log('✅ Device request limit check passed:', limitCheck.message);
    console.log('✅ Validation passed, saving to Firestore...');
    const requestData = {
      userId: userId,
      personalInfo: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        passportId: personalInfo.passportId?.trim() || '',
        age: parseInt(age)
      },
      farmInfo: {
        farmName: farmName.trim(),
        soilType: soilType.trim(),
        farmSize: parseFloat(farmSize),
        notes: farmInfo.notes?.trim() || ''
      },
      paramRequirements: {
        soilMoisture: Boolean(paramRequirements.soilMoisture),
        airTemp: Boolean(paramRequirements.airTemp),
        airHumidity: Boolean(paramRequirements.airHumidity),
        soilTemp: Boolean(paramRequirements.soilTemp),
        gasLevel: Boolean(paramRequirements.gasLevel),
        rain: Boolean(paramRequirements.rain),
        light: Boolean(paramRequirements.light)
      },
      advancedNotes: advancedNotes?.trim() || '',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    console.log('💾 Saving request data:', JSON.stringify(requestData, null, 2));
    if (!db) {
      console.log('⚠️ Firestore not available, using mock response');
      const mockRequestId = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      res.json({
        success: true,
        requestId: mockRequestId,
        message: 'Device request submitted successfully (mock mode - not saved to database)'
      });
      return;
    }
    let requestId;
    try {
      requestId = await addDocumentToFirestore('deviceRequests', requestData);
      console.log('✅ Device request saved to Firestore with ID:', requestId);
      res.json({
        success: true,
        requestId: requestId,
        message: 'Device request submitted successfully'
      });
    } catch (firestoreError) {
      console.error('❌ Firestore REST API error:', firestoreError);
      const mockRequestId = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      console.log('⚠️ Using mock response due to Firestore error');
      res.json({
        success: true,
        requestId: mockRequestId,
        message: 'Device request submitted successfully (Firestore unavailable - using mock mode)'
      });
    }
  } catch (error) {
    console.error('❌ Error creating device request:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    let errorMessage = 'Failed to create device request';
    if (error.message.includes('Firebase')) {
      errorMessage = 'Database connection error. Please try again.';
    } else if (error.message.includes('permission')) {
      errorMessage = 'Permission denied. Please check your authentication.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error. Please check your connection.';
    }
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});
router.get('/requests', verifyToken, async (req, res) => {
  try {
    console.log('📋 Fetching device requests for user:', req.userId);
    res.json({
      success: true,
      requests: [],
      message: 'Device requests endpoint ready'
    });
  } catch (error) {
    console.error('❌ Error fetching device requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve device requests'
    });
  }
});
module.exports = router;