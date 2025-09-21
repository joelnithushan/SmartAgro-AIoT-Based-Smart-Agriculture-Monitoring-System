import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
// DeviceCard import removed - not used in this component
import toast from 'react-hot-toast';

const ShareDevice = () => {
  const { deviceId } = useParams();
  const { currentUser } = useAuth();
  // Removed unused device state - access info stored separately
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [ownerName, setOwnerName] = useState('');

  useEffect(() => {
    const checkDeviceAccess = async () => {
      if (!deviceId || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Check if device exists and if user has access
        const deviceDoc = await getDoc(doc(db, 'devices', deviceId));
        
        if (!deviceDoc.exists()) {
          toast.error('Device not found');
          setLoading(false);
          return;
        }

        const deviceData = deviceDoc.data();
        const isOwner = deviceData.userId === currentUser.uid;
        const isShared = deviceData.sharedWith && deviceData.sharedWith[currentUser.uid] === true;

        if (isOwner || isShared) {
          setHasAccess(true);

          // Get owner name if this is a shared device
          if (!isOwner) {
            const ownerDoc = await getDoc(doc(db, 'users', deviceData.userId));
            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data();
              setOwnerName(ownerData.displayName || ownerData.email || 'Unknown');
            }
          }
        } else {
          setHasAccess(false);
          // Get owner name for display
          const ownerDoc = await getDoc(doc(db, 'users', deviceData.userId));
          if (ownerDoc.exists()) {
            const ownerData = ownerDoc.data();
            setOwnerName(ownerData.displayName || ownerData.email || 'Device owner');
          }
        }
      } catch (error) {
        console.error('Error checking device access:', error);
        toast.error('Failed to check device access');
      } finally {
        setLoading(false);
      }
    };

    checkDeviceAccess();
  }, [deviceId, currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view this shared device.
            </p>
            <Link
              to="/login"
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 inline-block"
            >
              Login to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking device access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🚫</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to view this device. The device owner ({ownerName}) needs to share it with your account.
            </p>
            <div className="space-y-3">
              <Link
                to="/user/dashboard"
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 inline-block"
              >
                Go to Dashboard
              </Link>
              <p className="text-sm text-gray-500">
                Device ID: {deviceId}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user has access, redirect to dashboard with device selected
  return <Navigate to="/user/dashboard" state={{ selectedDeviceId: deviceId }} replace />;
};

export default ShareDevice;
