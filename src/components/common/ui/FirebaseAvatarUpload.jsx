import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../../services/firebase/firebase';
import toast from 'react-hot-toast';

const FirebaseAvatarUpload = ({ currentAvatar, onUpload, userId, disabled = false }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!userId) {
      toast.error('User ID not found. Please refresh and try again.');
      return;
    }

    // Check authentication status
    const { auth } = await import('../../../services/firebase/firebase');
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error('You must be logged in to upload images. Please refresh the page and try again.');
      return;
    }

    console.log('🔍 Authentication Debug Info:');
    console.log('  Current User UID:', currentUser.uid);
    console.log('  Current User Email:', currentUser.email);
    console.log('  Target User ID:', userId);
    console.log('  UIDs Match:', currentUser.uid === userId);

    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `avatar_${userId}_${timestamp}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `avatars/${userId}/${fileName}`);
      
      console.log('🚀 Uploading to Firebase Storage...');
      console.log('  Storage Path:', `avatars/${userId}/${fileName}`);
      console.log('  File Name:', fileName);
      console.log('  File Size:', file.size);
      console.log('  File Type:', file.type);
      console.log('  File Name Pattern Check:', fileName.match(/^avatar_.*/));

      // Upload file to Firebase Storage
      const uploadResult = await uploadBytes(storageRef, file);
      console.log('Firebase Storage upload successful:', uploadResult);

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('Download URL:', downloadURL);

      // Call the callback function with the new URL
      if (onUpload && typeof onUpload === 'function') {
        await onUpload(downloadURL);
      }

      toast.success('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('❌ Firebase Storage upload error:', error);
      console.error('  Error code:', error.code);
      console.error('  Error message:', error.message);
      console.error('  Full error object:', error);
      
      let errorMessage = 'Failed to upload profile picture';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled.';
      } else if (error.code === 'storage/unknown') {
        errorMessage = 'An unknown error occurred during upload.';
      } else if (error.code === 'storage/invalid-format') {
        errorMessage = 'Invalid file format. Please use JPG, PNG, or GIF.';
      } else if (error.code === 'storage/object-not-found') {
        errorMessage = 'Storage object not found.';
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      toast.error(errorMessage);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };


  const displayImage = preview || currentAvatar;

  return (
    <div className="flex items-center space-x-4">
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
        {displayImage ? (
          <img 
            src={displayImage} 
            alt="Avatar" 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Failed to load avatar image:', displayImage);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.993A17.025 17.025 0 0112.004 15c3.906 0 7.039 1.388 9.004 3.993h-1.011zm-1.011 0c-1.965-2.605-5.098-3.993-9.004-3.993S4.97 18.388 3 20.993V24h18v-3.007zM12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.103 0 2 .897 2 2s-.897 2-2 2-2-.897-2-2 .897-2 2-2z" />
            </svg>
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <label 
          htmlFor="firebase-avatar-upload" 
          className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer ${
            disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </label>
        
        <input
          id="firebase-avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        <p className="mt-3 text-xs text-gray-500">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </div>
    </div>
  );
};

export default FirebaseAvatarUpload;
