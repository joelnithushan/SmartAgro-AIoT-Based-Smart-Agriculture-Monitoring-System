# Full AI Chatbot Setup Guide

## 🚀 Complete ChatGPT-like AI Chatbot with Google Gemini

This is a full-stack AI chatbot application with Firebase integration, real-time chat history, and a ChatGPT-like interface.

## 📁 Files Created

### Backend
- `backend/server.js` - Complete Express server with Gemini API and Firebase integration
- `backend/package.json` - Updated with all necessary dependencies

### Frontend Components
- `src/config/firebase.js` - Firebase configuration
- `src/components/ChatApp.jsx` - Main application component
- `src/components/ChatWindow.jsx` - Chat interface with message display
- `src/components/MessageBubble.jsx` - Individual message component
- `src/components/ChatInput.jsx` - Message input with auto-resize
- `src/components/Sidebar.jsx` - Chat history sidebar
- `src/pages/FullChatbot.jsx` - Test page for the complete chatbot

## 🔧 Setup Instructions

### 1. Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Gemini API Configuration
GEMINI_API_KEY=AIzaSyBqIJYwTqKoCGxQ6P_p-ccvctI2ENnSlxs

# Firebase Configuration (Backend)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"smartagro-solution",...}
FIREBASE_DATABASE_URL=https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app

# Server Configuration
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
npm start
# or
node server.js
```

### 4. Start the Frontend

```bash
# In a new terminal
cd ../
npm start
```

### 5. Test the Chatbot

- Go to `http://localhost:3000/full-chatbot`
- Or add the route to your App.jsx

## 🎯 Features

### Backend (`server.js`)
- ✅ Express server with CORS enabled
- ✅ Firebase Admin SDK integration
- ✅ Google Gemini API integration
- ✅ Authentication middleware
- ✅ Chat CRUD operations
- ✅ Real-time message saving
- ✅ Message editing support
- ✅ Error handling and validation

### Frontend Components

#### `ChatApp.jsx` (Main Component)
- ✅ Authentication management
- ✅ Chat state management
- ✅ API integration
- ✅ Real-time updates

#### `ChatWindow.jsx`
- ✅ Message display
- ✅ Message editing
- ✅ Auto-scroll
- ✅ Loading states

#### `MessageBubble.jsx`
- ✅ User/AI message styling
- ✅ Timestamps
- ✅ Edit functionality
- ✅ Hover actions

#### `ChatInput.jsx`
- ✅ Auto-resize textarea
- ✅ Enter to send
- ✅ Character count
- ✅ Loading states

#### `Sidebar.jsx`
- ✅ Chat history list
- ✅ New chat button
- ✅ Delete chat functionality
- ✅ Collapsible design
- ✅ User profile

## 🧪 API Endpoints

### POST `/chat`
**Input:**
```json
{
  "message": "How to improve soil fertility?",
  "chatId": "optional-existing-chat-id",
  "editMessageId": "optional-message-id-to-edit"
}
```

**Output:**
```json
{
  "success": true,
  "reply": "To improve soil fertility, consider these steps...",
  "chatId": "chat-id",
  "messageId": "message-id"
}
```

### GET `/chats`
**Output:**
```json
{
  "success": true,
  "chats": [
    {
      "id": "chat-id",
      "title": "Chat title",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "messageCount": 10
    }
  ]
}
```

### GET `/chats/:chatId`
**Output:**
```json
{
  "success": true,
  "chat": {
    "id": "chat-id",
    "userId": "user-id",
    "title": "Chat title",
    "messages": [
      {
        "id": "message-id",
        "role": "user",
        "content": "User message",
        "timestamp": "timestamp"
      }
    ],
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### DELETE `/chats/:chatId`
**Output:**
```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

## 🎨 UI Features

### ChatGPT-like Interface
- ✅ **Left Sidebar**: Chat history with new chat button
- ✅ **Main Chat Window**: Messages with user/AI styling
- ✅ **Input Box**: Auto-resize with send button
- ✅ **Message Editing**: Click edit to modify and regenerate
- ✅ **Real-time Updates**: Instant message saving
- ✅ **Mobile Responsive**: Works on all devices

### Chat Management
- ✅ **New Chat**: Creates new conversation
- ✅ **Chat History**: Loads from Firebase
- ✅ **Delete Chat**: Remove conversations
- ✅ **Edit Messages**: Modify and regenerate responses
- ✅ **Auto-save**: All messages saved in real-time

## 🧪 Testing Examples

### General Questions (Short Answers)
- "Who is the president of Sri Lanka?"
- "What is artificial intelligence?"
- "Explain quantum computing"

### Agriculture Questions (Detailed Answers)
- "How to improve soil fertility for paddy?"
- "What fertilizer should I use for tomatoes?"
- "How to prevent pests in paddy field?"
- "What's the best irrigation method for rice?"

## 🔄 Firebase Data Structure

```
chats/
  {chatId}/
    userId: "user-id"
    title: "Chat title"
    messages: [
      {
        id: "message-id",
        role: "user" | "assistant",
        content: "message content",
        timestamp: timestamp
      }
    ]
    createdAt: timestamp
    updatedAt: timestamp
```

## 🐛 Troubleshooting

### Common Issues
1. **Authentication errors**: Check Firebase configuration
2. **API key errors**: Verify Gemini API key
3. **CORS errors**: Ensure CORS is enabled
4. **Firebase errors**: Check service account configuration

### Debug Commands
```bash
# Test backend health
curl http://localhost:5000/health

# Test chat endpoint
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"Hello"}'
```

## 🚀 Next Steps

1. **Add to your main app**: Import `FullChatbot` in your App.jsx
2. **Customize styling**: Modify Tailwind classes
3. **Add file uploads**: Support image analysis
4. **Add streaming**: Real-time response streaming
5. **Add voice input**: Speech-to-text integration

Your complete AI chatbot is now ready! 🤖✨
