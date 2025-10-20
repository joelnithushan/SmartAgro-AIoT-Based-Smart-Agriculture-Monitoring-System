import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Import toast polyfill to ensure all methods are available
import './components/common/ui/toastPolyfill';
// Import i18n configuration
import './i18n';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import SmartNavbar from './components/layout/SmartNavbar';
import ProtectedRoute from './components/common/ui/ProtectedRoute';
import AdminRouteHandler from './components/admin/common/AdminRouteHandler';
import PublicRoute from './components/common/ui/PublicRoute';
import RoleGuard from './components/common/ui/RoleGuard';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import VerifyOTP from './components/auth/VerifyOTP';
import WaitingPage from './pages/WaitingPage';
import ForgotPassword from './components/auth/ForgotPassword';
import ForgotPasswordOTP from './components/auth/ForgotPasswordOTP';
import ResetPassword from './components/auth/ResetPassword';
import EmailVerification from './components/auth/EmailVerification';
import PhoneVerification from './components/auth/PhoneVerification';
import WaitingForVerification from './pages/WaitingForVerification';
import UserDashboardNew from './components/user/dashboard/UserDashboardNew';
import AgricultureChatbot from './components/AgricultureChatbot';
import CropFertilizer from './components/user/cropFertilizer/CropFertilizer';
import UserOrders from './pages/UserOrders';
import UserProfile from './pages/UserProfile';
import ShareDevice from './pages/ShareDevice';
import AlertIrrigation from './components/user/alertIrrigation/AlertIrrigation';
import UserRouteHandler from './components/common/ui/UserRouteHandler';
import PostLoginRedirect from './components/common/ui/PostLoginRedirect';
import AdminDashboard from './components/admin/dashboard/AdminDashboardPage';
import Footer from './components/layout/Footer';

// Component to conditionally render Footer
const ConditionalFooter = () => {
  const location = useLocation();
  const isChatbotPage = location.pathname === '/user/ai-chatbot' || 
                        location.pathname.includes('ai-chatbot') ||
                        location.pathname.includes('chatbot');
  
  console.log('Current path:', location.pathname, 'Is chatbot page:', isChatbotPage);
  
  if (isChatbotPage) {
    return null; // Don't render footer on chatbot page
  }
  
  return <Footer />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <CurrencyProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <SmartNavbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/modern-dashboard" element={<AdminDashboard />} />
            
            {/* Redirect old dashboard route to new user dashboard */}
            <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/verify-otp" 
              element={
                <PublicRoute>
                  <VerifyOTP />
                </PublicRoute>
              } 
            />
            <Route 
              path="/waiting" 
              element={
                <PublicRoute>
                  <WaitingPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password-otp" 
              element={
                <PublicRoute>
                  <ForgotPasswordOTP />
                </PublicRoute>
              } 
            />
            <Route 
              path="/reset-password" 
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } 
            />
            <Route 
              path="/email-verification" 
              element={
                <PublicRoute>
                  <EmailVerification />
                </PublicRoute>
              } 
            />
            <Route 
              path="/phone-verification" 
              element={
                <PublicRoute>
                  <PhoneVerification />
                </PublicRoute>
              } 
            />
            <Route 
              path="/waiting-verification" 
              element={
                <PublicRoute>
                  <WaitingForVerification />
                </PublicRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <RoleGuard requiredRole="admin">
                  <AdminRouteHandler />
                </RoleGuard>
              } 
            />
            <Route 
              path="/crops" 
              element={
                <ProtectedRoute>
                  <CropFertilizer />
                </ProtectedRoute>
              } 
            />
            
            {/* New User Routes with Role-Based Access */}
            <Route 
              path="/user/dashboard" 
              element={
                <RoleGuard requiredRole="user">
                  <UserDashboardNew />
                </RoleGuard>
              } 
            />
            <Route 
              path="/user/orders" 
              element={
                <RoleGuard requiredRole="user">
                  <UserRouteHandler routeType="orders">
                    <UserOrders />
                  </UserRouteHandler>
                </RoleGuard>
              } 
            />
            <Route 
              path="/user/devices" 
              element={
                <RoleGuard requiredRole="user">
                  <UserDashboardNew />
                </RoleGuard>
              } 
            />
            <Route 
              path="/user/crops" 
              element={
                <RoleGuard requiredRole="user">
                  <UserRouteHandler routeType="crops">
                    <CropFertilizer />
                  </UserRouteHandler>
                </RoleGuard>
              } 
            />
            <Route 
              path="/user/alerts" 
              element={
                <RoleGuard requiredRole="user">
                  <UserRouteHandler routeType="alerts">
                    <AlertIrrigation />
                  </UserRouteHandler>
                </RoleGuard>
              } 
            />
            <Route 
              path="/user/profile" 
              element={
                <RoleGuard requiredRole="user">
                  <UserRouteHandler routeType="profile">
                    <UserProfile />
                  </UserRouteHandler>
                </RoleGuard>
              } 
            />
            <Route 
              path="/user/chatbot" 
              element={
                <RoleGuard requiredRole="user">
                  <UserRouteHandler routeType="chatbot">
                    <AgricultureChatbot />
                  </UserRouteHandler>
                </RoleGuard>
              } 
            />
            
                {/* Device sharing route */}
                <Route 
                  path="/share/:deviceId" 
                  element={<ShareDevice />}
                />
                
            
            {/* Post-login redirect route */}
            <Route 
              path="/redirect" 
              element={
                <PostLoginRedirect />
              } 
            />
          </Routes>
          <ConditionalFooter />
        </div>
      </Router>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
          },
        }}
      />
          </CurrencyProvider>
          </LanguageProvider>
        </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
