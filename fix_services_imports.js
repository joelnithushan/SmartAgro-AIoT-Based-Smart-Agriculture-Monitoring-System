const fs = require('fs');
const path = require('path');

// Function to fix services imports
function fixServicesImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix services imports
    const patterns = [
      // From src/services/firebase/ importing firebase.js
      [/from\s+['"]\.\.\/\.\.\/\.\.\/services\/firebase\/firebase['"]/g, "from './firebase'"],
      // From src/services/firebase/ importing firestoreService.js
      [/from\s+['"]\.\.\/\.\.\/\.\.\/services\/firebase\/firestoreService['"]/g, "from './firestoreService'"],
      // From src/services/auth/ importing other services
      [/from\s+['"]\.\.\/\.\.\/\.\.\/services\/firebase\/([^'"]+)['"]/g, "from '../firebase/$1'"],
      // From src/services/api/ importing firebase services
      [/from\s+['"]\.\.\/\.\.\/\.\.\/services\/firebase\/([^'"]+)['"]/g, "from '../firebase/$1'"],
    ];
    
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed services imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Function to recursively fix services imports
function fixServicesImportsInDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixServicesImportsInDirectory(fullPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        fixServicesImports(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Fix services imports
fixServicesImportsInDirectory('./src/services');
console.log('Fixed all services imports!');
