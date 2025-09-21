import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole, getRedirectRoute, isAdminRoute, isUserRoute } from '../services/roleService';
import toast from 'react-hot-toast';

const RoleGuard = ({ children, requiredRole = null }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [roleLoading, setRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const checkUserRoleAndRedirect = useCallback(async () => {
    if (authLoading) return;

    // If not authenticated, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setRoleLoading(true);
      const role = await getUserRole(user);
      setUserRole(role);

      // Check if user is trying to access wrong role's routes
      const redirectRoute = await getRedirectRoute(user, location.pathname);
      
      if (redirectRoute) {
        // Show access denied message for role violations
        if ((role === 'user' && isAdminRoute(location.pathname)) || 
            (role === 'admin' && isUserRoute(location.pathname))) {
          toast.error('Access denied. Redirecting to your dashboard.');
        }
        
        navigate(redirectRoute, { replace: true });
        return;
      }

      // Check if specific role is required
      if (requiredRole && role !== requiredRole) {
        toast.error('Access denied. Insufficient permissions.');
        const dashboardRoute = role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        navigate(dashboardRoute, { replace: true });
        return;
      }

    } catch (error) {
      console.error('Error checking user role:', error);
      toast.error('Error verifying permissions. Redirecting to login.');
      navigate('/login');
    } finally {
      setRoleLoading(false);
    }
  }, [authLoading, user, location.pathname, navigate]);

  useEffect(() => {
    checkUserRoleAndRedirect();
  }, [checkUserRoleAndRedirect]);

  // Show loading while checking authentication and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children
  if (!user) {
    return null;
  }

  // If specific role required and user doesn't have it, don't render
  if (requiredRole && userRole !== requiredRole) {
    return null;
  }

  return children;
};

export default RoleGuard;
