/**
 * Test script to verify chatbot setup
 * Run this to check if everything is configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing AI Chatbot Setup...\n');

// Test 1: Check if .env file exists
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ Backend .env file exists');
  
  // Check if GEMINI_API_KEY is set
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('GEMINI_API_KEY=') && !envContent.includes('your-gemini-api-key-here')) {
    console.log('✅ GEMINI_API_KEY is configured');
  } else {
    console.log('❌ GEMINI_API_KEY needs to be set in backend/.env');
  }
} else {
  console.log('❌ Backend .env file missing - copy from env-example.txt');
}

// Test 2: Check if backend dependencies are installed
const packageJsonPath = path.join(__dirname, 'backend', 'package.json');
const nodeModulesPath = path.join(__dirname, 'backend', 'node_modules');
if (fs.existsSync(packageJsonPath) && fs.existsSync(nodeModulesPath)) {
  console.log('✅ Backend dependencies installed');
} else {
  console.log('❌ Backend dependencies not installed - run: cd backend && npm install');
}

// Test 3: Check if frontend components exist
const components = [
  'src/pages/AIChatbot.jsx',
  'src/components/ChatWidget.jsx',
  'src/components/FAQPanel.jsx',
  'src/components/ChatHistory.jsx'
];

let allComponentsExist = true;
components.forEach(component => {
  if (fs.existsSync(path.join(__dirname, component))) {
    console.log(`✅ ${component} exists`);
  } else {
    console.log(`❌ ${component} missing`);
    allComponentsExist = false;
  }
});

// Test 4: Check if backend routes exist
const backendFiles = [
  'backend/server.js',
  'backend/routes/chat.js'
];

let allBackendFilesExist = true;
backendFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allBackendFilesExist = false;
  }
});

console.log('\n📋 Setup Summary:');
console.log('================');

if (fs.existsSync(envPath) && allComponentsExist && allBackendFilesExist) {
  console.log('🎉 AI Chatbot setup is complete!');
  console.log('\n🚀 Next steps:');
  console.log('1. Start backend server: cd backend && npm start');
  console.log('2. Start frontend: npm start');
  console.log('3. Navigate to /user/ai-chatbot');
  console.log('4. Start chatting with your AI assistant!');
} else {
  console.log('⚠️  Setup incomplete. Please fix the issues above.');
  console.log('\n📖 See AI_CHATBOT_SETUP_GUIDE.md for detailed instructions.');
}

console.log('\n🤖 Your AI Chatbot is ready to help with farming questions!');
