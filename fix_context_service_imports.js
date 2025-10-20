const fs = require('fs');
const path = require('path');

// Function to fix context service imports
function fixContextServiceImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix context service imports - from src/context/ it should be ../services/
    const patterns = [
      [/from\s+['"]\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]/g, "from '../services/$1'"],
    ];
    
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed context service imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Fix context service imports
const contextFiles = [
  'src/context/AuthContext.jsx',
  'src/context/CurrencyContext.jsx',
  'src/context/LanguageContext.jsx',
  'src/context/ThemeContext.jsx'
];

contextFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fixContextServiceImports(filePath);
  }
});

console.log('Fixed all context service imports!');
