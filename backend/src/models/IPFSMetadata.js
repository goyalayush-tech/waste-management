/**
 * IPFSMetadata model for tracking IPFS stored content
 * Handles metadata for images and documents stored on IPFS
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const ipfsMetadataSchema = new Schema({
  ipfsHash: {
    type: String,
    required: [true, 'IPFS hash is required'],
    unique: true,
    match: [/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/, 'Invalid IPFS hash format'],
    index: true
  },
  
  entityType: {
    type: String,
    enum: {
      values: ['waste_image', 'document', 'certificate', 'qr_code', 'avatar', 'report'],
      message: 'Invalid entity type'
    },
    required: [true, 'Entity type is required'],
    index: true
  },
  
  entityId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Entity ID is required'],
    index: true
  },
  
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true,
    maxlength: [255, 'Filename cannot exceed 255 characters']
  },
  
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
    maxlength: [255, 'Original filename cannot exceed 255 characters']
  },
  
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    enum: {
      values: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'application/json', 'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel', 'text/csv'
      ],
      message: 'Unsupported MIME type'
    },
    index: true
  },
  
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [1, 'File size must be at least 1 byte'],
    max: [52428800, 'File size cannot exceed 50MB'] // 50MB limit
  },
  
  checksum: {
    algorithm: {
      type: String,
      enum: ['md5', 'sha1', 'sha256'],
      default: 'sha256'
    },
    hash: {
      type: String,
      required: [true, 'File checksum is required']
    }
  },
  
  uploadDetails: {
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader ID is required']
    },
    
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    uploadMethod: {
      type: String,
      enum: ['direct', 'multipart', 'chunked'],
      default: 'direct'
    },
    
    uploadDuration: {
      type: Number, // milliseconds
      min: 0
    },
    
    ipfsNode: {
      type: String,
      default: 'local'
    },
    
    pinned: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  
  metadata: {
    // Image-specific metadata
    dimensions: {
      width: {
        type: Number,
        min: 1
      },
      height: {
        type: Number,
        min: 1
      }
    },
    
    // EXIF data for images
    exif: {
      timestamp: Date,
      gpsCoordinates: {
        latitude: Number,
        longitude: Number,
        accuracy: Number
      },
      camera: {
        make: String,
        model: String,
        software: String
      },
      settings: {
        iso: Number,
        aperture: String,
        shutterSpeed: String,
        flash: Boolean
      }
    },
    
    // Document-specific metadata
    document: {
      pages: {
        type: Number,
        min: 1
      },
      title: String,
      author: String,
      subject: String,
      keywords: [String],
      creator: String,
      producer: String,
      creationDate: Date,
      modificationDate: Date
    },
    
    // Processing metadata
    processing: {
      compressed: {
        type: Boolean,
        default: false
      },
      optimized: {
        type: Boolean,
        default: false
      },
      watermarked: {
        type: Boolean,
        default: false
      },
      encrypted: {
        type: Boolean,
        default: false
      }
    }
  },
  
  access: {
    visibility: {
      type: String,
      enum: ['public', 'private', 'restricted'],
      default: 'private',
      index: true
    },
    
    permissions: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'admin']
      },
      grantedAt: {
        type: Date,
        default: Date.now
      },
      grantedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    
    downloadCount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  },
  
  storage: {
    gateways: [{
      url: {
        type: String,
        required: true
      },
      primary: {
        type: Boolean,
        default: false
      },
      available: {
        type: Boolean,
        default: true
      },
      lastChecked: {
        type: Date,
        default: Date.now
      },
      responseTime: Number // milliseconds
    }],
    
    replicas: [{
      nodeId: String,
      location: String,
      status: {
        type: String,
        enum: ['active', 'inactive', 'failed'],
        default: 'active'
      },
      lastSeen: {
        type: Date,
        default: Date.now
      }
    }],
    
    backup: {
      enabled: {
        type: Boolean,
        default: true
      },
      lastBackup: Date,
      backupLocation: String,
      backupHash: String
    }
  },
  
  verification: {
    verified: {
      type: Boolean,
      default: false,
      index: true
    },
    
    verifiedAt: Date,
    
    verificationMethod: {
      type: String,
      enum: ['checksum', 'signature', 'blockchain'],
      sparse: true
    },
    
    blockchainRecord: {
      transactionHash: {
        type: String,
        match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format'],
        sparse: true
      },
      blockNumber: Number,
      network: String
    }
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  status: {
    type: String,
    enum: {
      values: ['active', 'archived', 'deleted', 'corrupted'],
      message: 'Invalid status'
    },
    default: 'active',
    index: true
  },
  
  retention: {
    expiresAt: {
      type: Date,
      sparse: true,
      index: true
    },
    
    retentionPolicy: {
      type: String,
      enum: ['permanent', 'temporary', 'compliance'],
      default: 'permanent'
    },
    
    autoDelete: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
ipfsMetadataSchema.index({ ipfsHash: 1 });
ipfsMetadataSchema.index({ entityType: 1, entityId: 1 });
ipfsMetadataSchema.index({ 'uploadDetails.uploadedBy': 1, createdAt: -1 });
ipfsMetadataSchema.index({ mimeType: 1 });
ipfsMetadataSchema.index({ 'access.visibility': 1 });
ipfsMetadataSchema.index({ status: 1 });
ipfsMetadataSchema.index({ 'uploadDetails.pinned': 1 });
ipfsMetadataSchema.index({ tags: 1 });

// Virtual for file extension
ipfsMetadataSchema.virtual('extension').get(function() {
  const parts = this.filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
});

// Virtual for is image
ipfsMetadataSchema.virtual('isImage').get(function() {
  return this.mimeType.startsWith('image/');
});

// Virtual for is document
ipfsMetadataSchema.virtual('isDocument').get(function() {
  return this.mimeType === 'application/pdf' || 
         this.mimeType.includes('spreadsheet') ||
         this.mimeType.includes('excel') ||
         this.mimeType === 'text/csv';
});

// Virtual for primary gateway URL
ipfsMetadataSchema.virtual('primaryGatewayUrl').get(function() {
  const primaryGateway = this.storage.gateways.find(g => g.primary && g.available);
  if (primaryGateway) {
    return `${primaryGateway.url}/ipfs/${this.ipfsHash}`;
  }
  
  const availableGateway = this.storage.gateways.find(g => g.available);
  return availableGateway ? `${availableGateway.url}/ipfs/${this.ipfsHash}` : null;
});

// Virtual for file size in human readable format
ipfsMetadataSchema.virtual('humanReadableSize').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Pre-save middleware to set default gateways
ipfsMetadataSchema.pre('save', function(next) {
  if (this.isNew && this.storage.gateways.length === 0) {
    // Add default IPFS gateways
    this.storage.gateways = [
      {
        url: process.env.IPFS_GATEWAY_URL || 'http://localhost:8080',
        primary: true,
        available: true,
        lastChecked: new Date()
      },
      {
        url: 'https://ipfs.io',
        primary: false,
        available: true,
        lastChecked: new Date()
      },
      {
        url: 'https://gateway.pinata.cloud',
        primary: false,
        available: true,
        lastChecked: new Date()
      }
    ];
  }
  next();
});

// Pre-save middleware to update access timestamp
ipfsMetadataSchema.pre('save', function(next) {
  if (this.isModified('access.downloadCount')) {
    this.access.lastAccessed = new Date();
  }
  next();
});

// Static method to find by entity
ipfsMetadataSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({ entityType, entityId, status: 'active' })
    .sort({ createdAt: -1 });
};

// Static method to find by uploader
ipfsMetadataSchema.statics.findByUploader = function(uploaderId, options = {}) {
  const {
    page = 1,
    limit = 20,
    entityType,
    mimeType,
    startDate,
    endDate
  } = options;
  
  const query = {
    'uploadDetails.uploadedBy': uploaderId,
    status: 'active'
  };
  
  if (entityType) query.entityType = entityType;
  if (mimeType) query.mimeType = mimeType;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get storage statistics
ipfsMetadataSchema.statics.getStorageStats = async function() {
  const stats = await this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        pinnedFiles: {
          $sum: { $cond: ['$uploadDetails.pinned', 1, 0] }
        },
        verifiedFiles: {
          $sum: { $cond: ['$verification.verified', 1, 0] }
        }
      }
    }
  ]);
  
  const typeStats = await this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$entityType',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return {
    overall: stats[0] || {
      totalFiles: 0,
      totalSize: 0,
      pinnedFiles: 0,
      verifiedFiles: 0
    },
    byType: typeStats
  };
};

// Instance method to increment download count
ipfsMetadataSchema.methods.incrementDownloadCount = function() {
  this.access.downloadCount += 1;
  this.access.lastAccessed = new Date();
  return this.save();
};

// Instance method to verify file integrity
ipfsMetadataSchema.methods.verifyIntegrity = async function() {
  try {
    // This would typically involve fetching the file from IPFS
    // and comparing checksums - implementation depends on IPFS client
    this.verification.verified = true;
    this.verification.verifiedAt = new Date();
    this.verification.verificationMethod = 'checksum';
    
    return await this.save();
  } catch (error) {
    this.status = 'corrupted';
    return await this.save();
  }
};

// Instance method to archive file
ipfsMetadataSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Instance method to mark as deleted
ipfsMetadataSchema.methods.markDeleted = function() {
  this.status = 'deleted';
  return this.save();
};

// Instance method to add permission
ipfsMetadataSchema.methods.addPermission = function(userId, role, grantedBy) {
  // Remove existing permission for this user
  this.access.permissions = this.access.permissions.filter(
    p => !p.userId.equals(userId)
  );
  
  // Add new permission
  this.access.permissions.push({
    userId,
    role,
    grantedAt: new Date(),
    grantedBy
  });
  
  return this.save();
};

// Instance method to remove permission
ipfsMetadataSchema.methods.removePermission = function(userId) {
  this.access.permissions = this.access.permissions.filter(
    p => !p.userId.equals(userId)
  );
  
  return this.save();
};

// Static method to cleanup expired files
ipfsMetadataSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  
  const expiredFiles = await this.find({
    'retention.expiresAt': { $lt: now },
    'retention.autoDelete': true,
    status: 'active'
  });
  
  let deletedCount = 0;
  
  for (const file of expiredFiles) {
    file.status = 'deleted';
    await file.save();
    deletedCount++;
  }
  
  return deletedCount;
};

// Static method to check gateway availability
ipfsMetadataSchema.statics.checkGatewayAvailability = async function() {
  // This would typically involve making HTTP requests to each gateway
  // Implementation depends on HTTP client and specific requirements
  const files = await this.find({ status: 'active' });
  
  for (const file of files) {
    for (const gateway of file.storage.gateways) {
      // Mock availability check - in real implementation,
      // this would make an actual HTTP request
      gateway.available = true;
      gateway.lastChecked = new Date();
      gateway.responseTime = Math.floor(Math.random() * 1000) + 100;
    }
    await file.save();
  }
  
  return files.length;
};

const IPFSMetadata = mongoose.model('IPFSMetadata', ipfsMetadataSchema);

export default IPFSMetadata;