import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getUserRole, getRedirectRoute, isAdminRoute, isUserRoute } from '../../../services/auth/roleService';
import toast from 'react-hot-toast';
const RoleGuard = ({ children, requiredRole = null }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [roleLoading, setRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [hasShownError, setHasShownError] = useState(false);
  const checkUserRoleAndRedirect = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setRoleLoading(true);
      const role = await getUserRole(user);
      setUserRole(role);
      const redirectRoute = await getRedirectRoute(user, location.pathname);
      if (redirectRoute) {
        // Only show error if user is trying to access wrong route (not from login/root)
        const isFromLoginOrRoot = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';
        
        // Completely disable error messages for login redirects
        if (!isFromLoginOrRoot && ((role === 'user' && isAdminRoute(location.pathname)) || 
            (role === 'admin' && isUserRoute(location.pathname)))) {
          // Only show error for actual unauthorized access attempts, not login redirects
          // Removed the error toast completely for now
        }
        navigate(redirectRoute, { replace: true });
        return;
      }
      if (requiredRole && role !== requiredRole) {
        if (!hasShownError) {
          toast.error('Access denied. Insufficient permissions.');
          setHasShownError(true);
        }
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
  }, [authLoading, user, location.pathname, navigate, requiredRole]);
  useEffect(() => {
    setHasShownError(false); // Reset error flag when user or location changes
    checkUserRoleAndRedirect();
  }, [checkUserRoleAndRedirect]);
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
  if (!user) {
    return null;
  }
  if (requiredRole && userRole !== requiredRole) {
    return null;
  }
  return children;
};
export default RoleGuard;
