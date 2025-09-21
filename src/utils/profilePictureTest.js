// Profile Picture Test Utility
// This utility helps test profile picture functionality

export const testProfilePicture = {
  // Test if profile picture is properly displayed
  checkProfilePicture: (userProfile) => {
    console.log('🧪 Testing profile picture display...');
    
    if (!userProfile) {
      console.log('❌ No user profile data found');
      return false;
    }
    
    if (userProfile.avatar) {
      console.log('✅ Profile picture URL found:', userProfile.avatar);
      
      // Test if the image loads
      const img = new Image();
      img.onload = () => {
        console.log('✅ Profile picture loads successfully');
      };
      img.onerror = () => {
        console.log('❌ Profile picture failed to load');
      };
      img.src = userProfile.avatar;
      
      return true;
    } else {
      console.log('⚠️ No profile picture URL found, will show initials');
      return false;
    }
  },
  
  // Test profile picture fallback
  checkFallback: (userProfile, currentUser) => {
    console.log('🧪 Testing profile picture fallback...');
    
    const fallbackInitial = userProfile?.fullName?.charAt(0) || 
                           currentUser?.displayName?.charAt(0) || 
                           currentUser?.email?.charAt(0) || 
                           'U';
    
    console.log('✅ Fallback initial:', fallbackInitial);
    return fallbackInitial;
  },
  
  // Test profile picture sources
  checkSources: (userProfile, currentUser) => {
    console.log('🧪 Testing profile picture sources...');
    
    const sources = {
      avatar: userProfile?.avatar,
      photoURL: userProfile?.photoURL || currentUser?.photoURL,
      profilePicture: userProfile?.profilePicture,
      displayName: userProfile?.fullName || currentUser?.displayName,
      email: currentUser?.email
    };
    
    console.log('📋 Available sources:', sources);
    
    const primarySource = sources.avatar || sources.photoURL || sources.profilePicture;
    console.log('🎯 Primary source:', primarySource ? 'Image URL' : 'Initials');
    
    return sources;
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.testProfilePicture = testProfilePicture;
}
