import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import FirebaseAvatarUpload from '../../components/common/ui/FirebaseAvatarUpload';
import toast from 'react-hot-toast';
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
    
    
    // Handle invalid avatar URL (undefined, empty string, etc.)
    if (!avatarUrl) {
      console.error('Invalid avatar URL provided:', avatarUrl);
      toast.error('Invalid avatar URL');
      return;
    }
    console.log('Updating profile picture for user:', user.uid);
    console.log('Avatar URL:', avatarUrl);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const updateData = {
        photoURL: avatarUrl,
        profilePicture: avatarUrl,
        updatedAt: new Date().toISOString()
      };
      if (userSnap.exists()) {
        await updateDoc(userRef, updateData);
        console.log('Profile picture updated in existing Firestore document');
      } else {
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
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
            <p className="mt-2 text-lg text-white">
              Manage your admin account settings and profile information
            </p>
          </div>
          
          {/* Main Content - Centered */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
        <div className="bg-white shadow-lg rounded-xl border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          <div className="px-6 py-4 space-y-6">
            {/* Profile Picture - Only show upload when in edit mode */}
            {editMode && (
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">Profile Picture</label>
                <div className="flex justify-center">
                  <FirebaseAvatarUpload
                    currentAvatar={profile.profilePicture}
                    onUpload={handleAvatarUpload}
                    userId={user?.uid}
                    disabled={saving}
                  />
                </div>
              </div>
            )}
            
            {/* Display current profile picture when not in edit mode */}
            {!editMode && (
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">Profile Picture</label>
                <div className="flex justify-center">
                  <div className="relative">
                    {profile.profilePicture ? (
                      <img 
                        src={profile.profilePicture} 
                        alt="Profile" 
                        className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center border-4 border-gray-200">
                        <span className="text-2xl font-medium text-gray-700">
                          {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">Click "Edit Profile" to change your picture</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                {editMode ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200 hover:border-gray-400"
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
                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter your mobile number"
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
            {}
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
            {}
            {editMode && (
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border border-transparent rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminProfile;