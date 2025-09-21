#!/usr/bin/env node

/**
 * SmartAgro Backend Server Startup Script
 * This script starts the backend server with proper environment setup
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting SmartAgro Backend Server...');

// Check if .env file exists
const envPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found in backend directory');
  console.log('📝 Please create backend/.env file with the following variables:');
  console.log('');
  console.log('GEMINI_API_KEY=your-gemini-api-key-here');
  console.log('FIREBASE_PROJECT_ID=your-firebase-project-id');
  console.log('FIREBASE_CLIENT_EMAIL=your-firebase-client-email');
  console.log('FIREBASE_PRIVATE_KEY="your-firebase-private-key"');
  console.log('PORT=5000');
  console.log('NODE_ENV=development');
  console.log('FRONTEND_URL=http://localhost:3000');
  console.log('');
  console.log('💡 You can copy from env-example.txt and fill in your values');
  process.exit(1);
}

// Start the backend server
const serverPath = path.join(__dirname, 'backend', 'server.js');
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'backend')
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🛑 Server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});
