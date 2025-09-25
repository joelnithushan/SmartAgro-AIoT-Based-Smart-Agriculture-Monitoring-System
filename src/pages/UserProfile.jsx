import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { deleteUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import CloudinaryAvatarUpload from '../components/common/CloudinaryAvatarUpload';
import ConfirmModal from '../components/common/ConfirmModal';
import toast from 'react-hot-toast';
const UserProfile = () => {
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    nic: '',
    phone: '',
    location: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    nic: '',
    phone: '',
    location: ''
  });
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }
      try {
        console.log('🔍 Loading user profile data for:', currentUser.uid);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('📊 User profile data loaded:', data);
          const profileData = {
            fullName: data.fullName || '',
            email: data.email || currentUser.email || '',
            nic: data.nic || '',
            phone: data.phone || '',
            location: data.location || '',
            avatar: data.avatar || ''
          };
          setUserData(profileData);
          setFormData(profileData);
        } else {
          let initialData = {
            fullName: currentUser.displayName || '',
            email: currentUser.email || '',
            nic: '',
            phone: '',
            location: '',
            avatar: '',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          try {
            const { deviceRequestsService } = await import('../services/firestoreService');
            const requestsResult = await deviceRequestsService.getUserRequests(currentUser.uid);
            if (requestsResult.success && requestsResult.requests.length > 0) {
              const firstRequest = requestsResult.requests[0];
              console.log('📋 Found data from device request:', firstRequest);
              initialData = {
                fullName: firstRequest.fullName || currentUser.displayName || '',
                email: firstRequest.email || currentUser.email || '',
                nic: firstRequest.nic || '',
                phone: firstRequest.phone || '',
                location: firstRequest.location || '',
                avatar: currentUser.photoURL || '',
                createdAt: new Date(),
                updatedAt: new Date()
              };
            }
          } catch (error) {
            console.error('❌ Error loading from device requests:', error);
          }
          console.log('📝 Creating new user profile document');
          await setDoc(userDocRef, initialData);
          setUserData(initialData);
          setFormData(initialData);
        }
      } catch (error) {
        console.error('❌ Error loading user profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [currentUser?.uid, currentUser?.email, currentUser?.displayName]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async () => {
    if (!currentUser?.uid) return;
    setSaving(true);
    try {
      console.log('💾 Updating user profile:', formData);
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        ...formData,
        updatedAt: new Date()
      });
      setUserData(formData);
      setEditing(false);
      console.log('✅ User profile updated successfully');
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  const handleCancel = () => {
    setFormData(userData);
    setEditing(false);
  };
  const handleAvatarUpload = async (avatarUrl) => {
    if (!currentUser?.uid) {
      console.error('No user found for avatar upload');
      toast.error('User not authenticated');
      return;
    }
    if (!avatarUrl) {
      console.error('No avatar URL provided');
      toast.error('Invalid avatar URL');
      return;
    }
    console.log('Updating profile picture for user:', currentUser.uid);
    console.log('Avatar URL:', avatarUrl);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      const updateData = {
        photoURL: avatarUrl,
        profilePicture: avatarUrl,
        avatar: avatarUrl,
        updatedAt: new Date()
      };
      if (userSnap.exists()) {
        await updateDoc(userDocRef, updateData);
        console.log('Profile picture updated in existing Firestore document');
      } else {
        const newUserData = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || '',
          fullName: currentUser.displayName || '',
          phone: '',
          photoURL: avatarUrl,
          profilePicture: avatarUrl,
          avatar: avatarUrl,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await setDoc(userDocRef, newUserData);
        console.log('New user document created with profile picture');
      }
      setUserData(prev => ({
        ...prev,
        avatar: avatarUrl,
        profilePicture: avatarUrl,
        photoURL: avatarUrl,
        updatedAt: new Date()
      }));
      toast.success('Profile picture saved successfully!');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      let errorMessage = 'Failed to save profile picture';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error.code === 'not-found') {
        errorMessage = 'User document not found.';
      } else if (error.message) {
        errorMessage = `Save failed: ${error.message}`;
      }
      toast.error(errorMessage);
    }
  };
  const getAvatarInitials = () => {
    const name = formData.fullName || currentUser?.displayName || currentUser?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!currentUser) return;

    setIsDeleting(true);
    try {
      // Delete user's device requests
      try {
        const deviceRequestsQuery = query(
          collection(db, 'deviceRequests'),
          where('userId', '==', currentUser.uid)
        );
        const deviceRequestsSnapshot = await getDocs(deviceRequestsQuery);

        for (const requestDoc of deviceRequestsSnapshot.docs) {
          await deleteDoc(doc(db, 'deviceRequests', requestDoc.id));
        }
      } catch (error) {
        console.warn('Error deleting device requests:', error);
      }

      // Delete user's farms
      try {
        const farmsQuery = query(
          collection(db, 'farms'),
          where('userId', '==', currentUser.uid)
        );
        const farmsSnapshot = await getDocs(farmsQuery);

        for (const farmDoc of farmsSnapshot.docs) {
          await deleteDoc(doc(db, 'farms', farmDoc.id));
        }
      } catch (error) {
        console.warn('Error deleting farms:', error);
      }

      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));
      
      // Delete the Firebase Auth account
      await deleteUser(currentUser);
      
      toast.success('Account deactivated successfully');
      
      // Logout and redirect
      await logout();
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error deleting account:', error);
      
      // If Firestore deletion succeeded but Firebase deletion failed, still logout
      if (error.message.includes('Firebase')) {
        toast.error('Account data deleted, but there was an issue with authentication. Please sign out manually.');
        await logout();
        window.location.href = '/';
      } else {
        toast.error('Failed to deactivate account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteModal(false);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account information and personal details</p>
        </div>
        <div className="max-w-2xl">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
            <div className="px-6 py-4 space-y-6">
              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
                <CloudinaryAvatarUpload
                  currentAvatar={userData.avatar}
                  onUpload={handleAvatarUpload}
                  userId={currentUser?.uid}
                  disabled={saving}
                />
              </div>
              {}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{userData.fullName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{userData.email}</p>
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">NIC Number</label>
                  {editing ? (
                    <input
                      type="text"
                      name="nic"
                      value={formData.nic}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter your NIC number"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{userData.nic || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{userData.phone || 'Not provided'}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  {editing ? (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter your location"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{userData.location || 'Not provided'}</p>
                  )}
                </div>
              </div>
              {}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Account Information</h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <p className="mt-1 text-sm text-gray-900">{currentUser?.uid?.slice(-8)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser?.metadata?.creationTime ? 
                        new Date(currentUser.metadata.creationTime).toLocaleDateString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>
              {}
              {editing && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account Management */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Account Management</h3>
            </div>
            <div className="px-6 py-4">
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="text-sm font-medium text-gray-900">Deactivate Account</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 whitespace-nowrap flex-shrink-0"
                  >
                    {isDeleting ? 'Deleting...' : 'Deactivate Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Profile Sync</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your profile information will be automatically synced when you submit device requests. 
                  This ensures consistency across all your applications and requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteAccount}
        onConfirm={confirmDeleteAccount}
        title="Deactivate Account"
        message={`Are you sure you want to permanently delete your account? This will remove all your data including devices, orders, and profile information. This action cannot be undone.`}
        confirmText="Yes, Delete My Account"
        cancelText="Cancel"
        confirmColor="red"
        loading={isDeleting}
      />
    </div>
  );
};
export default UserProfile;
