const fs = require('fs');
const path = require('path');

// Function to fix firebase imports in a specific file
function fixFirebaseImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix firebase imports that go outside src
    const firebasePatterns = [
      [/from\s+['"]\.\.\/\.\.\/\.\.\/services\/firebase\/([^'"]+)['"]/g, "from '../../../services/firebase/$1'"],
      [/from\s+['"]\.\.\/\.\.\/services\/firebase\/([^'"]+)['"]/g, "from '../../../services/firebase/$1'"],
      [/from\s+['"]\.\.\/services\/firebase\/([^'"]+)['"]/g, "from '../../../services/firebase/$1'"],
    ];
    
    for (const [pattern, replacement] of firebasePatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed firebase imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// List of files that need fixing
const filesToFix = [
  'src/components/admin/common/AdminSidebar.jsx',
  'src/components/admin/common/ModernAdminLayout.jsx',
  'src/components/admin/dashboard/AdminDashboard.jsx',
  'src/components/admin/dashboard/AdminDashboardPage.jsx',
  'src/components/admin/deviceManagement/AdminDeviceManagement.jsx',
  'src/components/admin/deviceManagement/Devices.jsx',
  'src/components/admin/formManagement/AdminFarmDataManagement.jsx',
  'src/components/admin/formManagement/FarmDataManagement.jsx',
  'src/components/admin/orderManagement/AdminOrderManagement.jsx',
  'src/components/admin/orderManagement/OrderDetails.jsx',
  'src/components/admin/orderManagement/OrderDetailsModal.jsx',
  'src/components/admin/orderManagement/OrderManagement.jsx',
  'src/components/admin/orderManagement/UserOrders.jsx',
  'src/components/admin/userManagement/AdminProfile.jsx',
  'src/components/admin/userManagement/AdminUserManagement.jsx',
  'src/components/admin/userManagement/UserManagement.jsx',
  'src/components/auth/ForgotPassword.jsx',
  'src/components/auth/PhoneVerification.jsx',
  'src/components/auth/Register.jsx',
  'src/components/common/hooks/useAlertProcessor.js',
  'src/components/common/hooks/useDashboardStats.js',
  'src/components/common/hooks/useDeviceRealtime.js',
  'src/components/common/hooks/useRealtimeSensorData.js',
  'src/components/common/hooks/useUserDevices.js',
  'src/components/common/ui/AuthDebug.jsx',
  'src/components/common/ui/CostEstimationCard.jsx',
  'src/components/common/ui/FirebaseAvatarUpload.jsx',
  'src/components/common/ui/ProtectedRoute.jsx',
  'src/components/common/ui/UserRouteHandler.jsx',
  'src/components/layout/AdminLayout.jsx',
  'src/components/layout/UserNavbar.jsx',
  'src/components/user/alertIrrigation/AlertBell.jsx',
  'src/components/user/alertIrrigation/ManualIrrigation.jsx',
  'src/components/user/alertIrrigation/NotificationBell.jsx',
  'src/components/user/chatbot/ChatApp.jsx',
  'src/components/user/cropFertilizer/CropFertilizer.jsx',
  'src/components/user/cropFertilizer/FarmManagement.jsx',
  'src/components/user/cropFertilizer/FertilizerSchedule.jsx',
  'src/components/user/dashboard/DashboardStats.jsx',
  'src/components/user/dashboard/DeviceStatusCard.jsx',
  'src/components/user/dashboard/IoTSensorDisplay.jsx',
  'src/components/user/dashboard/RealtimeCharts.jsx',
  'src/components/user/dashboard/SensorDataDisplay.jsx',
  'src/components/user/dashboard/TrendCharts.jsx',
  'src/components/user/dashboard/UserDashboard.jsx',
  'src/components/user/dashboard/UserDashboardNew.jsx',
  'src/components/user/dashboard/WeeklyReportExport.jsx',
  'src/components/user/deviceManagement/DeviceCard.jsx',
  'src/components/user/deviceManagement/MultiStepDeviceRequest.jsx',
  'src/components/user/deviceManagement/RequestDeviceModal.jsx',
  'src/components/user/deviceManagement/UpdateRequestModal.jsx',
  'src/components/user/profile/Settings.jsx',
  'src/components/user/profile/UserProfile.jsx',
  'src/context/AuthContext.jsx',
  'src/context/CurrencyContext.jsx',
  'src/context/LanguageContext.jsx',
  'src/pages/admin/AdminProfile.jsx',
  'src/pages/admin/UserManagement.jsx',
  'src/pages/AdminDeviceManagement.jsx',
  'src/pages/AdminOrderManagement.jsx',
  'src/pages/AdminUserManagement.jsx',
  'src/pages/CropManagement.jsx',
  'src/pages/OrderManagement.jsx',
  'src/pages/ShareDevice.jsx',
  'src/pages/user/Alerts.jsx',
  'src/pages/UserOrders.jsx',
  'src/services/api/adminApi.js',
  'src/services/api/alertApi.js',
  'src/services/api/api.js',
  'src/services/api/devicesService.js',
  'src/services/api/irrigationApi.js',
  'src/services/auth/otpService.js',
  'src/services/auth/roleService.js',
  'src/services/auth/userApi.js',
  'src/services/firebase/firestoreService.js'
];

// Fix firebase imports in each file
filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fixFirebaseImportsInFile(filePath);
  }
});

console.log('Targeted firebase import path fixes completed!');
