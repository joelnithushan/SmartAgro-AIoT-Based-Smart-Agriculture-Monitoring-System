import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import AlertBell from './AlertBell';

const UserNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Real-time user profile data listener
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    console.log('🔍 Setting up real-time profile listener for:', currentUser.uid);

    const userDocRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
      try {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📊 Profile data updated:', userData);
          
          setUserProfile({
            fullName: userData.fullName || userData.displayName || '',
            email: userData.email || currentUser.email || '',
            avatar: userData.avatar || userData.photoURL || userData.profilePicture || '',
            phone: userData.phone || '',
            location: userData.location || ''
          });
        } else {
          // Fallback to currentUser data
          console.log('📝 No user document found, using currentUser data');
          setUserProfile({
            fullName: currentUser.displayName || '',
            email: currentUser.email || '',
            avatar: currentUser.photoURL || '',
            phone: '',
            location: ''
          });
        }
      } catch (error) {
        console.error('❌ Error in profile listener:', error);
        // Fallback to currentUser data
        setUserProfile({
          fullName: currentUser.displayName || '',
          email: currentUser.email || '',
          avatar: currentUser.photoURL || '',
          phone: '',
          location: ''
        });
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Profile listener error:', error);
      // Fallback to currentUser data
      setUserProfile({
        fullName: currentUser.displayName || '',
        email: currentUser.email || '',
        avatar: currentUser.photoURL || '',
        phone: '',
        location: ''
      });
      setLoading(false);
    });

    return () => {
      console.log('🔌 Cleaning up profile listener');
      unsubscribe();
    };
  }, [currentUser?.uid, currentUser?.email, currentUser?.displayName, currentUser?.photoURL]);

  const handleLogout = async () => {
    try {
      console.log('🚪 Logout button clicked');
      const result = await logout();
      console.log('🚪 Logout result:', result);
      if (result.success) {
        console.log('✅ Logout successful, navigating to home');
        navigate('/');
      } else {
        console.error('❌ Logout failed:', result.error);
        alert('Logout failed: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      alert('Logout failed: ' + error.message);
    }
  };

  const navLinks = [
    { path: '/user/dashboard', label: 'Dashboard' },
    { path: '/user/orders', label: 'Orders' },
    { path: '/user/crops', label: 'Crop & Fertilizer' },
    { path: '/user/alerts', label: 'Alert & Irrigation' },
    { path: '/user/ai-chatbot', label: 'AI Chatbot' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/user/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-black text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                SmartAgro
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-white bg-green-600 shadow-md'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            {/* Alert Bell */}
            <AlertBell />
            
            {/* Profile Avatar */}
            <Link
              to="/user/profile"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/user/profile')
                  ? 'text-white bg-green-600 shadow-md'
                  : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-green-100 flex items-center justify-center">
                {!loading && userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span 
                  className={`text-green-600 font-medium text-sm ${!loading && userProfile?.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                >
                  {userProfile?.fullName?.charAt(0) || currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden sm:block">Profile</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('🖱️ Logout button clicked (desktop)');
                handleLogout();
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-700 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200"
              type="button"
            >
              <span>Logout</span>
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-white bg-green-600 shadow-md'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Mobile Alert Bell */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-center">
                <AlertBell />
              </div>
            </div>

            {/* Mobile User Info & Logout */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-3 py-2 space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-green-100 flex items-center justify-center">
                  {!loading && userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span 
                    className={`text-green-600 font-medium text-sm ${!loading && userProfile?.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                  >
                    {userProfile?.fullName?.charAt(0) || currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {userProfile?.fullName || currentUser?.displayName || 'User'}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {userProfile?.email || currentUser?.email}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🖱️ Logout button clicked (mobile)');
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors duration-200 border border-gray-200 hover:border-red-200"
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;