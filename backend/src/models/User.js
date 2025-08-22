/**
 * User model for waste verification system
 * Supports vendor, buyer, and admin roles
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  
  role: {
    type: String,
    enum: {
      values: ['vendor', 'buyer', 'admin', 'epr-client', 'auditor'],
      message: 'Role must be vendor, buyer, admin, epr-client, or auditor'
    },
    required: [true, 'User role is required'],
    default: 'vendor'
  },
  
  profile: {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    
    organization: {
      type: String,
      trim: true,
      maxlength: [200, 'Organization name cannot exceed 200 characters']
    },
    
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    
    walletAddress: {
      type: String,
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid Ethereum wallet address'],
      sparse: true // Allow multiple null values but unique non-null values
    },
    
    avatar: {
      type: String,
      default: null
    }
  },
  
  verification: {
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    
    emailVerificationToken: {
      type: String,
      select: false
    },
    
    emailVerificationExpires: {
      type: Date,
      select: false
    },
    
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    
    kycDocuments: [{
      type: String,
      documentType: String,
      uploadedAt: Date
    }],

    // Multi-factor authentication
    mfa: {
      enabled: {
        type: Boolean,
        default: false
      },
      
      secret: {
        type: String,
        select: false
      },
      
      backupCodes: [{
        code: String,
        used: {
          type: Boolean,
          default: false
        },
        usedAt: Date
      }],
      
      lastUsed: Date,
      
      methods: [{
        type: String,
        enum: ['totp', 'sms', 'email'],
        enabled: {
          type: Boolean,
          default: false
        }
      }]
    }
  },
  
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'es', 'fr']
    },
    
    timezone: {
      type: String,
      default: 'UTC'
    }
  },

  // EPR Client subscription management
  subscription: {
    tier: {
      type: String,
      enum: ['basic', 'professional', 'enterprise'],
      default: 'basic'
    },
    
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'active'
    },
    
    startDate: {
      type: Date,
      default: Date.now
    },
    
    endDate: {
      type: Date
    },
    
    features: {
      maxTonnagePerMonth: {
        type: Number,
        default: 100 // Basic tier limit
      },
      
      maxApiCallsPerMonth: {
        type: Number,
        default: 1000 // Basic tier limit
      },
      
      advancedAnalytics: {
        type: Boolean,
        default: false
      },
      
      customBranding: {
        type: Boolean,
        default: false
      },
      
      prioritySupport: {
        type: Boolean,
        default: false
      },
      
      multiFactorAuth: {
        type: Boolean,
        default: false
      }
    },
    
    usage: {
      tonnageThisMonth: {
        type: Number,
        default: 0
      },
      
      apiCallsThisMonth: {
        type: Number,
        default: 0
      },
      
      lastResetDate: {
        type: Date,
        default: Date.now
      }
    },
    
    billing: {
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      lastPaymentDate: Date,
      nextPaymentDate: Date,
      paymentMethod: String
    }
  },

  // Team management for EPR clients
  team: {
    members: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['owner', 'admin', 'member', 'viewer'],
        default: 'member'
      },
      invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      invitedAt: {
        type: Date,
        default: Date.now
      },
      joinedAt: Date,
      permissions: [{
        type: String,
        enum: ['view_reports', 'upload_documents', 'manage_team', 'billing']
      }]
    }],
    
    invitations: [{
      email: String,
      role: {
        type: String,
        enum: ['admin', 'member', 'viewer'],
        default: 'member'
      },
      token: String,
      invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      invitedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'expired'],
        default: 'pending'
      }
    }]
  },
  
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    
    verifiedSubmissions: {
      type: Number,
      default: 0
    },
    
    totalCreditsEarned: {
      type: Number,
      default: 0
    },
    
    totalCreditsPurchased: {
      type: Number,
      default: 0
    },
    
    lastLoginAt: {
      type: Date,
      default: null
    },
    
    loginCount: {
      type: Number,
      default: 0
    }
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active'
  },
  
  resetPasswordToken: {
    type: String,
    select: false
  },
  
  resetPasswordExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.verification.emailVerificationToken;
      delete ret.verification.emailVerificationExpires;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.walletAddress': 1 }, { sparse: true });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.profile.name;
});

// Virtual for verification status
userSchema.virtual('isVerified').get(function() {
  return this.verification.isEmailVerified && this.verification.kycStatus === 'verified';
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update stats
userSchema.pre('save', function(next) {
  if (this.isModified('stats.lastLoginAt')) {
    this.stats.loginCount += 1;
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
    isVerified: this.isVerified
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'waste-verification-mvp'
    }
  );
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  
  this.resetPasswordToken = bcrypt.hashSync(resetToken, 10);
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
  
  this.verification.emailVerificationToken = bcrypt.hashSync(verificationToken, 10);
  this.verification.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Instance method to check subscription limits
userSchema.methods.checkSubscriptionLimits = function() {
  const { subscription } = this;
  
  return {
    tonnageLimit: subscription.features.maxTonnagePerMonth,
    tonnageUsed: subscription.usage.tonnageThisMonth,
    tonnageRemaining: Math.max(0, subscription.features.maxTonnagePerMonth - subscription.usage.tonnageThisMonth),
    apiLimit: subscription.features.maxApiCallsPerMonth,
    apiUsed: subscription.usage.apiCallsThisMonth,
    apiRemaining: Math.max(0, subscription.features.maxApiCallsPerMonth - subscription.usage.apiCallsThisMonth),
    canUpload: subscription.usage.tonnageThisMonth < subscription.features.maxTonnagePerMonth,
    canMakeApiCall: subscription.usage.apiCallsThisMonth < subscription.features.maxApiCallsPerMonth
  };
};

// Instance method to increment usage
userSchema.methods.incrementUsage = async function(tonnage = 0, apiCalls = 0) {
  // Reset monthly usage if needed
  const now = new Date();
  const lastReset = new Date(this.subscription.usage.lastResetDate);
  
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.subscription.usage.tonnageThisMonth = 0;
    this.subscription.usage.apiCallsThisMonth = 0;
    this.subscription.usage.lastResetDate = now;
  }
  
  this.subscription.usage.tonnageThisMonth += tonnage;
  this.subscription.usage.apiCallsThisMonth += apiCalls;
  
  await this.save();
};

// Instance method to generate team invitation token
userSchema.methods.generateTeamInvitationToken = function(email, role = 'member') {
  const invitationToken = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
  
  this.team.invitations.push({
    email,
    role,
    token: bcrypt.hashSync(invitationToken, 10),
    invitedBy: this._id
  });
  
  return invitationToken;
};

// Instance method to check if user can invite team members
userSchema.methods.canInviteTeamMembers = function() {
  const maxMembers = {
    basic: 3,
    professional: 10,
    enterprise: 50
  };
  
  const currentMembers = this.team.members.length;
  const maxAllowed = maxMembers[this.subscription.tier] || 3;
  
  return currentMembers < maxAllowed;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by wallet address
userSchema.statics.findByWalletAddress = function(walletAddress) {
  return this.findOne({ 'profile.walletAddress': walletAddress });
};

// Static method to get user statistics
userSchema.statics.getUserStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        verified: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$verification.isEmailVerified', true] },
                { $eq: ['$verification.kycStatus', 'verified'] }
              ]},
              1,
              0
            ]
          }
        },
        active: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats;
};

// Static method for advanced search
userSchema.statics.searchUsers = function(query, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = -1,
    role,
    status,
    verified
  } = options;
  
  const searchQuery = {};
  
  if (query) {
    searchQuery.$or = [
      { 'profile.name': { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { 'profile.organization': { $regex: query, $options: 'i' } }
    ];
  }
  
  if (role) searchQuery.role = role;
  if (status) searchQuery.status = status;
  if (verified !== undefined) {
    searchQuery['verification.isEmailVerified'] = verified;
    searchQuery['verification.kycStatus'] = verified ? 'verified' : { $ne: 'verified' };
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(searchQuery)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .select('-password');
};

// Model validation
userSchema.path('email').validate(async function(email) {
  if (!this.isNew && !this.isModified('email')) return true;
  
  const emailCount = await mongoose.models.User.countDocuments({ email });
  return !emailCount;
}, 'Email already exists');

userSchema.path('profile.walletAddress').validate(async function(walletAddress) {
  if (!walletAddress) return true;
  if (!this.isNew && !this.isModified('profile.walletAddress')) return true;
  
  const walletCount = await mongoose.models.User.countDocuments({ 
    'profile.walletAddress': walletAddress 
  });
  return !walletCount;
}, 'Wallet address already exists');

const User = mongoose.model('User', userSchema);

export default User;