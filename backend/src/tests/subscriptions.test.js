/**
 * Subscription and team management tests
 * Tests EPR client subscriptions, billing, and team features
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';

// Test database connection
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/waste-verification-test';

beforeAll(async () => {
  await mongoose.connect(MONGODB_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Subscription Management', () => {
  let eprClient;
  let authToken;

  beforeEach(async () => {
    eprClient = new User({
      email: 'eprclient@example.com',
      password: 'password123',
      role: 'epr-client',
      profile: {
        name: 'EPR Client',
        organization: 'Test Company'
      }
    });
    await eprClient.save();
    authToken = eprClient.generateAuthToken();
  });

  describe('GET /api/subscriptions/current', () => {
    test('should get current subscription details', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.tier).toBe('basic');
      expect(response.body.data.limits.tonnageLimit).toBe(100);
      expect(response.body.data.limits.canUpload).toBe(true);
      expect(response.body.data.team.canInvite).toBe(true);
    });

    test('should deny access to non-EPR clients', async () => {
      const vendor = new User({
        email: 'vendor@example.com',
        password: 'password123',
        role: 'vendor',
        profile: { name: 'Vendor' }
      });
      await vendor.save();
      const vendorToken = vendor.generateAuthToken();

      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/subscriptions/upgrade', () => {
    test('should upgrade to professional tier', async () => {
      const response = await request(app)
        .put('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tier: 'professional' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.tier).toBe('professional');
      expect(response.body.data.limits.tonnageLimit).toBe(1000);
      expect(response.body.data.subscription.features.advancedAnalytics).toBe(true);
    });

    test('should upgrade to enterprise tier', async () => {
      const response = await request(app)
        .put('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tier: 'enterprise' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.tier).toBe('enterprise');
      expect(response.body.data.limits.tonnageLimit).toBe(10000);
      expect(response.body.data.subscription.features.prioritySupport).toBe(true);
    });

    test('should fail with invalid tier', async () => {
      const response = await request(app)
        .put('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tier: 'invalid-tier' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/subscriptions/usage', () => {
    test('should get usage statistics', async () => {
      // Add some usage
      await eprClient.incrementUsage(50, 500);

      const response = await request(app)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.usage.tonnage.used).toBe(50);
      expect(response.body.data.usage.tonnage.percentage).toBe(50);
      expect(response.body.data.usage.apiCalls.used).toBe(500);
      expect(response.body.data.warnings.tonnageNearLimit).toBe(false);
    });

    test('should show warnings when near limits', async () => {
      // Use 90% of tonnage limit
      await eprClient.incrementUsage(90, 900);

      const response = await request(app)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.warnings.tonnageNearLimit).toBe(true);
      expect(response.body.data.warnings.apiNearLimit).toBe(true);
    });

    test('should show exceeded warnings', async () => {
      // Exceed limits
      await eprClient.incrementUsage(150, 1500);

      const response = await request(app)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.warnings.tonnageExceeded).toBe(true);
      expect(response.body.data.warnings.apiExceeded).toBe(true);
    });
  });
});

describe('Team Management', () => {
  let eprClient;
  let authToken;

  beforeEach(async () => {
    eprClient = new User({
      email: 'eprclient@example.com',
      password: 'password123',
      role: 'epr-client',
      profile: {
        name: 'EPR Client',
        organization: 'Test Company'
      }
    });
    await eprClient.save();
    authToken = eprClient.generateAuthToken();
  });

  describe('POST /api/subscriptions/team/invite', () => {
    test('should invite team member successfully', async () => {
      const response = await request(app)
        .post('/api/subscriptions/team/invite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'teammember@example.com',
          role: 'member',
          permissions: ['view_reports', 'upload_documents']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invitation.email).toBe('teammember@example.com');
      expect(response.body.data.invitation.role).toBe('member');

      // Check invitation was added to user
      const updatedUser = await User.findById(eprClient._id);
      expect(updatedUser.team.invitations).toHaveLength(1);
      expect(updatedUser.team.invitations[0].email).toBe('teammember@example.com');
    });

    test('should fail when team limit reached', async () => {
      // Add 3 members (basic tier limit)
      for (let i = 0; i < 3; i++) {
        eprClient.team.members.push({
          userId: new mongoose.Types.ObjectId(),
          role: 'member'
        });
      }
      await eprClient.save();

      const response = await request(app)
        .post('/api/subscriptions/team/invite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'teammember@example.com',
          role: 'member'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('limit reached');
    });

    test('should fail with duplicate invitation', async () => {
      // Send first invitation
      await request(app)
        .post('/api/subscriptions/team/invite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'teammember@example.com',
          role: 'member'
        })
        .expect(200);

      // Try to send second invitation to same email
      const response = await request(app)
        .post('/api/subscriptions/team/invite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'teammember@example.com',
          role: 'member'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('pending invitation');
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/subscriptions/team/invite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
          role: 'member'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    test('should validate role', async () => {
      const response = await request(app)
        .post('/api/subscriptions/team/invite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'teammember@example.com',
          role: 'invalid-role'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/subscriptions/team/accept-invitation', () => {
    let invitationToken;

    beforeEach(async () => {
      invitationToken = eprClient.generateTeamInvitationToken('newmember@example.com', 'member');
      await eprClient.save();
    });

    test('should accept invitation and create new user', async () => {
      const response = await request(app)
        .post('/api/subscriptions/team/accept-invitation')
        .send({
          token: invitationToken,
          email: 'newmember@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('member');

      // Check user was created
      const newUser = await User.findByEmail('newmember@example.com');
      expect(newUser).toBeTruthy();
      expect(newUser.role).toBe('epr-client');

      // Check user was added to team
      const updatedClient = await User.findById(eprClient._id);
      expect(updatedClient.team.members).toHaveLength(1);
      expect(updatedClient.team.members[0].userId.toString()).toBe(newUser._id.toString());

      // Check invitation was marked as accepted
      const invitation = updatedClient.team.invitations.find(inv => inv.email === 'newmember@example.com');
      expect(invitation.status).toBe('accepted');
    });

    test('should accept invitation for existing user', async () => {
      // Create existing user
      const existingUser = new User({
        email: 'newmember@example.com',
        password: 'password123',
        role: 'vendor',
        profile: { name: 'Existing User' }
      });
      await existingUser.save();

      const response = await request(app)
        .post('/api/subscriptions/team/accept-invitation')
        .send({
          token: invitationToken,
          email: 'newmember@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Check user was added to team
      const updatedClient = await User.findById(eprClient._id);
      expect(updatedClient.team.members).toHaveLength(1);
      expect(updatedClient.team.members[0].userId.toString()).toBe(existingUser._id.toString());
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/subscriptions/team/accept-invitation')
        .send({
          token: 'invalid-token',
          email: 'newmember@example.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });

    test('should fail with missing token', async () => {
      const response = await request(app)
        .post('/api/subscriptions/team/accept-invitation')
        .send({
          email: 'newmember@example.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/subscriptions/team', () => {
    test('should get team information', async () => {
      // Add a team member
      const teamMember = new User({
        email: 'member@example.com',
        password: 'password123',
        role: 'epr-client',
        profile: { name: 'Team Member' }
      });
      await teamMember.save();

      eprClient.team.members.push({
        userId: teamMember._id,
        role: 'member',
        permissions: ['view_reports'],
        joinedAt: new Date()
      });

      // Add a pending invitation
      eprClient.team.invitations.push({
        email: 'pending@example.com',
        role: 'viewer',
        status: 'pending',
        invitedBy: eprClient._id
      });

      await eprClient.save();

      const response = await request(app)
        .get('/api/subscriptions/team')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.members).toHaveLength(1);
      expect(response.body.data.members[0].user.email).toBe('member@example.com');
      expect(response.body.data.invitations).toHaveLength(1);
      expect(response.body.data.invitations[0].email).toBe('pending@example.com');
      expect(response.body.data.limits.maxMembers).toBe(3); // Basic tier
    });

    test('should show correct limits for professional tier', async () => {
      eprClient.subscription.tier = 'professional';
      await eprClient.save();

      const response = await request(app)
        .get('/api/subscriptions/team')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.limits.maxMembers).toBe(10);
    });
  });

  describe('PUT /api/subscriptions/team/:memberId', () => {
    let teamMember;
    let memberId;

    beforeEach(async () => {
      teamMember = new User({
        email: 'member@example.com',
        password: 'password123',
        role: 'epr-client',
        profile: { name: 'Team Member' }
      });
      await teamMember.save();

      eprClient.team.members.push({
        userId: teamMember._id,
        role: 'member',
        permissions: ['view_reports']
      });
      await eprClient.save();

      memberId = eprClient.team.members[0]._id;
    });

    test('should update team member role', async () => {
      const response = await request(app)
        .put(`/api/subscriptions/team/${memberId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'admin',
          permissions: ['view_reports', 'manage_team']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.member.role).toBe('admin');
      expect(response.body.data.member.permissions).toContain('manage_team');

      // Verify in database
      const updatedClient = await User.findById(eprClient._id);
      const member = updatedClient.team.members.id(memberId);
      expect(member.role).toBe('admin');
      expect(member.permissions).toContain('manage_team');
    });

    test('should fail with invalid member ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/subscriptions/team/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'admin'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/subscriptions/team/:memberId', () => {
    let teamMember;
    let memberId;

    beforeEach(async () => {
      teamMember = new User({
        email: 'member@example.com',
        password: 'password123',
        role: 'epr-client',
        profile: { name: 'Team Member' }
      });
      await teamMember.save();

      eprClient.team.members.push({
        userId: teamMember._id,
        role: 'member'
      });
      await eprClient.save();

      memberId = eprClient.team.members[0]._id;
    });

    test('should remove team member', async () => {
      const response = await request(app)
        .delete(`/api/subscriptions/team/${memberId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify member was removed
      const updatedClient = await User.findById(eprClient._id);
      expect(updatedClient.team.members).toHaveLength(0);
    });

    test('should fail with invalid member ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/subscriptions/team/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/subscriptions/team/invitations/:invitationId', () => {
    let invitationId;

    beforeEach(async () => {
      eprClient.team.invitations.push({
        email: 'pending@example.com',
        role: 'member',
        status: 'pending',
        invitedBy: eprClient._id
      });
      await eprClient.save();

      invitationId = eprClient.team.invitations[0]._id;
    });

    test('should cancel invitation', async () => {
      const response = await request(app)
        .delete(`/api/subscriptions/team/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify invitation was removed
      const updatedClient = await User.findById(eprClient._id);
      expect(updatedClient.team.invitations).toHaveLength(0);
    });

    test('should fail with invalid invitation ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/subscriptions/team/invitations/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });
});

describe('Subscription Limits and Usage', () => {
  let eprClient;

  beforeEach(async () => {
    eprClient = new User({
      email: 'eprclient@example.com',
      password: 'password123',
      role: 'epr-client',
      profile: {
        name: 'EPR Client'
      }
    });
    await eprClient.save();
  });

  test('should check subscription limits correctly', () => {
    const limits = eprClient.checkSubscriptionLimits();
    
    expect(limits.tonnageLimit).toBe(100);
    expect(limits.tonnageUsed).toBe(0);
    expect(limits.tonnageRemaining).toBe(100);
    expect(limits.apiLimit).toBe(1000);
    expect(limits.apiUsed).toBe(0);
    expect(limits.apiRemaining).toBe(1000);
    expect(limits.canUpload).toBe(true);
    expect(limits.canMakeApiCall).toBe(true);
  });

  test('should increment usage correctly', async () => {
    await eprClient.incrementUsage(50, 200);
    
    const limits = eprClient.checkSubscriptionLimits();
    expect(limits.tonnageUsed).toBe(50);
    expect(limits.apiUsed).toBe(200);
    expect(limits.tonnageRemaining).toBe(50);
    expect(limits.apiRemaining).toBe(800);
  });

  test('should prevent uploads when tonnage limit exceeded', async () => {
    await eprClient.incrementUsage(150, 0); // Exceed tonnage limit
    
    const limits = eprClient.checkSubscriptionLimits();
    expect(limits.canUpload).toBe(false);
    expect(limits.tonnageRemaining).toBe(0);
  });

  test('should prevent API calls when limit exceeded', async () => {
    await eprClient.incrementUsage(0, 1500); // Exceed API limit
    
    const limits = eprClient.checkSubscriptionLimits();
    expect(limits.canMakeApiCall).toBe(false);
    expect(limits.apiRemaining).toBe(0);
  });

  test('should reset monthly usage', async () => {
    // Set usage to previous month
    eprClient.subscription.usage.tonnageThisMonth = 80;
    eprClient.subscription.usage.apiCallsThisMonth = 500;
    eprClient.subscription.usage.lastResetDate = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000); // 32 days ago
    
    await eprClient.incrementUsage(10, 50);
    
    const limits = eprClient.checkSubscriptionLimits();
    expect(limits.tonnageUsed).toBe(10); // Should be reset + new usage
    expect(limits.apiUsed).toBe(50);
  });

  test('should check team invitation limits', () => {
    expect(eprClient.canInviteTeamMembers()).toBe(true);
    
    // Add members to reach basic tier limit (3)
    for (let i = 0; i < 3; i++) {
      eprClient.team.members.push({
        userId: new mongoose.Types.ObjectId(),
        role: 'member'
      });
    }
    
    expect(eprClient.canInviteTeamMembers()).toBe(false);
  });

  test('should allow more team members for professional tier', () => {
    eprClient.subscription.tier = 'professional';
    
    // Add 5 members (should still be under professional limit of 10)
    for (let i = 0; i < 5; i++) {
      eprClient.team.members.push({
        userId: new mongoose.Types.ObjectId(),
        role: 'member'
      });
    }
    
    expect(eprClient.canInviteTeamMembers()).toBe(true);
  });
});