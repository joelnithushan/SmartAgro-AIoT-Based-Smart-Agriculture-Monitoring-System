import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import CloudinaryAvatarUpload from '../../components/common/CloudinaryAvatarUpload';
import adminApi from '../../services/adminApi';
import toast from 'react-hot-toast';

// Ensure toast.info is available (fallback to default toast)
if (!toast.info) {
  toast.info = toast;
}

const AdminProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'admin',
    profilePicture: '',
    createdAt: '',
    updatedAt: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  });

  const fetchProfile = useCallback(async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setProfile({
          fullName: userData.displayName || userData.fullName || '',
          email: userData.email || user.email || '',
          phone: userData.phone || '',
          role: userData.role || 'admin',
          profilePicture: userData.photoURL || userData.profilePicture || '',
          createdAt: userData.createdAt || '',
          updatedAt: userData.updatedAt || ''
        });
        setFormData({
          fullName: userData.displayName || userData.fullName || '',
          phone: userData.phone || ''
        });
      } else {
        // Create profile if doesn't exist
        setProfile({
          fullName: user.displayName || '',
          email: user.email || '',
          phone: '',
          role: 'admin',
          profilePicture: user.photoURL || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setFormData({
          fullName: user.displayName || '',
          phone: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: formData.fullName,
        fullName: formData.fullName,
        phone: formData.phone,
        updatedAt: new Date().toISOString()
      });

      setProfile(prev => ({
        ...prev,
        fullName: formData.fullName,
        phone: formData.phone,
        updatedAt: new Date().toISOString()
      }));

      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (avatarUrl) => {
    if (!user) {
      console.error('No user found for avatar upload');
      toast.error('User not authenticated');
      return;
    }

    if (!avatarUrl) {
      console.error('No avatar URL provided');
      toast.error('Invalid avatar URL');
      return;
    }

    console.log('Updating profile picture for user:', user.uid);
    console.log('Avatar URL:', avatarUrl);

    try {
      const userRef = doc(db, 'users', user.uid);
      
      // First, check if user document exists
      const userSnap = await getDoc(userRef);
      
      const updateData = {
        photoURL: avatarUrl,
        profilePicture: avatarUrl,
        updatedAt: new Date().toISOString()
      };

      if (userSnap.exists()) {
        // Update existing document
        await updateDoc(userRef, updateData);
        console.log('Profile picture updated in existing Firestore document');
      } else {
        // Create new document with all required fields
        const newUserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          fullName: user.displayName || '',
          phone: '',
          role: 'admin',
          photoURL: avatarUrl,
          profilePicture: avatarUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(userRef, newUserData);
        console.log('New user document created with profile picture');
      }

      // Update local state
      setProfile(prev => ({
        ...prev,
        profilePicture: avatarUrl,
        photoURL: avatarUrl,
        updatedAt: new Date().toISOString()
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

  const handleCancel = () => {
    setFormData({
      fullName: profile.fullName,
      phone: profile.phone
    });
    setEditMode(false);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your admin account settings and profile information
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
              <CloudinaryAvatarUpload
                currentAvatar={profile.profilePicture}
                onUpload={handleAvatarUpload}
                userId={user?.uid}
                disabled={saving}
              />
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                {editMode ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.fullName || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {profile.role}
                  </span>
                </p>
              </div>
            </div>

            {/* Account Information */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Account Information</h4>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleString() : 'Unknown'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {editMode && (
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Section */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Security</h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Password</h4>
                <p className="mt-1 text-sm text-gray-600">
                  To change your password, please use the Firebase Authentication settings or contact system administrator.
                </p>
                <button
                  onClick={() => toast('Password change feature coming soon')}
                  className="mt-2 text-sm text-green-600 hover:text-green-500"
                >
                  Change Password
                </button>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Two-factor authentication is not currently enabled for your account.
                </p>
                <button
                  onClick={() => toast('2FA feature coming soon')}
                  className="mt-2 text-sm text-green-600 hover:text-green-500"
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Admin Actions</h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">System Status</h4>
                <p className="mt-1 text-sm text-gray-600">
                  View system health, active users, and performance metrics.
                </p>
                <button
                  onClick={() => toast('System status feature coming soon')}
                  className="mt-2 text-sm text-green-600 hover:text-green-500"
                >
                  View System Status
                </button>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">Backup & Export</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Export user data, orders, and system configuration.
                </p>
                <button
                  onClick={() => toast('Backup feature coming soon')}
                  className="mt-2 text-sm text-green-600 hover:text-green-500"
                >
                  Create Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;