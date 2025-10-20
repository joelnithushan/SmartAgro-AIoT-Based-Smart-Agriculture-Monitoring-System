const fs = require('fs');
const path = require('path');

// Function to fix context imports in a specific file
function fixContextImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix context imports that go outside src
    const contextPatterns = [
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

// List of files that need fixing
const filesToFix = [
  'src/components/auth/Login.jsx',
  'src/components/auth/Register.jsx',
  'src/components/auth/ForgotPassword.jsx',
  'src/components/auth/ForgotPasswordOTP.jsx',
  'src/components/auth/ResetPassword.jsx',
  'src/components/auth/VerifyOTP.jsx',
  'src/components/auth/VerifyResetOTP.jsx',
  'src/components/auth/EmailVerification.jsx',
  'src/components/auth/EmailVerificationModal.jsx',
  'src/components/auth/EmailOTPVerificationModal.jsx',
  'src/components/auth/PhoneVerification.jsx',
  'src/components/common/ui/ProtectedRoute.jsx',
  'src/components/common/ui/PublicRoute.jsx',
  'src/components/common/ui/RoleGuard.jsx',
  'src/components/common/ui/UserRouteHandler.jsx',
  'src/components/common/ui/PostLoginRedirect.jsx',
  'src/components/common/ui/AuthDebug.jsx',
  'src/components/common/ui/CostEstimationCard.jsx',
  'src/components/common/ui/CostEstimateModal.jsx',
  'src/components/common/ui/CostEstimationPDFOnly.jsx',
  'src/components/common/ui/CostEstimationPDFViewer.jsx',
  'src/components/common/ui/CostEstimationQRViewer.jsx',
  'src/components/common/ui/FAQPanel.jsx',
  'src/components/common/ui/QRCodeScanner.jsx',
  'src/components/common/hooks/useAlertProcessor.js',
  'src/components/layout/AdminNavbar.jsx',
  'src/components/layout/AdminPanelLayout.jsx',
  'src/components/layout/HomeNavbar.jsx',
  'src/components/layout/Navbar.jsx',
  'src/components/layout/SmartNavbar.jsx',
  'src/components/layout/UserNavbar.jsx',
  'src/components/layout/UserSidebar.jsx',
  'src/components/admin/common/AdminRoute.jsx',
  'src/components/admin/common/AdminRouteHandler.jsx',
  'src/components/admin/common/AdminRouteHandler_NEW.jsx',
  'src/components/admin/common/AdminSidebar.jsx',
  'src/components/admin/orderManagement/OrderDetailsModal.jsx',
  'src/components/admin/orderManagement/UserOrders.jsx',
  'src/components/admin/userManagement/AdminProfile.jsx',
  'src/components/admin/userManagement/UserManagement.jsx',
  'src/components/user/alertIrrigation/AlertBell.jsx',
  'src/components/user/alertIrrigation/AlertForm.jsx',
  'src/components/user/alertIrrigation/AlertIrrigation.jsx',
  'src/components/user/alertIrrigation/AlertList.jsx',
  'src/components/user/alertIrrigation/AutoIrrigationEnhanced.jsx',
  'src/components/user/alertIrrigation/AutoIrrigationSwitch.jsx',
  'src/components/user/alertIrrigation/ManualIrrigation.jsx',
  'src/components/user/alertIrrigation/NotificationBell.jsx',
  'src/components/user/chatbot/AgricultureChatbot.jsx',
  'src/components/user/chatbot/ChatApp.jsx',
  'src/components/user/chatbot/ChatGPTLikeChatbot.jsx',
  'src/components/user/chatbot/ChatHistory.jsx',
  'src/components/user/chatbot/ChatWidget.jsx',
  'src/components/user/chatbot/EnhancedChatHistory.jsx',
  'src/components/user/chatbot/ModernChatbot.jsx',
  'src/components/user/chatbot/TestMessageEdit.jsx',
  'src/components/user/cropFertilizer/CropFertilizer.jsx',
  'src/components/user/cropFertilizer/FertilizerSchedule.jsx',
  'src/components/user/dashboard/Dashboard.jsx',
  'src/components/user/dashboard/SensorDataDisplay.jsx',
  'src/components/user/dashboard/UserDashboard.jsx',
  'src/components/user/dashboard/UserDashboardNew.jsx',
  'src/components/user/deviceManagement/DeviceShareModal.jsx',
  'src/components/user/deviceManagement/MultiStepDeviceRequest.jsx',
  'src/components/user/deviceManagement/RequestDeviceModal.jsx',
  'src/components/user/deviceManagement/UpdateRequestModal.jsx',
  'src/components/user/profile/Settings.jsx',
  'src/components/user/profile/UserProfile.jsx',
  'src/pages/admin/AdminProfile.jsx',
  'src/pages/admin/UserManagement.jsx',
  'src/pages/AdminDeviceManagement.jsx',
  'src/pages/AdminOrderManagement.jsx',
  'src/pages/AdminUserManagement.jsx',
  'src/pages/AIChatbot.jsx',
  'src/pages/CropManagement.jsx',
  'src/pages/OrderManagement.jsx',
  'src/pages/ShareDevice.jsx',
  'src/pages/user/Alerts.jsx',
  'src/pages/UserOrders.jsx',
  'src/pages/WaitingForVerification.jsx',
  'src/pages/WaitingPage.jsx'
];

// Fix context imports in each file
filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fixContextImportsInFile(filePath);
  }
});

console.log('Targeted context import path fixes completed!');
