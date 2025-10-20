import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
const AdminNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  const navLinks = [
    { path: '/admin', label: 'Admin Panel', icon: '⚙️' },
    { path: '/admin/orders', label: 'Order Management', icon: '📋' },
    { path: '/admin/users', label: 'User Management', icon: '👥' },
    { path: '/admin/devices', label: 'Device Management', icon: '📱' },
    { path: '/admin/farms', label: 'Farm Data Management', icon: '🌾' },
    { path: '/admin/profile', label: 'Profile', icon: '👤' },
  ];
  return (
    <nav className="bg-gray-50 shadow-lg sticky top-0 z-[99990] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/admin" className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-gray-800">
                  Admin Dashboard
                </span>
              </div>
            </Link>
          </div>
          {}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-white bg-blue-600 shadow-md'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
          {}
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
                  </span>
                </div>
                <span className="hidden sm:block">{currentUser?.displayName || currentUser?.email}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200">
                <Link
                  to="/"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  🏠 Back to Home
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
            {}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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
      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-white bg-blue-600 shadow-md'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-3 py-2 text-sm text-gray-500">
                {currentUser?.displayName || currentUser?.email}
              </div>
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                📊 User Dashboard
              </Link>
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                🏠 Back to Home
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
export default AdminNavbar;
