const fs = require('fs');
const path = require('path');

// Function to calculate correct relative path
function calculateCorrectPath(fromFile, toDir) {
  const fromParts = fromFile.split('/').slice(0, -1); // Remove filename
  const toParts = toDir.split('/');
  
  // Remove common prefix
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
    i++;
  }
  
  // Calculate levels to go up
  const levelsUp = fromParts.length - i;
  const pathDown = toParts.slice(i);
  
  return '../'.repeat(levelsUp) + pathDown.join('/') + '/';
}

// Function to fix all imports in a file
function fixAllImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Calculate file depth from src
    const relativePath = filePath.replace(/\\/g, '/').replace('src/', '');
    
    // Fix context imports
    const correctContextPath = calculateCorrectPath(relativePath, 'context');
    const contextPattern = /from\s+['"]\.\.\/.*?\/context\/([^'"]+)['"]/g;
    if (contextPattern.test(content)) {
      content = content.replace(contextPattern, `from '${correctContextPath}$1'`);
      updated = true;
    }
    
    // Fix services imports
    const correctServicesPath = calculateCorrectPath(relativePath, 'services');
    const servicesPattern = /from\s+['"]\.\.\/.*?\/services\/([^'"]+)['"]/g;
    if (servicesPattern.test(content)) {
      content = content.replace(servicesPattern, `from '${correctServicesPath}$1'`);
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Function to recursively fix all imports
function fixAllImportsInDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixAllImportsInDirectory(fullPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        fixAllImports(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Fix all imports in src
fixAllImportsInDirectory('./src');
console.log('Comprehensive import fix completed!');
