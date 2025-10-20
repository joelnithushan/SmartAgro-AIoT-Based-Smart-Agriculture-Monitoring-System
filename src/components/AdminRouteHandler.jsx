import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AdminSidebar from './admin/AdminSidebar';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import OrderManagement from '../pages/admin/OrderManagement';
import DeviceManagement from '../pages/admin/DeviceManagement';
import Farms from '../pages/admin/Farms';
import AdminProfile from '../pages/admin/AdminProfile';

// FIXED: AdminRouteHandler component with proper function declaration order
const AdminRouteHandler = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // FIXED: Properly defined checkUserRole function with useCallback
  const checkUserRole = useCallback(async () => {
    console.log('checkUserRole called with user:', user?.email);
    
    if (!user) {
      console.log('No user found, setting role loading to false');
      setRoleLoading(false);
      return;
    }

    try {
      setRoleLoading(true);
      console.log('Checking if user is admin:', user.email);
      
      // Check if user is super admin (joelnithushan6@gmail.com)
      if (user.email === 'joelnithushan6@gmail.com') {
        console.log('User is super admin');
        setUserRole('admin');
        return;
      }

      // Check user role from Firestore
      const { db } = await import('../config/firebase');
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('User data from Firestore:', userData);
        
        if (userData.role === 'admin' || userData.role === 'superadmin') {
          console.log('User is admin, setting role');
          setUserRole('admin');
          return;
        }
      }
      
      // User is not admin
      console.log('Access denied: User is not admin');
      toast.error('Access denied. Admin access required.');
      navigate('/user/dashboard');
      
    } catch (error) {
      console.error('Error checking user role:', error);
      navigate('/user/dashboard');
    } finally {
      setRoleLoading(false);
    }
  }, [user, navigate]);

  // FIXED: useEffect is called AFTER the function is defined
  useEffect(() => {
    console.log('useEffect triggered, calling checkUserRole');
    checkUserRole();
  }, [checkUserRole]);

  // Show loading while checking authentication and role
  if (authLoading || roleLoading) {
    console.log('Showing loading screen, authLoading:', authLoading, 'roleLoading:', roleLoading);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    console.log('No user, redirecting to login');
    navigate('/login');
    return null;
  }

  // If not admin, redirect to user dashboard
  if (userRole !== 'admin') {
    console.log('User is not admin, redirecting to user dashboard');
    navigate('/user/dashboard');
    return null;
  }

  // Render admin routes
  const renderAdminRoute = () => {
    const path = location.pathname;
    console.log('Rendering admin route for path:', path);
    
    switch (path) {
      case '/admin/dashboard':
        return <AdminDashboard />;
      case '/admin/users':
        return <UserManagement />;
      case '/admin/orders':
        return <OrderManagement />;
      case '/admin/devices':
        return <DeviceManagement />;
      case '/admin/farms':
        return <Farms />;
      case '/admin/profile':
        return <AdminProfile />;
      default:
        // Default to dashboard if route not found
        return <AdminDashboard />;
    }
  };

  console.log('Rendering AdminSidebar with userRole:', userRole);
  return (
    <AdminSidebar>
      {renderAdminRoute()}
    </AdminSidebar>
  );
};

export default AdminRouteHandler;