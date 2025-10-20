const fs = require('fs');
const path = require('path');

// Function to fix context imports for depth-3 files
function fixDepth3ContextImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix 4-level context imports to 3-level for files at depth 3
    const patterns = [
      // Fix 4-level context imports to 3-level
      [/from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/context\/([^'"]+)['"]/g, "from '../../../context/$1'"],
    ];
    
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed depth-3 context imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Function to recursively fix context imports
function fixDepth3ContextImportsInDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixDepth3ContextImportsInDirectory(fullPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        // Check if file has 4-level context imports
        const content = fs.readFileSync(fullPath, 'utf8');
        if (/from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/context\//.test(content)) {
          fixDepth3ContextImports(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Fix depth-3 context imports in components subdirectories
fixDepth3ContextImportsInDirectory('./src/components/admin');
fixDepth3ContextImportsInDirectory('./src/components/user');
fixDepth3ContextImportsInDirectory('./src/components/common');
console.log('Fixed all depth-3 context imports!');
