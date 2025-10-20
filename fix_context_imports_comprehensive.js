const fs = require('fs');
const path = require('path');

// Function to fix context imports in a specific file
function fixContextImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix context imports that go outside src - use a more comprehensive approach
    const contextPatterns = [
      // Fix imports that go outside src directory
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

// Function to recursively find and fix all files with context import issues
function fixAllContextImports(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixAllContextImports(fullPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        // Check if file has problematic context imports
        const content = fs.readFileSync(fullPath, 'utf8');
        if (/from\s+['"]\.\.\/\.\.\/\.\.\/context\//.test(content)) {
          fixContextImportsInFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Fix all context imports in the src directory
fixAllContextImports('./src');
console.log('Comprehensive context import path fixes completed!');
