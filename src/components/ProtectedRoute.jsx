import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/firestoreService';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [emailVerified, setEmailVerified] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(true);

  // Check email verification status
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (currentUser && !loading) {
        let isEmailVerified = currentUser.emailVerified;
        
        // If Firebase says email is not verified, check Firestore
        if (!isEmailVerified) {
          try {
            const userDoc = await usersService.getUser(currentUser.uid);
            isEmailVerified = userDoc?.user?.emailVerified || false;
          } catch (error) {
            console.warn('Failed to check email verification status:', error);
          }
        }
        
        setEmailVerified(isEmailVerified);
        setCheckingVerification(false);
      } else if (!currentUser && !loading) {
        setEmailVerified(false);
        setCheckingVerification(false);
      }
    };

    checkEmailVerification();
  }, [currentUser, loading]);

  // Show loading spinner while checking authentication or email verification
  if (loading || checkingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but email is not verified, redirect to waiting page
  if (currentUser && emailVerified === false) {
    return <Navigate to="/waiting" state={{ 
      email: currentUser.email,
      fromProtectedRoute: true 
    }} replace />;
  }

  // If user is authenticated and email is verified, render the protected component
  return children;
};

export default ProtectedRoute;
