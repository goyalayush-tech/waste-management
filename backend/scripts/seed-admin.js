/**
 * Seed Admin User Script
 * Creates an admin user in MongoDB for the ClaimClean system
 * 
 * Run with: node scripts/seed-admin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import User model after loading env
import User from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/waste-verification-mvp';

const adminUsers = [
  {
    email: 'admin@claimclean.com',
    password: 'Admin@123',
    role: 'admin',
    profile: {
      name: 'System Administrator',
      organization: 'ClaimClean',
      phone: '+919876543210',
    },
    verification: {
      isEmailVerified: true,
      kycStatus: 'verified',
    },
    status: 'active',
    subscription: {
      tier: 'enterprise',
      status: 'active',
      features: {
        maxTonnagePerMonth: 100000,
        maxApiCallsPerMonth: 100000,
        advancedAnalytics: true,
        customBranding: true,
        prioritySupport: true,
        multiFactorAuth: true,
      },
    },
  },
  {
    email: 'auditor@claimclean.com',
    password: 'Auditor@123',
    role: 'auditor',
    profile: {
      name: 'Demo Auditor',
      organization: 'ClaimClean Verification',
      phone: '+919876543211',
    },
    verification: {
      isEmailVerified: true,
      kycStatus: 'verified',
    },
    status: 'active',
    subscription: {
      tier: 'professional',
      status: 'active',
    },
  },
  {
    email: 'brand@example.com',
    password: 'Brand@123',
    role: 'epr-client',
    profile: {
      name: 'Brand Manager',
      organization: 'Example FMCG Brand',
      phone: '+919876543212',
    },
    verification: {
      isEmailVerified: true,
      kycStatus: 'verified',
    },
    status: 'active',
    subscription: {
      tier: 'professional',
      status: 'active',
      features: {
        maxTonnagePerMonth: 10000,
        maxApiCallsPerMonth: 10000,
        advancedAnalytics: true,
      },
    },
  },
];

async function seedAdminUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    for (const userData of adminUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠ User ${userData.email} already exists, updating...`);
        // Update existing user
        existingUser.profile = userData.profile;
        existingUser.role = userData.role;
        existingUser.verification = userData.verification;
        existingUser.status = userData.status;
        existingUser.subscription = { ...existingUser.subscription, ...userData.subscription };
        await existingUser.save();
        console.log(`✓ Updated user: ${userData.email}`);
      } else {
        // Create new user
        const user = new User(userData);
        await user.save();
        console.log(`✓ Created user: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\n========================================');
    console.log('Admin users seeded successfully!');
    console.log('========================================');
    console.log('\nLogin credentials:');
    console.log('------------------------------------------');
    console.log('Admin:   admin@claimclean.com / Admin@123');
    console.log('Auditor: auditor@claimclean.com / Auditor@123');
    console.log('Brand:   brand@example.com / Brand@123');
    console.log('------------------------------------------');
    console.log('\nNote: MFA is disabled for demo purposes.');
    console.log('========================================\n');

  } catch (error) {
    console.error('Error seeding admin users:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seedAdminUsers();
