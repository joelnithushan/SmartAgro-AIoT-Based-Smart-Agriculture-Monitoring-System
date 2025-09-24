import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import admin from "firebase-admin";
import { processAlerts } from "./functions/alertProcessor.js";
import { getSLTimeForLogging, getSLTimezoneOffset } from "./utils/timeUtils.js";
import adminRouter from "./routes/admin.js";
import chatRouter from "./routes/chat.js";

dotenv.config();

// Initialize Firebase Admin
const initializeFirebase = async () => {
  if (!admin.apps.length) {
    try {
      // Try to load service account key from file
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const serviceAccount = require('./config/serviceAccountKey.json');
      
      if (serviceAccount.private_key && !serviceAccount.private_key.includes('MOCK')) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
        });
        console.log('✅ Firebase Admin SDK initialized with service account key');
      } else {
        console.log('⚠️  Firebase service account not configured - using demo mode');
      }
    } catch (error) {
      console.log('⚠️  Firebase initialization failed:', error.message);
      console.log('   Using demo mode for development');
    }
  }
};

const app = express();
app.use(cors());
app.use(express.json());

// Mount admin routes
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const db = admin.apps.length > 0 ? admin.firestore() : null;

// System prompt for agriculture specialization with structured responses
const getSystemPrompt = () => {
  return `You are an expert agricultural assistant. Your role is to provide detailed, practical advice for farming, crop management, soil health, irrigation, pest control, and all aspects of agriculture.

IMPORTANT: Always format your responses in Markdown with proper structure:

For agriculture-related questions, provide comprehensive, detailed answers using:
- **Headings** (# ## ###) to organize sections
- **Bold keywords** (**keyword**) for emphasis
- **Numbered lists** (1. 2. 3.) for step-by-step instructions
- **Bullet points** (- or *) for features, benefits, or items
- **Code blocks** (\`\`\`) for specific measurements or technical details

Example format:
# [Main Topic]
## [Subsection 1]
1. **Step 1**: Description...
2. **Step 2**: Description...

## [Subsection 2]
- **Key Point 1**: Description...
- **Key Point 2**: Description...

**Important Notes:**
- Use proper Markdown formatting
- Make responses professional and structured
- Include specific recommendations, step-by-step instructions, best practices
- Add safety considerations, seasonal timing, equipment recommendations
- For general questions (non-agriculture), provide concise, helpful answers in simple Markdown

Always be professional, accurate, and practical in your responses.`;
};

// Middleware to verify Firebase ID token (demo mode for now)
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For demo purposes, use static user
      req.uid = 'demoUser';
      req.user = { uid: 'demoUser', email: 'demo@example.com' };
      return next();
    }

    if (!admin.apps.length) {
      // Firebase not configured, use demo user
      req.uid = 'demoUser';
      req.user = { uid: 'demoUser', email: 'demo@example.com' };
      return next();
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.uid = decodedToken.uid;
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    // Fallback to demo user
    req.uid = 'demoUser';
    req.user = { uid: 'demoUser', email: 'demo@example.com' };
    next();
  }
};

// Legacy chat endpoint (for existing ChatWidget)
app.post('/api/chat', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.uid;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log(`🤖 Legacy API: Processing message from ${userId}: ${message.substring(0, 50)}...`);

    // Call Gemini API
    const systemPrompt = getSystemPrompt();
    const fullPrompt = `${systemPrompt}\n\nUser question: ${message}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return res.status(500).json({ 
        error: 'Gemini API call failed', 
        details: `${geminiResponse.status} - ${errorText}` 
      });
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      console.error('Invalid Gemini response:', geminiData);
      return res.status(500).json({ error: 'Invalid response from Gemini API' });
    }

    const reply = geminiData.candidates[0].content.parts[0].text;

    res.json({
      success: true,
      reply: reply,
      chatId: `legacy-chat-${Date.now()}`,
      messageId: Date.now().toString()
    });

  } catch (error) {
    console.error('Legacy chat endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// Chat endpoint (for new chatbot)
app.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, chatId, editMessageId, deleteMessageId } = req.body;
    const userId = req.uid;

    // Handle message deletion
    if (deleteMessageId && chatId) {
      if (db) {
        try {
          const messagesRef = db.collection('users').doc(userId).collection('chats').doc(chatId).collection('messages');
          
          // Get the message to delete
          const messageDoc = await messagesRef.doc(deleteMessageId).get();
          if (messageDoc.exists) {
            const messageData = messageDoc.data();
            
            // Delete the user message
            await messagesRef.doc(deleteMessageId).delete();
            
            // If it's a user message, also delete the next assistant message
            if (messageData.role === 'user') {
              const nextMessages = await messagesRef
                .where('createdAt', '>', messageData.createdAt)
                .orderBy('createdAt', 'asc')
                .limit(1)
                .get();
              
              if (!nextMessages.empty) {
                const nextMessage = nextMessages.docs[0];
                if (nextMessage.data().role === 'assistant') {
                  await nextMessage.ref.delete();
                }
              }
            }
            
            console.log(`✅ Message ${deleteMessageId} deleted from chat ${chatId}`);
          }
          
          return res.json({ success: true, message: 'Message deleted successfully' });
        } catch (firestoreError) {
          console.error('Firestore deletion error:', firestoreError);
          return res.status(500).json({ error: 'Failed to delete message' });
        }
      }
      return res.json({ success: true, message: 'Message deleted successfully' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log(`🤖 Processing message from ${userId}: ${message.substring(0, 50)}...`);

    // Call Gemini API
    const systemPrompt = getSystemPrompt();
    const fullPrompt = `${systemPrompt}\n\nUser question: ${message}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return res.status(500).json({ 
        error: 'Gemini API call failed', 
        details: `${geminiResponse.status} - ${errorText}` 
      });
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      console.error('Invalid Gemini response:', geminiData);
      return res.status(500).json({ error: 'Invalid response from Gemini API' });
    }

    const reply = geminiData.candidates[0].content.parts[0].text;

    // Save to Firestore if available
    let savedChatId = chatId;
    if (db) {
      try {
        const chatRef = db.collection('users').doc(userId).collection('chats');
        
        if (!chatId) {
          // Create new chat with first 30 characters as title
          const title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
          const newChatRef = await chatRef.add({
            title: title,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          savedChatId = newChatRef.id;
        } else {
          // Update existing chat
          await chatRef.doc(chatId).update({
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Save messages
        const messagesRef = chatRef.doc(savedChatId).collection('messages');
        
        if (editMessageId) {
          // Edit existing message and regenerate response
          await messagesRef.doc(editMessageId).update({
            content: message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Delete the old assistant response and add new one
          const oldAssistantMessages = await messagesRef
            .where('createdAt', '>', (await messagesRef.doc(editMessageId).get()).data().createdAt)
            .orderBy('createdAt', 'asc')
            .limit(1)
            .get();
          
          if (!oldAssistantMessages.empty) {
            await oldAssistantMessages.docs[0].ref.delete();
          }
        } else {
          // Add user message
          await messagesRef.add({
            role: 'user',
            content: message,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Add assistant response
        await messagesRef.add({
          role: 'assistant',
          content: reply,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Messages saved to Firestore for chat ${savedChatId}`);
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        // Continue without saving to Firestore
      }
    }

    res.json({
      success: true,
      reply: reply,
      chatId: savedChatId
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// Get user's chats
app.get('/chats', verifyToken, async (req, res) => {
  try {
    const userId = req.uid;

    if (!db) {
      return res.json({ chats: [] });
    }

    const chatsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('chats')
      .orderBy('updatedAt', 'desc')
      .get();

    const chats = [];
    chatsSnapshot.forEach(doc => {
      chats.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ chats });
  } catch (error) {
    console.error('Error loading chats:', error);
    res.status(500).json({ error: 'Failed to load chats' });
  }
});

// Get specific chat with messages
app.get('/chats/:chatId', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.uid;

    if (!db) {
      return res.json({ chat: null });
    }

    const chatDoc = await db
      .collection('users')
      .doc(userId)
      .collection('chats')
      .doc(chatId)
      .get();

    if (!chatDoc.exists) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messagesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();

    const messages = [];
    messagesSnapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      chat: {
        id: chatDoc.id,
        ...chatDoc.data(),
        messages
      }
    });
  } catch (error) {
    console.error('Error loading chat:', error);
    res.status(500).json({ error: 'Failed to load chat' });
  }
});

// Delete chat
app.delete('/chats/:chatId', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.uid;

    if (!db) {
      return res.json({ success: true });
    }

    // Delete all messages first
    const messagesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .get();

    const batch = db.batch();
    messagesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete chat
    await db
      .collection('users')
      .doc(userId)
      .collection('chats')
      .doc(chatId)
      .delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Update chat title
app.put('/chats/:chatId', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const userId = req.uid;

    if (!db) {
      return res.json({ success: true });
    }

    await db
      .collection('users')
      .doc(userId)
      .collection('chats')
      .doc(chatId)
      .update({
        title: title,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    geminiConfigured: !!GEMINI_API_KEY,
    firebaseConfigured: !!process.env.FIREBASE_SERVICE_ACCOUNT
  });
});

// Alert processing endpoint (called when sensor data is updated)
app.post('/process-alerts', async (req, res) => {
  try {
    const { sensorData, deviceId } = req.body;
    
    if (!sensorData || !deviceId) {
      return res.status(400).json({ error: 'Missing sensorData or deviceId' });
    }

    // Process alerts asynchronously
    processAlerts(sensorData, deviceId).catch(error => {
      console.error('Error in async alert processing:', error);
    });

    res.json({ success: true, message: 'Alert processing initiated' });
  } catch (error) {
    console.error('Error in alert processing endpoint:', error);
    res.status(500).json({ error: 'Failed to process alerts' });
  }
});


const PORT = process.env.PORT || 5000;

// Start server after Firebase initialization
const startServer = async () => {
  await initializeFirebase();
  
  app.listen(PORT, () => {
    console.log(`🚀 AI Chatbot Server running on port ${PORT}`);
    console.log(`📡 Gemini API configured: ${!!GEMINI_API_KEY}`);
    console.log(`🔥 Firebase configured: ${!!process.env.FIREBASE_SERVICE_ACCOUNT}`);
    console.log(`🕐 Server started at: ${getSLTimeForLogging()} (${getSLTimezoneOffset()})`);
    console.log(`🌍 Timezone: Asia/Colombo (Sri Lanka)`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`💬 Chat endpoint: http://localhost:${PORT}/chat`);
  });
};

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});