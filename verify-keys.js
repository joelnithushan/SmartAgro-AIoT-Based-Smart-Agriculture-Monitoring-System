// SmartAgro Keys Verification Script
// Run with: node verify-keys.js

const fs = require('fs');
const path = require('path');

console.log('🔍 SmartAgro Keys Verification Report');
console.log('=====================================\n');

// Check if .env files exist
function checkEnvFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${description}: Found`);
        
        // Read and check for key variables
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        const requiredVars = [
            'VITE_FIREBASE_API_KEY',
            'VITE_FIREBASE_PROJECT_ID',
            'FIREBASE_PROJECT_ID',
            'GEMINI_API_KEY',
            'CLOUDINARY_CLOUD_NAME'
        ];
        
        const foundVars = [];
        const missingVars = [];
        
        requiredVars.forEach(varName => {
            if (content.includes(varName)) {
                foundVars.push(varName);
            } else {
                missingVars.push(varName);
            }
        });
        
        if (foundVars.length > 0) {
            console.log(`   📋 Found variables: ${foundVars.join(', ')}`);
        }
        
        if (missingVars.length > 0) {
            console.log(`   ⚠️  Missing variables: ${missingVars.join(', ')}`);
        }
        
        return true;
    } else {
        console.log(`❌ ${description}: Not found`);
        return false;
    }
}

// Check Firebase configuration files
function checkFirebaseConfig() {
    console.log('\n🔥 Firebase Configuration:');
    
    const firebaseFiles = [
        { path: 'firebase.json', desc: 'Firebase project config' },
        { path: 'firestore.rules', desc: 'Firestore security rules' },
        { path: 'storage.rules', desc: 'Storage security rules' },
        { path: 'firestore.indexes.json', desc: 'Firestore indexes' },
        { path: 'backend/config/serviceAccountKey.json', desc: 'Service account key' }
    ];
    
    firebaseFiles.forEach(file => {
        if (fs.existsSync(file.path)) {
            console.log(`✅ ${file.desc}: Found`);
        } else {
            console.log(`❌ ${file.desc}: Not found`);
        }
    });
}

// Check backup files
function checkBackups() {
    console.log('\n💾 Backup Status:');
    
    const backupDir = 'backups';
    if (fs.existsSync(backupDir)) {
        const backupFolders = fs.readdirSync(backupDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        if (backupFolders.length > 0) {
            console.log(`✅ Found ${backupFolders.length} backup(s):`);
            backupFolders.forEach(folder => {
                console.log(`   📁 ${folder}`);
            });
        } else {
            console.log('⚠️  No backup folders found');
        }
    } else {
        console.log('❌ Backup directory not found');
    }
}

// Main verification
console.log('📋 Environment Files:');
checkEnvFile('env.local', 'Local environment variables');
checkEnvFile('env.example', 'Environment template');

checkFirebaseConfig();
checkBackups();

console.log('\n🎯 Summary:');
console.log('===========');

// Check critical files
const criticalFiles = [
    'env.local',
    'firebase.json',
    'firestore.rules',
    'backend/config/serviceAccountKey.json'
];

let allCriticalFound = true;
criticalFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        allCriticalFound = false;
    }
});

if (allCriticalFound) {
    console.log('✅ All critical configuration files are present');
    console.log('🚀 SmartAgro is ready for deployment');
} else {
    console.log('⚠️  Some critical files are missing');
    console.log('🔧 Please check the configuration before deployment');
}

console.log('\n💡 Tips:');
console.log('- Run backup-keys.bat or backup-keys.ps1 to create backups');
console.log('- Never commit .env files to version control');
console.log('- Store backups in a secure location');
console.log('- Rotate API keys regularly for security');

console.log('\n✨ Verification complete!');
