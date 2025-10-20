import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
const ADMIN_EMAIL = 'joelnithushan6@gmail.com';
export const getUserRole = async (user) => {
  if (!user || !user.email) {
    return 'user';
  }
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.role || 'user';
    } else {
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
    return user.email === ADMIN_EMAIL ? 'admin' : 'user';
  }
};
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
export const isAdmin = async (user) => {
  const role = await getUserRole(user);
  return role === 'admin';
};
export const isUser = async (user) => {
  const role = await getUserRole(user);
  return role === 'user';
};
export const getDashboardRoute = async (user) => {
  const role = await getUserRole(user);
  return role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
};
export const isAdminRoute = (pathname) => {
  return pathname.startsWith('/admin');
};
export const isUserRoute = (pathname) => {
  return pathname.startsWith('/user');
};
export const getRedirectRoute = async (user, currentPath) => {
  const role = await getUserRole(user);
  if (role === 'admin' && isUserRoute(currentPath)) {
    return '/admin/dashboard';
  }
  if (role === 'user' && isAdminRoute(currentPath)) {
    return '/user/dashboard';
  }
  if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') {
    return role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
  }
  return null;
};
