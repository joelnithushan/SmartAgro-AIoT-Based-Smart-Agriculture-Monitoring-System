/**
 * Authentication middleware for backend routes
 */

import { admin } from '../config/firebase.js';

/**
 * Verify Firebase ID token middleware
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!admin.apps.length) {
      // Firebase not configured, use demo user for development
      req.uid = 'demo-user';
      req.user = { uid: 'demo-user', email: 'demo@example.com' };
      return next();
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    // For development, allow demo user
    if (process.env.NODE_ENV === 'development') {
      req.uid = 'demo-user';
      req.user = { uid: 'demo-user', email: 'demo@example.com' };
      return next();
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }
};

/**
 * Optional token verification (doesn't fail if no token)
 */
const optionalVerifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.uid = null;
      req.user = null;
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!admin.apps.length) {
      req.uid = 'demo-user';
      req.user = { uid: 'demo-user', email: 'demo@example.com' };
      return next();
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('Optional token verification error:', error);
    req.uid = null;
    req.user = null;
    next();
  }
};

/**
 * Admin role verification middleware
 */
const verifyAdmin = async (req, res, next) => {
  try {
    // First verify the token
    await verifyToken(req, res, (err) => {
      if (err) return next(err);
      
      // Check if user is admin
      const userEmail = req.user?.email;
      
      if (userEmail === 'joelnithushan6@gmail.com') {
        // Super admin
        req.userRole = 'superadmin';
        return next();
      }
      
      // Check custom claims for admin role
      if (req.user?.role === 'admin') {
        req.userRole = 'admin';
        return next();
      }
      
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify admin access'
    });
  }
};

export {
  verifyToken,
  optionalVerifyToken,
  verifyAdmin
};
