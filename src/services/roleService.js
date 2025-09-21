import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Admin email configuration
const ADMIN_EMAIL = 'joelnithushan6@gmail.com';

/**
 * Get user role from Firebase or determine based on email
 * @param {Object} user - Firebase user object
 * @returns {Promise<string>} - User role ('admin' or 'user')
 */
export const getUserRole = async (user) => {
  if (!user || !user.email) {
    return 'user';
  }

  try {
    // Check if user document exists in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.role || 'user';
    } else {
      // Create user document with appropriate role
      const role = user.email === ADMIN_EMAIL ? 'admin' : 'user';
      await setDoc(userRef, {
        email: user.email,
        fullName: user.displayName || '',
        role: role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return role;
    }
  } catch (error) {
    console.error('Error getting user role:', error);
    // Fallback to email-based role determination
    return user.email === ADMIN_EMAIL ? 'admin' : 'user';
  }
};

/**
 * Update user role in Firebase
 * @param {string} userId - User UID
 * @param {string} role - New role ('admin' or 'user')
 * @returns {Promise<boolean>} - Success status
 */
export const updateUserRole = async (userId, role) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: role,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
};

/**
 * Check if user is admin
 * @param {Object} user - Firebase user object
 * @returns {Promise<boolean>} - Is admin status
 */
export const isAdmin = async (user) => {
  const role = await getUserRole(user);
  return role === 'admin';
};

/**
 * Check if user is regular user
 * @param {Object} user - Firebase user object
 * @returns {Promise<boolean>} - Is user status
 */
export const isUser = async (user) => {
  const role = await getUserRole(user);
  return role === 'user';
};

/**
 * Get the appropriate dashboard route for user
 * @param {Object} user - Firebase user object
 * @returns {Promise<string>} - Dashboard route
 */
export const getDashboardRoute = async (user) => {
  const role = await getUserRole(user);
  return role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
};

/**
 * Check if route is admin-only
 * @param {string} pathname - Current route path
 * @returns {boolean} - Is admin route
 */
export const isAdminRoute = (pathname) => {
  return pathname.startsWith('/admin');
};

/**
 * Check if route is user-only
 * @param {string} pathname - Current route path
 * @returns {boolean} - Is user route
 */
export const isUserRoute = (pathname) => {
  return pathname.startsWith('/user');
};

/**
 * Get the correct redirect route based on user role and current path
 * @param {Object} user - Firebase user object
 * @param {string} currentPath - Current route path
 * @returns {Promise<string>} - Redirect route
 */
export const getRedirectRoute = async (user, currentPath) => {
  const role = await getUserRole(user);
  
  // If user is admin and trying to access user routes
  if (role === 'admin' && isUserRoute(currentPath)) {
    return '/admin/dashboard';
  }
  
  // If user is regular user and trying to access admin routes
  if (role === 'user' && isAdminRoute(currentPath)) {
    return '/user/dashboard';
  }
  
  // If accessing root or login, redirect to appropriate dashboard
  if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') {
    return role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
  }
  
  // No redirect needed
  return null;
};
