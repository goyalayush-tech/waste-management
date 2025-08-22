/**
 * AuditResult model for EPR compliance system
 * Handles audit findings and recommendations
 */

import { DataTypes, Model } from 'sequelize';

class AuditResult extends Model {
  /**
   * Initialize the AuditResult model
   */
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      
      clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      
      documentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'documents',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      
      auditType: {
        type: DataTypes.ENUM(
          'document_validation',
          'recycler_verification', 
          'tonnage_check',
          'date_consistency',
          'cross_reference',
          'compliance_check',
          'data_quality',
          'regulatory_compliance'
        ),
        allowNull: false,
        validate: {
          isIn: {
            args: [[
              'document_validation',
              'recycler_verification', 
              'tonnage_check',
              'date_consistency',
              'cross_reference',
              'compliance_check',
              'data_quality',
              'regulatory_compliance'
            ]],
            msg: 'Invalid audit type'
          }
        }
      },
      
      auditScope: {
        type: DataTypes.JSONB,
        defaultValue: {
          period: null,
          wasteTypes: [],
          recyclers: [],
          documents: [],
          regions: []
        }
      },
      
      status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['pending', 'in_progress', 'completed', 'failed', 'cancelled']],
            msg: 'Invalid audit status'
          }
        }
      },
      
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium',
        validate: {
          isIn: {
            args: [['low', 'medium', 'high', 'critical']],
            msg: 'Invalid priority level'
          }
        }
      },
      
      findings: {
        type: DataTypes.JSONB,
        defaultValue: {
          summary: null,
          issues: [],
          compliantItems: [],
          nonCompliantItems: [],
          dataQualityIssues: [],
          statisticalAnalysis: {}
        },
        validate: {
          isValidFindings(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Findings must be a valid JSON object');
            }
          }
        }
      },
      
      recommendations: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
        validate: {
          isValidRecommendations(value) {
            if (value && !Array.isArray(value)) {
              throw new Error('Recommendations must be an array');
            }
          }
        }
      },
      
      riskAssessment: {
        type: DataTypes.JSONB,
        defaultValue: {
          overallRisk: 'medium',
          riskFactors: [],
          mitigationStrategies: [],
          impactAnalysis: {}
        }
      },
      
      complianceScore: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: {
            args: 0,
            msg: 'Compliance score cannot be negative'
          },
          max: {
            args: 100,
            msg: 'Compliance score cannot exceed 100'
          }
        }
      },
      
      confidenceScore: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        validate: {
          min: {
            args: 0,
            msg: 'Confidence score cannot be negative'
          },
          max: {
            args: 1,
            msg: 'Confidence score cannot exceed 1'
          }
        }
      },
      
      auditCriteria: {
        type: DataTypes.JSONB,
        defaultValue: {
          rules: [],
          thresholds: {},
          regulations: [],
          standards: []
        }
      },
      
      methodology: {
        type: DataTypes.JSONB,
        defaultValue: {
          approach: 'automated',
          tools: [],
          samplingMethod: null,
          sampleSize: null,
          validationSteps: []
        }
      },
      
      auditTrail: {
        type: DataTypes.JSONB,
        defaultValue: {
          steps: [],
          dataAccessed: [],
          calculations: [],
          validations: []
        }
      },
      
      auditorId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of human auditor if manual review was performed'
      },
      
      auditorType: {
        type: DataTypes.ENUM('system', 'human', 'hybrid'),
        defaultValue: 'system',
        validate: {
          isIn: {
            args: [['system', 'human', 'hybrid']],
            msg: 'Invalid auditor type'
          }
        }
      },
      
      auditorNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 2000],
            msg: 'Auditor notes cannot exceed 2000 characters'
          }
        }
      },
      
      reviewStatus: {
        type: DataTypes.ENUM('not_required', 'pending_review', 'under_review', 'reviewed', 'disputed'),
        defaultValue: 'not_required',
        validate: {
          isIn: {
            args: [['not_required', 'pending_review', 'under_review', 'reviewed', 'disputed']],
            msg: 'Invalid review status'
          }
        }
      },
      
      reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of reviewer'
      },
      
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      reviewNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 2000],
            msg: 'Review notes cannot exceed 2000 characters'
          }
        }
      },
      
      executionTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Audit execution time in milliseconds'
      },
      
      dataProcessed: {
        type: DataTypes.JSONB,
        defaultValue: {
          documentsCount: 0,
          recordsCount: 0,
          tonnageAnalyzed: 0,
          timeRange: {}
        }
      },
      
      alerts: {
        type: DataTypes.JSONB,
        defaultValue: {
          generated: [],
          sent: [],
          acknowledged: []
        }
      },
      
      followUpRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      
      followUpDueDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      followUpStatus: {
        type: DataTypes.ENUM('not_required', 'pending', 'in_progress', 'completed', 'overdue'),
        defaultValue: 'not_required',
        validate: {
          isIn: {
            args: [['not_required', 'pending', 'in_progress', 'completed', 'overdue']],
            msg: 'Invalid follow-up status'
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
      
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {
          version: '1.0',
          engine: 'epr-audit-engine',
          configuration: {},
          environment: 'production'
        }
      },
      
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      scheduledFor: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'AuditResult',
      tableName: 'audit_results',
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft deletes
      indexes: [
        {
          fields: ['client_id']
        },
        {
          fields: ['document_id']
        },
        {
          fields: ['audit_type']
        },
        {
          fields: ['status']
        },
        {
          fields: ['priority']
        },
        {
          fields: ['review_status']
        },
        {
          fields: ['follow_up_required']
        },
        {
          fields: ['created_at']
        },
        {
          fields: ['completed_at']
        },
        {
          fields: ['tags'],
          using: 'gin'
        }
      ],
      hooks: {
        beforeUpdate: (auditResult) => {
          // Set completion timestamp when status changes to completed
          if (auditResult.changed('status') && auditResult.status === 'completed') {
            auditResult.completedAt = new Date();
            
            // Calculate execution time if started
            if (auditResult.startedAt) {
              auditResult.executionTime = new Date() - auditResult.startedAt;
            }
          }
          
          // Set start timestamp when status changes to in_progress
          if (auditResult.changed('status') && auditResult.status === 'in_progress') {
            auditResult.startedAt = new Date();
          }
          
          // Set review timestamp when reviewed
          if (auditResult.changed('reviewStatus') && auditResult.reviewStatus === 'reviewed') {
            auditResult.reviewedAt = new Date();
          }
        }
      }
    });
  }

  /**
   * Define associations
   */
  static associate(models) {
    // AuditResult belongs to client
    this.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    
    // AuditResult belongs to document (optional)
    this.belongsTo(models.Document, {
      foreignKey: 'documentId',
      as: 'document'
    });
    
    // AuditResult has many audit trails
    this.hasMany(models.AuditTrail, {
      foreignKey: 'entityId',
      as: 'auditTrails',
      scope: {
        entityType: 'audit_result'
      }
    });
  }

  /**
   * Instance method to start audit
   */
  async startAudit() {
    this.status = 'in_progress';
    this.startedAt = new Date();
    
    // Add audit trail entry
    const trail = this.auditTrail || { steps: [] };
    trail.steps.push({
      step: 'audit_started',
      timestamp: new Date(),
      details: 'Audit execution started'
    });
    this.auditTrail = trail;
    
    return await this.save();
  }

  /**
   * Instance method to complete audit
   */
  async completeAudit(findings, recommendations, complianceScore) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.findings = findings;
    this.recommendations = recommendations;
    this.complianceScore = complianceScore;
    
    // Calculate execution time
    if (this.startedAt) {
      this.executionTime = new Date() - this.startedAt;
    }
    
    // Determine if follow-up is required based on findings
    this.followUpRequired = this.determineFollowUpRequired(findings, complianceScore);
    if (this.followUpRequired) {
      this.followUpDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      this.followUpStatus = 'pending';
    }
    
    // Add audit trail entry
    const trail = this.auditTrail || { steps: [] };
    trail.steps.push({
      step: 'audit_completed',
      timestamp: new Date(),
      details: `Audit completed with compliance score: ${complianceScore}`
    });
    this.auditTrail = trail;
    
    return await this.save();
  }

  /**
   * Instance method to fail audit
   */
  async failAudit(error) {
    this.status = 'failed';
    this.completedAt = new Date();
    
    // Add error to findings
    const findings = this.findings || {};
    findings.error = {
      message: error.message,
      timestamp: new Date(),
      stack: error.stack
    };
    this.findings = findings;
    
    // Add audit trail entry
    const trail = this.auditTrail || { steps: [] };
    trail.steps.push({
      step: 'audit_failed',
      timestamp: new Date(),
      details: `Audit failed: ${error.message}`
    });
    this.auditTrail = trail;
    
    return await this.save();
  }

  /**
   * Instance method to add recommendation
   */
  async addRecommendation(recommendation) {
    const recommendations = this.recommendations || [];
    recommendations.push(recommendation);
    this.recommendations = recommendations;
    
    return await this.save();
  }

  /**
   * Instance method to update risk assessment
   */
  async updateRiskAssessment(riskData) {
    this.riskAssessment = { ...this.riskAssessment, ...riskData };
    
    return await this.save();
  }

  /**
   * Instance method to generate alert
   */
  async generateAlert(alertType, message, severity = 'medium') {
    const alerts = this.alerts || { generated: [], sent: [], acknowledged: [] };
    
    const alert = {
      id: Date.now().toString(),
      type: alertType,
      message,
      severity,
      timestamp: new Date(),
      status: 'generated'
    };
    
    alerts.generated.push(alert);
    this.alerts = alerts;
    
    return await this.save();
  }

  /**
   * Instance method to mark alert as sent
   */
  async markAlertSent(alertId) {
    const alerts = this.alerts || { generated: [], sent: [], acknowledged: [] };
    
    const alert = alerts.generated.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'sent';
      alert.sentAt = new Date();
      alerts.sent.push(alert);
    }
    
    this.alerts = alerts;
    return await this.save();
  }

  /**
   * Instance method to determine if follow-up is required
   */
  determineFollowUpRequired(findings, complianceScore) {
    // Follow-up required if compliance score is below threshold
    if (complianceScore < 70) return true;
    
    // Follow-up required if there are critical issues
    if (findings.issues && findings.issues.some(issue => issue.severity === 'critical')) {
      return true;
    }
    
    // Follow-up required if there are many non-compliant items
    if (findings.nonCompliantItems && findings.nonCompliantItems.length > 10) {
      return true;
    }
    
    return false;
  }

  /**
   * Static method to find by client
   */
  static findByClient(clientId, options = {}) {
    const {
      page = 1,
      limit = 20,
      auditType,
      status,
      priority,
      startDate,
      endDate
    } = options;
    
    const where = { clientId };
    if (auditType) where.auditType = auditType;
    if (status) where.status = status;
    if (priority) where.priority = priority;
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
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: this.sequelize.models.Client,
          as: 'client',
          attributes: ['id', 'name', 'organization']
        },
        {
          model: this.sequelize.models.Document,
          as: 'document',
          attributes: ['id', 'filename', 'documentType']
        }
      ]
    });
  }

  /**
   * Static method to find pending audits
   */
  static findPending() {
    return this.findAll({
      where: {
        status: 'pending'
      },
      order: [['priority', 'DESC'], ['createdAt', 'ASC']],
      include: [
        {
          model: this.sequelize.models.Client,
          as: 'client',
          attributes: ['id', 'name']
        }
      ]
    });
  }

  /**
   * Static method to find audits requiring follow-up
   */
  static findRequiringFollowUp() {
    return this.findAll({
      where: {
        followUpRequired: true,
        followUpStatus: ['pending', 'in_progress']
      },
      order: [['followUpDueDate', 'ASC']],
      include: [
        {
          model: this.sequelize.models.Client,
          as: 'client',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
  }

  /**
   * Static method to get audit statistics
   */
  static async getStatistics(clientId = null) {
    const where = clientId ? { clientId } : {};
    
    const stats = await this.findAll({
      where,
      attributes: [
        'auditType',
        'status',
        'priority',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
        [this.sequelize.fn('AVG', this.sequelize.col('compliance_score')), 'avgComplianceScore'],
        [this.sequelize.fn('AVG', this.sequelize.col('execution_time')), 'avgExecutionTime']
      ],
      group: ['auditType', 'status', 'priority'],
      raw: true
    });
    
    const followUpStats = await this.findAll({
      where: {
        ...where,
        followUpRequired: true
      },
      attributes: [
        'followUpStatus',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: ['followUpStatus'],
      raw: true
    });
    
    return {
      byTypeStatusPriority: stats,
      followUp: followUpStats
    };
  }

  /**
   * Static method to cleanup old completed audits
   */
  static async cleanupOldAudits(daysOld = 365) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const oldAudits = await this.findAll({
      where: {
        status: 'completed',
        completedAt: {
          [this.sequelize.Op.lt]: cutoffDate
        },
        followUpRequired: false
      }
    });
    
    // Archive instead of delete for compliance
    for (const audit of oldAudits) {
      const metadata = audit.metadata || {};
      metadata.archived = true;
      metadata.archivedAt = new Date();
      audit.metadata = metadata;
      await audit.save();
    }
    
    return oldAudits.length;
  }

  /**
   * Instance method to get execution duration in human readable format
   */
  getExecutionDuration() {
    if (!this.executionTime) return null;
    
    const seconds = Math.floor(this.executionTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Instance method to get compliance grade
   */
  getComplianceGrade() {
    if (!this.complianceScore) return 'N/A';
    
    if (this.complianceScore >= 90) return 'A';
    if (this.complianceScore >= 80) return 'B';
    if (this.complianceScore >= 70) return 'C';
    if (this.complianceScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Instance method to check if overdue
   */
  isOverdue() {
    return this.followUpRequired && 
           this.followUpDueDate && 
           new Date() > this.followUpDueDate &&
           this.followUpStatus !== 'completed';
  }
}

export default AuditResult;