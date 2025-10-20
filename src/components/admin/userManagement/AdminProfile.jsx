import React, { useState, useEffect } from 'react';
import { 
  UserCircleIcon, 
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { usersService } from '../../../services/firebase/firestoreService';
import toast from 'react-hot-toast';
const AdminProfile = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'admin',
    photoURL: '',
    createdAt: null,
    updatedAt: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    loadProfile();
  }, [currentUser]);
  const loadProfile = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const result = await usersService.getUser(currentUser.uid);
      if (result.success && result.user) {
        setProfile({
          fullName: result.user.fullName || currentUser.displayName || '',
          email: result.user.email || currentUser.email || '',
          phone: result.user.phone || '',
          role: result.user.role || 'admin',
          photoURL: result.user.photoURL || currentUser.photoURL || '',
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt
        });
      } else {
        const defaultProfile = {
          fullName: currentUser.displayName || '',
          email: currentUser.email || '',
          phone: '',
          role: 'admin',
          photoURL: currentUser.photoURL || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await usersService.updateUser(currentUser.uid, defaultProfile);
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!currentUser) return;
    try {
      setSaving(true);
      const updatedProfile = {
        ...profile,
        updatedAt: new Date()
      };
      const result = await usersService.updateUser(currentUser.uid, updatedProfile);
      if (result.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setSaving(false);
    }
  };
  const handleCancel = () => {
    setIsEditing(false);
    loadProfile(); 
  };
  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({
          ...prev,
          photoURL: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  const getProviderName = (providerId) => {
    switch (providerId) {
      case 'google.com': return 'Google';
      case 'apple.com': return 'Apple';
      case 'password': return 'Email/Password';
      default: return 'Unknown';
    }
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
      {}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
        <p className="text-gray-600">Manage your admin account settings</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-24 h-24 text-green-600" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-2 cursor-pointer hover:bg-green-700 transition-colors">
                    <CameraIcon className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
          {}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-green-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-green-700">Your account is secured with 2FA</p>
                </div>
                <span className="text-green-600">
                  <CheckIcon className="w-5 h-5" />
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Login Provider</h4>
                  <p className="text-sm text-blue-700">
                    {getProviderName(currentUser?.providerData?.[0]?.providerId)} Authentication
                  </p>
                </div>
                <span className="text-blue-600">
                  <CheckIcon className="w-5 h-5" />
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Last Login</h4>
                  <p className="text-sm text-yellow-700">
                    {currentUser?.metadata?.lastSignInTime 
                      ? new Date(currentUser.metadata.lastSignInTime).toLocaleString()
                      : 'Unknown'
                    }
                  </p>
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
