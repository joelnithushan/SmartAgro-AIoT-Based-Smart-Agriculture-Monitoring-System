# Clean AI Chatbot Setup Guide

## 🚀 Full-Stack AI Chatbot with Google Gemini

This is a clean, simplified implementation of a ChatGPT-like chatbot powered by Google Gemini AI.

## 📁 Files Created

### Backend
- `backend/server-clean.js` - Clean Express server with Gemini API integration
- `backend/package.json` - Updated with ES modules and node-fetch

### Frontend
- `src/components/CleanChatbot.jsx` - Clean chat interface component
- `src/pages/CleanChatbotTest.jsx` - Test page for the chatbot

## 🔧 Setup Instructions

### 1. Environment Variables
Create a `.env` file in the `backend` directory:
```
GEMINI_API_KEY=AIzaSyBqIJYwTqKoCGxQ6P_p-ccvctI2ENnSlxs
PORT=5000
NODE_ENV=development
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Start the Backend Server
```bash
npm run chatbot
# or
node server-clean.js
```

### 4. Start the Frontend
```bash
# In a new terminal
cd ../
npm start
```

### 5. Test the Chatbot
- Go to `http://localhost:3000/clean-chatbot-test`
- Or add the route to your App.jsx

## 🎯 Features

### Backend (`server-clean.js`)
- ✅ Express server with CORS enabled
- ✅ POST `/chat` endpoint
- ✅ Google Gemini API integration
- ✅ Error handling and validation
- ✅ Health check endpoint
- ✅ Clean, minimal code

### Frontend (`CleanChatbot.jsx`)
- ✅ Real-time chat interface
- ✅ Message history
- ✅ Loading states
- ✅ Auto-scroll to bottom
- ✅ Enter key to send
- ✅ Responsive design
- ✅ Clean UI with Tailwind CSS

## 🧪 API Endpoints

### POST `/chat`
**Input:**
```json
{
  "message": "Hello, how are you?"
}
```

**Output:**
```json
{
  "reply": "Hello! I'm doing well, thank you for asking. How can I help you today?"
}
```

### GET `/health`
**Output:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-21T12:00:00.000Z",
  "geminiConfigured": true
}
```

## 🎨 Usage Examples

### Test Questions
- "What is artificial intelligence?"
- "How do I grow tomatoes?"
- "Explain quantum computing"
- "What's the weather like?"

## 🔄 Next Steps

1. **Add to your main app**: Import `CleanChatbotTest` in your App.jsx
2. **Add authentication**: Integrate with your existing Firebase auth
3. **Add chat history**: Store conversations in Firestore
4. **Add file uploads**: Support image analysis with Gemini Vision
5. **Add streaming**: Real-time response streaming

## 🐛 Troubleshooting

### Common Issues
1. **CORS errors**: Make sure CORS is enabled in server
2. **API key errors**: Verify your Gemini API key is correct
3. **Port conflicts**: Change PORT in .env if 5000 is busy
4. **Module errors**: Make sure you're using Node.js 14+ for ES modules

### Debug Commands
```bash
# Test backend health
curl http://localhost:5000/health

# Test chat endpoint
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

Your clean AI chatbot is now ready! 🤖✨
