const { NFTStorage, File } = require('nft.storage');
const { create } = require('ipfs-http-client');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ipfs-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/ipfs-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize IPFS clients
const nftStorage = new NFTStorage({ token: process.env.NFT_STORAGE_API_KEY });
const ipfsClient = create({
  host: process.env.IPFS_HOST || 'localhost',
  port: process.env.IPFS_PORT || 5001,
  protocol: process.env.IPFS_PROTOCOL || 'http'
});

/**
 * Enhanced IPFS Service for decentralized storage of waste certificate metadata
 * with automatic backup and redundancy systems
 */
class IPFSService {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups/metadata');
    this.redundancyGateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://nftstorage.link/ipfs/'
    ];
    this.initializeBackupSystem();
  }

  /**
   * Initialize backup system and create necessary directories
   */
  async initializeBackupSystem() {
    try {
      if (!fsSync.existsSync(this.backupDir)) {
        await fs.mkdir(this.backupDir, { recursive: true });
      }
      
      // Create logs directory if it doesn't exist
      const logsDir = path.join(__dirname, '../logs');
      if (!fsSync.existsSync(logsDir)) {
        await fs.mkdir(logsDir, { recursive: true });
      }
      
      logger.info('IPFS backup system initialized');
    } catch (error) {
      logger.error('Failed to initialize backup system:', error);
    }
  }

  /**
   * Store comprehensive waste processing metadata on IPFS with redundancy
   * @param {Object} metadata - Complete certificate metadata
   * @param {Array<Buffer>} attachments - Optional file attachments
   * @returns {Promise<Object>} - Storage result with CID and backup info
   */
  async storeWasteProcessingMetadata(metadata, attachments = []) {
    try {
      logger.info(`Storing waste processing metadata for batch: ${metadata.batchId}`);
      
      // Validate metadata structure
      this.validateMetadata(metadata);
      
      // Process attachments if provided
      const processedAttachments = await this.processAttachments(attachments);
      
      // Create comprehensive metadata object
      const completeMetadata = {
        ...metadata,
        attachments: processedAttachments,
        storageTimestamp: new Date().toISOString(),
        storageVersion: '2.0',
        checksum: this.calculateChecksum(metadata)
      };

      // Store on multiple IPFS services for redundancy
      const storageResults = await this.storeWithRedundancy(completeMetadata);
      
      // Create automatic backups
      await this.createAutomaticBackup(storageResults.primaryCid, completeMetadata);
      
      // Log successful storage
      logger.info(`Successfully stored metadata with primary CID: ${storageResults.primaryCid}`);
      
      return storageResults;
    } catch (error) {
      logger.error('Error storing waste processing metadata:', error);
      throw new Error(`IPFS storage failed: ${error.message}`);
    }
  }

  /**
   * Store metadata with redundancy across multiple IPFS services
   * @param {Object} metadata - Metadata to store
   * @returns {Promise<Object>} - Storage results with multiple CIDs
   */
  async storeWithRedundancy(metadata) {
    const metadataFile = new File(
      [JSON.stringify(metadata, null, 2)],
      'waste-certificate-metadata.json',
      { type: 'application/json' }
    );

    const storagePromises = [];
    
    // Store on NFT.Storage (primary)
    storagePromises.push(
      nftStorage.storeBlob(metadataFile)
        .then(cid => ({ service: 'nft.storage', cid, status: 'success' }))
        .catch(error => ({ service: 'nft.storage', error: error.message, status: 'failed' }))
    );

    // Store on local IPFS node (secondary)
    if (process.env.IPFS_HOST) {
      storagePromises.push(
        ipfsClient.add(JSON.stringify(metadata, null, 2))
          .then(result => ({ service: 'local-ipfs', cid: result.cid.toString(), status: 'success' }))
          .catch(error => ({ service: 'local-ipfs', error: error.message, status: 'failed' }))
      );
    }

    const results = await Promise.allSettled(storagePromises);
    const storageResults = results.map(result => result.value || result.reason);
    
    // Find primary successful storage
    const primaryResult = storageResults.find(result => result.status === 'success');
    if (!primaryResult) {
      throw new Error('All IPFS storage services failed');
    }

    return {
      primaryCid: primaryResult.cid,
      primaryService: primaryResult.service,
      redundantStorages: storageResults.filter(result => result.status === 'success'),
      failedStorages: storageResults.filter(result => result.status === 'failed'),
      totalRedundancy: storageResults.filter(result => result.status === 'success').length
    };
  }

  /**
   * Process file attachments and store them on IPFS
   * @param {Array<Buffer>} attachments - File attachments
   * @returns {Promise<Array<Object>>} - Processed attachment metadata
   */
  async processAttachments(attachments) {
    if (!attachments || attachments.length === 0) {
      return [];
    }

    const processedAttachments = [];
    
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      try {
        const fileName = `attachment-${i}-${Date.now()}`;
        const file = new File([attachment], fileName, { type: 'application/octet-stream' });
        const cid = await nftStorage.storeBlob(file);
        
        processedAttachments.push({
          fileName,
          cid,
          size: attachment.length,
          checksum: crypto.createHash('sha256').update(attachment).digest('hex'),
          uploadTimestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Failed to process attachment ${i}:`, error);
        // Continue with other attachments
      }
    }
    
    return processedAttachments;
  }

  /**
   * Create automatic backup of metadata with versioning
   * @param {string} cid - IPFS CID
   * @param {Object} metadata - Metadata to backup
   */
  async createAutomaticBackup(cid, metadata) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${cid}-${timestamp}.json`;
      const backupPath = path.join(this.backupDir, backupFileName);
      
      const backupData = {
        cid,
        metadata,
        backupTimestamp: new Date().toISOString(),
        backupVersion: '1.0'
      };
      
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      
      // Create index file for easy retrieval
      await this.updateBackupIndex(cid, backupFileName);
      
      logger.info(`Created automatic backup: ${backupFileName}`);
    } catch (error) {
      logger.error('Failed to create automatic backup:', error);
      // Don't throw error for backup failures
    }
  }

  /**
   * Update backup index for efficient retrieval
   * @param {string} cid - IPFS CID
   * @param {string} backupFileName - Backup file name
   */
  async updateBackupIndex(cid, backupFileName) {
    try {
      const indexPath = path.join(this.backupDir, 'backup-index.json');
      let index = {};
      
      // Load existing index
      try {
        const indexData = await fs.readFile(indexPath, 'utf8');
        index = JSON.parse(indexData);
      } catch (error) {
        // Index doesn't exist, create new one
        index = {};
      }
      
      // Update index
      index[cid] = {
        backupFileName,
        timestamp: new Date().toISOString()
      };
      
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      logger.error('Failed to update backup index:', error);
    }
  }

  /**
   * Retrieve metadata from IPFS with fallback to backups
   * @param {string} cid - IPFS CID
   * @returns {Promise<Object>} - Retrieved metadata
   */
  async retrieveMetadata(cid) {
    try {
      logger.info(`Retrieving metadata for CID: ${cid}`);
      
      // Try to retrieve from IPFS gateways
      for (const gateway of this.redundancyGateways) {
        try {
          const response = await fetch(`${gateway}${cid}`);
          if (response.ok) {
            const metadata = await response.json();
            logger.info(`Successfully retrieved metadata from gateway: ${gateway}`);
            return metadata;
          }
        } catch (error) {
          logger.warn(`Failed to retrieve from gateway ${gateway}:`, error.message);
          continue;
        }
      }
      
      // Fallback to local backup
      const backupData = await this.retrieveFromBackup(cid);
      if (backupData) {
        logger.info(`Retrieved metadata from local backup for CID: ${cid}`);
        return backupData.metadata;
      }
      
      throw new Error(`Failed to retrieve metadata for CID: ${cid}`);
    } catch (error) {
      logger.error('Error retrieving metadata:', error);
      throw error;
    }
  }

  /**
   * Retrieve metadata from local backup
   * @param {string} cid - IPFS CID
   * @returns {Promise<Object|null>} - Backup data or null if not found
   */
  async retrieveFromBackup(cid) {
    try {
      const indexPath = path.join(this.backupDir, 'backup-index.json');
      const indexData = await fs.readFile(indexPath, 'utf8');
      const index = JSON.parse(indexData);
      
      if (index[cid]) {
        const backupPath = path.join(this.backupDir, index[cid].backupFileName);
        const backupData = await fs.readFile(backupPath, 'utf8');
        return JSON.parse(backupData);
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to retrieve from backup:', error);
      return null;
    }
  }

  /**
   * Validate metadata structure according to schema
   * @param {Object} metadata - Metadata to validate
   * @throws {Error} - If validation fails
   */
  validateMetadata(metadata) {
    const requiredFields = ['batchId', 'wasteType', 'processingDate'];
    
    for (const field of requiredFields) {
      if (!metadata[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate data types
    if (typeof metadata.quantity !== 'undefined' && typeof metadata.quantity !== 'number') {
      throw new Error('Quantity must be a number');
    }
    
    if (typeof metadata.carbonCredits !== 'undefined' && typeof metadata.carbonCredits !== 'number') {
      throw new Error('Carbon credits must be a number');
    }
  }

  /**
   * Calculate checksum for metadata integrity
   * @param {Object} metadata - Metadata object
   * @returns {string} - SHA256 checksum
   */
  calculateChecksum(metadata) {
    const metadataString = JSON.stringify(metadata, Object.keys(metadata).sort());
    return crypto.createHash('sha256').update(metadataString).digest('hex');
  }

  /**
   * Verify metadata integrity using checksum
   * @param {Object} metadata - Metadata with checksum
   * @returns {boolean} - True if integrity is verified
   */
  verifyIntegrity(metadata) {
    if (!metadata.checksum) {
      return false;
    }
    
    const { checksum, ...metadataWithoutChecksum } = metadata;
    const calculatedChecksum = this.calculateChecksum(metadataWithoutChecksum);
    
    return checksum === calculatedChecksum;
  }

  /**
   * Get multiple gateway URLs for redundant access
   * @param {string} cid - IPFS CID
   * @returns {Array<string>} - Array of gateway URLs
   */
  getRedundantGatewayUrls(cid) {
    return this.redundancyGateways.map(gateway => `${gateway}${cid}`);
  }

  /**
   * Perform health check on IPFS storage system
   * @returns {Promise<Object>} - Health check results
   */
  async performHealthCheck() {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      nftStorage: { status: 'unknown', error: null },
      localIpfs: { status: 'unknown', error: null },
      backupSystem: { status: 'unknown', error: null },
      gateways: []
    };

    // Test NFT.Storage
    try {
      const testFile = new File(['health-check'], 'health-check.txt', { type: 'text/plain' });
      await nftStorage.storeBlob(testFile);
      healthCheck.nftStorage.status = 'healthy';
    } catch (error) {
      healthCheck.nftStorage.status = 'unhealthy';
      healthCheck.nftStorage.error = error.message;
    }

    // Test local IPFS
    if (process.env.IPFS_HOST) {
      try {
        await ipfsClient.add('health-check');
        healthCheck.localIpfs.status = 'healthy';
      } catch (error) {
        healthCheck.localIpfs.status = 'unhealthy';
        healthCheck.localIpfs.error = error.message;
      }
    }

    // Test backup system
    try {
      const testBackupPath = path.join(this.backupDir, 'health-check.json');
      await fs.writeFile(testBackupPath, JSON.stringify({ test: true }));
      await fs.unlink(testBackupPath);
      healthCheck.backupSystem.status = 'healthy';
    } catch (error) {
      healthCheck.backupSystem.status = 'unhealthy';
      healthCheck.backupSystem.error = error.message;
    }

    // Test gateways
    for (const gateway of this.redundancyGateways) {
      try {
        const response = await fetch(gateway, { method: 'HEAD', timeout: 5000 });
        healthCheck.gateways.push({
          gateway,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: Date.now()
        });
      } catch (error) {
        healthCheck.gateways.push({
          gateway,
          status: 'unhealthy',
          error: error.message
        });
      }
    }

    return healthCheck;
  }
}

module.exports = new IPFSService();