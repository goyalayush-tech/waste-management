const axios = require('axios');
const certificateService = require('./certificateService');
const digitalTwinService = require('./digitalTwinService');
const ipfsService = require('./ipfsService');
const { createCertificateMetadata } = require('./metadataSchema');
const { EventEmitter } = require('events');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Enhanced service for handling webhooks to update NFT certificates with real-time processing
 */
class WebhookService extends EventEmitter {
  constructor() {
    super();
    this.webhookSecret = process.env.WEBHOOK_SECRET || 'default-secret';
    this.pendingUpdates = new Map();
    this.registeredWebhooks = new Map();
    this.milestoneDetectors = new Map();
    this.batchUpdateQueue = new Map();
    this.updateInterval = 30 * 1000; // 30 seconds for faster processing
    this.batchSize = 20; // Increased batch size for efficiency
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    
    // Processing milestone types
    this.milestoneTypes = {
      COLLECTION: 'collection',
      SORTING: 'sorting',
      PROCESSING: 'processing',
      QUALITY_CHECK: 'quality_check',
      VERIFICATION: 'verification',
      COMPLETION: 'completion',
      ENVIRONMENTAL_IMPACT: 'environmental_impact',
      DIGITAL_TWIN_UPDATE: 'digital_twin_update'
    };
    
    // Initialize milestone detectors
    this.initializeMilestoneDetectors();
    
    // Start the update processing loop
    this.startUpdateProcessing();
    
    console.log('Enhanced WebhookService initialized with real-time processing capabilities');
  }
  
  /**
   * Register a webhook for certificate updates
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {string} callbackUrl - Callback URL for updates
   * @returns {Promise<Object>} - Registration result
   */
  async registerWebhook(facilityId, tokenId, callbackUrl) {
    try {
      // Generate webhook ID
      const webhookId = `${facilityId}-${tokenId}-${Date.now()}`;
      
      // Store webhook registration
      // In a production system, this would be stored in a database
      const webhook = {
        id: webhookId,
        facilityId,
        tokenId,
        callbackUrl,
        createdAt: new Date().toISOString(),
        lastTriggered: null
      };
      
      console.log(`Registered webhook ${webhookId} for certificate ${tokenId} in facility ${facilityId}`);
      
      return {
        webhookId,
        status: 'registered',
        ...webhook
      };
    } catch (error) {
      console.error('Error registering webhook:', error);
      throw error;
    }
  }
  
  /**
   * Trigger certificate update based on processing milestone
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} milestoneData - Processing milestone data
   * @returns {Promise<Object>} - Update result
   */
  async triggerMilestoneUpdate(facilityId, tokenId, milestoneData) {
    try {
      // Validate milestone data
      if (!milestoneData.milestoneName || !milestoneData.milestoneType) {
        throw new Error('Invalid milestone data: milestoneName and milestoneType are required');
      }
      
      // Queue the update
      const updateId = `${facilityId}-${tokenId}-${Date.now()}`;
      this.pendingUpdates.set(updateId, {
        facilityId,
        tokenId,
        milestoneData,
        timestamp: Date.now()
      });
      
      console.log(`Queued update ${updateId} for certificate ${tokenId} in facility ${facilityId}`);
      
      return {
        updateId,
        status: 'queued',
        estimatedProcessingTime: this.getEstimatedProcessingTime()
      };
    } catch (error) {
      console.error('Error triggering milestone update:', error);
      throw error;
    }
  }
  
  /**
   * Process a batch of pending updates
   * @returns {Promise<void>}
   */
  async processPendingUpdates() {
    try {
      if (this.pendingUpdates.size === 0) {
        return;
      }
      
      console.log(`Processing ${Math.min(this.batchSize, this.pendingUpdates.size)} of ${this.pendingUpdates.size} pending updates`);
      
      // Get updates to process in this batch
      const updates = Array.from(this.pendingUpdates.entries())
        .slice(0, this.batchSize)
        .map(([id, update]) => ({ id, ...update }));
      
      // Group updates by facility for batch processing
      const updatesByFacility = {};
      updates.forEach(update => {
        if (!updatesByFacility[update.facilityId]) {
          updatesByFacility[update.facilityId] = [];
        }
        updatesByFacility[update.facilityId].push(update);
      });
      
      // Process updates for each facility
      for (const [facilityId, facilityUpdates] of Object.entries(updatesByFacility)) {
        // Get certificate contract
        const certificateContract = await certificateService.getCertificateContract(facilityId);
        
        // Process each update
        for (const update of facilityUpdates) {
          try {
            // Get current certificate data
            const currentCert = await certificateContract.getCertificate(update.tokenId);
            
            // Create updated metadata based on milestone
            const updatedData = this.generateUpdatedData(currentCert, update.milestoneData);
            
            // Update certificate
            await certificateService.updateCertificate(facilityId, update.tokenId, updatedData);
            
            // Remove from pending updates
            this.pendingUpdates.delete(update.id);
            
            console.log(`Processed update ${update.id} for certificate ${update.tokenId}`);
          } catch (error) {
            console.error(`Error processing update ${update.id}:`, error);
            
            // If update is older than 24 hours, remove it
            if (Date.now() - update.timestamp > 24 * 60 * 60 * 1000) {
              this.pendingUpdates.delete(update.id);
              console.log(`Removed stale update ${update.id} from queue`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing pending updates:', error);
    }
  }
  
  /**
   * Start the update processing loop
   */
  startUpdateProcessing() {
    setInterval(() => {
      this.processPendingUpdates();
    }, this.updateInterval);
    
    console.log(`Started update processing loop with interval of ${this.updateInterval / 1000} seconds`);
  }
  
  /**
   * Generate updated certificate data based on milestone
   * @param {Object} currentCert - Current certificate data
   * @param {Object} milestoneData - Processing milestone data
   * @returns {Object} - Updated certificate data
   */
  generateUpdatedData(currentCert, milestoneData) {
    // Base updated data
    const updatedData = {
      processingSteps: [...(currentCert.processingSteps || []), {
        name: milestoneData.milestoneName,
        type: milestoneData.milestoneType,
        timestamp: new Date().toISOString(),
        data: milestoneData.data || {}
      }]
    };
    
    // Update specific fields based on milestone type
    switch (milestoneData.milestoneType) {
      case 'quality_check':
        updatedData.qualityScore = milestoneData.data?.qualityScore || currentCert.qualityScore;
        break;
        
      case 'environmental_impact':
        updatedData.carbonCredits = milestoneData.data?.carbonCredits || currentCert.carbonCredits;
        updatedData.co2Reduction = milestoneData.data?.co2Reduction || currentCert.co2Reduction;
        updatedData.recyclingEfficiency = milestoneData.data?.recyclingEfficiency || currentCert.recyclingEfficiency;
        break;
        
      case 'verification':
        updatedData.verifier = milestoneData.data?.verifier || currentCert.verifier;
        updatedData.verificationDate = new Date().toISOString();
        updatedData.verificationMethod = milestoneData.data?.verificationMethod || currentCert.verificationMethod;
        updatedData.isVerified = true;
        break;
        
      case 'processing_complete':
        updatedData.processingDate = new Date().toISOString();
        break;
    }
    
    return updatedData;
  }
  
  /**
   * Initialize milestone detectors for automatic processing detection
   * @private
   */
  initializeMilestoneDetectors() {
    // Collection milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.COLLECTION, {
      condition: (data) => data.status === 'collected' && data.wasteId,
      handler: this.handleCollectionMilestone.bind(this)
    });
    
    // Sorting milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.SORTING, {
      condition: (data) => data.status === 'sorted' && data.categories,
      handler: this.handleSortingMilestone.bind(this)
    });
    
    // Processing milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.PROCESSING, {
      condition: (data) => data.status === 'processing' && data.processingMethod,
      handler: this.handleProcessingMilestone.bind(this)
    });
    
    // Quality check milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.QUALITY_CHECK, {
      condition: (data) => data.qualityScore !== undefined && data.qualityScore >= 0,
      handler: this.handleQualityCheckMilestone.bind(this)
    });
    
    // Verification milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.VERIFICATION, {
      condition: (data) => data.isVerified === true && data.verifier,
      handler: this.handleVerificationMilestone.bind(this)
    });
    
    // Completion milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.COMPLETION, {
      condition: (data) => data.status === 'completed' && data.finalProducts,
      handler: this.handleCompletionMilestone.bind(this)
    });
    
    // Environmental impact milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.ENVIRONMENTAL_IMPACT, {
      condition: (data) => data.carbonCredits > 0 || data.co2Reduction > 0,
      handler: this.handleEnvironmentalImpactMilestone.bind(this)
    });
    
    // Digital twin update milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.DIGITAL_TWIN_UPDATE, {
      condition: (data) => data.digitalTwinId && data.twinState,
      handler: this.handleDigitalTwinUpdateMilestone.bind(this)
    });
  }
  
  /**
   * Enhanced webhook registration with milestone detection
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {string} callbackUrl - Callback URL for updates
   * @param {Array<string>} milestoneTypes - Types of milestones to monitor
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Registration result
   */
  async registerEnhancedWebhook(facilityId, tokenId, callbackUrl, milestoneTypes = [], options = {}) {
    try {
      const webhookId = `${facilityId}-${tokenId}-${Date.now()}`;
      const webhookSecret = crypto.randomBytes(32).toString('hex');
      
      const webhook = {
        id: webhookId,
        facilityId,
        tokenId,
        callbackUrl,
        secret: webhookSecret,
        milestoneTypes: milestoneTypes.length > 0 ? milestoneTypes : Object.values(this.milestoneTypes),
        options: {
          retryAttempts: options.retryAttempts || this.maxRetries,
          retryDelay: options.retryDelay || this.retryDelay,
          batchUpdates: options.batchUpdates !== false,
          realTimeUpdates: options.realTimeUpdates !== false,
          ...options
        },
        createdAt: new Date().toISOString(),
        lastTriggered: null,
        status: 'active',
        triggerCount: 0,
        failureCount: 0
      };
      
      this.registeredWebhooks.set(webhookId, webhook);
      
      console.log(`Registered enhanced webhook ${webhookId} for certificate ${tokenId} in facility ${facilityId}`);
      
      return {
        webhookId,
        secret: webhookSecret,
        status: 'registered',
        monitoredMilestones: webhook.milestoneTypes,
        ...webhook
      };
    } catch (error) {
      console.error('Error registering enhanced webhook:', error);
      throw error;
    }
  }
  
  /**
   * Detect and trigger milestone updates automatically
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} processingData - Processing data to analyze
   * @returns {Promise<Array<Object>>} - Triggered milestone updates
   */
  async detectAndTriggerMilestones(facilityId, tokenId, processingData) {
    try {
      const triggeredMilestones = [];
      
      // Check each milestone detector
      for (const [milestoneType, detector] of this.milestoneDetectors.entries()) {
        if (detector.condition(processingData)) {
          const milestoneData = await detector.handler(facilityId, tokenId, processingData);
          
          if (milestoneData) {
            // Trigger milestone update
            const updateResult = await this.triggerMilestoneUpdate(facilityId, tokenId, milestoneData);
            triggeredMilestones.push({
              milestoneType,
              updateResult,
              data: milestoneData
            });
            
            // Emit milestone event
            this.emit('milestoneDetected', {
              facilityId,
              tokenId,
              milestoneType,
              data: milestoneData,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      return triggeredMilestones;
    } catch (error) {
      console.error('Error detecting and triggering milestones:', error);
      throw error;
    }
  }
  
  /**
   * Handle collection milestone
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} data - Processing data
   * @returns {Promise<Object>} - Milestone data
   */
  async handleCollectionMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Waste Collection Completed',
      milestoneType: this.milestoneTypes.COLLECTION,
      data: {
        wasteId: data.wasteId,
        collectionDate: data.collectionDate || new Date().toISOString(),
        collectionLocation: data.collectionLocation,
        wasteType: data.wasteType,
        quantity: data.quantity,
        collector: data.collector
      }
    };
  }
  
  /**
   * Handle sorting milestone
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} data - Processing data
   * @returns {Promise<Object>} - Milestone data
   */
  async handleSortingMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Waste Sorting Completed',
      milestoneType: this.milestoneTypes.SORTING,
      data: {
        categories: data.categories,
        sortingDate: data.sortingDate || new Date().toISOString(),
        sortingMethod: data.sortingMethod,
        contamination: data.contamination || 0,
        sortingEfficiency: data.sortingEfficiency || 0,
        operator: data.operator
      }
    };
  }
  
  /**
   * Handle processing milestone
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} data - Processing data
   * @returns {Promise<Object>} - Milestone data
   */
  async handleProcessingMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Waste Processing Started',
      milestoneType: this.milestoneTypes.PROCESSING,
      data: {
        processingMethod: data.processingMethod,
        processingDate: data.processingDate || new Date().toISOString(),
        expectedDuration: data.expectedDuration,
        energyConsumption: data.energyConsumption,
        temperature: data.temperature,
        pressure: data.pressure,
        operator: data.operator
      }
    };
  }
  
  /**
   * Handle quality check milestone
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} data - Processing data
   * @returns {Promise<Object>} - Milestone data
   */
  async handleQualityCheckMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Quality Check Completed',
      milestoneType: this.milestoneTypes.QUALITY_CHECK,
      data: {
        qualityScore: data.qualityScore,
        checkDate: data.checkDate || new Date().toISOString(),
        checkMethod: data.checkMethod,
        inspector: data.inspector,
        defects: data.defects || [],
        passed: data.qualityScore >= (data.minimumScore || 70)
      }
    };
  }
  
  /**
   * Handle verification milestone
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} data - Processing data
   * @returns {Promise<Object>} - Milestone data
   */
  async handleVerificationMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Certificate Verification Completed',
      milestoneType: this.milestoneTypes.VERIFICATION,
      data: {
        verifier: data.verifier,
        verificationDate: data.verificationDate || new Date().toISOString(),
        verificationMethod: data.verificationMethod,
        verificationStandard: data.verificationStandard,
        isVerified: data.isVerified,
        verificationHash: data.verificationHash
      }
    };
  }
  
  /**
   * Handle completion milestone
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} data - Processing data
   * @returns {Promise<Object>} - Milestone data
   */
  async handleCompletionMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Processing Completed',
      milestoneType: this.milestoneTypes.COMPLETION,
      data: {
        completionDate: data.completionDate || new Date().toISOString(),
        finalProducts: data.finalProducts,
        totalRecovered: data.totalRecovered,
        wasteReduction: data.wasteReduction,
        processingEfficiency: data.processingEfficiency,
        operator: data.operator
      }
    };
  }
  
  /**
   * Handle environmental impact milestone
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} data - Processing data
   * @returns {Promise<Object>} - Milestone data
   */
  async handleEnvironmentalImpactMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Environmental Impact Calculated',
      milestoneType: this.milestoneTypes.ENVIRONMENTAL_IMPACT,
      data: {
        carbonCredits: data.carbonCredits,
        co2Reduction: data.co2Reduction,
        energySaved: data.energySaved,
        waterSaved: data.waterSaved,
        recyclingEfficiency: data.recyclingEfficiency,
        environmentalImpact: data.environmentalImpact,
        calculationDate: data.calculationDate || new Date().toISOString(),
        calculationMethod: data.calculationMethod
      }
    };
  }
  
  /**
   * Handle digital twin update milestone
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} data - Processing data
   * @returns {Promise<Object>} - Milestone data
   */
  async handleDigitalTwinUpdateMilestone(facilityId, tokenId, data) {
    try {
      // Update digital twin state
      await digitalTwinService.updateTwinState(data.digitalTwinId, data.twinState);
      
      return {
        milestoneName: 'Digital Twin Updated',
        milestoneType: this.milestoneTypes.DIGITAL_TWIN_UPDATE,
        data: {
          digitalTwinId: data.digitalTwinId,
          updateDate: data.updateDate || new Date().toISOString(),
          stateChanges: data.twinState,
          syncStatus: 'synchronized',
          previousState: data.previousState
        }
      };
    } catch (error) {
      console.error('Error updating digital twin:', error);
      return null;
    }
  }
  
  /**
   * Process batch updates efficiently
   * @param {Array<Object>} updates - Array of updates to process
   * @returns {Promise<Object>} - Batch processing result
   */
  async processBatchUpdates(updates) {
    try {
      const batchId = `batch-${Date.now()}`;
      const results = {
        batchId,
        totalUpdates: updates.length,
        successful: 0,
        failed: 0,
        errors: [],
        processedAt: new Date().toISOString()
      };
      
      // Group updates by facility for efficient processing
      const updatesByFacility = {};
      updates.forEach((update, index) => {
        if (!updatesByFacility[update.facilityId]) {
          updatesByFacility[update.facilityId] = [];
        }
        updatesByFacility[update.facilityId].push({ ...update, originalIndex: index });
      });
      
      // Process updates for each facility
      for (const [facilityId, facilityUpdates] of Object.entries(updatesByFacility)) {
        try {
          // Get certificate contract once per facility
          const certificateContract = await certificateService.getCertificateContract(facilityId);
          
          // Prepare batch update data
          const tokenIds = [];
          const carbonCreditsArray = [];
          const recyclingEfficienciesArray = [];
          const environmentalImpactsArray = [];
          const ipfsHashesArray = [];
          
          // Process each update in the facility batch
          for (const update of facilityUpdates) {
            try {
              // Get current certificate data
              const currentCert = await certificateContract.getCertificate(update.tokenId);
              
              // Generate updated data
              const updatedData = this.generateUpdatedData(currentCert, update.milestoneData);
              
              // Create updated metadata
              const metadata = createCertificateMetadata({
                ...updatedData,
                tokenId: update.tokenId,
                processingFacility: facilityId,
                lastUpdated: new Date().toISOString()
              });
              
              // Store metadata on IPFS
              const cid = await ipfsService.storeMetadata(metadata);
              const ipfsUri = `ipfs://${cid}`;
              
              // Add to batch arrays
              tokenIds.push(update.tokenId);
              carbonCreditsArray.push(updatedData.carbonCredits || currentCert.carbonCredits);
              recyclingEfficienciesArray.push(updatedData.recyclingEfficiency || currentCert.recyclingEfficiency);
              environmentalImpactsArray.push(updatedData.environmentalImpact || currentCert.environmentalImpact);
              ipfsHashesArray.push(ipfsUri);
              
              results.successful++;
            } catch (error) {
              console.error(`Error processing update for token ${update.tokenId}:`, error);
              results.failed++;
              results.errors.push({
                tokenId: update.tokenId,
                error: error.message,
                originalIndex: update.originalIndex
              });
            }
          }
          
          // Execute batch update on blockchain if we have updates to process
          if (tokenIds.length > 0) {
            const tx = await certificateContract.batchUpdateCertificates(
              tokenIds,
              carbonCreditsArray,
              recyclingEfficienciesArray,
              environmentalImpactsArray,
              ipfsHashesArray
            );
            
            await tx.wait();
            console.log(`Batch updated ${tokenIds.length} certificates for facility ${facilityId}`);
          }
        } catch (error) {
          console.error(`Error processing batch updates for facility ${facilityId}:`, error);
          // Mark all updates in this facility as failed
          facilityUpdates.forEach(update => {
            results.failed++;
            results.errors.push({
              tokenId: update.tokenId,
              error: `Facility batch error: ${error.message}`,
              originalIndex: update.originalIndex
            });
          });
        }
      }
      
      console.log(`Batch processing completed: ${results.successful} successful, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('Error in batch processing:', error);
      throw error;
    }
  }
  
  /**
   * Trigger webhook notifications
   * @param {string} webhookId - Webhook ID
   * @param {Object} payload - Notification payload
   * @returns {Promise<Object>} - Notification result
   */
  async triggerWebhookNotification(webhookId, payload) {
    try {
      const webhook = this.registeredWebhooks.get(webhookId);
      if (!webhook || webhook.status !== 'active') {
        throw new Error(`Webhook ${webhookId} not found or inactive`);
      }
      
      // Create signature for webhook security
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      // Prepare webhook payload
      const webhookPayload = {
        ...payload,
        webhookId,
        timestamp: new Date().toISOString(),
        signature: `sha256=${signature}`
      };
      
      // Send webhook notification
      const response = await axios.post(webhook.callbackUrl, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': webhookId,
          'User-Agent': 'WasteManagement-Webhook/1.0'
        },
        timeout: 10000 // 10 second timeout
      });
      
      // Update webhook statistics
      webhook.lastTriggered = new Date().toISOString();
      webhook.triggerCount++;
      
      console.log(`Webhook ${webhookId} triggered successfully`);
      
      return {
        webhookId,
        status: 'success',
        responseStatus: response.status,
        triggeredAt: webhook.lastTriggered
      };
    } catch (error) {
      console.error(`Error triggering webhook ${webhookId}:`, error);
      
      // Update failure count
      const webhook = this.registeredWebhooks.get(webhookId);
      if (webhook) {
        webhook.failureCount++;
        
        // Deactivate webhook after too many failures
        if (webhook.failureCount >= webhook.options.retryAttempts) {
          webhook.status = 'failed';
          console.log(`Webhook ${webhookId} deactivated due to repeated failures`);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Get webhook statistics
   * @param {string} webhookId - Webhook ID
   * @returns {Object} - Webhook statistics
   */
  getWebhookStats(webhookId) {
    const webhook = this.registeredWebhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }
    
    return {
      webhookId,
      status: webhook.status,
      triggerCount: webhook.triggerCount,
      failureCount: webhook.failureCount,
      successRate: webhook.triggerCount > 0 ? 
        ((webhook.triggerCount - webhook.failureCount) / webhook.triggerCount * 100).toFixed(2) + '%' : 
        '0%',
      createdAt: webhook.createdAt,
      lastTriggered: webhook.lastTriggered,
      monitoredMilestones: webhook.milestoneTypes
    };
  }
  
  /**
   * Get estimated processing time for updates
   * @returns {number} - Estimated processing time in milliseconds
   */
  getEstimatedProcessingTime() {
    const pendingCount = this.pendingUpdates.size;
    const batchesNeeded = Math.ceil(pendingCount / this.batchSize);
    return batchesNeeded * this.updateInterval;
  }
  
  /**
   * Get system status and statistics
   * @returns {Object} - System status
   */
  getSystemStatus() {
    return {
      pendingUpdates: this.pendingUpdates.size,
      registeredWebhooks: this.registeredWebhooks.size,
      activeWebhooks: Array.from(this.registeredWebhooks.values()).filter(w => w.status === 'active').length,
      batchSize: this.batchSize,
      updateInterval: this.updateInterval,
      estimatedProcessingTime: this.getEstimatedProcessingTime(),
      milestoneTypes: Object.values(this.milestoneTypes),
      uptime: process.uptime()
    };
  }
}

module.exports = new WebhookService();