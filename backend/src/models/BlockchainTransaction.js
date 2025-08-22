/**
 * BlockchainTransaction model for tracking blockchain operations
 * Handles transaction tracking for waste submissions and credits
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const blockchainTransactionSchema = new Schema({
  transactionHash: {
    type: String,
    required: [true, 'Transaction hash is required'],
    unique: true,
    match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format'],
    index: true
  },
  
  entityType: {
    type: String,
    enum: {
      values: ['waste_submission', 'waste_credit', 'user_registration', 'credit_transfer', 'audit_record'],
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
  
  contractAddress: {
    type: String,
    required: [true, 'Contract address is required'],
    match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format']
  },
  
  fromAddress: {
    type: String,
    required: [true, 'From address is required'],
    match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid from address format']
  },
  
  toAddress: {
    type: String,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid to address format']
  },
  
  functionName: {
    type: String,
    required: [true, 'Function name is required'],
    trim: true
  },
  
  functionParameters: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map()
  },
  
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'failed', 'dropped', 'replaced'],
      message: 'Invalid transaction status'
    },
    default: 'pending',
    index: true
  },
  
  blockNumber: {
    type: Number,
    min: 0,
    sparse: true,
    index: true
  },
  
  blockHash: {
    type: String,
    match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid block hash format'],
    sparse: true
  },
  
  transactionIndex: {
    type: Number,
    min: 0,
    sparse: true
  },
  
  gasLimit: {
    type: String,
    required: [true, 'Gas limit is required'],
    match: [/^\d+$/, 'Gas limit must be a number']
  },
  
  gasUsed: {
    type: String,
    match: [/^\d+$/, 'Gas used must be a number'],
    sparse: true
  },
  
  gasPrice: {
    type: String,
    required: [true, 'Gas price is required'],
    match: [/^\d+$/, 'Gas price must be a number']
  },
  
  value: {
    type: String,
    default: '0',
    match: [/^\d+$/, 'Value must be a number']
  },
  
  nonce: {
    type: Number,
    required: [true, 'Nonce is required'],
    min: 0
  },
  
  confirmations: {
    type: Number,
    default: 0,
    min: 0
  },
  
  requiredConfirmations: {
    type: Number,
    default: 12,
    min: 1
  },
  
  network: {
    name: {
      type: String,
      required: [true, 'Network name is required'],
      enum: ['mainnet', 'polygon', 'mumbai', 'goerli', 'sepolia']
    },
    
    chainId: {
      type: Number,
      required: [true, 'Chain ID is required']
    },
    
    rpcUrl: {
      type: String,
      required: [true, 'RPC URL is required']
    }
  },
  
  receipt: {
    status: {
      type: String,
      enum: ['success', 'failed'],
      sparse: true
    },
    
    logs: [{
      address: String,
      topics: [String],
      data: String,
      blockNumber: Number,
      transactionHash: String,
      transactionIndex: Number,
      blockHash: String,
      logIndex: Number,
      removed: Boolean
    }],
    
    events: [{
      event: String,
      signature: String,
      args: Map,
      address: String,
      blockNumber: Number,
      transactionHash: String
    }],
    
    cumulativeGasUsed: String,
    effectiveGasPrice: String,
    type: String
  },
  
  error: {
    code: String,
    message: String,
    data: Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  retryAttempts: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  retryHistory: [{
    attempt: Number,
    timestamp: Date,
    gasPrice: String,
    gasLimit: String,
    transactionHash: String,
    error: String
  }],
  
  metadata: {
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    submittedAt: {
      type: Date,
      default: Date.now
    },
    
    confirmedAt: Date,
    
    failedAt: Date,
    
    ipfsHash: {
      type: String,
      match: [/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/, 'Invalid IPFS hash format'],
      sparse: true
    },
    
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      trim: true
    }
  },
  
  monitoring: {
    lastChecked: {
      type: Date,
      default: Date.now
    },
    
    checkCount: {
      type: Number,
      default: 0
    },
    
    alertsSent: {
      type: Number,
      default: 0
    },
    
    webhookNotified: {
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
blockchainTransactionSchema.index({ transactionHash: 1 });
blockchainTransactionSchema.index({ entityType: 1, entityId: 1 });
blockchainTransactionSchema.index({ status: 1, createdAt: -1 });
blockchainTransactionSchema.index({ blockNumber: -1 });
blockchainTransactionSchema.index({ 'network.chainId': 1 });
blockchainTransactionSchema.index({ 'metadata.submittedBy': 1 });
blockchainTransactionSchema.index({ confirmations: 1, requiredConfirmations: 1 });

// Virtual for is confirmed
blockchainTransactionSchema.virtual('isConfirmed').get(function() {
  return this.confirmations >= this.requiredConfirmations && this.status === 'confirmed';
});

// Virtual for is pending
blockchainTransactionSchema.virtual('isPending').get(function() {
  return this.status === 'pending' || 
         (this.status === 'confirmed' && this.confirmations < this.requiredConfirmations);
});

// Virtual for gas cost in ETH
blockchainTransactionSchema.virtual('gasCostEth').get(function() {
  if (!this.gasUsed || !this.gasPrice) return null;
  
  const gasUsed = BigInt(this.gasUsed);
  const gasPrice = BigInt(this.gasPrice);
  const gasCostWei = gasUsed * gasPrice;
  
  // Convert wei to ETH (1 ETH = 10^18 wei)
  return Number(gasCostWei) / Math.pow(10, 18);
});

// Virtual for transaction age in minutes
blockchainTransactionSchema.virtual('ageMinutes').get(function() {
  const now = new Date();
  const submitted = this.metadata.submittedAt;
  return Math.floor((now - submitted) / (1000 * 60));
});

// Pre-save middleware to update monitoring
blockchainTransactionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.monitoring.lastChecked = new Date();
    
    if (this.status === 'confirmed') {
      this.metadata.confirmedAt = new Date();
    } else if (this.status === 'failed') {
      this.metadata.failedAt = new Date();
    }
  }
  
  next();
});

// Static method to find by entity
blockchainTransactionSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({ entityType, entityId }).sort({ createdAt: -1 });
};

// Static method to find pending transactions
blockchainTransactionSchema.statics.findPending = function(options = {}) {
  const query = {
    $or: [
      { status: 'pending' },
      {
        status: 'confirmed',
        confirmations: { $lt: this.schema.obj.requiredConfirmations.default }
      }
    ]
  };
  
  if (options.network) {
    query['network.name'] = options.network;
  }
  
  if (options.olderThan) {
    query.createdAt = { $lt: new Date(Date.now() - options.olderThan * 60 * 1000) };
  }
  
  return this.find(query).sort({ createdAt: 1 });
};

// Static method to get transaction statistics
blockchainTransactionSchema.statics.getStats = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.network) matchStage['network.name'] = filters.network;
  if (filters.entityType) matchStage.entityType = filters.entityType;
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
        totalTransactions: { $sum: 1 },
        confirmedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        pendingTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        averageConfirmations: { $avg: '$confirmations' },
        totalGasUsed: {
          $sum: {
            $cond: [
              { $ne: ['$gasUsed', null] },
              { $toDouble: '$gasUsed' },
              0
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalTransactions: 0,
    confirmedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    averageConfirmations: 0,
    totalGasUsed: 0
  };
};

// Instance method to update confirmation count
blockchainTransactionSchema.methods.updateConfirmations = function(currentBlockNumber) {
  if (this.blockNumber && currentBlockNumber > this.blockNumber) {
    this.confirmations = currentBlockNumber - this.blockNumber + 1;
    
    if (this.confirmations >= this.requiredConfirmations && this.status === 'confirmed') {
      this.status = 'confirmed';
    }
  }
  
  this.monitoring.lastChecked = new Date();
  this.monitoring.checkCount += 1;
  
  return this.save();
};

// Instance method to mark as failed
blockchainTransactionSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'Transaction failed',
    data: error.data || null,
    timestamp: new Date()
  };
  this.metadata.failedAt = new Date();
  
  return this.save();
};

// Instance method to retry transaction
blockchainTransactionSchema.methods.retry = function(newGasPrice, newGasLimit) {
  if (this.retryAttempts >= 5) {
    throw new Error('Maximum retry attempts exceeded');
  }
  
  this.retryHistory.push({
    attempt: this.retryAttempts + 1,
    timestamp: new Date(),
    gasPrice: this.gasPrice,
    gasLimit: this.gasLimit,
    transactionHash: this.transactionHash,
    error: this.error ? this.error.message : null
  });
  
  this.retryAttempts += 1;
  this.gasPrice = newGasPrice || this.gasPrice;
  this.gasLimit = newGasLimit || this.gasLimit;
  this.status = 'pending';
  this.error = undefined;
  
  return this.save();
};

// Instance method to update receipt
blockchainTransactionSchema.methods.updateReceipt = function(receipt) {
  this.receipt = {
    status: receipt.status === 1 ? 'success' : 'failed',
    logs: receipt.logs || [],
    events: receipt.events || [],
    cumulativeGasUsed: receipt.cumulativeGasUsed?.toString(),
    effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
    type: receipt.type?.toString()
  };
  
  this.gasUsed = receipt.gasUsed?.toString();
  this.blockNumber = receipt.blockNumber;
  this.blockHash = receipt.blockHash;
  this.transactionIndex = receipt.transactionIndex;
  
  if (receipt.status === 1) {
    this.status = 'confirmed';
  } else {
    this.status = 'failed';
    this.error = {
      code: 'TRANSACTION_REVERTED',
      message: 'Transaction was reverted',
      timestamp: new Date()
    };
  }
  
  return this.save();
};

// Static method to cleanup old transactions
blockchainTransactionSchema.statics.cleanup = async function(daysOld = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['confirmed', 'failed'] }
  });
  
  return result.deletedCount;
};

const BlockchainTransaction = mongoose.model('BlockchainTransaction', blockchainTransactionSchema);

export default BlockchainTransaction;