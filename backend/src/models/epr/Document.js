/**
 * Document model for EPR compliance system
 * Handles document storage and OCR processing
 */

import { DataTypes, Model } from 'sequelize';

class Document extends Model {
  /**
   * Initialize the Document model
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
      
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Filename is required'
          },
          len: {
            args: [1, 255],
            msg: 'Filename must be between 1 and 255 characters'
          }
        }
      },
      
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Original filename is required'
          }
        }
      },
      
      filePath: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'File path is required'
          }
        }
      },
      
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: {
            args: 1,
            msg: 'File size must be at least 1 byte'
          },
          max: {
            args: 52428800, // 50MB
            msg: 'File size cannot exceed 50MB'
          }
        }
      },
      
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: {
            args: [['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']],
            msg: 'Unsupported file type'
          }
        }
      },
      
      documentType: {
        type: DataTypes.ENUM('invoice', 'weighbridge_slip', 'transport_document', 'certificate', 'manifest', 'permit', 'other'),
        allowNull: false,
        validate: {
          isIn: {
            args: [['invoice', 'weighbridge_slip', 'transport_document', 'certificate', 'manifest', 'permit', 'other']],
            msg: 'Invalid document type'
          }
        }
      },
      
      documentSubtype: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'Document subtype cannot exceed 100 characters'
          }
        }
      },
      
      uploadDetails: {
        type: DataTypes.JSONB,
        defaultValue: {
          uploadMethod: 'web',
          userAgent: null,
          ipAddress: null,
          uploadDuration: null
        }
      },
      
      ocrStatus: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'skipped'),
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['pending', 'processing', 'completed', 'failed', 'skipped']],
            msg: 'Invalid OCR status'
          }
        }
      },
      
      ocrResults: {
        type: DataTypes.JSONB,
        defaultValue: {
          rawText: null,
          confidence: null,
          processingTime: null,
          engine: null,
          version: null,
          language: 'en'
        }
      },
      
      extractedData: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidExtractedData(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Extracted data must be a valid JSON object');
            }
          }
        }
      },
      
      structuredData: {
        type: DataTypes.JSONB,
        defaultValue: {
          vendor: null,
          buyer: null,
          recycler: null,
          wasteType: null,
          quantity: null,
          unit: null,
          date: null,
          invoiceNumber: null,
          transportDetails: null,
          certificationInfo: null
        }
      },
      
      validationResults: {
        type: DataTypes.JSONB,
        defaultValue: {
          isValid: null,
          validationRules: [],
          errors: [],
          warnings: [],
          confidence: null
        }
      },
      
      processingHistory: {
        type: DataTypes.JSONB,
        defaultValue: [],
        validate: {
          isValidHistory(value) {
            if (value && !Array.isArray(value)) {
              throw new Error('Processing history must be an array');
            }
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
          checksum: null,
          encryption: false,
          compression: false,
          backup: false,
          archival: false
        }
      },
      
      storage: {
        type: DataTypes.JSONB,
        defaultValue: {
          provider: 'local',
          bucket: null,
          key: null,
          url: null,
          encrypted: false,
          compressed: false
        }
      },
      
      access: {
        type: DataTypes.JSONB,
        defaultValue: {
          visibility: 'private',
          downloadCount: 0,
          lastAccessed: null,
          sharedWith: []
        }
      },
      
      compliance: {
        type: DataTypes.JSONB,
        defaultValue: {
          retentionPeriod: 2555, // 7 years in days
          legalHold: false,
          auditRequired: true,
          regulatoryRequirements: []
        }
      },
      
      status: {
        type: DataTypes.ENUM('active', 'archived', 'deleted', 'quarantined'),
        defaultValue: 'active',
        validate: {
          isIn: {
            args: [['active', 'archived', 'deleted', 'quarantined']],
            msg: 'Invalid document status'
          }
        }
      },
      
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      archivedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'Document',
      tableName: 'documents',
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft deletes
      indexes: [
        {
          fields: ['client_id']
        },
        {
          fields: ['document_type']
        },
        {
          fields: ['ocr_status']
        },
        {
          fields: ['status']
        },
        {
          fields: ['created_at']
        },
        {
          fields: ['filename']
        },
        {
          fields: ['tags'],
          using: 'gin'
        }
      ],
      hooks: {
        beforeCreate: (document) => {
          // Add initial processing history entry
          document.processingHistory = [{
            stage: 'upload',
            timestamp: new Date(),
            status: 'completed',
            details: 'Document uploaded successfully'
          }];
        },
        
        beforeUpdate: (document) => {
          // Update processing history when OCR status changes
          if (document.changed('ocrStatus')) {
            const history = document.processingHistory || [];
            history.push({
              stage: 'ocr',
              timestamp: new Date(),
              status: document.ocrStatus,
              details: `OCR status changed to ${document.ocrStatus}`
            });
            document.processingHistory = history;
          }
          
          // Set processedAt when OCR is completed
          if (document.changed('ocrStatus') && document.ocrStatus === 'completed') {
            document.processedAt = new Date();
          }
        }
      }
    });
  }

  /**
   * Define associations
   */
  static associate(models) {
    // Document belongs to client
    this.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    
    // Document has many audit results
    this.hasMany(models.AuditResult, {
      foreignKey: 'documentId',
      as: 'auditResults'
    });
    
    // Document has many audit trails
    this.hasMany(models.AuditTrail, {
      foreignKey: 'entityId',
      as: 'auditTrails',
      scope: {
        entityType: 'document'
      }
    });
  }

  /**
   * Instance method to update OCR results
   */
  async updateOCRResults(ocrData) {
    this.ocrStatus = 'completed';
    this.ocrResults = {
      rawText: ocrData.text,
      confidence: ocrData.confidence,
      processingTime: ocrData.processingTime,
      engine: ocrData.engine || 'tesseract',
      version: ocrData.version,
      language: ocrData.language || 'en'
    };
    
    // Add processing history entry
    const history = this.processingHistory || [];
    history.push({
      stage: 'ocr_completed',
      timestamp: new Date(),
      status: 'completed',
      details: `OCR processing completed with ${ocrData.confidence}% confidence`
    });
    this.processingHistory = history;
    
    return await this.save();
  }

  /**
   * Instance method to update extracted data
   */
  async updateExtractedData(extractedData) {
    this.extractedData = extractedData;
    
    // Add processing history entry
    const history = this.processingHistory || [];
    history.push({
      stage: 'data_extraction',
      timestamp: new Date(),
      status: 'completed',
      details: 'Data extraction completed'
    });
    this.processingHistory = history;
    
    return await this.save();
  }

  /**
   * Instance method to update structured data
   */
  async updateStructuredData(structuredData) {
    this.structuredData = { ...this.structuredData, ...structuredData };
    
    // Add processing history entry
    const history = this.processingHistory || [];
    history.push({
      stage: 'data_structuring',
      timestamp: new Date(),
      status: 'completed',
      details: 'Data structuring completed'
    });
    this.processingHistory = history;
    
    return await this.save();
  }

  /**
   * Instance method to validate document data
   */
  async validateData(validationRules) {
    const results = {
      isValid: true,
      validationRules: validationRules.map(rule => rule.name),
      errors: [],
      warnings: [],
      confidence: 1.0
    };
    
    // Run validation rules
    for (const rule of validationRules) {
      try {
        const ruleResult = await rule.validate(this.structuredData);
        if (!ruleResult.isValid) {
          results.isValid = false;
          if (ruleResult.severity === 'error') {
            results.errors.push(ruleResult.message);
          } else {
            results.warnings.push(ruleResult.message);
          }
        }
        results.confidence = Math.min(results.confidence, ruleResult.confidence || 1.0);
      } catch (error) {
        results.errors.push(`Validation rule '${rule.name}' failed: ${error.message}`);
        results.isValid = false;
      }
    }
    
    this.validationResults = results;
    
    // Add processing history entry
    const history = this.processingHistory || [];
    history.push({
      stage: 'validation',
      timestamp: new Date(),
      status: results.isValid ? 'completed' : 'failed',
      details: `Validation completed: ${results.errors.length} errors, ${results.warnings.length} warnings`
    });
    this.processingHistory = history;
    
    return await this.save();
  }

  /**
   * Instance method to increment download count
   */
  async incrementDownloadCount() {
    const access = this.access || {};
    access.downloadCount = (access.downloadCount || 0) + 1;
    access.lastAccessed = new Date();
    this.access = access;
    
    return await this.save();
  }

  /**
   * Instance method to archive document
   */
  async archive() {
    this.status = 'archived';
    this.archivedAt = new Date();
    
    // Add processing history entry
    const history = this.processingHistory || [];
    history.push({
      stage: 'archival',
      timestamp: new Date(),
      status: 'completed',
      details: 'Document archived'
    });
    this.processingHistory = history;
    
    return await this.save();
  }

  /**
   * Instance method to quarantine document
   */
  async quarantine(reason) {
    this.status = 'quarantined';
    
    // Add processing history entry
    const history = this.processingHistory || [];
    history.push({
      stage: 'quarantine',
      timestamp: new Date(),
      status: 'quarantined',
      details: `Document quarantined: ${reason}`
    });
    this.processingHistory = history;
    
    return await this.save();
  }

  /**
   * Static method to find documents by client
   */
  static findByClient(clientId, options = {}) {
    const {
      page = 1,
      limit = 20,
      documentType,
      status = 'active',
      ocrStatus,
      startDate,
      endDate
    } = options;
    
    const where = { clientId };
    if (documentType) where.documentType = documentType;
    if (status) where.status = status;
    if (ocrStatus) where.ocrStatus = ocrStatus;
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
        }
      ]
    });
  }

  /**
   * Static method to find documents pending OCR
   */
  static findPendingOCR() {
    return this.findAll({
      where: {
        ocrStatus: 'pending',
        status: 'active'
      },
      order: [['createdAt', 'ASC']],
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
   * Static method to get document statistics
   */
  static async getStatistics(clientId = null) {
    const where = clientId ? { clientId } : {};
    
    const stats = await this.findAll({
      where,
      attributes: [
        'documentType',
        'ocrStatus',
        'status',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
        [this.sequelize.fn('SUM', this.sequelize.col('file_size')), 'totalSize']
      ],
      group: ['documentType', 'ocrStatus', 'status'],
      raw: true
    });
    
    const processingStats = await this.findAll({
      where: {
        ...where,
        processedAt: {
          [this.sequelize.Op.not]: null
        }
      },
      attributes: [
        [this.sequelize.fn('AVG', this.sequelize.literal("(ocr_results->>'processingTime')::numeric")), 'avgProcessingTime'],
        [this.sequelize.fn('AVG', this.sequelize.literal("(ocr_results->>'confidence')::numeric")), 'avgConfidence']
      ],
      raw: true
    });
    
    return {
      byTypeAndStatus: stats,
      processing: processingStats[0]
    };
  }

  /**
   * Static method to cleanup old documents
   */
  static async cleanupExpired() {
    const expiredDocuments = await this.findAll({
      where: {
        expiresAt: {
          [this.sequelize.Op.lt]: new Date()
        },
        status: 'active'
      }
    });
    
    for (const doc of expiredDocuments) {
      await doc.archive();
    }
    
    return expiredDocuments.length;
  }

  /**
   * Instance method to get file extension
   */
  getFileExtension() {
    const parts = this.filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Instance method to get human readable file size
   */
  getHumanReadableSize() {
    const bytes = this.fileSize;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Instance method to check if document is image
   */
  isImage() {
    return this.mimeType.startsWith('image/');
  }

  /**
   * Instance method to check if document is PDF
   */
  isPDF() {
    return this.mimeType === 'application/pdf';
  }

  /**
   * Instance method to check if document is spreadsheet
   */
  isSpreadsheet() {
    return this.mimeType.includes('excel') || 
           this.mimeType.includes('spreadsheet') || 
           this.mimeType === 'text/csv';
  }
}

export default Document;