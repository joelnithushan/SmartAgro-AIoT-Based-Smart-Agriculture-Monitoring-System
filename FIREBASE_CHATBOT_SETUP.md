# Firebase Chatbot Setup Guide

## 🔥 Firebase Configuration for Chatbot

### Step 1: Get Firebase Service Account Key

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `smartagro-solution`
3. **Go to Project Settings** (gear icon)
4. **Click "Service Accounts" tab**
5. **Click "Generate new private key"**
6. **Download the JSON file**

### Step 2: Set Environment Variables

Create a `.env` file in the `backend` folder with:

```env
# Gemini AI Configuration
GEMINI_API_KEY=AIzaSyA0JB7l2j22yKum1QNbMrm700arVOvrg78

# Firebase Configuration
FIREBASE_PROJECT_ID=smartagro-solution
FIREBASE_DATABASE_URL=https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app

# Firebase Service Account (paste the entire JSON content here)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"smartagro-solution",...}

# Server Configuration
PORT=5000
```

### Step 3: Firestore Security Rules

Add these rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chat history rules
    match /users/{userId}/chats/{chatId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User profiles
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 4: Start the Server

```bash
cd backend
npm start
```

## 🎯 Features Enabled

With Firebase connected, your chatbot will have:

- ✅ **User Authentication**: Real Firebase Auth
- ✅ **Chat History**: Stored in Firestore
- ✅ **User Profiles**: Persistent user data
- ✅ **Real-time Updates**: Live chat synchronization
- ✅ **Data Persistence**: Chat history survives server restarts

## 🔧 Current Status

- ✅ **Gemini AI**: Working with `gemini-1.5-flash`
- ✅ **Server**: Running on port 5000
- ⚠️ **Firebase**: Needs service account configuration
- ✅ **Demo Mode**: Works without Firebase (temporary)

## 🚀 Next Steps

1. **Get your Firebase service account key**
2. **Add it to the `.env` file**
3. **Restart the server**
4. **Test with real authentication**

Your chatbot will then have full Firebase integration!
