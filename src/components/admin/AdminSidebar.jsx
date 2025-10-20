import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { usersService } from '../../services/firebase/firestoreService';
import ConfirmModal from '../common/ConfirmModal';

const AdminSidebar = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const { currentUser } = useAuth();

  // Load user profile data from Firestore
  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser) {
        try {
          const result = await usersService.getUser(currentUser.uid);
          if (result.success) {
            setUserProfileData(result.user);
            console.log('AdminSidebar - User Profile Data from Firestore:', result.user);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };

    loadUserProfile();
  }, [currentUser]);

  // Debug logging for user data
  useEffect(() => {
    if (currentUser) {
      console.log('AdminSidebar - Current User Data:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        emailVerified: currentUser.emailVerified
      });
    }
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Orders', path: '/admin/orders' },
    { name: 'Devices', path: '/admin/devices' },
    { name: 'Farms', path: '/admin/farms' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ 
        backgroundImage: 'url(/images/admin-bg.jpg)',
        backgroundColor: '#C9FFD4', // Fallback color
        filter: 'blur(3px)',
        transform: 'scale(1.1)' // Slight scale to prevent edge blur artifacts
      }}
    >
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/admin/dashboard" className="text-2xl font-black text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  SmartAgro Admin
                </Link>
              </div>
            </div>

            {/* Center - Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-green-600 hover:border-b-2 hover:border-green-300'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

            {/* Right side - Profile picture and logout */}
            <div className="flex items-center space-x-4">
              {/* Profile Picture */}
              <div className="hidden md:flex md:items-center">
                <button
                  onClick={() => navigate('/admin/profile')}
                  className="flex items-center space-x-2 text-sm font-medium bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-lg px-3 py-2 transition-all duration-200"
                >
                  {(currentUser?.photoURL || userProfileData?.photoURL) ? (
                    <img 
                      src={currentUser?.photoURL || userProfileData?.photoURL} 
                      alt="Admin Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        console.log('Profile image failed to load:', currentUser?.photoURL || userProfileData?.photoURL);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold"
                    style={{ display: (currentUser?.photoURL || userProfileData?.photoURL) ? 'none' : 'flex' }}
                  >
                    {(userProfileData?.displayName || currentUser?.displayName) ? 
                      (userProfileData?.displayName || currentUser?.displayName).charAt(0).toUpperCase() : 
                      (userProfileData?.email || currentUser?.email) ? 
                        (userProfileData?.email || currentUser?.email).charAt(0).toUpperCase() : 'A'}
                  </div>
                  <span>Admin</span>
                </button>
              </div>

              {/* Logout Button */}
              <div className="hidden md:flex md:items-center">
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg px-4 py-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Logout
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 transition-all duration-200"
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'text-green-600 bg-green-50 border-l-4 border-green-600'
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <button
                onClick={() => {
                  handleLogoutClick();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="p-6 relative">
        <div className="relative z-10">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout from the admin dashboard?"
        confirmText="Yes, Logout"
        cancelText="Cancel"
        type="warning"
        confirmClass="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-lg hover:shadow-red-500/25"
      />
    </div>
  );
};

export default AdminSidebar;
