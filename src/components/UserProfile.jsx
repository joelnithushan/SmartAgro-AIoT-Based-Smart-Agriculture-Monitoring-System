import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserCircleIcon, 
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import userApi from '../services/auth/userApi';
import { db, collection, query, where, getDocs, doc, getDoc } from '../config/firebase';
import Settings from './user/profile/Settings';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    age: '',
    nicNumber: '',
    passportNumber: '',
    address: '',
    role: 'user',
    photoURL: '',
    createdAt: null,
    updatedAt: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load personal information from deviceRequest collection for specific user
  const loadProfile = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      console.log('🔍 Loading personal information from deviceRequest collection for user:', currentUser.uid);
      
      // Query deviceRequest collection for this specific user (without orderBy to avoid index requirement)
      const deviceRequestsQuery = query(
        collection(db, 'deviceRequests'),
        where('userId', '==', currentUser.uid)
      );
      
      const deviceRequestsSnapshot = await getDocs(deviceRequestsQuery);
      console.log('📋 Found device requests:', deviceRequestsSnapshot.size);
      
      let personalInfo = {
        fullName: '',
        email: '',
        mobileNumber: '',
        age: '',
        nicNumber: '',
        passportNumber: '',
        address: '',
        role: 'user',
        photoURL: currentUser.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      if (!deviceRequestsSnapshot.empty) {
        // Sort documents by createdAt to get the first (oldest) device request
        const sortedDocs = deviceRequestsSnapshot.docs.sort((a, b) => {
          const aTime = a.data().createdAt?.toDate?.() || a.data().createdAt || new Date(0);
          const bTime = b.data().createdAt?.toDate?.() || b.data().createdAt || new Date(0);
          return new Date(aTime) - new Date(bTime);
        });
        
        // Get the first (oldest) device request for this user
        const firstRequest = sortedDocs[0].data();
        console.log('📝 First device request data:', firstRequest);
        
        // Extract personal information from device request (Step 1 - Personal Details)
        personalInfo = {
          // Personal details from device request form
          fullName: firstRequest.fullName || currentUser.displayName || '',
          email: firstRequest.email || currentUser.email || '',
          mobileNumber: firstRequest.mobileNumber || '',
          age: firstRequest.age || '',
          nicNumber: firstRequest.nicNumber || '',
          passportNumber: firstRequest.passportNumber || '',
          address: firstRequest.address || '',
          
          // System information
          phone: '', // Not in device request, user can add manually
          role: 'user',
          photoURL: currentUser.photoURL || '',
          createdAt: firstRequest.createdAt || new Date(),
          updatedAt: new Date()
        };
        
        console.log('✅ Personal information extracted from device request:', personalInfo);
      } else {
        console.log('⚠️ No device requests found for user, using Firebase Auth data');
        // Fallback to Firebase Auth data if no device requests
        personalInfo = {
          fullName: currentUser.displayName || '',
          email: currentUser.email || '',
          phone: '',
          mobileNumber: '',
          age: '',
          nicNumber: '',
          passportNumber: '',
          address: '',
          role: 'user',
          photoURL: currentUser.photoURL || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      
      // Check if user has existing profile in localStorage first
      try {
        const profileKey = `userProfile_${currentUser.uid}`;
        const savedProfile = localStorage.getItem(profileKey);
        
        if (savedProfile) {
          const existingProfile = JSON.parse(savedProfile);
          console.log('📋 Found existing profile in localStorage:', existingProfile);
          
          // Merge localStorage profile with device request data (localStorage takes priority for user edits)
          personalInfo = {
            ...personalInfo,
            mobileNumber: existingProfile.mobileNumber || personalInfo.mobileNumber,
            address: existingProfile.address || personalInfo.address,
            nicNumber: existingProfile.nicNumber || personalInfo.nicNumber,
            age: existingProfile.age || personalInfo.age,
            passportNumber: existingProfile.passportNumber || personalInfo.passportNumber,
            photoURL: existingProfile.photoURL || personalInfo.photoURL,
            // Keep device request data for other fields, but allow localStorage overrides
          };
          
          console.log('📋 Updated personalInfo with localStorage data:', personalInfo);
          console.log('📋 localStorage photoURL:', existingProfile.photoURL);
          console.log('📋 Final photoURL after localStorage merge:', personalInfo.photoURL);
        }
      } catch (localError) {
        console.log('📋 No existing profile found in localStorage');
      }
      
      // Try to load from backend API (highest priority - most recent saved data)
      try {
        console.log('🔍 Attempting to load profile from backend API...');
        
        const result = await userApi.getProfile();
        console.log('📋 Found existing profile from backend API:', result.data);
        
        if (result.data) {
          const backendProfile = result.data;
          console.log('📋 Backend profile data:', backendProfile);
          console.log('📋 Backend avatarUrl field:', backendProfile.avatarUrl);
          console.log('📋 Current personalInfo photoURL:', personalInfo.photoURL);
          
          // Backend API data takes highest priority (overrides localStorage and device request)
          personalInfo = {
            ...personalInfo,
            fullName: backendProfile.firstName && backendProfile.lastName 
              ? `${backendProfile.firstName} ${backendProfile.lastName}` 
              : (backendProfile.fullName || personalInfo.fullName),
            email: backendProfile.email || personalInfo.email,
            mobileNumber: backendProfile.phone || personalInfo.mobileNumber,
            address: backendProfile.address || personalInfo.address,
            nicNumber: backendProfile.nic || personalInfo.nicNumber,
            age: backendProfile.age || personalInfo.age,
            passportNumber: backendProfile.passport || personalInfo.passportNumber,
            photoURL: backendProfile.avatarUrl || backendProfile.photoURL || personalInfo.photoURL,
            // Keep device request data for fields not in backend
          };
          
          console.log('📋 Updated personalInfo with backend data (highest priority):', personalInfo);
          console.log('📋 Final photoURL after backend merge:', personalInfo.photoURL);
          console.log('✅ Backend API data successfully loaded and applied!');
        }
      } catch (apiError) {
        console.log('📋 Backend API load failed:', apiError);
        
        // Fallback: Try direct Firestore access
        try {
          const userProfileRef = doc(db, 'userProfiles', currentUser.uid);
          const userProfileDoc = await getDoc(userProfileRef);
          
          if (userProfileDoc.exists()) {
            const existingProfile = userProfileDoc.data();
            console.log('📋 Found existing profile in userProfiles:', existingProfile);
            
            // Merge existing profile with device request data
            personalInfo = {
              ...personalInfo,
              mobileNumber: existingProfile.mobileNumber || personalInfo.mobileNumber,
              // Keep device request data for other fields
            };
          }
        } catch (firestoreError) {
          console.log('📋 No existing profile found in Firestore');
        }
      }
      
      console.log('📊 Final personal information:', personalInfo);
      setProfile(personalInfo);
      
      // Save personal information to localStorage for persistence
      try {
        const profileKey = `userProfile_${currentUser.uid}`;
        localStorage.setItem(profileKey, JSON.stringify(personalInfo));
        console.log('💾 Personal information saved to localStorage');
      } catch (localError) {
        console.warn('⚠️ Could not save personal information to localStorage:', localError);
      }
      
    } catch (error) {
      console.error('❌ Error loading personal information from device requests:', error);
      
      // Check if it's a Firestore index error
      if (error.code === 'failed-precondition') {
        console.log('⚠️ Firestore index required. Using Firebase Auth data as fallback.');
        toast.error('Database index required. Using basic profile information.');
      } else if (error.code === 'permission-denied') {
        console.log('⚠️ Permission denied. Using Firebase Auth data as fallback.');
        toast.error('Permission denied. Using basic profile information.');
      } else {
        console.log('⚠️ Unknown error. Using Firebase Auth data as fallback.');
        toast.error('Error loading profile. Using basic information.');
      }
      
        // Fallback to Firebase Auth data
        console.log('🔄 Using Firebase Auth data as fallback');
        const fallbackProfile = {
          fullName: currentUser.displayName || '',
          email: currentUser.email || '',
          mobileNumber: '',
          age: '',
          nicNumber: '',
          passportNumber: '',
          address: '',
          role: 'user',
          photoURL: currentUser.photoURL || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      setProfile(fallbackProfile);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const nameRegex = /^[A-Za-z0-9\s\-'\.][A-Za-z0-9\s\-'\.]{1,49}$/; // 2-50 chars, letters, numbers, spaces, hyphens, apostrophes, and periods
  const phoneRegex = /^(?:\+94\d{9}|0\d{9}|\+\d{7,15})$/; // +94XXXXXXXXX or 0XXXXXXXXX or international +########
  const ageValid = (val) => {
    const n = Number(val);
    return Number.isFinite(n) && n >= 0 && n <= 100;
  };
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const nicRegex = /^(?:\d{12}|\d{9}[Vv])$/; // 12 digits or 9 digits + V/v
  const passportRegex = /^[A-Za-z][0-9]{7}$/; // 1 letter + 7 digits

  const handleSave = async () => {
    if (!currentUser) {
      console.error('❌ No current user found');
      toast.error('Please log in to update your profile');
      return;
    }
    
    // Validate fields
    if (profile.fullName && !nameRegex.test(profile.fullName.trim())) {
      toast.error('Full name must contain only letters, numbers, spaces, hyphens, apostrophes, and periods (2–50 chars).');
      return;
    }
    if (profile.mobileNumber && !phoneRegex.test(String(profile.mobileNumber).trim())) {
      toast.error('Enter a valid mobile: +947XXXXXXXX, 07XXXXXXXX, or international +########.');
      return;
    }
    if (profile.age && !ageValid(profile.age)) {
      toast.error('Age must be a number between 0 and 100.');
      return;
    }
    if (profile.email && !emailRegex.test(profile.email)) {
      toast.error('Enter a valid email address.');
      return;
    }
    if (profile.nicNumber && !nicRegex.test(profile.nicNumber.trim())) {
      toast.error('NIC must be 12 digits or 9 digits followed by V/v (e.g., 200228002211 or 367120132V).');
      return;
    }
    if (profile.passportNumber && !passportRegex.test(profile.passportNumber.trim())) {
      toast.error('Passport must be 1 letter followed by 7 digits (e.g., N1234567).');
      return;
    }

    console.log('🔍 handleSave called with profile:', profile);
    console.log('🔍 Current user:', currentUser.uid);
    
    try {
      setSaving(true);
      
      const updatedProfile = {
        ...profile,
        updatedAt: new Date()
      };
      
      console.log('🔍 Saving profile locally since Firestore permissions are not working...');
      
      // Save to localStorage and update device request in database
      try {
        const profileKey = `userProfile_${currentUser.uid}`;
        localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
        console.log('✅ Profile saved to localStorage');
        
        // Try to save to database using backend API
        let apiSaveSuccess = false;
        try {
          console.log('🔍 Attempting to save user profile via backend API...');
          
          // Prepare data for backend API
          const profileData = {
            firstName: updatedProfile.fullName?.split(' ')[0] || '',
            lastName: updatedProfile.fullName?.split(' ').slice(1).join(' ') || '',
            email: updatedProfile.email,
            phone: updatedProfile.mobileNumber,
            address: updatedProfile.address,
            // Map additional fields to backend expected format
            nic: updatedProfile.nicNumber,
            age: updatedProfile.age,
            passport: updatedProfile.passportNumber
          };
          
          // Remove undefined/null values
          Object.keys(profileData).forEach(key => {
            if (profileData[key] === undefined || profileData[key] === null || profileData[key] === '') {
              delete profileData[key];
            }
          });
          
          console.log('📤 Sending profile data to backend:', profileData);
          
          // Call backend API using the service
          console.log('🔍 Calling userApi.updateProfile...');
          const result = await userApi.updateProfile(profileData);
          console.log('✅ Profile saved via backend API:', result);
          
          // Show success message for database save
          toast.success('Profile saved to database successfully!');
          apiSaveSuccess = true;
          
        } catch (apiError) {
          console.warn('⚠️ Backend API save failed:', apiError);
          console.log('📝 Profile data saved to localStorage only');
          
          // Show a warning toast that data is saved locally but not in database
          toast('Profile saved locally. Database sync failed - changes may not persist across devices.', {
            icon: '⚠️',
            duration: 4000,
          });
        }
        
        // Only show the general success message if no specific message was shown
        if (!apiSaveSuccess) {
          toast.success('Profile updated successfully');
        }
        setIsEditing(false);
        
      } catch (localError) {
        console.error('❌ Error saving to localStorage:', localError);
        throw localError;
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile. Please try again.');
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

  // Image compression function
  const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
        // Validate file size (max 500KB for base64 upload to avoid 413 errors)
        if (file.size > 500 * 1024) {
          toast.error('File size must be less than 500KB for photo upload');
          return;
        }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      try {
        // Show loading state
        toast.loading('Uploading photo...');

        // Compress image before converting to base64
        const compressedFile = await compressImage(file);
        console.log('📏 Original file size:', file.size, 'bytes');
        console.log('📏 Compressed file size:', compressedFile.size, 'bytes');

        // Convert to base64 for immediate preview and upload
        const base64Result = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            setProfile(prev => ({
              ...prev,
              photoURL: e.target.result
            }));
            resolve(e.target.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });

        // Upload to backend API (send base64 data URL)
        console.log('📤 Uploading photo to backend API...');
        console.log('📤 Base64 data length:', base64Result.length);
        console.log('📤 Base64 preview:', base64Result.substring(0, 100) + '...');
        
        const response = await fetch('/api/users/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await currentUser.getIdToken()}`
          },
          body: JSON.stringify({
            avatarUrl: base64Result
          })
        });

        console.log('📥 Photo upload response status:', response.status);
        console.log('📥 Photo upload response headers:', response.headers);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Photo uploaded successfully:', result);
          
          // Update profile with the uploaded photo URL
          const updatedProfile = {
            ...profile,
            photoURL: result.data.avatarUrl || base64Result
          };
          
          setProfile(updatedProfile);
          
          // Save to localStorage for persistence
          try {
            const profileKey = `userProfile_${currentUser.uid}`;
            localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
            console.log('💾 Photo saved to localStorage for persistence');
          } catch (localError) {
            console.warn('⚠️ Could not save photo to localStorage:', localError);
          }

          toast.success('Photo updated successfully!');
        } else {
          let errorMessage = 'Failed to upload photo to server';
          
          try {
            const errorData = await response.json();
            console.error('❌ Photo upload failed:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error('❌ Could not parse error response:', parseError);
            
            // Handle specific HTTP status codes
            if (response.status === 413) {
              errorMessage = 'Photo file is too large. Please select a smaller image.';
            } else if (response.status === 400) {
              errorMessage = 'Invalid photo format. Please select a valid image file.';
            } else if (response.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            }
          }
          
          console.error('❌ Response status:', response.status);
          
          // Still save to localStorage even if server upload fails
          try {
            const profileKey = `userProfile_${currentUser.uid}`;
            const currentProfile = { ...profile, photoURL: base64Result };
            localStorage.setItem(profileKey, JSON.stringify(currentProfile));
            console.log('💾 Photo saved to localStorage as fallback');
          } catch (localError) {
            console.warn('⚠️ Could not save photo to localStorage:', localError);
          }
          
          toast.error(`${errorMessage}, but photo is saved locally.`);
        }
      } catch (error) {
        console.error('❌ Photo upload error:', error);
        toast.error('Error uploading photo to server, but photo is saved locally.');
      }
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Debug logging
  console.log('Current profile state:', profile);
  console.log('Current user:', currentUser);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url(/images/leaves-bg.jpg)'
      }}
    >
      <div className="min-h-screen bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Centered Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('profile.title')}</h1>
            <p className="text-gray-200">{t('profile.personalInfo')}</p>
          </div>

          {/* Centered Profile Card */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white bg-opacity-95 rounded-lg shadow-lg backdrop-blur-sm border border-gray-200 p-8">
              {/* Profile Picture at Top Center */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                    {profile.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-24 h-24 text-gray-400" />
                    )}
                  </div>
                  {isEditing && (
                    <label 
                      className="absolute -bottom-2 -right-2 bg-green-600 text-white rounded-full p-3 cursor-pointer hover:bg-green-700 transition-colors"
                      title="Click to change profile picture"
                    >
                      <CameraIcon className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.fullName}</h2>
                <p className="text-gray-600 mb-4">{profile.email}</p>
              </div>

              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900">{t('profile.profileInformation')}</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    {t('profile.editProfile')}
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
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('profile.fullName')}
                    </label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      disabled={!isEditing}
                      pattern="[A-Za-z0-9\s\-'\.][A-Za-z0-9\s\-'\.]{1,49}"
                      title="Name must contain only letters, numbers, spaces, hyphens, apostrophes, and periods (2–50 characters)."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('profile.age')}
                    </label>
                    <input
                      type="number"
                      value={profile.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter age"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('profile.email')}
                    </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t('profile.emailCannotBeChanged')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={profile.mobileNumber}
                    onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter mobile number"
                    pattern="(?:\+94\d{9}|0\d{9}|\+\d{7,15})"
                    title="Valid formats: +947XXXXXXXX, 07XXXXXXXX, or international +########."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('profile.nic')}
                    </label>
                    <input
                      type="text"
                      value={profile.nicNumber}
                      onChange={(e) => handleInputChange('nicNumber', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter NIC number"
                      pattern="(?:\\d{12}|\\d{9}[Vv])"
                      title="NIC must be 12 digits or 9 digits followed by V/v (e.g., 200228002211 or 367120132V)."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      value={profile.passportNumber}
                      onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter passport number"
                      pattern="[A-Za-z][0-9]{7}"
                      title="Passport must be 1 letter followed by 7 digits (e.g., N1234567)."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.address')}
                  </label>
                  <textarea
                    value={profile.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your address"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.role')}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={profile.role}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {profile.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="mt-8">
              <div className="bg-white bg-opacity-95 rounded-lg shadow-lg backdrop-blur-sm border border-gray-200 p-8">
                <Settings />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;