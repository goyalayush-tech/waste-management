/**
 * RecyclerMaster model for EPR compliance system
 * Maintains database of registered recyclers with CPCB/SPCB data
 */

import { DataTypes, Model } from 'sequelize';

class RecyclerMaster extends Model {
  /**
   * Initialize the RecyclerMaster model
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
            msg: 'Recycler name is required'
          },
          len: {
            args: [2, 300],
            msg: 'Recycler name must be between 2 and 300 characters'
          }
        }
      },
      
      registrationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Registration number already exists'
        },
        validate: {
          notEmpty: {
            msg: 'Registration number is required'
          },
          len: {
            args: [5, 50],
            msg: 'Registration number must be between 5 and 50 characters'
          }
        }
      },
      
      alternateRegistrationNumbers: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        validate: {
          isValidNumbers(value) {
            if (value && !Array.isArray(value)) {
              throw new Error('Alternate registration numbers must be an array');
            }
          }
        }
      },
      
      gstNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isValidGST(value) {
            if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
              throw new Error('Invalid GST number format');
            }
          }
        }
      },
      
      panNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isValidPAN(value) {
            if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
              throw new Error('Invalid PAN number format');
            }
          }
        }
      },
      
      address: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        validate: {
          isValidAddress(value) {
            if (!value || typeof value !== 'object') {
              throw new Error('Address must be a valid JSON object');
            }
            if (!value.street || !value.city || !value.state || !value.pincode) {
              throw new Error('Address must include street, city, state, and pincode');
            }
          }
        }
      },
      
      state: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'State is required'
          },
          len: {
            args: [2, 100],
            msg: 'State name must be between 2 and 100 characters'
          }
        }
      },
      
      district: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'District is required'
          },
          len: {
            args: [2, 100],
            msg: 'District name must be between 2 and 100 characters'
          }
        }
      },
      
      pincode: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Pincode is required'
          },
          isValidPincode(value) {
            if (!/^[0-9]{6}$/.test(value)) {
              throw new Error('Pincode must be 6 digits');
            }
          }
        }
      },
      
      coordinates: {
        type: DataTypes.JSONB,
        allowNull: true,
        validate: {
          isValidCoordinates(value) {
            if (value && (typeof value !== 'object' || 
                         typeof value.latitude !== 'number' || 
                         typeof value.longitude !== 'number')) {
              throw new Error('Coordinates must include valid latitude and longitude');
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
      
      licenseInfo: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        validate: {
          isValidLicense(value) {
            if (!value || typeof value !== 'object') {
              throw new Error('License info must be a valid JSON object');
            }
          }
        }
      },
      
      licenseType: {
        type: DataTypes.ENUM('cpcb', 'spcb', 'both'),
        allowNull: false,
        validate: {
          isIn: {
            args: [['cpcb', 'spcb', 'both']],
            msg: 'License type must be cpcb, spcb, or both'
          }
        }
      },
      
      licenseNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'License number is required'
          },
          len: {
            args: [5, 100],
            msg: 'License number must be between 5 and 100 characters'
          }
        }
      },
      
      licenseExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: {
            msg: 'License expiry must be a valid date'
          }
        }
      },
      
      operationalDetails: {
        type: DataTypes.JSONB,
        defaultValue: {
          establishedYear: null,
          operatingHours: null,
          seasonalOperations: false,
          certifications: [],
          equipmentDetails: []
        }
      },
      
      capacity: {
        type: DataTypes.JSONB,
        defaultValue: {
          dailyCapacityTonnes: null,
          monthlyCapacityTonnes: null,
          annualCapacityTonnes: null,
          storageCapacityTonnes: null,
          utilizationRate: null
        },
        validate: {
          isValidCapacity(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Capacity must be a valid JSON object');
            }
          }
        }
      },
      
      wasteTypesAccepted: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        validate: {
          isValidWasteTypes(value) {
            if (value && !Array.isArray(value)) {
              throw new Error('Waste types must be an array');
            }
            const validTypes = [
              'plastic', 'paper', 'metal', 'glass', 'textile', 'rubber', 
              'electronic', 'battery', 'hazardous', 'mixed', 'other'
            ];
            if (value && value.some(type => !validTypes.includes(type))) {
              throw new Error('Invalid waste type specified');
            }
          }
        }
      },
      
      processingMethods: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        validate: {
          isValidMethods(value) {
            if (value && !Array.isArray(value)) {
              throw new Error('Processing methods must be an array');
            }
          }
        }
      },
      
      outputProducts: {
        type: DataTypes.JSONB,
        defaultValue: {
          primaryProducts: [],
          byProducts: [],
          qualityGrades: []
        }
      },
      
      complianceHistory: {
        type: DataTypes.JSONB,
        defaultValue: {
          inspections: [],
          violations: [],
          penalties: [],
          improvements: []
        }
      },
      
      riskProfile: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium',
        validate: {
          isIn: {
            args: [['low', 'medium', 'high', 'critical']],
            msg: 'Risk profile must be low, medium, high, or critical'
          }
        }
      },
      
      riskFactors: {
        type: DataTypes.JSONB,
        defaultValue: {
          environmental: [],
          operational: [],
          financial: [],
          regulatory: [],
          overall_score: 0
        }
      },
      
      verificationStatus: {
        type: DataTypes.ENUM('verified', 'pending', 'rejected', 'suspended'),
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['verified', 'pending', 'rejected', 'suspended']],
            msg: 'Verification status must be verified, pending, rejected, or suspended'
          }
        }
      },
      
      verificationDetails: {
        type: DataTypes.JSONB,
        defaultValue: {
          verifiedBy: null,
          verificationDate: null,
          verificationMethod: null,
          documentsVerified: [],
          siteVisitConducted: false,
          nextVerificationDue: null
        }
      },
      
      performanceMetrics: {
        type: DataTypes.JSONB,
        defaultValue: {
          processingEfficiency: null,
          qualityRating: null,
          deliveryReliability: null,
          environmentalCompliance: null,
          customerSatisfaction: null
        }
      },
      
      financialInfo: {
        type: DataTypes.JSONB,
        defaultValue: {
          annualTurnover: null,
          creditRating: null,
          paymentTerms: null,
          bankingDetails: {}
        }
      },
      
      partnerships: {
        type: DataTypes.JSONB,
        defaultValue: {
          suppliers: [],
          customers: [],
          certifyingBodies: [],
          governmentAgencies: []
        }
      },
      
      documents: {
        type: DataTypes.JSONB,
        defaultValue: {
          license: null,
          registration: null,
          gstCertificate: null,
          environmentalClearance: null,
          insurancePolicies: [],
          auditReports: []
        }
      },
      
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'blacklisted'),
        defaultValue: 'active',
        validate: {
          isIn: {
            args: [['active', 'inactive', 'suspended', 'blacklisted']],
            msg: 'Status must be active, inactive, suspended, or blacklisted'
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
      
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 2000],
            msg: 'Notes cannot exceed 2000 characters'
          }
        }
      },
      
      lastVerifiedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      lastInspectionAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      nextInspectionDue: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      dataSource: {
        type: DataTypes.STRING,
        defaultValue: 'manual',
        validate: {
          isIn: {
            args: [['manual', 'cpcb_api', 'spcb_api', 'government_portal', 'third_party']],
            msg: 'Invalid data source'
          }
        }
      },
      
      lastSyncedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      syncStatus: {
        type: DataTypes.ENUM('synced', 'pending', 'failed', 'manual'),
        defaultValue: 'manual',
        validate: {
          isIn: {
            args: [['synced', 'pending', 'failed', 'manual']],
            msg: 'Invalid sync status'
          }
        }
      }
    }, {
      sequelize,
      modelName: 'RecyclerMaster',
      tableName: 'recycler_master',
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft deletes
      indexes: [
        {
          fields: ['registration_number'],
          unique: true
        },
        {
          fields: ['gst_number']
        },
        {
          fields: ['state']
        },
        {
          fields: ['district']
        },
        {
          fields: ['pincode']
        },
        {
          fields: ['license_type']
        },
        {
          fields: ['verification_status']
        },
        {
          fields: ['risk_profile']
        },
        {
          fields: ['status']
        },
        {
          fields: ['waste_types_accepted'],
          using: 'gin'
        },
        {
          fields: ['tags'],
          using: 'gin'
        }
      ],
      hooks: {
        beforeUpdate: (recycler) => {
          // Update verification date when status changes to verified
          if (recycler.changed('verificationStatus') && recycler.verificationStatus === 'verified') {
            recycler.lastVerifiedAt = new Date();
            
            const details = recycler.verificationDetails || {};
            details.verificationDate = new Date();
            recycler.verificationDetails = details;
          }
          
          // Update sync timestamp
          if (recycler.changed('syncStatus') && recycler.syncStatus === 'synced') {
            recycler.lastSyncedAt = new Date();
          }
        }
      }
    });
  }

  /**
   * Define associations
   */
  static associate(models) {
    // RecyclerMaster has many audit trails
    this.hasMany(models.AuditTrail, {
      foreignKey: 'entityId',
      as: 'auditTrails',
      scope: {
        entityType: 'recycler_master'
      }
    });
  }

  /**
   * Instance method to verify recycler
   */
  async verify(verifiedBy, method = 'manual') {
    this.verificationStatus = 'verified';
    this.lastVerifiedAt = new Date();
    
    const details = this.verificationDetails || {};
    details.verifiedBy = verifiedBy;
    details.verificationDate = new Date();
    details.verificationMethod = method;
    details.nextVerificationDue = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    this.verificationDetails = details;
    
    return await this.save();
  }

  /**
   * Instance method to update risk profile
   */
  async updateRiskProfile(riskFactors) {
    this.riskFactors = { ...this.riskFactors, ...riskFactors };
    
    // Calculate overall risk score
    const factors = this.riskFactors;
    let totalScore = 0;
    let factorCount = 0;
    
    ['environmental', 'operational', 'financial', 'regulatory'].forEach(category => {
      if (factors[category] && Array.isArray(factors[category])) {
        factors[category].forEach(factor => {
          if (factor.score) {
            totalScore += factor.score;
            factorCount++;
          }
        });
      }
    });
    
    const overallScore = factorCount > 0 ? totalScore / factorCount : 0;
    factors.overall_score = overallScore;
    
    // Determine risk profile based on score
    if (overallScore >= 80) this.riskProfile = 'low';
    else if (overallScore >= 60) this.riskProfile = 'medium';
    else if (overallScore >= 40) this.riskProfile = 'high';
    else this.riskProfile = 'critical';
    
    return await this.save();
  }

  /**
   * Instance method to add compliance record
   */
  async addComplianceRecord(type, details) {
    const history = this.complianceHistory || { inspections: [], violations: [], penalties: [], improvements: [] };
    
    if (!history[type]) history[type] = [];
    
    history[type].push({
      id: Date.now().toString(),
      date: new Date(),
      details,
      addedAt: new Date()
    });
    
    this.complianceHistory = history;
    
    // Update last inspection date if it's an inspection
    if (type === 'inspections') {
      this.lastInspectionAt = new Date();
      this.nextInspectionDue = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months
    }
    
    return await this.save();
  }

  /**
   * Instance method to update performance metrics
   */
  async updatePerformanceMetrics(metrics) {
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
    
    return await this.save();
  }

  /**
   * Instance method to suspend recycler
   */
  async suspend(reason) {
    this.status = 'suspended';
    this.verificationStatus = 'suspended';
    
    const notes = this.notes || '';
    this.notes = `${notes}\n[${new Date().toISOString()}] Suspended: ${reason}`;
    
    return await this.save();
  }

  /**
   * Instance method to blacklist recycler
   */
  async blacklist(reason) {
    this.status = 'blacklisted';
    this.verificationStatus = 'rejected';
    
    const notes = this.notes || '';
    this.notes = `${notes}\n[${new Date().toISOString()}] Blacklisted: ${reason}`;
    
    return await this.save();
  }

  /**
   * Static method to find by registration number
   */
  static findByRegistrationNumber(registrationNumber) {
    return this.findOne({
      where: {
        [this.sequelize.Op.or]: [
          { registrationNumber },
          { alternateRegistrationNumbers: { [this.sequelize.Op.contains]: [registrationNumber] } }
        ]
      }
    });
  }

  /**
   * Static method to find by GST number
   */
  static findByGSTNumber(gstNumber) {
    return this.findOne({
      where: { gstNumber }
    });
  }

  /**
   * Static method to find by location
   */
  static findByLocation(state, district = null, pincode = null) {
    const where = { state };
    if (district) where.district = district;
    if (pincode) where.pincode = pincode;
    
    return this.findAll({
      where,
      order: [['name', 'ASC']]
    });
  }

  /**
   * Static method to find by waste type
   */
  static findByWasteType(wasteType) {
    return this.findAll({
      where: {
        wasteTypesAccepted: {
          [this.sequelize.Op.contains]: [wasteType]
        },
        status: 'active',
        verificationStatus: 'verified'
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Static method to find verified recyclers
   */
  static findVerified() {
    return this.findAll({
      where: {
        verificationStatus: 'verified',
        status: 'active'
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Static method to find recyclers needing verification
   */
  static findNeedingVerification() {
    return this.findAll({
      where: {
        verificationStatus: 'pending'
      },
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * Static method to find recyclers with expired licenses
   */
  static findWithExpiredLicenses() {
    return this.findAll({
      where: {
        licenseExpiry: {
          [this.sequelize.Op.lt]: new Date()
        },
        status: 'active'
      },
      order: [['licenseExpiry', 'ASC']]
    });
  }

  /**
   * Static method to get statistics
   */
  static async getStatistics() {
    const stats = await this.findAll({
      attributes: [
        'state',
        'verificationStatus',
        'riskProfile',
        'status',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: ['state', 'verificationStatus', 'riskProfile', 'status'],
      raw: true
    });
    
    const wasteTypeStats = await this.findAll({
      attributes: [
        [this.sequelize.fn('unnest', this.sequelize.col('waste_types_accepted')), 'wasteType'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: [this.sequelize.fn('unnest', this.sequelize.col('waste_types_accepted'))],
      raw: true
    });
    
    const capacityStats = await this.findAll({
      attributes: [
        [this.sequelize.fn('SUM', this.sequelize.literal("(capacity->>'dailyCapacityTonnes')::numeric")), 'totalDailyCapacity'],
        [this.sequelize.fn('AVG', this.sequelize.literal("(capacity->>'dailyCapacityTonnes')::numeric")), 'avgDailyCapacity'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'totalRecyclers']
      ],
      where: {
        status: 'active',
        verificationStatus: 'verified'
      },
      raw: true
    });
    
    return {
      byStateStatusRisk: stats,
      byWasteType: wasteTypeStats,
      capacity: capacityStats[0]
    };
  }

  /**
   * Static method to sync with external data source
   */
  static async syncWithExternalSource(dataSource, data) {
    const recycler = await this.findByRegistrationNumber(data.registrationNumber);
    
    if (recycler) {
      // Update existing recycler
      Object.assign(recycler, data);
      recycler.dataSource = dataSource;
      recycler.syncStatus = 'synced';
      recycler.lastSyncedAt = new Date();
      await recycler.save();
      return recycler;
    } else {
      // Create new recycler
      const newRecycler = await this.create({
        ...data,
        dataSource,
        syncStatus: 'synced',
        lastSyncedAt: new Date()
      });
      return newRecycler;
    }
  }

  /**
   * Instance method to check if license is expired
   */
  isLicenseExpired() {
    return this.licenseExpiry && new Date() > this.licenseExpiry;
  }

  /**
   * Instance method to check if verification is due
   */
  isVerificationDue() {
    const details = this.verificationDetails || {};
    return details.nextVerificationDue && new Date() > details.nextVerificationDue;
  }

  /**
   * Instance method to check if inspection is due
   */
  isInspectionDue() {
    return this.nextInspectionDue && new Date() > this.nextInspectionDue;
  }

  /**
   * Instance method to get distance from coordinates
   */
  getDistanceFrom(latitude, longitude) {
    if (!this.coordinates) return null;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (latitude - this.coordinates.latitude) * Math.PI / 180;
    const dLon = (longitude - this.coordinates.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.coordinates.latitude * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }
}

export default RecyclerMaster;