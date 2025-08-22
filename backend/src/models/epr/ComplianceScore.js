/**
 * ComplianceScore model for EPR compliance system
 * Implements ClaimClean scoring system with component breakdown
 */

import { DataTypes, Model } from 'sequelize';

class ComplianceScore extends Model {
  /**
   * Initialize the ComplianceScore model
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
      
      scoreId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'Score ID is required'
          }
        }
      },
      
      overallScore: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: {
            args: 0,
            msg: 'Overall score cannot be negative'
          },
          max: {
            args: 100,
            msg: 'Overall score cannot exceed 100'
          }
        }
      },
      
      grade: {
        type: DataTypes.ENUM('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'),
        allowNull: false,
        validate: {
          isIn: {
            args: [['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']],
            msg: 'Invalid grade'
          }
        }
      },
      
      componentScores: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        validate: {
          isValidComponents(value) {
            if (!value || typeof value !== 'object') {
              throw new Error('Component scores must be a valid JSON object');
            }
            
            const requiredComponents = [
              'documentationQuality',
              'recyclerVerification',
              'tonnageAccuracy',
              'timelinessCompliance',
              'dataConsistency',
              'regulatoryAdherence'
            ];
            
            for (const component of requiredComponents) {
              if (!(component in value)) {
                throw new Error(`Missing required component: ${component}`);
              }
              if (typeof value[component].score !== 'number' || 
                  value[component].score < 0 || 
                  value[component].score > 100) {
                throw new Error(`Invalid score for component ${component}`);
              }
            }
          }
        }
      },
      
      calculationDetails: {
        type: DataTypes.JSONB,
        defaultValue: {
          methodology: 'claimclean_v1.0',
          weights: {},
          rawScores: {},
          adjustments: [],
          penalties: [],
          bonuses: []
        }
      },
      
      calculationDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      
      periodStart: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: 'Period start must be a valid date'
          }
        }
      },
      
      periodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: 'Period end must be a valid date'
          },
          isAfterStart(value) {
            if (value <= this.periodStart) {
              throw new Error('Period end must be after period start');
            }
          }
        }
      },
      
      dataScope: {
        type: DataTypes.JSONB,
        defaultValue: {
          totalDocuments: 0,
          documentsProcessed: 0,
          totalTonnage: 0,
          tonnageAudited: 0,
          recyclersCovered: 0,
          wasteTypesCovered: [],
          regionsCovered: []
        }
      },
      
      totalTonnageAudited: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Total tonnage audited cannot be negative'
          }
        }
      },
      
      documentsProcessed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Documents processed cannot be negative'
          }
        }
      },
      
      auditFindingsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Audit findings count cannot be negative'
          }
        }
      },
      
      criticalIssuesCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Critical issues count cannot be negative'
          }
        }
      },
      
      improvementRecommendations: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
        validate: {
          isValidRecommendations(value) {
            if (value && !Array.isArray(value)) {
              throw new Error('Improvement recommendations must be an array');
            }
          }
        }
      },
      
      actionItems: {
        type: DataTypes.JSONB,
        defaultValue: {
          immediate: [],
          shortTerm: [],
          longTerm: []
        }
      },
      
      benchmarkComparison: {
        type: DataTypes.JSONB,
        defaultValue: {
          industryAverage: null,
          peerComparison: null,
          historicalTrend: [],
          percentileRank: null,
          bestPractices: []
        }
      },
      
      trendAnalysis: {
        type: DataTypes.JSONB,
        defaultValue: {
          previousScores: [],
          trend: 'stable',
          trendStrength: 0,
          seasonalPatterns: [],
          projectedScore: null
        }
      },
      
      riskIndicators: {
        type: DataTypes.JSONB,
        defaultValue: {
          highRiskAreas: [],
          riskScore: 0,
          mitigationSuggestions: [],
          monitoringRecommendations: []
        }
      },
      
      certificationEligibility: {
        type: DataTypes.JSONB,
        defaultValue: {
          eligible: false,
          certificationLevel: null,
          requirements: [],
          gaps: []
        }
      },
      
      scoringMetadata: {
        type: DataTypes.JSONB,
        defaultValue: {
          version: '1.0',
          algorithm: 'claimclean',
          parameters: {},
          dataQuality: 'high',
          confidence: 0.95
        }
      },
      
      validationResults: {
        type: DataTypes.JSONB,
        defaultValue: {
          isValid: true,
          validationRules: [],
          warnings: [],
          errors: []
        }
      },
      
      status: {
        type: DataTypes.ENUM('draft', 'calculated', 'validated', 'published', 'archived'),
        defaultValue: 'calculated',
        validate: {
          isIn: {
            args: [['draft', 'calculated', 'validated', 'published', 'archived']],
            msg: 'Invalid status'
          }
        }
      },
      
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      validUntil: {
        type: DataTypes.DATE,
        allowNull: true
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
      
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 2000],
            msg: 'Notes cannot exceed 2000 characters'
          }
        }
      }
    }, {
      sequelize,
      modelName: 'ComplianceScore',
      tableName: 'compliance_scores',
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft deletes
      indexes: [
        {
          fields: ['client_id']
        },
        {
          fields: ['score_id'],
          unique: true
        },
        {
          fields: ['overall_score']
        },
        {
          fields: ['grade']
        },
        {
          fields: ['calculation_date']
        },
        {
          fields: ['period_start', 'period_end']
        },
        {
          fields: ['status']
        },
        {
          fields: ['tags'],
          using: 'gin'
        }
      ],
      hooks: {
        beforeCreate: (score) => {
          // Generate score ID if not provided
          if (!score.scoreId) {
            const timestamp = Date.now().toString();
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            score.scoreId = `CS${timestamp}${random}`;
          }
          
          // Calculate grade based on overall score
          score.grade = score.calculateGrade(score.overallScore);
        },
        
        beforeUpdate: (score) => {
          // Update grade if overall score changed
          if (score.changed('overallScore')) {
            score.grade = score.calculateGrade(score.overallScore);
          }
          
          // Set published timestamp when status changes to published
          if (score.changed('status') && score.status === 'published') {
            score.publishedAt = new Date();
            
            // Set validity period (default 3 months)
            if (!score.validUntil) {
              score.validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            }
          }
        }
      }
    });
  }

  /**
   * Define associations
   */
  static associate(models) {
    // ComplianceScore belongs to client
    this.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    
    // ComplianceScore has many audit trails
    this.hasMany(models.AuditTrail, {
      foreignKey: 'entityId',
      as: 'auditTrails',
      scope: {
        entityType: 'compliance_score'
      }
    });
  }

  /**
   * Instance method to calculate grade from score
   */
  calculateGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Instance method to validate score
   */
  async validateScore() {
    const results = {
      isValid: true,
      validationRules: [],
      warnings: [],
      errors: []
    };
    
    // Check component scores consistency
    const components = this.componentScores;
    const weights = this.calculationDetails.weights || {};
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    Object.keys(components).forEach(component => {
      const weight = weights[component] || (1 / Object.keys(components).length);
      weightedSum += components[component].score * weight;
      totalWeight += weight;
    });
    
    const calculatedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const scoreDifference = Math.abs(this.overallScore - calculatedScore);
    
    if (scoreDifference > 1) {
      results.errors.push(`Overall score (${this.overallScore}) doesn't match calculated score (${calculatedScore.toFixed(2)})`);
      results.isValid = false;
    }
    
    // Check data scope consistency
    if (this.dataScope.documentsProcessed > this.dataScope.totalDocuments) {
      results.warnings.push('Documents processed exceeds total documents');
    }
    
    if (this.dataScope.tonnageAudited > this.dataScope.totalTonnage) {
      results.warnings.push('Tonnage audited exceeds total tonnage');
    }
    
    // Check period validity
    const periodDays = (this.periodEnd - this.periodStart) / (1000 * 60 * 60 * 24);
    if (periodDays > 365) {
      results.warnings.push('Scoring period exceeds one year');
    }
    
    this.validationResults = results;
    return await this.save();
  }

  /**
   * Instance method to publish score
   */
  async publish(validityDays = 90) {
    this.status = 'published';
    this.publishedAt = new Date();
    this.validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
    
    return await this.save();
  }

  /**
   * Instance method to archive score
   */
  async archive() {
    this.status = 'archived';
    return await this.save();
  }

  /**
   * Instance method to add improvement recommendation
   */
  async addRecommendation(recommendation) {
    const recommendations = this.improvementRecommendations || [];
    recommendations.push(recommendation);
    this.improvementRecommendations = recommendations;
    
    return await this.save();
  }

  /**
   * Instance method to update benchmark comparison
   */
  async updateBenchmark(benchmarkData) {
    this.benchmarkComparison = { ...this.benchmarkComparison, ...benchmarkData };
    
    return await this.save();
  }

  /**
   * Instance method to update trend analysis
   */
  async updateTrendAnalysis(previousScores) {
    const trend = this.calculateTrend(previousScores);
    
    this.trendAnalysis = {
      ...this.trendAnalysis,
      previousScores,
      trend: trend.direction,
      trendStrength: trend.strength,
      projectedScore: trend.projection
    };
    
    return await this.save();
  }

  /**
   * Instance method to calculate trend
   */
  calculateTrend(previousScores) {
    if (previousScores.length < 2) {
      return { direction: 'stable', strength: 0, projection: this.overallScore };
    }
    
    // Simple linear regression for trend calculation
    const n = previousScores.length;
    const sumX = previousScores.reduce((sum, _, index) => sum + index, 0);
    const sumY = previousScores.reduce((sum, score) => sum + score, 0);
    const sumXY = previousScores.reduce((sum, score, index) => sum + index * score, 0);
    const sumXX = previousScores.reduce((sum, _, index) => sum + index * index, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const direction = slope > 1 ? 'improving' : slope < -1 ? 'declining' : 'stable';
    const strength = Math.abs(slope);
    const projection = intercept + slope * n;
    
    return { direction, strength, projection };
  }

  /**
   * Instance method to identify risk indicators
   */
  async identifyRiskIndicators() {
    const risks = {
      highRiskAreas: [],
      riskScore: 0,
      mitigationSuggestions: [],
      monitoringRecommendations: []
    };
    
    const components = this.componentScores;
    
    // Identify components with low scores
    Object.keys(components).forEach(component => {
      const score = components[component].score;
      if (score < 60) {
        risks.highRiskAreas.push({
          area: component,
          score,
          severity: score < 40 ? 'critical' : score < 50 ? 'high' : 'medium'
        });
      }
    });
    
    // Calculate overall risk score
    risks.riskScore = Math.max(0, 100 - this.overallScore);
    
    // Generate mitigation suggestions
    if (this.overallScore < 70) {
      risks.mitigationSuggestions.push('Implement comprehensive quality assurance program');
      risks.mitigationSuggestions.push('Increase frequency of internal audits');
    }
    
    if (this.criticalIssuesCount > 0) {
      risks.mitigationSuggestions.push('Address all critical compliance issues immediately');
    }
    
    // Generate monitoring recommendations
    risks.monitoringRecommendations.push('Monthly compliance score tracking');
    if (risks.riskScore > 50) {
      risks.monitoringRecommendations.push('Weekly risk assessment reviews');
    }
    
    this.riskIndicators = risks;
    return await this.save();
  }

  /**
   * Static method to find by client
   */
  static findByClient(clientId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status = 'published',
      startDate,
      endDate
    } = options;
    
    const where = { clientId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.calculationDate = {};
      if (startDate) where.calculationDate[this.sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.calculationDate[this.sequelize.Op.lte] = new Date(endDate);
    }
    
    const offset = (page - 1) * limit;
    
    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['calculationDate', 'DESC']],
      include: [
        {
          model: this.sequelize.models.Client,
          as: 'client',
          attributes: ['id', 'name', 'organization']
        }
      ]
    });
  }

  /**
   * Static method to find latest score for client
   */
  static findLatestForClient(clientId) {
    return this.findOne({
      where: {
        clientId,
        status: 'published'
      },
      order: [['calculationDate', 'DESC']],
      include: [
        {
          model: this.sequelize.models.Client,
          as: 'client',
          attributes: ['id', 'name', 'organization']
        }
      ]
    });
  }

  /**
   * Static method to get score distribution
   */
  static async getScoreDistribution() {
    const distribution = await this.findAll({
      where: {
        status: 'published'
      },
      attributes: [
        'grade',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
        [this.sequelize.fn('AVG', this.sequelize.col('overall_score')), 'avgScore']
      ],
      group: ['grade'],
      order: [['grade', 'ASC']],
      raw: true
    });
    
    const scoreRanges = await this.findAll({
      where: {
        status: 'published'
      },
      attributes: [
        [this.sequelize.fn('COUNT', 
          this.sequelize.literal("CASE WHEN overall_score >= 90 THEN 1 END")), 'excellent'],
        [this.sequelize.fn('COUNT', 
          this.sequelize.literal("CASE WHEN overall_score >= 80 AND overall_score < 90 THEN 1 END")), 'good'],
        [this.sequelize.fn('COUNT', 
          this.sequelize.literal("CASE WHEN overall_score >= 70 AND overall_score < 80 THEN 1 END")), 'satisfactory'],
        [this.sequelize.fn('COUNT', 
          this.sequelize.literal("CASE WHEN overall_score < 70 THEN 1 END")), 'needsImprovement']
      ],
      raw: true
    });
    
    return {
      byGrade: distribution,
      byRange: scoreRanges[0]
    };
  }

  /**
   * Static method to calculate industry benchmarks
   */
  static async calculateIndustryBenchmarks() {
    const benchmarks = await this.findAll({
      where: {
        status: 'published',
        calculationDate: {
          [this.sequelize.Op.gte]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
        }
      },
      attributes: [
        [this.sequelize.fn('AVG', this.sequelize.col('overall_score')), 'industryAverage'],
        [this.sequelize.fn('PERCENTILE_CONT', 0.5, this.sequelize.literal('WITHIN GROUP (ORDER BY overall_score)')), 'median'],
        [this.sequelize.fn('PERCENTILE_CONT', 0.25, this.sequelize.literal('WITHIN GROUP (ORDER BY overall_score)')), 'q1'],
        [this.sequelize.fn('PERCENTILE_CONT', 0.75, this.sequelize.literal('WITHIN GROUP (ORDER BY overall_score)')), 'q3'],
        [this.sequelize.fn('MIN', this.sequelize.col('overall_score')), 'minimum'],
        [this.sequelize.fn('MAX', this.sequelize.col('overall_score')), 'maximum'],
        [this.sequelize.fn('STDDEV', this.sequelize.col('overall_score')), 'standardDeviation']
      ],
      raw: true
    });
    
    return benchmarks[0];
  }

  /**
   * Static method to cleanup expired scores
   */
  static async cleanupExpiredScores() {
    const expiredScores = await this.findAll({
      where: {
        validUntil: {
          [this.sequelize.Op.lt]: new Date()
        },
        status: 'published'
      }
    });
    
    for (const score of expiredScores) {
      await score.archive();
    }
    
    return expiredScores.length;
  }

  /**
   * Instance method to check if score is valid
   */
  isValid() {
    return this.validUntil && new Date() <= this.validUntil;
  }

  /**
   * Instance method to get score summary
   */
  getSummary() {
    return {
      scoreId: this.scoreId,
      overallScore: this.overallScore,
      grade: this.grade,
      period: {
        start: this.periodStart,
        end: this.periodEnd
      },
      dataScope: this.dataScope,
      topStrengths: this.getTopStrengths(),
      topWeaknesses: this.getTopWeaknesses(),
      trend: this.trendAnalysis.trend,
      riskLevel: this.getRiskLevel()
    };
  }

  /**
   * Instance method to get top strengths
   */
  getTopStrengths() {
    const components = this.componentScores;
    return Object.keys(components)
      .map(key => ({ component: key, score: components[key].score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  /**
   * Instance method to get top weaknesses
   */
  getTopWeaknesses() {
    const components = this.componentScores;
    return Object.keys(components)
      .map(key => ({ component: key, score: components[key].score }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }

  /**
   * Instance method to get risk level
   */
  getRiskLevel() {
    const riskScore = this.riskIndicators.riskScore || 0;
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }
}

export default ComplianceScore;