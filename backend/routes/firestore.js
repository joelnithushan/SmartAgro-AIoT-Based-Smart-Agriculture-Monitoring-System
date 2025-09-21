const express = require('express');
const router = express.Router();

// Firebase REST API configuration
const FIREBASE_PROJECT_ID = 'smartagro-58812';
const FIREBASE_API_KEY = 'AIzaSyAxhqhRzayrjnf-zHEIVwevSnbb9O4703U';

// Helper function to make Firestore REST API calls
async function firestoreRequest(method, path, data = null) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents${path}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Firestore API error: ${result.error?.message || 'Unknown error'}`);
    }
    
    return result;
  } catch (error) {
    console.error('Firestore REST API error:', error);
    throw error;
  }
}

// Convert JavaScript object to Firestore document format
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

// Convert Firestore document format to JavaScript object
function fromFirestoreDocument(doc) {
  if (!doc.fields) return {};
  
  const obj = {};
  
  for (const [key, value] of Object.entries(doc.fields)) {
    if (value.stringValue !== undefined) {
      obj[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      obj[key] = parseInt(value.integerValue);
    } else if (value.doubleValue !== undefined) {
      obj[key] = parseFloat(value.doubleValue);
    } else if (value.booleanValue !== undefined) {
      obj[key] = value.booleanValue;
    } else if (value.timestampValue !== undefined) {
      obj[key] = new Date(value.timestampValue);
    } else if (value.nullValue !== undefined) {
      obj[key] = null;
    } else if (value.arrayValue !== undefined) {
      obj[key] = value.arrayValue.values.map(v => fromFirestoreDocument({ fields: { item: v } }).item);
    } else if (value.mapValue !== undefined) {
      obj[key] = fromFirestoreDocument(value.mapValue);
    }
  }
  
  return obj;
}

// Add document to Firestore collection
router.post('/add/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const data = req.body;
    
    // Add timestamp
    data.createdAt = new Date();
    data.updatedAt = new Date();
    
    const firestoreDoc = toFirestoreDocument(data);
    const result = await firestoreRequest('POST', `/${collection}`, firestoreDoc);
    
    // Extract document ID from the result
    const docId = result.name.split('/').pop();
    
    res.json({
      success: true,
      id: docId,
      message: 'Document added successfully'
    });
  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get documents from Firestore collection
router.get('/get/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const result = await firestoreRequest('GET', `/${collection}`);
    
    const documents = [];
    if (result.documents) {
      for (const doc of result.documents) {
        const docId = doc.name.split('/').pop();
        const data = fromFirestoreDocument(doc);
        documents.push({ id: docId, ...data });
      }
    }
    
    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update document in Firestore collection
router.put('/update/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const data = req.body;
    
    // Add update timestamp
    data.updatedAt = new Date();
    
    const firestoreDoc = toFirestoreDocument(data);
    await firestoreRequest('PATCH', `/${collection}/${id}`, firestoreDoc);
    
    res.json({
      success: true,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
