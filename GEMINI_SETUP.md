# Gemini API Setup Guide

## 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

## 2. Enable Generative Language API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Library"
4. Search for "Generative Language API"
5. Click "Enable"

## 3. Environment Variables

Create a `.env` file in the `backend` directory with:

```
GEMINI_API_KEY=your-actual-api-key-here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 4. Start the Backend Server

```bash
cd backend
npm install
node server.js
```

## 5. Test the Chatbot

1. Start your frontend: `npm start`
2. Go to the chatbot page
3. Ask questions like:
   - "Who is the president of Sri Lanka?" (general Q&A)
   - "How to prevent pests in paddy field?" (agriculture Q&A)
