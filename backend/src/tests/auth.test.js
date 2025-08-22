/**
 * Authentication and authorization tests
 * Tests multi-role authentication, JWT tokens, and security features
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
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

describe('Authentication System', () => {
  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      role: 'vendor',
      profile: {
        name: 'Test User',
        organization: 'Test Org'
      }
    };

    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.role).toBe(validUserData.role);
      expect(response.body.data.token).toBeDefined();

      // Check user was created in database
      const user = await User.findByEmail(validUserData.email);
      expect(user).toBeTruthy();
      expect(user.profile.name).toBe(validUserData.profile.name);
    });

    test('should register EPR client with correct role', async () => {
      const eprClientData = {
        ...validUserData,
        email: 'eprclient@example.com',
        role: 'epr-client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(eprClientData)
        .expect(201);

      expect(response.body.data.user.role).toBe('epr-client');
      
      const user = await User.findByEmail(eprClientData.email);
      expect(user.subscription.tier).toBe('basic');
      expect(user.subscription.features.maxTonnagePerMonth).toBe(100);
    });

    test('should register auditor with correct role', async () => {
      const auditorData = {
        ...validUserData,
        email: 'auditor@example.com',
        role: 'auditor'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(auditorData)
        .expect(201);

      expect(response.body.data.user.role).toBe('auditor');
    });

    test('should fail with invalid email', async () => {
      const invalidData = {
        ...validUserData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    test('should fail with short password', async () => {
      const invalidData = {
        ...validUserData,
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    test('should fail with invalid role', async () => {
      const invalidData = {
        ...validUserData,
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    test('should fail with duplicate wallet address', async () => {
      const userData1 = {
        ...validUserData,
        profile: {
          ...validUserData.profile,
          walletAddress: '0x1234567890123456789012345678901234567890'
        }
      };

      const userData2 = {
        ...validUserData,
        email: 'test2@example.com',
        profile: {
          ...validUserData.profile,
          walletAddress: '0x1234567890123456789012345678901234567890'
        }
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData1)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData2)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Wallet address');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        email: 'test@example.com',
        password: 'password123',
        role: 'vendor',
        profile: {
          name: 'Test User'
        }
      });
      await testUser.save();
    });

    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();

      // Verify JWT token
      const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET || 'fallback-secret');
      expect(decoded.email).toBe('test@example.com');
    });

    test('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should fail with inactive account', async () => {
      testUser.status = 'inactive';
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not active');
    });

    test('should require MFA for admin users', async () => {
      testUser.role = 'admin';
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.requiresMFA).toBe(true);
    });

    test('should require MFA for EPR clients', async () => {
      testUser.role = 'epr-client';
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.requiresMFA).toBe(true);
    });

    test('should accept MFA token for enterprise roles', async () => {
      testUser.role = 'admin';
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          mfaToken: '123456'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('should update login stats', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.stats.lastLoginAt).toBeDefined();
      expect(updatedUser.stats.loginCount).toBe(1);
    });
  });

  describe('Authentication Middleware', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = new User({
        email: 'test@example.com',
        password: 'password123',
        role: 'vendor',
        profile: {
          name: 'Test User'
        }
      });
      await testUser.save();
      authToken = testUser.generateAuthToken();
    });

    test('should authenticate valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    test('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    test('should reject invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalid format');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
    });

    test('should reject token for inactive user', async () => {
      testUser.status = 'inactive';
      await testUser.save();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not active');
    });
  });

  describe('Role-based Authorization', () => {
    let vendorUser, adminUser, eprClientUser, auditorUser;
    let vendorToken, adminToken, eprClientToken, auditorToken;

    beforeEach(async () => {
      vendorUser = new User({
        email: 'vendor@example.com',
        password: 'password123',
        role: 'vendor',
        profile: { name: 'Vendor User' }
      });
      await vendorUser.save();
      vendorToken = vendorUser.generateAuthToken();

      adminUser = new User({
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        profile: { name: 'Admin User' }
      });
      await adminUser.save();
      adminToken = adminUser.generateAuthToken();

      eprClientUser = new User({
        email: 'eprclient@example.com',
        password: 'password123',
        role: 'epr-client',
        profile: { name: 'EPR Client User' }
      });
      await eprClientUser.save();
      eprClientToken = eprClientUser.generateAuthToken();

      auditorUser = new User({
        email: 'auditor@example.com',
        password: 'password123',
        role: 'auditor',
        profile: { name: 'Auditor User' }
      });
      await auditorUser.save();
      auditorToken = auditorUser.generateAuthToken();
    });

    test('should allow admin to access user stats', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
    });

    test('should deny vendor access to user stats', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    test('should allow user to access own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${vendorUser._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('vendor@example.com');
    });

    test('should deny user access to other user profiles', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('own resources');
    });

    test('should allow admin to access any user profile', async () => {
      const response = await request(app)
        .get(`/api/users/${vendorUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('vendor@example.com');
    });
  });

  describe('Password Management', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = new User({
        email: 'test@example.com',
        password: 'password123',
        role: 'vendor',
        profile: {
          name: 'Test User'
        }
      });
      await testUser.save();
      authToken = testUser.generateAuthToken();
    });

    test('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    test('should fail with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Current password is incorrect');
    });

    test('should handle forgot password request', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');
    });

    test('should handle forgot password for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');
    });
  });

  describe('Email Verification', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        email: 'test@example.com',
        password: 'password123',
        role: 'vendor',
        profile: {
          name: 'Test User'
        }
      });
      
      const verificationToken = testUser.generateEmailVerificationToken();
      await testUser.save();
      testUser.verificationToken = verificationToken; // Store for test
    });

    test('should verify email successfully', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: testUser.verificationToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.verification.isEmailVerified).toBe(true);
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: 'invalid-token'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });
  });
});

describe('Subscription Management', () => {
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

  test('should check subscription limits', () => {
    const limits = eprClient.checkSubscriptionLimits();
    
    expect(limits.tonnageLimit).toBe(100);
    expect(limits.tonnageUsed).toBe(0);
    expect(limits.tonnageRemaining).toBe(100);
    expect(limits.canUpload).toBe(true);
    expect(limits.canMakeApiCall).toBe(true);
  });

  test('should increment usage correctly', async () => {
    await eprClient.incrementUsage(50, 100);
    
    const limits = eprClient.checkSubscriptionLimits();
    expect(limits.tonnageUsed).toBe(50);
    expect(limits.apiUsed).toBe(100);
    expect(limits.tonnageRemaining).toBe(50);
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
    
    // Add members to reach limit
    for (let i = 0; i < 3; i++) {
      eprClient.team.members.push({
        userId: new mongoose.Types.ObjectId(),
        role: 'member'
      });
    }
    
    expect(eprClient.canInviteTeamMembers()).toBe(false);
  });
});