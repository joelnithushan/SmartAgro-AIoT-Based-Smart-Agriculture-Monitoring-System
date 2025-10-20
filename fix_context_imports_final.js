const fs = require('fs');
const path = require('path');

// Function to fix context imports in a file
function fixContextImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix context imports that go outside src
    const contextPatterns = [
      [/from\s+['"]\.\.\/\.\.\/\.\.\/context\/([^'"]+)['"]/g, "from '../../../context/$1'"],
      [/from\s+['"]\.\.\/\.\.\/context\/([^'"]+)['"]/g, "from '../../../context/$1'"],
      [/from\s+['"]\.\.\/context\/([^'"]+)['"]/g, "from '../../../context/$1'"],
    ];
    
    for (const [pattern, replacement] of contextPatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed context imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Function to recursively fix context imports in directory
function fixContextImportsInDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixContextImportsInDirectory(fullPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        fixContextImports(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Fix context imports in the src directory
fixContextImportsInDirectory('./src');
console.log('Context import path fixes completed!');
