const fs = require('fs');
const path = require('path');

// Function to fix all remaining import paths in a file
function fixAllRemainingImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix all remaining problematic import patterns
    const patterns = [
      // Fix context imports that go outside src
      [/from\s+['"]\.\.\/context\/([^'"]+)['"]/g, "from '../../../context/$1'"],
      [/from\s+['"]\.\.\/\.\.\/context\/([^'"]+)['"]/g, "from '../../../context/$1'"],
      [/from\s+['"]\.\.\/\.\.\/\.\.\/context\/([^'"]+)['"]/g, "from '../../../context/$1'"],
      
      // Fix services imports that go outside src
      [/from\s+['"]\.\.\/services\/([^'"]+)['"]/g, "from '../../../services/$1'"],
      [/from\s+['"]\.\.\/\.\.\/services\/([^'"]+)['"]/g, "from '../../../services/$1'"],
      [/from\s+['"]\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]/g, "from '../../../services/$1'"],
      
      // Fix firebase imports that go outside src
      [/from\s+['"]\.\.\/firebase\/([^'"]+)['"]/g, "from '../../../services/firebase/$1'"],
      [/from\s+['"]\.\.\/\.\.\/firebase\/([^'"]+)['"]/g, "from '../../../services/firebase/$1'"],
      [/from\s+['"]\.\.\/\.\.\/\.\.\/firebase\/([^'"]+)['"]/g, "from '../../../services/firebase/$1'"],
      
      // Fix auth imports that go outside src
      [/from\s+['"]\.\.\/auth\/([^'"]+)['"]/g, "from '../../../services/auth/$1'"],
      [/from\s+['"]\.\.\/\.\.\/auth\/([^'"]+)['"]/g, "from '../../../services/auth/$1'"],
      [/from\s+['"]\.\.\/\.\.\/\.\.\/auth\/([^'"]+)['"]/g, "from '../../../services/auth/$1'"],
      
      // Fix api imports that go outside src
      [/from\s+['"]\.\.\/api\/([^'"]+)['"]/g, "from '../../../services/api/$1'"],
      [/from\s+['"]\.\.\/\.\.\/api\/([^'"]+)['"]/g, "from '../../../services/api/$1'"],
      [/from\s+['"]\.\.\/\.\.\/\.\.\/api\/([^'"]+)['"]/g, "from '../../../services/api/$1'"],
      
      // Fix utils imports that go outside src
      [/from\s+['"]\.\.\/utils\/([^'"]+)['"]/g, "from '../../../components/common/validations/$1'"],
      [/from\s+['"]\.\.\/\.\.\/utils\/([^'"]+)['"]/g, "from '../../../components/common/validations/$1'"],
      [/from\s+['"]\.\.\/\.\.\/\.\.\/utils\/([^'"]+)['"]/g, "from '../../../components/common/validations/$1'"],
    ];
    
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed all remaining imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Function to recursively fix all remaining imports in directory
function fixAllRemainingImportsInDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixAllRemainingImportsInDirectory(fullPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        fixAllRemainingImports(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Fix all remaining imports in the src directory
fixAllRemainingImportsInDirectory('./src');
console.log('Final comprehensive import path fixes completed!');
