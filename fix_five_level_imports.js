const fs = require('fs');
const path = require('path');

// Function to fix 5-level imports to 4-level
function fixFiveLevelImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix 5-level imports to 4-level
    const patterns = [
      // Fix 5-level service imports to 4-level
      [/from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]/g, "from '../../../../services/$1'"],
      // Fix 5-level context imports to 4-level
      [/from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/context\/([^'"]+)['"]/g, "from '../../../../context/$1'"],
    ];
    
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed 5-level imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Function to recursively fix 5-level imports
function fixFiveLevelImportsInDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixFiveLevelImportsInDirectory(fullPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        fixFiveLevelImports(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Fix 5-level imports in src
fixFiveLevelImportsInDirectory('./src');
console.log('Fixed all 5-level imports!');
