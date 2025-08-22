/**
 * WasteSubmission model for waste verification system
 * Handles waste collection submissions with AI verification and blockchain integration
 */

import mongoose from 'mongoose';
import QRCode from 'qrcode';

const { Schema } = mongoose;

const locationSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: [true, 'GPS coordinates are required'],
    validate: {
      validator: function(coords) {
        return coords.length === 2 && 
               coords[0] >= -180 && coords[0] <= 180 && // longitude
               coords[1] >= -90 && coords[1] <= 90;     // latitude
      },
      message: 'Invalid GPS coordinates'
    }
  },
  address: {
    type: String,
    trim: true
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 1000 // meters
  }
}, { _id: false });

const imageMetadataSchema = new Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/png', 'image/webp']
  },
  size: {
    type: Number,
    required: true,
    min: 1,
    max: 10485760 // 10MB
  },
  dimensions: {
    width: Number,
    height: Number
  },
  ipfsHash: {
    type: String,
    required: true,
    match: [/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/, 'Invalid IPFS hash format']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  exifData: {
    timestamp: Date,
    gpsCoordinates: [Number], // [longitude, latitude]
    deviceInfo: String
  }
}, { _id: false });

const aiVerificationSchema = new Schema({
  wasteType: {
    type: String,
    enum: ['plastic', 'paper', 'metal', 'glass', 'organic', 'mixed', 'unknown'],
    required: true
  },
  
  subTypes: [{
    type: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  
  quantity: {
    estimatedWeight: {
      type: Number,
      required: true,
      min: 0,
      max: 10000 // kg
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'tons'],
      default: 'kg'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    }
  },
  
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  
  confidence: {
    overall: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    classification: {
      type: Number,
      min: 0,
      max: 1
    },
    quantity: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  
  anomalies: [{
    type: {
      type: String,
      enum: ['suspicious_quantity', 'location_mismatch', 'image_quality', 'duplicate_submission', 'unusual_pattern']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    description: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  
  processingTime: {
    type: Number, // milliseconds
    required: true
  },
  
  modelVersion: {
    type: String,
    required: true
  },
  
  processedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const wasteSubmissionSchema = new Schema({
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor ID is required'],
    index: true
  },
  
  batchId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^WB[0-9]{8}[A-Z0-9]{4}$/, 'Invalid batch ID format']
  },
  
  qrCode: {
    data: {
      type: String,
      required: true,
      unique: true
    },
    imageUrl: {
      type: String,
      required: true
    }
  },
  
  images: {
    before: {
      type: imageMetadataSchema,
      required: [true, 'Before image is required']
    },
    after: {
      type: imageMetadataSchema,
      required: [true, 'After image is required']
    },
    additional: [imageMetadataSchema]
  },
  
  location: {
    type: locationSchema,
    required: [true, 'Location data is required'],
    index: '2dsphere'
  },
  
  collectionDetails: {
    collectionDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(date) {
          return date <= new Date();
        },
        message: 'Collection date cannot be in the future'
      }
    },
    
    estimatedQuantity: {
      type: Number,
      required: true,
      min: [0.1, 'Quantity must be at least 0.1 kg'],
      max: [10000, 'Quantity cannot exceed 10,000 kg']
    },
    
    wasteSource: {
      type: String,
      enum: ['household', 'commercial', 'industrial', 'construction', 'medical', 'electronic'],
      required: true
    },
    
    collectionMethod: {
      type: String,
      enum: ['door_to_door', 'drop_off', 'pickup_point', 'bulk_collection'],
      required: true
    },
    
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      trim: true
    }
  },
  
  aiVerification: {
    type: aiVerificationSchema,
    required: false // Will be populated after AI processing
  },
  
  status: {
    type: String,
    enum: {
      values: ['pending', 'processing', 'verified', 'rejected', 'flagged', 'expired'],
      message: 'Invalid status value'
    },
    default: 'pending',
    index: true
  },
  
  verificationHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: String,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    automated: {
      type: Boolean,
      default: true
    }
  }],
  
  blockchainTx: {
    type: String,
    match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format'],
    sparse: true,
    index: true
  },
  
  creditGenerated: {
    type: Boolean,
    default: false,
    index: true
  },
  
  creditId: {
    type: Schema.Types.ObjectId,
    ref: 'WasteCredit',
    sparse: true
  },
  
  adminReview: {
    required: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String,
    approved: Boolean
  },
  
  metadata: {
    deviceInfo: {
      userAgent: String,
      platform: String,
      appVersion: String
    },
    
    submissionSource: {
      type: String,
      enum: ['mobile_app', 'web_app', 'api'],
      default: 'web_app'
    },
    
    ipAddress: String,
    
    processingLogs: [{
      stage: String,
      timestamp: Date,
      duration: Number, // milliseconds
      success: Boolean,
      error: String
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
wasteSubmissionSchema.index({ vendorId: 1, createdAt: -1 });
wasteSubmissionSchema.index({ status: 1, createdAt: -1 });
wasteSubmissionSchema.index({ batchId: 1 });
wasteSubmissionSchema.index({ 'qrCode.data': 1 });
wasteSubmissionSchema.index({ 'aiVerification.wasteType': 1 });
wasteSubmissionSchema.index({ creditGenerated: 1 });
wasteSubmissionSchema.index({ 'collectionDetails.collectionDate': -1 });

// Virtual for verification score
wasteSubmissionSchema.virtual('verificationScore').get(function() {
  if (!this.aiVerification) return 0;
  return Math.round(this.aiVerification.confidence.overall * 100);
});

// Virtual for processing duration
wasteSubmissionSchema.virtual('processingDuration').get(function() {
  if (!this.aiVerification) return null;
  return this.aiVerification.processingTime;
});

// Virtual for has anomalies
wasteSubmissionSchema.virtual('hasAnomalies').get(function() {
  return this.aiVerification && this.aiVerification.anomalies.length > 0;
});

// Pre-save middleware to generate batch ID and QR code
wasteSubmissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Generate unique batch ID
      if (!this.batchId) {
        this.batchId = await this.constructor.generateBatchId();
      }
      
      // Generate QR code
      if (!this.qrCode.data) {
        const qrData = {
          batchId: this.batchId,
          vendorId: this.vendorId,
          timestamp: new Date().toISOString(),
          type: 'waste_submission'
        };
        
        this.qrCode.data = JSON.stringify(qrData);
        this.qrCode.imageUrl = await QRCode.toDataURL(this.qrCode.data);
      }
      
      // Add initial status to history
      this.verificationHistory.push({
        status: this.status,
        timestamp: new Date(),
        reason: 'Initial submission',
        automated: true
      });
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Pre-save middleware to update verification history
wasteSubmissionSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.verificationHistory.push({
      status: this.status,
      timestamp: new Date(),
      reason: 'Status updated',
      automated: true
    });
  }
  next();
});

// Static method to generate unique batch ID
wasteSubmissionSchema.statics.generateBatchId = async function() {
  let batchId;
  let exists = true;
  
  while (exists) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    batchId = `WB${timestamp}${random}`;
    
    exists = await this.findOne({ batchId });
  }
  
  return batchId;
};

// Static method to find by batch ID
wasteSubmissionSchema.statics.findByBatchId = function(batchId) {
  return this.findOne({ batchId: batchId.toUpperCase() });
};

// Static method to find by QR code
wasteSubmissionSchema.statics.findByQRCode = function(qrData) {
  return this.findOne({ 'qrCode.data': qrData });
};

// Static method to get submissions by vendor
wasteSubmissionSchema.statics.getByVendor = function(vendorId, options = {}) {
  const {
    page = 1,
    limit = 20,
    status,
    wasteType,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;
  
  const query = { vendorId };
  
  if (status) query.status = status;
  if (wasteType) query['aiVerification.wasteType'] = wasteType;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('vendorId', 'profile.name email')
    .populate('creditId')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

// Static method to get statistics
wasteSubmissionSchema.statics.getStats = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.vendorId) matchStage.vendorId = new mongoose.Types.ObjectId(filters.vendorId);
  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.createdAt.$lte = new Date(filters.endDate);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        verifiedSubmissions: {
          $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
        },
        pendingSubmissions: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        rejectedSubmissions: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        },
        totalQuantity: {
          $sum: '$aiVerification.quantity.estimatedWeight'
        },
        averageConfidence: {
          $avg: '$aiVerification.confidence.overall'
        },
        creditsGenerated: {
          $sum: { $cond: ['$creditGenerated', 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalSubmissions: 0,
    verifiedSubmissions: 0,
    pendingSubmissions: 0,
    rejectedSubmissions: 0,
    totalQuantity: 0,
    averageConfidence: 0,
    creditsGenerated: 0
  };
};

// Static method to get waste type distribution
wasteSubmissionSchema.statics.getWasteTypeDistribution = async function(filters = {}) {
  const matchStage = { status: 'verified' };
  
  if (filters.vendorId) matchStage.vendorId = new mongoose.Types.ObjectId(filters.vendorId);
  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.createdAt.$lte = new Date(filters.endDate);
  }
  
  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$aiVerification.wasteType',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$aiVerification.quantity.estimatedWeight' },
        averageConfidence: { $avg: '$aiVerification.confidence.overall' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Instance method to update AI verification
wasteSubmissionSchema.methods.updateAIVerification = function(verificationData) {
  this.aiVerification = verificationData;
  this.status = verificationData.confidence.overall >= 0.7 ? 'verified' : 'flagged';
  
  // Check if admin review is required
  if (verificationData.anomalies.some(a => a.severity === 'high') || 
      verificationData.confidence.overall < 0.5) {
    this.adminReview.required = true;
    this.status = 'flagged';
  }
  
  return this.save();
};

// Instance method to approve submission
wasteSubmissionSchema.methods.approve = function(adminId, notes) {
  this.status = 'verified';
  this.adminReview.approved = true;
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewedAt = new Date();
  this.adminReview.reviewNotes = notes;
  
  return this.save();
};

// Instance method to reject submission
wasteSubmissionSchema.methods.reject = function(adminId, reason) {
  this.status = 'rejected';
  this.adminReview.approved = false;
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewedAt = new Date();
  this.adminReview.reviewNotes = reason;
  
  return this.save();
};

const WasteSubmission = mongoose.model('WasteSubmission', wasteSubmissionSchema);

export default WasteSubmission;