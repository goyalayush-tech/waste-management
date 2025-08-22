/**
 * User management routes
 * Handles user profiles, role management, and subscription features
 */

import express from 'express';
import Joi from 'joi';
import User from '../models/User.js';
import { authenticate, authorize, requireOwnershipOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  profile: Joi.object({
    name: Joi.string().max(100).optional(),
    organization: Joi.string().max(200).optional(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      country: Joi.string().optional(),
      zipCode: Joi.string().optional()
    }).optional()
  }).required(),
  preferences: Joi.object({
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      push: Joi.boolean().optional()
    }).optional(),
    language: Joi.string().valid('en', 'hi', 'es', 'fr').optional(),
    timezone: Joi.string().optional()
  }).optional()
});

const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('vendor', 'buyer', 'admin', 'epr-client', 'auditor').required(),
  organization: Joi.string().optional(),
  message: Joi.string().max(500).optional()
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('vendor', 'buyer', 'admin', 'epr-client', 'auditor').required(),
  reason: Joi.string().max(200).optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'suspended', 'banned').required(),
  reason: Joi.string().max(200).optional()
});

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { profile, preferences } = value;

    // Check wallet address uniqueness if being updated
    if (profile.walletAddress && profile.walletAddress !== req.user.profile.walletAddress) {
      const existingWallet = await User.findByWalletAddress(profile.walletAddress);
      if (existingWallet && existingWallet._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address already registered'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          ...(profile && { profile: { ...req.user.profile, ...profile } }),
          ...(preferences && { preferences: { ...req.user.preferences, ...preferences } })
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      verified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1,
      role,
      status,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined
    };

    const users = await User.searchUsers(search, options);
    const total = await User.countDocuments();

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
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

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const stats = await User.getUserStats();
    
    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or own profile)
 */
router.get('/:id', authenticate, requireOwnershipOrAdmin('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
});

/**
 * @route   POST /api/users/invite
 * @desc    Invite new user (admin only)
 * @access  Private (Admin)
 */
router.post('/invite', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { error, value } = inviteUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, role, organization, message } = value;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // TODO: Send invitation email with temporary password or registration link
    console.log(`Invitation sent to ${email} for role ${role}`);
    console.log(`Organization: ${organization || 'N/A'}`);
    console.log(`Message: ${message || 'N/A'}`);

    res.json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        email,
        role,
        invitedBy: req.user.email
      }
    });

  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation'
    });
  }
});

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { error, value } = updateRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { role, reason } = value;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // TODO: Log role change in audit trail
    console.log(`Role changed for user ${user.email}: ${oldRole} -> ${role} by ${req.user.email}. Reason: ${reason || 'N/A'}`);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          oldRole
        }
      }
    });

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user status (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { status, reason } = value;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own status
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // TODO: Log status change in audit trail
    console.log(`Status changed for user ${user.email}: ${oldStatus} -> ${status} by ${req.user.email}. Reason: ${reason || 'N/A'}`);

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          status: user.status,
          oldStatus
        }
      }
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // TODO: Log user deletion in audit trail
    console.log(`User deleted: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

export default router;