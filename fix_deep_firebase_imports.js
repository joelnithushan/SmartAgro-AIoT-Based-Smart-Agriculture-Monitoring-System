const fs = require('fs');
const path = require('path');

// Function to fix deep firebase imports
function fixDeepFirebaseImports(filePath, depth) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Calculate the correct path based on depth
    const correctPath = '../'.repeat(depth) + 'services/firebase/';
    
    // Fix firebase imports
    const patterns = [
      [/from\s+['"]\.\.\/\.\.\/\.\.\/services\/firebase\/([^'"]+)['"]/g, `from '${correctPath}$1'`],
    ];
    
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed deep firebase imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Function to recursively fix deep firebase imports
function fixDeepFirebaseImportsInDirectory(dirPath, baseDepth) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixDeepFirebaseImportsInDirectory(fullPath, baseDepth + 1);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        // Check if file has problematic firebase imports
        const content = fs.readFileSync(fullPath, 'utf8');
        if (/from\s+['"]\.\.\/\.\.\/\.\.\/services\/firebase\//.test(content)) {
          fixDeepFirebaseImports(fullPath, baseDepth);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Fix deep firebase imports - depth 4 for user and admin subdirectories
fixDeepFirebaseImportsInDirectory('./src/components/user', 4);
fixDeepFirebaseImportsInDirectory('./src/components/admin', 4);
fixDeepFirebaseImportsInDirectory('./src/components/layout', 3);
fixDeepFirebaseImportsInDirectory('./src/components/common', 4);
fixDeepFirebaseImportsInDirectory('./src/components/auth', 3);
fixDeepFirebaseImportsInDirectory('./src/pages', 2);

console.log('Fixed all deep firebase imports!');
