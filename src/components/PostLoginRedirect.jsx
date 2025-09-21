import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRoute } from '../services/roleService';

const PostLoginRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectUser = async () => {
      if (loading) return;

      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const dashboardRoute = await getDashboardRoute(user);
        navigate(dashboardRoute, { replace: true });
      } catch (error) {
        console.error('Error determining redirect route:', error);
        // Fallback to user dashboard
        navigate('/user/dashboard', { replace: true });
      }
    };

    redirectUser();
  }, [user, loading, navigate]);

  // Show loading while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default PostLoginRedirect;
