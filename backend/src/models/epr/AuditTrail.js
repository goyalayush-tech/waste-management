/**
 * AuditTrail model for EPR compliance system
 * Provides immutable audit logging for all system activities
 */

import { DataTypes, Model } from 'sequelize';

class AuditTrail extends Model {
  /**
   * Initialize the AuditTrail model
   */
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      
      entityType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Entity type is required'
          },
          isIn: {
            args: [['client', 'document', 'audit_result', 'compliance_score', 'recycler_master', 'billing_record', 'user', 'system']],
            msg: 'Invalid entity type'
          }
        }
      },
      
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Entity ID is required'
          }
        }
      },
      
      action: {
        type: DataTypes.ENUM(
          'create', 'update', 'delete', 'approve', 'reject', 'review', 
          'upload', 'download', 'export', 'import', 'login', 'logout',
          'calculate', 'publish', 'archive', 'restore', 'verify', 'suspend'
        ),
        allowNull: false,
        validate: {
          isIn: {
            args: [[
              'create', 'update', 'delete', 'approve', 'reject', 'review', 
              'upload', 'download', 'export', 'import', 'login', 'logout',
              'calculate', 'publish', 'archive', 'restore', 'verify', 'suspend'
            ]],
            msg: 'Invalid action type'
          }
        }
      },
      
      actorId: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Actor ID is required'
          }
        }
      },
      
      actorType: {
        type: DataTypes.ENUM('client', 'auditor', 'admin', 'system'),
        allowNull: false,
        validate: {
          isIn: {
            args: [['client', 'auditor', 'admin', 'system']],
            msg: 'Invalid actor type'
          }
        }
      },
      
      actorDetails: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidDetails(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Actor details must be a valid JSON object');
            }
          }
        }
      },
      
      changes: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidChanges(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Changes must be a valid JSON object');
            }
          }
        }
      },
      
      previousValues: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidPrevious(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Previous values must be a valid JSON object');
            }
          }
        }
      },
      
      newValues: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidNew(value) {
            if (value && typeof value !== 'object') {
              throw new Error('New values must be a valid JSON object');
            }
          }
        }
      },
      
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidMetadata(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Metadata must be a valid JSON object');
            }
          }
        }
      },
      
      sessionInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidSession(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Session info must be a valid JSON object');
            }
          }
        }
      },
      
      requestInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidRequest(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Request info must be a valid JSON object');
            }
          }
        }
      },
      
      severity: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium',
        validate: {
          isIn: {
            args: [['low', 'medium', 'high', 'critical']],
            msg: 'Invalid severity level'
          }
        }
      },
      
      category: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'Category cannot exceed 100 characters'
          }
        }
      },
      
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 1000],
            msg: 'Description cannot exceed 1000 characters'
          }
        }
      },
      
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        validate: {
          isValidTags(value) {
            if (value && !Array.isArray(value)) {
              throw new Error('Tags must be an array');
            }
            if (value && value.some(tag => typeof tag !== 'string' || tag.length > 50)) {
              throw new Error('Each tag must be a string with maximum 50 characters');
            }
          }
        }
      },
      
      riskLevel: {
        type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'critical'),
        defaultValue: 'none',
        validate: {
          isIn: {
            args: [['none', 'low', 'medium', 'high', 'critical']],
            msg: 'Invalid risk level'
          }
        }
      },
      
      complianceImpact: {
        type: DataTypes.JSONB,
        defaultValue: {
          affected: false,
          regulations: [],
          requirements: [],
          impact_level: 'none'
        }
      },
      
      blockchainHash: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isValidHash(value) {
            if (value && !/^0x[a-fA-F0-9]{64}$/.test(value)) {
              throw new Error('Invalid blockchain hash format');
            }
          }
        }
      },
      
      blockchainStatus: {
        type: DataTypes.ENUM('pending', 'confirmed', 'failed', 'not_required'),
        defaultValue: 'not_required',
        validate: {
          isIn: {
            args: [['pending', 'confirmed', 'failed', 'not_required']],
            msg: 'Invalid blockchain status'
          }
        }
      },
      
      retentionPeriod: {
        type: DataTypes.INTEGER,
        defaultValue: 2555, // 7 years in days
        validate: {
          min: {
            args: 1,
            msg: 'Retention period must be at least 1 day'
          }
        }
      },
      
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      archived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      
      archivedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'AuditTrail',
      tableName: 'audit_trails',
      timestamps: true,
      underscored: true,
      // No paranoid delete - audit trails should never be deleted
      indexes: [
        {
          fields: ['entity_type', 'entity_id']
        },
        {
          fields: ['actor_id']
        },
        {
          fields: ['actor_type']
        },
        {
          fields: ['action']
        },
        {
          fields: ['severity']
        },
        {
          fields: ['risk_level']
        },
        {
          fields: ['created_at']
        },
        {
          fields: ['blockchain_hash']
        },
        {
          fields: ['archived']
        },
        {
          fields: ['tags'],
          using: 'gin'
        }
      ],
      hooks: {
        beforeCreate: (auditTrail) => {
          // Set expiration date based on retention period
          if (auditTrail.retentionPeriod) {
            auditTrail.expiresAt = new Date(Date.now() + auditTrail.retentionPeriod * 24 * 60 * 60 * 1000);
          }
          
          // Set risk level based on action and severity
          if (auditTrail.action === 'delete' || auditTrail.severity === 'critical') {
            auditTrail.riskLevel = 'high';
          } else if (auditTrail.severity === 'high') {
            auditTrail.riskLevel = 'medium';
          }
          
          // Add automatic tags based on action and entity type
          const autoTags = [];
          autoTags.push(`action:${auditTrail.action}`);
          autoTags.push(`entity:${auditTrail.entityType}`);
          autoTags.push(`actor:${auditTrail.actorType}`);
          
          auditTrail.tags = [...(auditTrail.tags || []), ...autoTags];
        }
      }
    });
  }

  /**
   * Define associations
   */
  static associate(models) {
    // AuditTrail can reference any entity type, so we don't define specific associations
    // Instead, we use dynamic queries based on entityType and entityId
  }

  /**
   * Static method to log activity
   */
  static async logActivity(params) {
    const {
      entityType,
      entityId,
      action,
      actorId,
      actorType,
      changes = {},
      previousValues = {},
      newValues = {},
      metadata = {},
      sessionInfo = {},
      requestInfo = {},
      severity = 'medium',
      category = null,
      description = null,
      tags = [],
      riskLevel = 'none',
      complianceImpact = { affected: false, regulations: [], requirements: [], impact_level: 'none' }
    } = params;

    return await this.create({
      entityType,
      entityId,
      action,
      actorId,
      actorType,
      changes,
      previousValues,
      newValues,
      metadata,
      sessionInfo,
      requestInfo,
      severity,
      category,
      description,
      tags,
      riskLevel,
      complianceImpact
    });
  }

  /**
   * Static method to find by entity
   */
  static findByEntity(entityType, entityId, options = {}) {
    const {
      page = 1,
      limit = 50,
      action,
      actorType,
      severity,
      startDate,
      endDate
    } = options;
    
    const where = { entityType, entityId };
    if (action) where.action = action;
    if (actorType) where.actorType = actorType;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[this.sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[this.sequelize.Op.lte] = new Date(endDate);
    }
    
    const offset = (page - 1) * limit;
    
    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Static method to find by actor
   */
  static findByActor(actorId, options = {}) {
    const {
      page = 1,
      limit = 50,
      entityType,
      action,
      startDate,
      endDate
    } = options;
    
    const where = { actorId };
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[this.sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[this.sequelize.Op.lte] = new Date(endDate);
    }
    
    const offset = (page - 1) * limit;
    
    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Static method to find high-risk activities
   */
  static findHighRiskActivities(options = {}) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate
    } = options;
    
    const where = {
      riskLevel: ['high', 'critical']
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[this.sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[this.sequelize.Op.lte] = new Date(endDate);
    }
    
    const offset = (page - 1) * limit;
    
    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Static method to get activity statistics
   */
  static async getActivityStatistics(options = {}) {
    const { startDate, endDate, entityType, actorType } = options;
    
    const where = {};
    if (entityType) where.entityType = entityType;
    if (actorType) where.actorType = actorType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[this.sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[this.sequelize.Op.lte] = new Date(endDate);
    }
    
    const actionStats = await this.findAll({
      where,
      attributes: [
        'action',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: ['action'],
      order: [[this.sequelize.fn('COUNT', this.sequelize.col('id')), 'DESC']],
      raw: true
    });
    
    const severityStats = await this.findAll({
      where,
      attributes: [
        'severity',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: ['severity'],
      raw: true
    });
    
    const riskStats = await this.findAll({
      where,
      attributes: [
        'risk_level',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: ['risk_level'],
      raw: true
    });
    
    const entityStats = await this.findAll({
      where,
      attributes: [
        'entity_type',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: ['entity_type'],
      order: [[this.sequelize.fn('COUNT', this.sequelize.col('id')), 'DESC']],
      raw: true
    });
    
    return {
      byAction: actionStats,
      bySeverity: severityStats,
      byRiskLevel: riskStats,
      byEntityType: entityStats
    };
  }

  /**
   * Static method to get compliance impact summary
   */
  static async getComplianceImpactSummary(options = {}) {
    const { startDate, endDate } = options;
    
    const where = {
      'complianceImpact.affected': true
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[this.sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[this.sequelize.Op.lte] = new Date(endDate);
    }
    
    const impactStats = await this.findAll({
      where,
      attributes: [
        [this.sequelize.literal("compliance_impact->>'impact_level'"), 'impactLevel'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: [this.sequelize.literal("compliance_impact->>'impact_level'")],
      raw: true
    });
    
    return impactStats;
  }

  /**
   * Static method to archive old records
   */
  static async archiveOldRecords(daysOld = 365) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const oldRecords = await this.findAll({
      where: {
        createdAt: {
          [this.sequelize.Op.lt]: cutoffDate
        },
        archived: false,
        riskLevel: ['none', 'low'] // Only archive low-risk records
      }
    });
    
    for (const record of oldRecords) {
      record.archived = true;
      record.archivedAt = new Date();
      await record.save();
    }
    
    return oldRecords.length;
  }

  /**
   * Static method to cleanup expired records
   */
  static async cleanupExpiredRecords() {
    const expiredRecords = await this.findAll({
      where: {
        expiresAt: {
          [this.sequelize.Op.lt]: new Date()
        },
        archived: true,
        riskLevel: ['none', 'low']
      }
    });
    
    // In a real implementation, you might move these to cold storage
    // instead of deleting them completely
    for (const record of expiredRecords) {
      // Mark for deletion or move to cold storage
      record.metadata = {
        ...record.metadata,
        markedForDeletion: true,
        deletionDate: new Date()
      };
      await record.save();
    }
    
    return expiredRecords.length;
  }

  /**
   * Instance method to add to blockchain
   */
  async addToBlockchain(transactionHash) {
    this.blockchainHash = transactionHash;
    this.blockchainStatus = 'pending';
    
    return await this.save();
  }

  /**
   * Instance method to confirm blockchain transaction
   */
  async confirmBlockchainTransaction() {
    this.blockchainStatus = 'confirmed';
    
    return await this.save();
  }

  /**
   * Instance method to get formatted timestamp
   */
  getFormattedTimestamp() {
    return this.createdAt.toISOString();
  }

  /**
   * Instance method to get activity summary
   */
  getActivitySummary() {
    return {
      id: this.id,
      timestamp: this.getFormattedTimestamp(),
      action: this.action,
      entityType: this.entityType,
      actorType: this.actorType,
      severity: this.severity,
      riskLevel: this.riskLevel,
      description: this.description,
      complianceImpacted: this.complianceImpact.affected
    };
  }

  /**
   * Instance method to check if record is expired
   */
  isExpired() {
    return this.expiresAt && new Date() > this.expiresAt;
  }

  /**
   * Instance method to check if record should be archived
   */
  shouldBeArchived(daysOld = 365) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return this.createdAt < cutoffDate && !this.archived && ['none', 'low'].includes(this.riskLevel);
  }
}

export default AuditTrail;