/**
 * WasteCredit model for waste verification marketplace
 * Represents verified waste credits that can be traded
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const wasteCreditSchema = new Schema({
  submissionId: {
    type: Schema.Types.ObjectId,
    ref: 'WasteSubmission',
    required: [true, 'Submission ID is required'],
    unique: true,
    index: true
  },
  
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor ID is required'],
    index: true
  },
  
  creditId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^WC[0-9]{8}[A-Z0-9]{4}$/, 'Invalid credit ID format']
  },
  
  wasteType: {
    type: String,
    enum: {
      values: ['plastic', 'paper', 'metal', 'glass', 'organic', 'mixed'],
      message: 'Invalid waste type'
    },
    required: [true, 'Waste type is required'],
    index: true
  },
  
  subType: {
    type: String,
    trim: true,
    maxlength: [100, 'Sub-type cannot exceed 100 characters']
  },
  
  quantity: {
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0.1, 'Weight must be at least 0.1 kg'],
      max: [10000, 'Weight cannot exceed 10,000 kg']
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'tons'],
      default: 'kg'
    }
  },
  
  qualityGrade: {
    type: String,
    enum: {
      values: ['A', 'B', 'C', 'D'],
      message: 'Quality grade must be A, B, C, or D'
    },
    required: [true, 'Quality grade is required'],
    index: true
  },
  
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Quality score is required']
  },
  
  verificationDetails: {
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    
    verifiedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    
    verificationMethod: {
      type: String,
      enum: ['ai_only', 'ai_human_review', 'manual_review'],
      required: true
    },
    
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    blockchainVerified: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative']
    },
    
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'INR', 'ETH'],
      default: 'USD'
    },
    
    pricePerKg: {
      type: Number,
      required: true,
      min: 0
    },
    
    dynamicPricing: {
      enabled: {
        type: Boolean,
        default: false
      },
      
      factors: {
        demand: Number,
        quality: Number,
        location: Number,
        urgency: Number
      },
      
      adjustedPrice: Number,
      lastUpdated: Date
    }
  },
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    region: {
      type: String,
      index: true
    }
  },
  
  availability: {
    status: {
      type: String,
      enum: {
        values: ['available', 'reserved', 'sold', 'expired', 'withdrawn'],
        message: 'Invalid availability status'
      },
      default: 'available',
      index: true
    },
    
    listedAt: {
      type: Date,
      default: Date.now
    },
    
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    
    reservedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    },
    
    reservedAt: Date,
    
    reservationExpires: Date,
    
    soldTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    },
    
    soldAt: Date,
    
    soldPrice: Number
  },
  
  blockchain: {
    transactionHash: {
      type: String,
      match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format'],
      sparse: true,
      index: true
    },
    
    tokenId: {
      type: String,
      sparse: true
    },
    
    contractAddress: {
      type: String,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format']
    },
    
    blockNumber: Number,
    
    gasUsed: Number,
    
    confirmations: {
      type: Number,
      default: 0
    },
    
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending'
    }
  },
  
  certifications: [{
    type: {
      type: String,
      enum: ['iso14001', 'recycling_standard', 'carbon_neutral', 'quality_assured'],
      required: true
    },
    
    issuer: {
      type: String,
      required: true
    },
    
    certificateNumber: String,
    
    issuedAt: {
      type: Date,
      required: true
    },
    
    expiresAt: Date,
    
    documentUrl: String
  }],
  
  environmental: {
    carbonFootprint: {
      type: Number,
      min: 0,
      comment: 'CO2 equivalent in kg'
    },
    
    energySaved: {
      type: Number,
      min: 0,
      comment: 'Energy saved in kWh'
    },
    
    waterSaved: {
      type: Number,
      min: 0,
      comment: 'Water saved in liters'
    },
    
    landfillDiverted: {
      type: Number,
      min: 0,
      comment: 'Weight diverted from landfill in kg'
    }
  },
  
  marketplace: {
    views: {
      type: Number,
      default: 0
    },
    
    inquiries: {
      type: Number,
      default: 0
    },
    
    featured: {
      type: Boolean,
      default: false,
      index: true
    },
    
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true
    },
    
    images: [{
      url: String,
      caption: String,
      isPrimary: Boolean
    }]
  },
  
  tracking: {
    collectionDate: {
      type: Date,
      required: true
    },
    
    processingDate: Date,
    
    verificationDate: Date,
    
    listingDate: Date,
    
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    
    statusHistory: [{
      status: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      reason: String,
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  
  metadata: {
    batchInfo: {
      batchId: String,
      batchSize: Number,
      processingFacility: String
    },
    
    compliance: {
      regulations: [String],
      permits: [String],
      auditTrail: String
    },
    
    additionalData: {
      type: Map,
      of: Schema.Types.Mixed
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
wasteCreditSchema.index({ vendorId: 1, createdAt: -1 });
wasteCreditSchema.index({ wasteType: 1, qualityGrade: 1 });
wasteCreditSchema.index({ 'availability.status': 1, 'availability.expiresAt': 1 });
wasteCreditSchema.index({ 'pricing.pricePerKg': 1 });
wasteCreditSchema.index({ 'verificationDetails.blockchainVerified': 1 });
wasteCreditSchema.index({ 'marketplace.featured': 1, createdAt: -1 });
wasteCreditSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for current price
wasteCreditSchema.virtual('currentPrice').get(function() {
  if (this.pricing.dynamicPricing.enabled && this.pricing.dynamicPricing.adjustedPrice) {
    return this.pricing.dynamicPricing.adjustedPrice;
  }
  return this.pricing.basePrice;
});

// Virtual for total value
wasteCreditSchema.virtual('totalValue').get(function() {
  return this.currentPrice * this.quantity.weight;
});

// Virtual for is available
wasteCreditSchema.virtual('isAvailable').get(function() {
  return this.availability.status === 'available' && 
         this.availability.expiresAt > new Date();
});

// Virtual for days until expiry
wasteCreditSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = this.availability.expiresAt;
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate credit ID
wasteCreditSchema.pre('save', async function(next) {
  if (this.isNew && !this.creditId) {
    try {
      this.creditId = await this.constructor.generateCreditId();
    } catch (error) {
      return next(error);
    }
  }
  
  // Update tracking
  if (this.isModified('availability.status')) {
    this.tracking.statusHistory.push({
      status: this.availability.status,
      timestamp: new Date(),
      reason: 'Status updated'
    });
    this.tracking.lastUpdated = new Date();
  }
  
  next();
});

// Pre-save middleware to calculate price per kg
wasteCreditSchema.pre('save', function(next) {
  if (this.isModified('pricing.basePrice') || this.isModified('quantity.weight')) {
    this.pricing.pricePerKg = this.pricing.basePrice / this.quantity.weight;
  }
  next();
});

// Static method to generate unique credit ID
wasteCreditSchema.statics.generateCreditId = async function() {
  let creditId;
  let exists = true;
  
  while (exists) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    creditId = `WC${timestamp}${random}`;
    
    exists = await this.findOne({ creditId });
  }
  
  return creditId;
};

// Static method to find available credits
wasteCreditSchema.statics.findAvailable = function(filters = {}) {
  const query = {
    'availability.status': 'available',
    'availability.expiresAt': { $gt: new Date() }
  };
  
  if (filters.wasteType) query.wasteType = filters.wasteType;
  if (filters.qualityGrade) query.qualityGrade = filters.qualityGrade;
  if (filters.minPrice) query['pricing.pricePerKg'] = { $gte: filters.minPrice };
  if (filters.maxPrice) {
    query['pricing.pricePerKg'] = query['pricing.pricePerKg'] || {};
    query['pricing.pricePerKg'].$lte = filters.maxPrice;
  }
  if (filters.location && filters.radius) {
    query['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: filters.location
        },
        $maxDistance: filters.radius * 1000 // Convert km to meters
      }
    };
  }
  
  return this.find(query)
    .populate('vendorId', 'profile.name profile.organization')
    .populate('submissionId', 'batchId collectionDetails.collectionDate')
    .sort({ 'marketplace.featured': -1, createdAt: -1 });
};

// Static method to get marketplace statistics
wasteCreditSchema.statics.getMarketplaceStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCredits: { $sum: 1 },
        availableCredits: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$availability.status', 'available'] },
                  { $gt: ['$availability.expiresAt', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        totalValue: { $sum: '$pricing.basePrice' },
        averagePrice: { $avg: '$pricing.pricePerKg' },
        totalWeight: { $sum: '$quantity.weight' }
      }
    }
  ]);
  
  const wasteTypeStats = await this.aggregate([
    {
      $match: {
        'availability.status': 'available',
        'availability.expiresAt': { $gt: new Date() }
      }
    },
    {
      $group: {
        _id: '$wasteType',
        count: { $sum: 1 },
        totalWeight: { $sum: '$quantity.weight' },
        averagePrice: { $avg: '$pricing.pricePerKg' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return {
    overall: stats[0] || {
      totalCredits: 0,
      availableCredits: 0,
      totalValue: 0,
      averagePrice: 0,
      totalWeight: 0
    },
    byWasteType: wasteTypeStats
  };
};

// Instance method to reserve credit
wasteCreditSchema.methods.reserve = function(buyerId, duration = 24) {
  if (this.availability.status !== 'available') {
    throw new Error('Credit is not available for reservation');
  }
  
  this.availability.status = 'reserved';
  this.availability.reservedBy = buyerId;
  this.availability.reservedAt = new Date();
  this.availability.reservationExpires = new Date(Date.now() + duration * 60 * 60 * 1000);
  
  return this.save();
};

// Instance method to complete sale
wasteCreditSchema.methods.completeSale = function(buyerId, salePrice) {
  if (this.availability.status !== 'reserved' || 
      !this.availability.reservedBy.equals(buyerId)) {
    throw new Error('Credit is not properly reserved for this buyer');
  }
  
  this.availability.status = 'sold';
  this.availability.soldTo = buyerId;
  this.availability.soldAt = new Date();
  this.availability.soldPrice = salePrice;
  
  return this.save();
};

// Instance method to cancel reservation
wasteCreditSchema.methods.cancelReservation = function() {
  if (this.availability.status !== 'reserved') {
    throw new Error('Credit is not currently reserved');
  }
  
  this.availability.status = 'available';
  this.availability.reservedBy = undefined;
  this.availability.reservedAt = undefined;
  this.availability.reservationExpires = undefined;
  
  return this.save();
};

// Instance method to update blockchain status
wasteCreditSchema.methods.updateBlockchainStatus = function(txHash, status, blockNumber) {
  this.blockchain.transactionHash = txHash;
  this.blockchain.status = status;
  if (blockNumber) this.blockchain.blockNumber = blockNumber;
  
  if (status === 'confirmed') {
    this.verificationDetails.blockchainVerified = true;
  }
  
  return this.save();
};

// Static method to expire old reservations
wasteCreditSchema.statics.expireReservations = async function() {
  const expiredReservations = await this.updateMany(
    {
      'availability.status': 'reserved',
      'availability.reservationExpires': { $lt: new Date() }
    },
    {
      $set: {
        'availability.status': 'available'
      },
      $unset: {
        'availability.reservedBy': '',
        'availability.reservedAt': '',
        'availability.reservationExpires': ''
      }
    }
  );
  
  return expiredReservations.modifiedCount;
};

const WasteCredit = mongoose.model('WasteCredit', wasteCreditSchema);

export default WasteCredit;