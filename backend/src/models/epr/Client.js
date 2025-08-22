/**
 * Client model for EPR compliance system
 * Represents EPR clients with subscription management
 */

import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class Client extends Model {
  /**
   * Initialize the Client model
   */
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Client name is required'
          },
          len: {
            args: [2, 200],
            msg: 'Client name must be between 2 and 200 characters'
          }
        }
      },
      
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Email address already exists'
        },
        validate: {
          isEmail: {
            msg: 'Please provide a valid email address'
          }
        }
      },
      
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [8, 255],
            msg: 'Password must be at least 8 characters long'
          }
        }
      },
      
      organization: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Organization name is required'
          },
          len: {
            args: [2, 300],
            msg: 'Organization name must be between 2 and 300 characters'
          }
        }
      },
      
      organizationDetails: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidDetails(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Organization details must be a valid JSON object');
            }
          }
        }
      },
      
      contactInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidContact(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Contact info must be a valid JSON object');
            }
          }
        }
      },
      
      subscriptionTier: {
        type: DataTypes.ENUM('basic', 'professional', 'enterprise'),
        defaultValue: 'basic',
        validate: {
          isIn: {
            args: [['basic', 'professional', 'enterprise']],
            msg: 'Subscription tier must be basic, professional, or enterprise'
          }
        }
      },
      
      subscriptionDetails: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidSubscription(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Subscription details must be a valid JSON object');
            }
          }
        }
      },
      
      billingInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidBilling(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Billing info must be a valid JSON object');
            }
          }
        }
      },
      
      complianceProfile: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidProfile(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Compliance profile must be a valid JSON object');
            }
          }
        }
      },
      
      permissions: {
        type: DataTypes.JSONB,
        defaultValue: {
          documentUpload: true,
          auditAccess: true,
          reportGeneration: true,
          apiAccess: false,
          bulkOperations: false
        }
      },
      
      usage: {
        type: DataTypes.JSONB,
        defaultValue: {
          documentsProcessed: 0,
          tonnageAudited: 0,
          apiCalls: 0,
          reportsGenerated: 0,
          lastActivity: null
        }
      },
      
      limits: {
        type: DataTypes.JSONB,
        defaultValue: {
          monthlyDocuments: 100,
          monthlyTonnage: 1000,
          monthlyApiCalls: 1000,
          monthlyReports: 10,
          storageGB: 5
        }
      },
      
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'trial'),
        defaultValue: 'trial',
        validate: {
          isIn: {
            args: [['active', 'inactive', 'suspended', 'trial']],
            msg: 'Status must be active, inactive, suspended, or trial'
          }
        }
      },
      
      verification: {
        type: DataTypes.JSONB,
        defaultValue: {
          emailVerified: false,
          phoneVerified: false,
          organizationVerified: false,
          kycCompleted: false,
          verificationDocuments: []
        }
      },
      
      preferences: {
        type: DataTypes.JSONB,
        defaultValue: {
          notifications: {
            email: true,
            sms: false,
            webhook: false
          },
          reporting: {
            frequency: 'monthly',
            format: 'pdf',
            autoGenerate: true
          },
          dashboard: {
            theme: 'light',
            language: 'en',
            timezone: 'UTC'
          }
        }
      },
      
      apiCredentials: {
        type: DataTypes.JSONB,
        defaultValue: {
          apiKey: null,
          secretKey: null,
          webhookUrl: null,
          rateLimits: {
            requestsPerMinute: 60,
            requestsPerHour: 1000,
            requestsPerDay: 10000
          }
        }
      },
      
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      loginCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Login count cannot be negative'
          }
        }
      },
      
      passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      
      emailVerificationExpires: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      trialEndsAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      subscriptionEndsAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'Client',
      tableName: 'clients',
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft deletes
      indexes: [
        {
          fields: ['email'],
          unique: true
        },
        {
          fields: ['subscription_tier']
        },
        {
          fields: ['status']
        },
        {
          fields: ['organization']
        },
        {
          fields: ['created_at']
        }
      ],
      hooks: {
        beforeCreate: async (client) => {
          if (client.password) {
            const salt = await bcrypt.genSalt(12);
            client.password = await bcrypt.hash(client.password, salt);
          }
          
          // Set trial end date for new clients
          if (client.status === 'trial') {
            client.trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
          }
        },
        
        beforeUpdate: async (client) => {
          if (client.changed('password')) {
            const salt = await bcrypt.genSalt(12);
            client.password = await bcrypt.hash(client.password, salt);
          }
          
          if (client.changed('lastLoginAt')) {
            client.loginCount += 1;
          }
        }
      }
    });
  }

  /**
   * Define associations
   */
  static associate(models) {
    // Client has many documents
    this.hasMany(models.Document, {
      foreignKey: 'clientId',
      as: 'documents'
    });
    
    // Client has many audit results
    this.hasMany(models.AuditResult, {
      foreignKey: 'clientId',
      as: 'auditResults'
    });
    
    // Client has many compliance scores
    this.hasMany(models.ComplianceScore, {
      foreignKey: 'clientId',
      as: 'complianceScores'
    });
    
    // Client has many billing records
    this.hasMany(models.BillingRecord, {
      foreignKey: 'clientId',
      as: 'billingRecords'
    });
    
    // Client has many audit trails
    this.hasMany(models.AuditTrail, {
      foreignKey: 'actorId',
      as: 'auditTrails',
      scope: {
        actorType: 'client'
      }
    });
  }

  /**
   * Instance method to compare password
   */
  async comparePassword(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      throw new Error('Password comparison failed');
    }
  }

  /**
   * Instance method to generate JWT token
   */
  generateAuthToken() {
    const payload = {
      id: this.id,
      email: this.email,
      organization: this.organization,
      subscriptionTier: this.subscriptionTier,
      status: this.status
    };
    
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'epr-compliance-system'
      }
    );
  }

  /**
   * Instance method to generate password reset token
   */
  generatePasswordResetToken() {
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    this.passwordResetToken = bcrypt.hashSync(resetToken, 10);
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    return resetToken;
  }

  /**
   * Instance method to generate email verification token
   */
  generateEmailVerificationToken() {
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
    
    this.emailVerificationToken = bcrypt.hashSync(verificationToken, 10);
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    return verificationToken;
  }

  /**
   * Instance method to check subscription limits
   */
  checkUsageLimits() {
    const usage = this.usage || {};
    const limits = this.limits || {};
    
    return {
      documents: {
        used: usage.documentsProcessed || 0,
        limit: limits.monthlyDocuments || 0,
        exceeded: (usage.documentsProcessed || 0) >= (limits.monthlyDocuments || 0)
      },
      tonnage: {
        used: usage.tonnageAudited || 0,
        limit: limits.monthlyTonnage || 0,
        exceeded: (usage.tonnageAudited || 0) >= (limits.monthlyTonnage || 0)
      },
      apiCalls: {
        used: usage.apiCalls || 0,
        limit: limits.monthlyApiCalls || 0,
        exceeded: (usage.apiCalls || 0) >= (limits.monthlyApiCalls || 0)
      },
      reports: {
        used: usage.reportsGenerated || 0,
        limit: limits.monthlyReports || 0,
        exceeded: (usage.reportsGenerated || 0) >= (limits.monthlyReports || 0)
      }
    };
  }

  /**
   * Instance method to update usage
   */
  async updateUsage(type, amount = 1) {
    const usage = this.usage || {};
    
    switch (type) {
      case 'documents':
        usage.documentsProcessed = (usage.documentsProcessed || 0) + amount;
        break;
      case 'tonnage':
        usage.tonnageAudited = (usage.tonnageAudited || 0) + amount;
        break;
      case 'apiCalls':
        usage.apiCalls = (usage.apiCalls || 0) + amount;
        break;
      case 'reports':
        usage.reportsGenerated = (usage.reportsGenerated || 0) + amount;
        break;
    }
    
    usage.lastActivity = new Date();
    this.usage = usage;
    
    return await this.save();
  }

  /**
   * Instance method to upgrade subscription
   */
  async upgradeSubscription(newTier, endDate) {
    const tierLimits = {
      basic: {
        monthlyDocuments: 100,
        monthlyTonnage: 1000,
        monthlyApiCalls: 1000,
        monthlyReports: 10,
        storageGB: 5
      },
      professional: {
        monthlyDocuments: 500,
        monthlyTonnage: 5000,
        monthlyApiCalls: 5000,
        monthlyReports: 50,
        storageGB: 25
      },
      enterprise: {
        monthlyDocuments: -1, // Unlimited
        monthlyTonnage: -1,
        monthlyApiCalls: -1,
        monthlyReports: -1,
        storageGB: 100
      }
    };
    
    this.subscriptionTier = newTier;
    this.limits = tierLimits[newTier];
    this.subscriptionEndsAt = endDate;
    this.status = 'active';
    
    // Update permissions based on tier
    const permissions = this.permissions || {};
    if (newTier === 'professional' || newTier === 'enterprise') {
      permissions.apiAccess = true;
      permissions.bulkOperations = true;
    }
    if (newTier === 'enterprise') {
      permissions.advancedAnalytics = true;
      permissions.customReports = true;
    }
    this.permissions = permissions;
    
    return await this.save();
  }

  /**
   * Instance method to check if trial is expired
   */
  isTrialExpired() {
    return this.status === 'trial' && 
           this.trialEndsAt && 
           new Date() > this.trialEndsAt;
  }

  /**
   * Instance method to check if subscription is expired
   */
  isSubscriptionExpired() {
    return this.subscriptionEndsAt && 
           new Date() > this.subscriptionEndsAt;
  }

  /**
   * Static method to find active clients
   */
  static findActive() {
    return this.findAll({
      where: {
        status: 'active'
      },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Static method to find clients by subscription tier
   */
  static findByTier(tier) {
    return this.findAll({
      where: {
        subscriptionTier: tier
      },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Static method to get client statistics
   */
  static async getStatistics() {
    const stats = await this.findAll({
      attributes: [
        'subscriptionTier',
        'status',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: ['subscriptionTier', 'status'],
      raw: true
    });
    
    const totalUsage = await this.findAll({
      attributes: [
        [this.sequelize.fn('SUM', this.sequelize.literal("(usage->>'documentsProcessed')::int")), 'totalDocuments'],
        [this.sequelize.fn('SUM', this.sequelize.literal("(usage->>'tonnageAudited')::numeric")), 'totalTonnage'],
        [this.sequelize.fn('SUM', this.sequelize.literal("(usage->>'apiCalls')::int")), 'totalApiCalls'],
        [this.sequelize.fn('SUM', this.sequelize.literal("(usage->>'reportsGenerated')::int")), 'totalReports']
      ],
      raw: true
    });
    
    return {
      byTierAndStatus: stats,
      totalUsage: totalUsage[0]
    };
  }

  /**
   * Static method to cleanup expired trials
   */
  static async cleanupExpiredTrials() {
    const expiredTrials = await this.findAll({
      where: {
        status: 'trial',
        trialEndsAt: {
          [this.sequelize.Op.lt]: new Date()
        }
      }
    });
    
    for (const client of expiredTrials) {
      client.status = 'inactive';
      await client.save();
    }
    
    return expiredTrials.length;
  }

  /**
   * JSON serialization - exclude sensitive fields
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    delete values.passwordResetToken;
    delete values.emailVerificationToken;
    delete values.apiCredentials;
    return values;
  }
}

export default Client;