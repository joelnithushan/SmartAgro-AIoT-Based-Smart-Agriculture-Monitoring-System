const fs = require('fs');
const path = require('path');

// Function to fix incorrect component imports in a specific file
function fixIncorrectComponentImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix incorrect component imports
    const patterns = [
      // Fix imports like ../../components/ which would go outside src
      [/from\s+['"]\.\.\/\.\.\/components\/([^'"]+)['"]/g, "from '../$1'"],
      [/from\s+['"]\.\.\/\.\.\/\.\.\/components\/([^'"]+)['"]/g, "from '../../$1'"],
    ];
    
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed incorrect component imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// List of files that need fixing
const filesToFix = [
  'src/components/auth/Login.jsx',
  'src/components/admin/deviceManagement/DeviceManagement.jsx',
  'src/components/admin/deviceManagement/Devices.jsx',
  'src/components/admin/formManagement/Farms.jsx',
  'src/components/admin/orderManagement/OrderManagement.jsx',
  'src/components/user/alertIrrigation/AlertIrrigation.jsx',
  'src/components/user/alertIrrigation/RelayControl.jsx',
  'src/components/user/alertIrrigation/SmartIrrigationSystem.jsx',
  'src/components/user/chatbot/ModernChatbot.jsx',
  'src/components/user/cropFertilizer/CropFertilizer.jsx',
  'src/components/user/dashboard/Dashboard.jsx',
  'src/components/user/dashboard/EnhancedDashboardStats.jsx',
  'src/components/user/profile/DeviceSwitcherInProfile.jsx',
  'src/components/user/profile/Profile.jsx',
  'src/pages/admin/AdminProfile.jsx',
  'src/pages/admin/UserManagement.jsx'
];

// Fix incorrect component imports in each file
filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fixIncorrectComponentImports(filePath);
  }
});

console.log('Fixed all incorrect component imports!');
