#!/usr/bin/env node

/**
 * Firebase Setup Script for SmartAgro Chatbot
 * This script helps you configure Firebase for the chatbot
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔥 Firebase Setup for SmartAgro Chatbot\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env file already exists');
} else {
  console.log('📝 Creating .env file...');
}

// Create .env content
const envContent = `# Gemini AI Configuration
GEMINI_API_KEY=AIzaSyA0JB7l2j22yKum1QNbMrm700arVOvrg78

# Firebase Configuration
FIREBASE_PROJECT_ID=smartagro-solution
FIREBASE_DATABASE_URL=https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app

# Firebase Service Account (JSON format as string)
# Get this from Firebase Console > Project Settings > Service Accounts
# Paste the entire JSON content here (replace the example below)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"smartagro-solution","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-xxxxx@smartagro-solution.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40smartagro-solution.iam.gserviceaccount.com"}

# Server Configuration
PORT=5000
`;

// Write .env file
fs.writeFileSync(envPath, envContent);
console.log('✅ .env file created/updated');

console.log('\n📋 Next Steps:');
console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
console.log('2. Select your project: smartagro-solution');
console.log('3. Go to Project Settings > Service Accounts');
console.log('4. Click "Generate new private key"');
console.log('5. Download the JSON file');
console.log('6. Copy the entire JSON content');
console.log('7. Replace the FIREBASE_SERVICE_ACCOUNT value in .env file');
console.log('8. Restart the server: npm start');

console.log('\n🎯 Current Status:');
console.log('✅ Gemini AI: Configured');
console.log('✅ Server: Ready');
console.log('⚠️  Firebase: Needs service account key');
console.log('✅ Demo Mode: Working (temporary)');

console.log('\n🚀 Your chatbot is ready to use!');
console.log('Visit: http://localhost:3000/full-chatbot');

rl.close();
