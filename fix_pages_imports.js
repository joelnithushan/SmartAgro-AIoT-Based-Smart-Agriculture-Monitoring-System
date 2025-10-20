const fs = require('fs');
const path = require('path');

// Function to fix imports in pages directory
function fixPagesImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix context imports for pages directory
    const patterns = [
      [/from\s+['"]\.\.\/\.\.\/\.\.\/context\/([^'"]+)['"]/g, "from '../context/$1'"],
      [/from\s+['"]\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]/g, "from '../services/$1'"],
      [/from\s+['"]\.\.\/\.\.\/\.\.\/components\/([^'"]+)['"]/g, "from '../components/$1'"],
    ];
    
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed pages imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Function to recursively fix imports in pages directory
function fixPagesImportsInDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixPagesImportsInDirectory(fullPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        fixPagesImports(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Fix imports in the pages directory
fixPagesImportsInDirectory('./src/pages');
console.log('Pages import path fixes completed!');
