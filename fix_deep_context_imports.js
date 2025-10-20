const fs = require('fs');
const path = require('path');

// Function to fix deep context imports
function fixDeepContextImports(filePath, depth) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Calculate the correct path based on depth
    const correctPath = '../'.repeat(depth) + 'context/';
    
    // Fix context imports
    const pattern = /from\s+['"]\.\.\/\.\.\/\.\.\/context\/([^'"]+)['"]/g;
    if (pattern.test(content)) {
      content = content.replace(pattern, `from '${correctPath}$1'`);
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed deep context imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Fix deep context imports for files at different depths
// Depth 4: src/components/user/dashboard/ -> need ../../../../
const depth4Files = [
  'src/components/user/dashboard/UserDashboardNew.jsx',
  'src/components/user/dashboard/UserDashboard.jsx',
  'src/components/user/dashboard/SensorDataDisplay.jsx',
  'src/components/user/dashboard/Dashboard.jsx',
  'src/components/user/cropFertilizer/CropFertilizer.jsx',
  'src/components/user/cropFertilizer/FertilizerSchedule.jsx',
  'src/components/user/chatbot/ModernChatbot.jsx',
  'src/components/user/chatbot/AgricultureChatbot.jsx',
  'src/components/user/chatbot/ChatGPTLikeChatbot.jsx',
  'src/components/user/chatbot/ChatHistory.jsx',
  'src/components/user/chatbot/ChatWidget.jsx',
  'src/components/user/chatbot/EnhancedChatHistory.jsx',
  'src/components/user/chatbot/TestMessageEdit.jsx',
  'src/components/user/alertIrrigation/AlertIrrigation.jsx',
  'src/components/user/alertIrrigation/AlertForm.jsx',
  'src/components/user/alertIrrigation/AlertList.jsx',
  'src/components/user/alertIrrigation/AlertBell.jsx',
  'src/components/user/alertIrrigation/ManualIrrigation.jsx',
  'src/components/user/alertIrrigation/NotificationBell.jsx',
  'src/components/user/alertIrrigation/AutoIrrigationEnhanced.jsx',
  'src/components/user/alertIrrigation/AutoIrrigationSwitch.jsx',
  'src/components/user/deviceManagement/RequestDeviceModal.jsx',
  'src/components/user/deviceManagement/UpdateRequestModal.jsx',
  'src/components/user/deviceManagement/MultiStepDeviceRequest.jsx',
  'src/components/user/deviceManagement/DeviceShareModal.jsx',
  'src/components/user/profile/UserProfile.jsx',
  'src/components/user/profile/Settings.jsx',
  'src/components/admin/userManagement/UserManagement.jsx',
  'src/components/admin/userManagement/AdminProfile.jsx',
  'src/components/admin/orderManagement/UserOrders.jsx',
  'src/components/admin/orderManagement/OrderDetailsModal.jsx',
  'src/components/admin/common/AdminSidebar.jsx',
  'src/components/admin/common/AdminRoute.jsx',
  'src/components/admin/common/AdminRouteHandler.jsx',
  'src/components/admin/common/AdminRouteHandler_NEW.jsx'
];

// Depth 3: src/components/auth/ -> need ../../../ (already correct)
// Depth 3: src/components/layout/ -> need ../../../ (already correct)
// Depth 3: src/components/common/ui/ -> need ../../../ (already correct)

depth4Files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fixDeepContextImports(filePath, 4);
  }
});

console.log('Fixed all deep context imports!');
