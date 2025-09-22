import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
// Removed unused imports - components are rendered via children prop

const UserRouteHandler = ({ children, routeType = 'dashboard' }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUserState = async () => {
      if (!currentUser?.uid) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if user has devices assigned in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        const hasDevices = userDoc.exists() && userDoc.data()?.devices && 
                          userDoc.data().devices.length > 0;

        // Check for device requests
        const { deviceRequestsService } = await import('../services/firestoreService');
        const requestsResult = await deviceRequestsService.getUserRequests(currentUser.uid);
        
        const hasRequests = requestsResult.success && requestsResult.requests.length > 0;
        const hasAssignedDevices = requestsResult.success && 
          requestsResult.requests.some(req => req.status === 'assigned');

        // Redirect logic based on user state
        if (routeType === 'dashboard') {
          if (!hasDevices && !hasAssignedDevices) {
            // No devices and no assigned devices -> redirect to orders
            navigate('/user/orders', { replace: true });
            return;
          } else if (hasRequests && !hasAssignedDevices) {
            // Has requests but no assigned devices -> redirect to orders
            navigate('/user/orders', { replace: true });
            return;
          }
          // Has assigned devices -> allow dashboard access
        } else if (routeType === 'alerts') {
          // Alerts page is accessible to all authenticated users
          // No special redirect logic needed
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Error checking user state:', error);
        setIsChecking(false);
      }
    };

    checkUserState();
  }, [currentUser?.uid, navigate, routeType]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
};

// Smart navigation component for post-login redirect
export const PostLoginRedirect = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!currentUser?.uid) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if user has devices assigned
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        const hasDevices = userDoc.exists() && userDoc.data()?.devices && 
                          Object.keys(userDoc.data().devices).length > 0;

        // Navigate based on device assignment status
        if (hasDevices) {
          navigate('/user/dashboard', { replace: true });
        } else {
          navigate('/user/orders', { replace: true });
        }
      } catch (error) {
        console.error('Error checking user devices for redirect:', error);
        // Default to orders page if there's an error
        navigate('/user/orders', { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    checkAndRedirect();
  }, [currentUser?.uid, navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default UserRouteHandler;
