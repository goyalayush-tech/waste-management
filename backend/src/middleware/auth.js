/**
 * Authentication and authorization middleware
 * Supports multi-role access control for waste verification and EPR compliance
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

/**
 * Check if user has required role(s)
 * @param {string|string[]} roles - Required role(s)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    const userRole = req.user.role;
    const allowedRoles = roles.flat(); // Handle both single role and array of roles
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole}`
      });
    }
    
    next();
  };
};

/**
 * Check if user is verified (email + KYC)
 */
export const requireVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (!req.user.verification.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required.'
    });
  }
  
  if (req.user.verification.kycStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'KYC verification required.'
    });
  }
  
  next();
};

/**
 * Check if user owns the resource or is admin
 * @param {string} userIdField - Field name containing user ID in request params/body
 */
export const requireOwnershipOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin && resourceUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
};

/**
 * Multi-factor authentication check for enterprise features
 */
export const requireMFA = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  // Check if MFA is required for this user role
  const mfaRequiredRoles = ['admin', 'epr-client', 'auditor'];
  
  if (mfaRequiredRoles.includes(req.user.role)) {
    const mfaToken = req.header('X-MFA-Token');
    
    if (!mfaToken) {
      return res.status(403).json({
        success: false,
        message: 'Multi-factor authentication required.',
        requiresMFA: true
      });
    }
    
    // TODO: Implement MFA token verification
    // For now, we'll accept any MFA token as valid
    // In production, this should verify TOTP, SMS, or other MFA methods
  }
  
  next();
};

/**
 * Rate limiting for sensitive operations
 */
export const sensitiveOperationLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = `${req.ip}-${req.user?._id || 'anonymous'}`;
    const now = Date.now();
    
    // Clean old entries
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }
    
    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    
    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((userAttempts.firstAttempt + windowMs - now) / 1000)
      });
    }
    
    userAttempts.count++;
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without user
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.status === 'active') {
      req.user = user;
    }
    
    next();
    
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

export default {
  authenticate,
  authorize,
  requireVerification,
  requireOwnershipOrAdmin,
  requireMFA,
  sensitiveOperationLimit,
  optionalAuth
};