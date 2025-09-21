import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HomeNavbar from './HomeNavbar';
import UserNavbar from './UserNavbar';

const SmartNavbar = () => {
  const location = useLocation();
  const { user, userRole } = useAuth();

  // Determine which navbar to show based on user role and current route
  const getNavbarComponent = () => {
    const path = location.pathname;

    // If user is not authenticated, show HomeNavbar
    if (!user) {
      return <HomeNavbar />;
    }

    // If on admin routes, don't show any navbar (AdminLayout handles navigation)
    if (path.startsWith('/admin')) {
      return null;
    }

    // If user is regular user, show UserNavbar for user routes, HomeNavbar for public routes
    if (userRole === 'user') {
      if (path.startsWith('/user') || path.startsWith('/crops')) {
        return <UserNavbar />;
      }
      return <HomeNavbar />;
    }

    // Fallback to HomeNavbar for public routes
    return <HomeNavbar />;
  };

  return getNavbarComponent();
};

export default SmartNavbar;
