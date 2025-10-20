import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  ClipboardDocumentListIcon, 
  CpuChipIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import ConfirmModal from './common/ConfirmModal';

const UserSidebar = ({ children }) => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const navigation = [
    { name: t('navigation.dashboard'), href: '/user/dashboard', icon: HomeIcon, current: location.pathname === '/user/dashboard' },
    { name: t('navigation.orders'), href: '/user/orders', icon: ClipboardDocumentListIcon, current: location.pathname === '/user/orders' },
    { name: t('navigation.devices'), href: '/user/devices', icon: CpuChipIcon, current: location.pathname === '/user/devices' },
    { name: t('navigation.crops'), href: '/user/crops', icon: '🌱', current: location.pathname === '/user/crops' },
    { name: t('navigation.alerts'), href: '/user/alerts', icon: '🔔', current: location.pathname === '/user/alerts' },
    { name: t('navigation.chatbot'), href: '/user/ai-chatbot', icon: ChatBubbleLeftRightIcon, current: location.pathname === '/user/ai-chatbot' },
    { name: t('navigation.profile'), href: '/user/profile', icon: UserCircleIcon, current: location.pathname === '/user/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/user/dashboard" className="flex items-center">
            <span className="text-3xl font-bold text-green-600">SmartAgro</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const IconComponent = typeof item.icon === 'string' ? 
                () => <span className="text-xl">{item.icon}</span> : 
                item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    item.current
                      ? 'bg-green-100 text-green-700 border-r-2 border-green-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <IconComponent className={`mr-3 h-5 w-5 ${
                    item.current ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-green-600">
                  {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {currentUser?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome back, {currentUser?.displayName || currentUser?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        confirmText="Yes, Logout"
        cancelText="Cancel"
        confirmColor="red"
        type="warning"
      />
    </div>
  );
};

export default UserSidebar;
