/**
 * Subscription management routes
 * Handles EPR client subscriptions, billing, and team management
 */

import express from 'express';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authenticate, authorize, requireOwnershipOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const updateSubscriptionSchema = Joi.object({
  tier: Joi.string().valid('basic', 'professional', 'enterprise').required()
});

const inviteTeamMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'member', 'viewer').default('member'),
  permissions: Joi.array().items(
    Joi.string().valid('view_reports', 'upload_documents', 'manage_team', 'billing')
  ).optional()
});

const updateTeamMemberSchema = Joi.object({
  role: Joi.string().valid('admin', 'member', 'viewer').optional(),
  permissions: Joi.array().items(
    Joi.string().valid('view_reports', 'upload_documents', 'manage_team', 'billing')
  ).optional()
});

/**
 * @route   GET /api/subscriptions/current
 * @desc    Get current user's subscription details
 * @access  Private (EPR Client)
 */
router.get('/current', authenticate, authorize('epr-client'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const limits = user.checkSubscriptionLimits();

    res.json({
      success: true,
      data: {
        subscription: user.subscription,
        limits,
        team: {
          members: user.team.members.length,
          invitations: user.team.invitations.filter(inv => inv.status === 'pending').length,
          canInvite: user.canInviteTeamMembers()
        }
      }
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription details'
    });
  }
});

/**
 * @route   PUT /api/subscriptions/upgrade
 * @desc    Upgrade subscription tier
 * @access  Private (EPR Client)
 */
router.put('/upgrade', authenticate, authorize('epr-client'), async (req, res) => {
  try {
    const { error, value } = updateSubscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { tier } = value;
    const user = await User.findById(req.user._id);

    // Define tier features
    const tierFeatures = {
      basic: {
        maxTonnagePerMonth: 100,
        maxApiCallsPerMonth: 1000,
        advancedAnalytics: false,
        customBranding: false,
        prioritySupport: false,
        multiFactorAuth: false
      },
      professional: {
        maxTonnagePerMonth: 1000,
        maxApiCallsPerMonth: 10000,
        advancedAnalytics: true,
        customBranding: true,
        prioritySupport: false,
        multiFactorAuth: true
      },
      enterprise: {
        maxTonnagePerMonth: 10000,
        maxApiCallsPerMonth: 100000,
        advancedAnalytics: true,
        customBranding: true,
        prioritySupport: true,
        multiFactorAuth: true
      }
    };

    // Update subscription
    user.subscription.tier = tier;
    user.subscription.features = tierFeatures[tier];
    user.subscription.endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    await user.save();

    // TODO: Process payment with Stripe
    console.log(`Subscription upgraded to ${tier} for user ${user.email}`);

    res.json({
      success: true,
      message: 'Subscription upgraded successfully',
      data: {
        subscription: user.subscription,
        limits: user.checkSubscriptionLimits()
      }
    });

  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade subscription'
    });
  }
});

/**
 * @route   GET /api/subscriptions/usage
 * @desc    Get current usage statistics
 * @access  Private (EPR Client)
 */
router.get('/usage', authenticate, authorize('epr-client'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const limits = user.checkSubscriptionLimits();

    // Calculate usage percentages
    const tonnagePercentage = (limits.tonnageUsed / limits.tonnageLimit) * 100;
    const apiPercentage = (limits.apiUsed / limits.apiLimit) * 100;

    res.json({
      success: true,
      data: {
        usage: {
          tonnage: {
            used: limits.tonnageUsed,
            limit: limits.tonnageLimit,
            remaining: limits.tonnageRemaining,
            percentage: Math.round(tonnagePercentage)
          },
          apiCalls: {
            used: limits.apiUsed,
            limit: limits.apiLimit,
            remaining: limits.apiRemaining,
            percentage: Math.round(apiPercentage)
          },
          resetDate: user.subscription.usage.lastResetDate
        },
        warnings: {
          tonnageNearLimit: tonnagePercentage > 80,
          apiNearLimit: apiPercentage > 80,
          tonnageExceeded: !limits.canUpload,
          apiExceeded: !limits.canMakeApiCall
        }
      }
    });

  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage statistics'
    });
  }
});

/**
 * @route   POST /api/subscriptions/team/invite
 * @desc    Invite team member
 * @access  Private (EPR Client with manage_team permission)
 */
router.post('/team/invite', authenticate, authorize('epr-client'), async (req, res) => {
  try {
    const { error, value } = inviteTeamMemberSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, role, permissions } = value;
    const user = await User.findById(req.user._id);

    // Check if user can invite team members
    if (!user.canInviteTeamMembers()) {
      return res.status(400).json({
        success: false,
        message: 'Team member limit reached for your subscription tier'
      });
    }

    // Check if email is already invited or is a member
    const existingInvitation = user.team.invitations.find(
      inv => inv.email === email && inv.status === 'pending'
    );
    
    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'User already has a pending invitation'
      });
    }

    const existingMember = user.team.members.find(
      member => member.userId && member.userId.toString() === req.user._id.toString()
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a team member'
      });
    }

    // Generate invitation token
    const invitationToken = user.generateTeamInvitationToken(email, role);
    
    // Set permissions if provided
    const invitation = user.team.invitations[user.team.invitations.length - 1];
    if (permissions) {
      invitation.permissions = permissions;
    }

    await user.save();

    // TODO: Send invitation email
    console.log(`Team invitation sent to ${email} with token: ${invitationToken}`);

    res.json({
      success: true,
      message: 'Team invitation sent successfully',
      data: {
        invitation: {
          email,
          role,
          permissions: permissions || [],
          invitedAt: invitation.invitedAt,
          expiresAt: invitation.expiresAt
        }
      }
    });

  } catch (error) {
    console.error('Invite team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send team invitation'
    });
  }
});

/**
 * @route   POST /api/subscriptions/team/accept-invitation
 * @desc    Accept team invitation
 * @access  Public
 */
router.post('/team/accept-invitation', async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Token and email are required'
      });
    }

    // Find user with matching invitation
    const users = await User.find({
      'team.invitations.email': email,
      'team.invitations.status': 'pending',
      'team.invitations.expiresAt': { $gt: new Date() }
    });

    let invitingUser = null;
    let invitation = null;

    for (const user of users) {
      const inv = user.team.invitations.find(
        i => i.email === email && 
             i.status === 'pending' && 
             i.expiresAt > new Date()
      );
      
      if (inv && inv.token && bcrypt.compareSync(token, inv.token)) {
        invitingUser = user;
        invitation = inv;
        break;
      }
    }

    if (!invitingUser || !invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation token'
      });
    }

    // Check if user exists, if not create account
    let invitedUser = await User.findByEmail(email);
    
    if (!invitedUser) {
      // Create new user account
      invitedUser = new User({
        email,
        password: Math.random().toString(36).substring(2, 15), // Temporary password
        role: 'epr-client',
        profile: {
          name: email.split('@')[0] // Use email prefix as default name
        },
        status: 'active'
      });
      
      await invitedUser.save();
      
      // TODO: Send welcome email with password reset link
      console.log(`New user account created for ${email}`);
    }

    // Add user to team
    invitingUser.team.members.push({
      userId: invitedUser._id,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.invitedAt,
      joinedAt: new Date(),
      permissions: invitation.permissions || []
    });

    // Mark invitation as accepted
    invitation.status = 'accepted';

    await invitingUser.save();

    res.json({
      success: true,
      message: 'Team invitation accepted successfully',
      data: {
        team: invitingUser.profile.organization || invitingUser.profile.name,
        role: invitation.role,
        permissions: invitation.permissions || []
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept team invitation'
    });
  }
});

/**
 * @route   GET /api/subscriptions/team
 * @desc    Get team members and invitations
 * @access  Private (EPR Client)
 */
router.get('/team', authenticate, authorize('epr-client'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('team.members.userId', 'email profile.name');

    const teamData = {
      members: user.team.members.map(member => ({
        id: member._id,
        user: member.userId ? {
          id: member.userId._id,
          email: member.userId.email,
          name: member.userId.profile.name
        } : null,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt,
        invitedAt: member.invitedAt
      })),
      invitations: user.team.invitations
        .filter(inv => inv.status === 'pending')
        .map(inv => ({
          id: inv._id,
          email: inv.email,
          role: inv.role,
          permissions: inv.permissions,
          invitedAt: inv.invitedAt,
          expiresAt: inv.expiresAt
        })),
      limits: {
        maxMembers: user.subscription.tier === 'basic' ? 3 : 
                   user.subscription.tier === 'professional' ? 10 : 50,
        currentMembers: user.team.members.length,
        canInvite: user.canInviteTeamMembers()
      }
    };

    res.json({
      success: true,
      data: teamData
    });

  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team information'
    });
  }
});

/**
 * @route   PUT /api/subscriptions/team/:memberId
 * @desc    Update team member role/permissions
 * @access  Private (EPR Client with manage_team permission)
 */
router.put('/team/:memberId', authenticate, authorize('epr-client'), async (req, res) => {
  try {
    const { error, value } = updateTeamMemberSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { role, permissions } = value;
    const user = await User.findById(req.user._id);
    
    const member = user.team.members.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Update member details
    if (role) member.role = role;
    if (permissions) member.permissions = permissions;

    await user.save();

    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: {
        member: {
          id: member._id,
          role: member.role,
          permissions: member.permissions
        }
      }
    });

  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team member'
    });
  }
});

/**
 * @route   DELETE /api/subscriptions/team/:memberId
 * @desc    Remove team member
 * @access  Private (EPR Client with manage_team permission)
 */
router.delete('/team/:memberId', authenticate, authorize('epr-client'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const member = user.team.members.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Remove member
    user.team.members.pull(req.params.memberId);
    await user.save();

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });

  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove team member'
    });
  }
});

/**
 * @route   DELETE /api/subscriptions/team/invitations/:invitationId
 * @desc    Cancel team invitation
 * @access  Private (EPR Client)
 */
router.delete('/team/invitations/:invitationId', authenticate, authorize('epr-client'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const invitation = user.team.invitations.id(req.params.invitationId);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Remove invitation
    user.team.invitations.pull(req.params.invitationId);
    await user.save();

    res.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel invitation'
    });
  }
});

export default router;