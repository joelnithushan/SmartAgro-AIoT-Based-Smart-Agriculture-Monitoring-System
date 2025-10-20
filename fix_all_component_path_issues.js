const fs = require('fs');
const path = require('path');

// Function to fix all component path issues
function fixAllComponentPathIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix all component path issues
    const patterns = [
      // Fix imports like ../components/common/ which go outside src from components/auth/
      [/from\s+['"]\.\.\/components\/common\/([^'"]+)['"]/g, "from '../common/$1'"],
      // Fix imports like ../../common/ from components/auth/ (should be ../common/)
      [/from\s+['"]\.\.\/\.\.\/common\/([^'"]+)['"]/g, "from '../common/$1'"],
    ];
    
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed component path issues in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Function to recursively find and fix all files
function fixAllComponentPathIssuesInDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixAllComponentPathIssuesInDirectory(fullPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        fixAllComponentPathIssues(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Fix all component path issues in src/components
fixAllComponentPathIssuesInDirectory('./src/components');
console.log('Fixed all component path issues!');
