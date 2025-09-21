import React, { useState } from 'react';
import toast from 'react-hot-toast';

const CloudinaryAvatarUpload = ({ currentAvatar, onUpload, userId, disabled = false }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const CLOUD_NAME = 'dedoxaqug';
  const UPLOAD_PRESET = 'smartagro_avatars'; // Upload preset for avatars

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!userId) {
      toast.error('User ID not found. Please refresh and try again.');
      return;
    }

    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      // Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'smartagro/avatars'); // Organize uploads
      formData.append('public_id', `${userId}_${Date.now()}`); // Unique public ID
      // Note: Transformations are not allowed with unsigned uploads

      console.log('Uploading to Cloudinary...');
      console.log('Cloud Name:', CLOUD_NAME);
      console.log('Upload Preset:', UPLOAD_PRESET);
      console.log('User ID:', userId);
      console.log('File Name:', file.name);
      console.log('File Size:', file.size);
      console.log('File Type:', file.type);

      // Upload to Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary API Error:', errorData);
        console.error('Response Status:', response.status);
        console.error('Response Status Text:', response.statusText);
        throw new Error(errorData.error?.message || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      const downloadURL = data.secure_url;

      console.log('Cloudinary upload successful:', data);

      // Call parent callback
      if (onUpload && typeof onUpload === 'function') {
        onUpload(downloadURL);
      }

      toast.success('Profile picture uploaded successfully!');

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      let errorMessage = 'Failed to upload profile picture';
      
      if (error.message.includes('upload_preset')) {
        errorMessage = 'Upload preset not configured. Please contact administrator.';
      } else if (error.message.includes('cloud_name')) {
        errorMessage = 'Cloudinary configuration error. Please contact administrator.';
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
          <img src={displayImage} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 20.993V24H0v-2.993A17.025 17.025 0 0112.004 15c3.906 0 7.039 1.388 9.004 3.993h-1.011zm-1.011 0c-1.965-2.605-5.098-3.993-9.004-3.993S4.97 18.388 3 20.993V24h18v-3.007zM12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.103 0 2 .897 2 2s-.897 2-2 2-2-.897-2-2 .897-2 2-2z" />
          </svg>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="cloudinary-avatar-upload" 
          className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </label>
        <input
          id="cloudinary-avatar-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
        <p className="mt-1 text-xs text-gray-500">
          JPG, PNG or GIF (max 5MB) • Powered by Cloudinary
        </p>
      </div>
    </div>
  );
};

export default CloudinaryAvatarUpload;
