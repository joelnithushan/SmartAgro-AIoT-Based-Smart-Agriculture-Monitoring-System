import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Import toast polyfill to ensure all methods are available
import './utils/toastPolyfill';
import { AuthProvider } from './contexts/AuthContext';
import SmartNavbar from './components/SmartNavbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRouteHandler from './components/AdminRouteHandler';
import PublicRoute from './components/PublicRoute';
import RoleGuard from './components/RoleGuard';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import WaitingPage from './pages/WaitingPage';
import UserDashboardNew from './pages/UserDashboardNew';
import AIChatbot from './pages/AIChatbot';
import CropFertilizer from './pages/user/CropFertilizer';
import UserOrders from './pages/UserOrders';
import UserProfile from './pages/UserProfile';
import ShareDevice from './pages/ShareDevice';
import Alerts from './pages/user/Alerts';
import UserRouteHandler from './components/UserRouteHandler';
import PostLoginRedirect from './components/PostLoginRedirect';
import ModernAdminDashboardPage from './pages/ModernAdminDashboardPage';
import Footer from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <SmartNavbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/modern-dashboard" element={<ModernAdminDashboardPage />} />
            
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
                    <Alerts />
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
              path="/user/ai-chatbot" 
              element={
                <RoleGuard requiredRole="user">
                  <UserRouteHandler routeType="chatbot">
                    <AIChatbot />
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
          <Footer />
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
    </AuthProvider>
  );
}

export default App;
