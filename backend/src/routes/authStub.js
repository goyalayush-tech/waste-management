/**
 * Authentication Stub Routes - Minimal auth for P0 milestone
 * Provides basic login functionality without full user management
 */

import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Mock users for P0 milestone
const mockUsers = [
  {
    id: 'user_1',
    email: 'admin@example.com',
    password: 'password123', // In production, this would be hashed
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    isActive: true,
    emailVerified: true,
    companyName: 'Waste Management Corp',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      dashboard: {
        layout: 'default',
        widgets: ['waste-analysis', 'contamination-detection', 'system-stats']
      }
    }
  },
  {
    id: 'user_2',
    email: 'operator@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Operator',
    role: 'operator',
    permissions: ['read', 'write'],
    isActive: true,
    emailVerified: true,
    companyName: 'Waste Management Corp',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      dashboard: {
        layout: 'compact',
        widgets: ['waste-analysis', 'real-time-monitoring']
      }
    }
  },
  {
    id: 'user_3',
    email: 'analyst@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Analyst',
    role: 'analyst',
    permissions: ['read'],
    isActive: true,
    emailVerified: true,
    companyName: 'Environmental Solutions Ltd',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      theme: 'auto',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: true
      },
      dashboard: {
        layout: 'detailed',
        widgets: ['analytics', 'reports', 'compliance-scores']
      }
    }
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/auth-stub/login
 * Simple login for P0 milestone
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password (in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const expiresIn = rememberMe ? '30d' : '24h';
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn });
    const refreshToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30d' });

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          ...userWithoutPassword,
          lastLoginAt: new Date().toISOString()
        },
        expiresAt: new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * POST /api/auth-stub/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Find user
    const user = mockUsers.find(u => u.id === decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
    const newRefreshToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

/**
 * POST /api/auth-stub/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth-stub/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = mockUsers.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

/**
 * GET /api/auth-stub/users
 * Get all users (admin only)
 */
router.get('/users', authenticateToken, (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { limit = 50, offset = 0, search, role, isActive } = req.query;
    
    let filteredUsers = mockUsers.map(({ password, ...user }) => user);
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        (user.companyName && user.companyName.toLowerCase().includes(searchLower))
      );
    }
    
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === (isActive === 'true'));
    }
    
    // Apply pagination
    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        total,
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

export default router;