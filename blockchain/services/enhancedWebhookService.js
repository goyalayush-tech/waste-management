const axios = require('axios');
const certificateService = require('./certificateService');
const digitalTwinService = require('./digitalTwinService');
const ipfsService = require('./ipfsService');
const { createCertificateMetadata } = require('./metadataSchema');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

/**
 * Enhanced Real-Time Certificate Update Service
 * Implements automatic NFT metadata updates during processing with advanced milestone detection
 */
class EnhancedWebhookService extends EventEmitter {
  constructor() {
    super();
    this.webhookSecret = process.env.WEBHOOK_SECRET || 'default-secret';
    this.pendingUpdates = new Map();
    this.registeredWebhooks = new Map();
    this.milestoneDetectors = new Map();
    this.batchUpdateQueue = new Map();
    this.realTimeUpdates = new Map(); // For immediate processing
    this.processingLocks = new Map(); // Prevent duplicate processing
    this.webhookCallbacks = new Map(); // Store callback URLs
    
    // Enhanced timing configuration
    this.updateInterval = 10 * 1000; // 10 seconds for regular processing
    this.realTimeInterval = 1 * 1000; // 1 second for real-time updates
    this.batchSize = 30; // Optimized batch size
    this.maxRetries = 5;
    this.retryDelay = 2000; // 2 seconds
    
    // Processing milestone types with enhanced detection
    this.milestoneTypes = {
      COLLECTION: 'collection',
      SORTING: 'sorting',
      PROCESSING: 'processing',
      QUALITY_CHECK: 'quality_check',
      VERIFICATION: 'verification',
      COMPLETION: 'completion',
      ENVIRONMENTAL_IMPACT: 'environmental_impact',
      DIGITAL_TWIN_UPDATE: 'digital_twin_update',
      REAL_TIME_SENSOR: 'real_time_sensor',
      BATCH_PROCESSING: 'batch_processing',
      MILESTONE_CHAIN: 'milestone_chain'
    };
    
    // Performance metrics
    this.metrics = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      averageProcessingTime: 0,
      webhookTriggers: 0,
      batchOperations: 0
    };
    
    // Initialize enhanced milestone detectors
    this.initializeEnhancedMilestoneDetectors();
    
    // Start processing loops
    this.startRealTimeProcessing();
    this.startBatchProcessing();
    
    console.log('Enhanced WebhookService initialized with real-time processing capabilities');
  } 
 /**
   * Register enhanced webhook with real-time capabilities
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {string} callbackUrl - Callback URL for updates
   * @param {Array<string>} milestoneTypes - Types of milestones to monitor
   * @param {Object} options - Enhanced options
   * @returns {Promise<Object>} - Registration result
   */
  async registerEnhancedWebhook(facilityId, tokenId, callbackUrl, milestoneTypes = [], options = {}) {
    try {
      const webhookId = `${facilityId}-${tokenId}-${Date.now()}-${uuidv4().slice(0, 8)}`;
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
          immediateProcessing: options.immediateProcessing || false,
          webhookTimeout: options.webhookTimeout || 10000,
          enableMetrics: options.enableMetrics !== false,
          ...options
        },
        createdAt: new Date().toISOString(),
        lastTriggered: null,
        status: 'active',
        triggerCount: 0,
        failureCount: 0,
        averageResponseTime: 0,
        lastProcessingTime: 0
      };
      
      this.registeredWebhooks.set(webhookId, webhook);
      this.webhookCallbacks.set(`${facilityId}-${tokenId}`, callbackUrl);
      
      console.log(`Registered enhanced webhook ${webhookId} for certificate ${tokenId} in facility ${facilityId}`);
      
      return {
        webhookId,
        secret: webhookSecret,
        status: 'registered',
        monitoredMilestones: webhook.milestoneTypes,
        realTimeEnabled: webhook.options.realTimeUpdates,
        ...webhook
      };
    } catch (error) {
      console.error('Error registering enhanced webhook:', error);
      throw error;
    }
  }
  
  /**
   * Trigger real-time certificate update
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} milestoneData - Processing milestone data
   * @param {boolean} immediate - Process immediately
   * @returns {Promise<Object>} - Update result
   */
  async triggerRealTimeUpdate(facilityId, tokenId, milestoneData, immediate = false) {
    try {
      const updateId = `${facilityId}-${tokenId}-${Date.now()}-${uuidv4().slice(0, 8)}`;
      const update = {
        id: updateId,
        facilityId,
        tokenId,
        milestoneData,
        timestamp: Date.now(),
        priority: immediate ? 'high' : 'normal',
        retryCount: 0,
        processingStarted: false
      };
      
      if (immediate || milestoneData.realTime) {
        this.realTimeUpdates.set(updateId, update);
        console.log(`Queued real-time update ${updateId} for immediate processing`);
      } else {
        this.pendingUpdates.set(updateId, update);
        console.log(`Queued update ${updateId} for batch processing`);
      }
      
      // Trigger webhook notification immediately if configured
      const webhookKey = `${facilityId}-${tokenId}`;
      if (this.webhookCallbacks.has(webhookKey)) {
        this.triggerWebhookNotification(webhookKey, {
          updateId,
          facilityId,
          tokenId,
          milestone: milestoneData,
          timestamp: new Date().toISOString(),
          type: 'milestone_detected'
        }).catch(error => {
          console.error(`Error triggering webhook notification: ${error.message}`);
        });
      }
      
      return {
        updateId,
        status: immediate ? 'queued_immediate' : 'queued_batch',
        estimatedProcessingTime: this.getEstimatedProcessingTime(immediate),
        priority: update.priority
      };
    } catch (error) {
      console.error('Error triggering real-time update:', error);
      throw error;
    }
  }
  
  /**
   * Start real-time processing loop for immediate updates
   */
  startRealTimeProcessing() {
    setInterval(async () => {
      if (this.realTimeUpdates.size > 0) {
        await this.processRealTimeUpdates();
      }
    }, this.realTimeInterval);
    
    console.log(`Started real-time processing loop with interval of ${this.realTimeInterval / 1000} seconds`);
  }
  
  /**
   * Start batch processing loop for regular updates
   */
  startBatchProcessing() {
    setInterval(async () => {
      if (this.pendingUpdates.size > 0) {
        await this.processBatchUpdates();
      }
    }, this.updateInterval);
    
    console.log(`Started batch processing loop with interval of ${this.updateInterval / 1000} seconds`);
  }  /**
  
 * Process real-time updates immediately
   */
  async processRealTimeUpdates() {
    try {
      const updates = Array.from(this.realTimeUpdates.entries())
        .filter(([_, update]) => !update.processingStarted)
        .slice(0, 5) // Process up to 5 real-time updates at once
        .map(([id, update]) => ({ id, ...update }));
      
      if (updates.length === 0) return;
      
      console.log(`Processing ${updates.length} real-time updates`);
      
      for (const update of updates) {
        const startTime = Date.now();
        
        try {
          // Mark as processing to prevent duplicate processing
          this.realTimeUpdates.get(update.id).processingStarted = true;
          
          // Process single update immediately
          await this.processSingleUpdate(update);
          
          // Remove from real-time queue
          this.realTimeUpdates.delete(update.id);
          
          // Update metrics
          const processingTime = Date.now() - startTime;
          this.updateMetrics(true, processingTime);
          
          console.log(`Processed real-time update ${update.id} in ${processingTime}ms`);
        } catch (error) {
          console.error(`Error processing real-time update ${update.id}:`, error);
          
          // Handle retry logic
          update.retryCount++;
          if (update.retryCount < this.maxRetries) {
            update.processingStarted = false;
            console.log(`Retrying real-time update ${update.id} (attempt ${update.retryCount})`);
          } else {
            this.realTimeUpdates.delete(update.id);
            this.updateMetrics(false, Date.now() - startTime);
            console.error(`Failed to process real-time update ${update.id} after ${this.maxRetries} attempts`);
          }
        }
      }
    } catch (error) {
      console.error('Error in real-time processing loop:', error);
    }
  }
  
  /**
   * Process a single update
   * @param {Object} update - Update to process
   */
  async processSingleUpdate(update) {
    const { facilityId, tokenId, milestoneData } = update;
    
    // Get certificate contract
    const certificateContract = await certificateService.getCertificateContract(facilityId);
    
    // Get current certificate data
    const currentCert = await certificateContract.getCertificate(tokenId);
    
    // Generate updated data based on milestone
    const updatedData = this.generateEnhancedUpdatedData(currentCert, milestoneData);
    
    // Create updated metadata
    const metadata = createCertificateMetadata({
      ...updatedData,
      tokenId,
      processingFacility: facilityId,
      lastUpdated: new Date().toISOString(),
      updateSource: 'real_time_webhook'
    });
    
    // Store metadata on IPFS
    const cid = await ipfsService.storeMetadata(metadata);
    const ipfsUri = `ipfs://${cid}`;
    
    // Update certificate on blockchain
    await certificateService.updateCertificate(facilityId, tokenId, {
      ...updatedData,
      ipfsUri
    });
    
    // Add processing stage if milestone includes stage data
    if (milestoneData.stageName) {
      await certificateContract.addProcessingStage(
        tokenId,
        milestoneData.stageName,
        milestoneData.milestoneType,
        cid
      );
    }
    
    console.log(`Successfully processed single update for certificate ${tokenId}`);
  }
  
  /**
   * Enhanced batch processing with improved efficiency
   */
  async processBatchUpdates() {
    try {
      if (this.pendingUpdates.size === 0) return;
      
      const startTime = Date.now();
      const updates = Array.from(this.pendingUpdates.entries())
        .slice(0, this.batchSize)
        .map(([id, update]) => ({ id, ...update }));
      
      console.log(`Processing batch of ${updates.length} updates`);
      
      // Group updates by facility for efficient processing
      const updatesByFacility = this.groupUpdatesByFacility(updates);
      
      const results = {
        batchId: `batch-${Date.now()}`,
        totalUpdates: updates.length,
        successful: 0,
        failed: 0,
        errors: [],
        processingTime: 0,
        facilitiesProcessed: Object.keys(updatesByFacility).length
      };
      
      // Process updates for each facility
      for (const [facilityId, facilityUpdates] of Object.entries(updatesByFacility)) {
        try {
          const facilityResult = await this.processFacilityBatch(facilityId, facilityUpdates);
          results.successful += facilityResult.successful;
          results.failed += facilityResult.failed;
          results.errors.push(...facilityResult.errors);
          
          // Remove successfully processed updates
          facilityUpdates.forEach(update => {
            if (!facilityResult.errors.find(e => e.updateId === update.id)) {
              this.pendingUpdates.delete(update.id);
            }
          });
        } catch (error) {
          console.error(`Error processing facility batch for ${facilityId}:`, error);
          results.failed += facilityUpdates.length;
          facilityUpdates.forEach(update => {
            results.errors.push({
              updateId: update.id,
              tokenId: update.tokenId,
              error: `Facility batch error: ${error.message}`
            });
            this.pendingUpdates.delete(update.id);
          });
        }
      }
      
      results.processingTime = Date.now() - startTime;
      this.updateBatchMetrics(results);
      
      console.log(`Batch processing completed: ${results.successful} successful, ${results.failed} failed in ${results.processingTime}ms`);
      
      return results;
    } catch (error) {
      console.error('Error in batch processing:', error);
      throw error;
    }
  }  /**
 
  * Process batch updates for a specific facility
   * @param {string} facilityId - Facility ID
   * @param {Array} updates - Updates for this facility
   * @returns {Promise<Object>} - Processing result
   */
  async processFacilityBatch(facilityId, updates) {
    const result = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    try {
      // Get certificate contract once per facility
      const certificateContract = await certificateService.getCertificateContract(facilityId);
      
      // Prepare batch update arrays
      const batchData = {
        tokenIds: [],
        carbonCredits: [],
        recyclingEfficiencies: [],
        environmentalImpacts: [],
        ipfsHashes: []
      };
      
      // Process each update and prepare batch data
      for (const update of updates) {
        try {
          const currentCert = await certificateContract.getCertificate(update.tokenId);
          const updatedData = this.generateEnhancedUpdatedData(currentCert, update.milestoneData);
          
          // Create metadata and store on IPFS
          const metadata = createCertificateMetadata({
            ...updatedData,
            tokenId: update.tokenId,
            processingFacility: facilityId,
            lastUpdated: new Date().toISOString(),
            updateSource: 'batch_webhook'
          });
          
          const cid = await ipfsService.storeMetadata(metadata);
          
          // Add to batch arrays
          batchData.tokenIds.push(update.tokenId);
          batchData.carbonCredits.push(updatedData.carbonCredits || currentCert.carbonCredits);
          batchData.recyclingEfficiencies.push(updatedData.recyclingEfficiency || currentCert.recyclingEfficiency);
          batchData.environmentalImpacts.push(updatedData.environmentalImpact || currentCert.environmentalImpact);
          batchData.ipfsHashes.push(`ipfs://${cid}`);
          
          result.successful++;
        } catch (error) {
          console.error(`Error preparing update for token ${update.tokenId}:`, error);
          result.failed++;
          result.errors.push({
            updateId: update.id,
            tokenId: update.tokenId,
            error: error.message
          });
        }
      }
      
      // Execute batch update on blockchain if we have valid updates
      if (batchData.tokenIds.length > 0) {
        const tx = await certificateContract.batchUpdateCertificates(
          batchData.tokenIds,
          batchData.carbonCredits,
          batchData.recyclingEfficiencies,
          batchData.environmentalImpacts,
          batchData.ipfsHashes
        );
        
        await tx.wait();
        console.log(`Batch updated ${batchData.tokenIds.length} certificates for facility ${facilityId}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error in facility batch processing for ${facilityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Group updates by facility for efficient processing
   * @param {Array} updates - Array of updates
   * @returns {Object} - Updates grouped by facility
   */
  groupUpdatesByFacility(updates) {
    const grouped = {};
    updates.forEach(update => {
      if (!grouped[update.facilityId]) {
        grouped[update.facilityId] = [];
      }
      grouped[update.facilityId].push(update);
    });
    return grouped;
  }
  
  /**
   * Generate enhanced updated certificate data based on milestone
   * @param {Object} currentCert - Current certificate data
   * @param {Object} milestoneData - Processing milestone data
   * @returns {Object} - Enhanced updated certificate data
   */
  generateEnhancedUpdatedData(currentCert, milestoneData) {
    const updatedData = {
      processingSteps: [...(currentCert.processingSteps || []), {
        name: milestoneData.milestoneName,
        type: milestoneData.milestoneType,
        timestamp: new Date().toISOString(),
        data: milestoneData.data || {},
        updateId: milestoneData.updateId || uuidv4()
      }],
      lastMilestone: milestoneData.milestoneType,
      lastMilestoneTimestamp: new Date().toISOString()
    };
    
    // Enhanced milestone-specific updates
    switch (milestoneData.milestoneType) {
      case 'collection':
        updatedData.collectionData = {
          collectionDate: milestoneData.data?.collectionDate,
          collectionLocation: milestoneData.data?.collectionLocation,
          wasteType: milestoneData.data?.wasteType,
          quantity: milestoneData.data?.quantity,
          collector: milestoneData.data?.collector
        };
        break;
        
      case 'environmental_impact':
        updatedData.carbonCredits = milestoneData.data?.carbonCredits || currentCert.carbonCredits;
        updatedData.co2Reduction = milestoneData.data?.co2Reduction || currentCert.co2Reduction;
        updatedData.recyclingEfficiency = milestoneData.data?.recyclingEfficiency || currentCert.recyclingEfficiency;
        updatedData.environmentalImpact = milestoneData.data?.environmentalImpact || currentCert.environmentalImpact;
        break;
        
      case 'verification':
        updatedData.verifier = milestoneData.data?.verifier || currentCert.verifier;
        updatedData.verificationDate = new Date().toISOString();
        updatedData.isVerified = true;
        break;
        
      case 'completion':
        updatedData.processingDate = new Date().toISOString();
        break;
    }
    
    return updatedData;
  } 
 /**
   * Initialize enhanced milestone detectors
   */
  initializeEnhancedMilestoneDetectors() {
    // Enhanced collection milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.COLLECTION, {
      condition: (data) => data.status === 'collected' && data.wasteId,
      handler: this.handleEnhancedCollectionMilestone.bind(this),
      priority: 'high',
      realTime: true
    });
    
    // Enhanced sorting milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.SORTING, {
      condition: (data) => data.status === 'sorted' && data.categories,
      handler: this.handleEnhancedSortingMilestone.bind(this),
      priority: 'high',
      realTime: true
    });
    
    // Enhanced processing milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.PROCESSING, {
      condition: (data) => data.status === 'processing' && data.processingMethod,
      handler: this.handleEnhancedProcessingMilestone.bind(this),
      priority: 'medium',
      realTime: false
    });
    
    // Enhanced quality check milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.QUALITY_CHECK, {
      condition: (data) => data.qualityScore !== undefined && data.qualityScore >= 0,
      handler: this.handleEnhancedQualityCheckMilestone.bind(this),
      priority: 'high',
      realTime: true
    });
    
    // Enhanced verification milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.VERIFICATION, {
      condition: (data) => data.isVerified === true && data.verifier,
      handler: this.handleEnhancedVerificationMilestone.bind(this),
      priority: 'high',
      realTime: true
    });
    
    // Enhanced completion milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.COMPLETION, {
      condition: (data) => data.status === 'completed' && data.finalProducts,
      handler: this.handleEnhancedCompletionMilestone.bind(this),
      priority: 'high',
      realTime: true
    });
    
    // Enhanced environmental impact milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.ENVIRONMENTAL_IMPACT, {
      condition: (data) => data.carbonCredits > 0 || data.co2Reduction > 0,
      handler: this.handleEnhancedEnvironmentalImpactMilestone.bind(this),
      priority: 'medium',
      realTime: false
    });
    
    // Enhanced digital twin update milestone detector
    this.milestoneDetectors.set(this.milestoneTypes.DIGITAL_TWIN_UPDATE, {
      condition: (data) => data.digitalTwinId && data.twinState,
      handler: this.handleEnhancedDigitalTwinUpdateMilestone.bind(this),
      priority: 'medium',
      realTime: true
    });
  }
  
  /**
   * Enhanced milestone handlers
   */
  async handleEnhancedCollectionMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Enhanced Waste Collection Completed',
      milestoneType: this.milestoneTypes.COLLECTION,
      updateId: uuidv4(),
      realTime: true,
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
  
  async handleEnhancedSortingMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Enhanced Waste Sorting Completed',
      milestoneType: this.milestoneTypes.SORTING,
      updateId: uuidv4(),
      realTime: true,
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
  
  async handleEnhancedProcessingMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Enhanced Waste Processing Started',
      milestoneType: this.milestoneTypes.PROCESSING,
      updateId: uuidv4(),
      realTime: false,
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
  
  async handleEnhancedQualityCheckMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Enhanced Quality Check Completed',
      milestoneType: this.milestoneTypes.QUALITY_CHECK,
      updateId: uuidv4(),
      realTime: true,
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
  
  async handleEnhancedVerificationMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Enhanced Certificate Verification Completed',
      milestoneType: this.milestoneTypes.VERIFICATION,
      updateId: uuidv4(),
      realTime: true,
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
  
  async handleEnhancedCompletionMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Enhanced Processing Completed',
      milestoneType: this.milestoneTypes.COMPLETION,
      updateId: uuidv4(),
      realTime: true,
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
  
  async handleEnhancedEnvironmentalImpactMilestone(facilityId, tokenId, data) {
    return {
      milestoneName: 'Enhanced Environmental Impact Calculated',
      milestoneType: this.milestoneTypes.ENVIRONMENTAL_IMPACT,
      updateId: uuidv4(),
      realTime: false,
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
  
  async handleEnhancedDigitalTwinUpdateMilestone(facilityId, tokenId, data) {
    try {
      // Update digital twin state
      await digitalTwinService.updateTwinState(data.digitalTwinId, data.twinState);
      
      return {
        milestoneName: 'Enhanced Digital Twin Updated',
        milestoneType: this.milestoneTypes.DIGITAL_TWIN_UPDATE,
        updateId: uuidv4(),
        realTime: true,
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
   * Enhanced milestone detection with priority handling
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} processingData - Processing data to analyze
   * @returns {Promise<Array<Object>>} - Triggered milestone updates
   */
  async detectAndTriggerEnhancedMilestones(facilityId, tokenId, processingData) {
    try {
      const triggeredMilestones = [];
      
      // Check each milestone detector
      for (const [milestoneType, detector] of this.milestoneDetectors.entries()) {
        if (detector.condition(processingData)) {
          const milestoneData = await detector.handler(facilityId, tokenId, processingData);
          
          if (milestoneData) {
            // Determine if this should be processed in real-time
            const immediate = detector.realTime && detector.priority === 'high';
            
            // Trigger milestone update
            const updateResult = await this.triggerRealTimeUpdate(
              facilityId, 
              tokenId, 
              milestoneData, 
              immediate
            );
            
            triggeredMilestones.push({
              milestoneType,
              updateResult,
              data: milestoneData,
              priority: detector.priority,
              realTime: detector.realTime
            });
            
            // Emit milestone event
            this.emit('milestoneDetected', {
              facilityId,
              tokenId,
              milestoneType,
              data: milestoneData,
              priority: detector.priority,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      return triggeredMilestones;
    } catch (error) {
      console.error('Error detecting and triggering enhanced milestones:', error);
      throw error;
    }
  }
  
  /**
   * Enhanced webhook notification with retry logic
   * @param {string} webhookKey - Webhook key
   * @param {Object} payload - Notification payload
   * @returns {Promise<Object>} - Notification result
   */
  async triggerWebhookNotification(webhookKey, payload) {
    const callbackUrl = this.webhookCallbacks.get(webhookKey);
    if (!callbackUrl) {
      throw new Error(`No webhook callback found for key ${webhookKey}`);
    }
    
    const startTime = Date.now();
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        // Create signature for webhook security
        const signature = crypto
          .createHmac('sha256', this.webhookSecret)
          .update(JSON.stringify(payload))
          .digest('hex');
        
        // Prepare webhook payload
        const webhookPayload = {
          ...payload,
          webhookKey,
          attempt: attempt + 1,
          timestamp: new Date().toISOString(),
          signature: `sha256=${signature}`
        };
        
        // Send webhook notification
        const response = await axios.post(callbackUrl, webhookPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Key': webhookKey,
            'X-Webhook-Attempt': attempt + 1,
            'User-Agent': 'EnhancedWasteManagement-Webhook/2.0'
          },
          timeout: 15000 // 15 second timeout
        });
        
        const responseTime = Date.now() - startTime;
        this.metrics.webhookTriggers++;
        
        console.log(`Webhook ${webhookKey} triggered successfully in ${responseTime}ms`);
        
        return {
          webhookKey,
          status: 'success',
          responseStatus: response.status,
          responseTime,
          attempt: attempt + 1,
          triggeredAt: new Date().toISOString()
        };
      } catch (error) {
        attempt++;
        console.error(`Webhook ${webhookKey} attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        } else {
          throw new Error(`Webhook ${webhookKey} failed after ${this.maxRetries} attempts: ${error.message}`);
        }
      }
    }
  }
  
  /**
   * Update performance metrics
   * @param {boolean} success - Whether the operation was successful
   * @param {number} processingTime - Processing time in milliseconds
   */
  updateMetrics(success, processingTime) {
    this.metrics.totalUpdates++;
    if (success) {
      this.metrics.successfulUpdates++;
    } else {
      this.metrics.failedUpdates++;
    }
    
    // Update average processing time
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalUpdates - 1) + processingTime) / 
      this.metrics.totalUpdates;
  }
  
  /**
   * Update batch processing metrics
   * @param {Object} batchResult - Batch processing result
   */
  updateBatchMetrics(batchResult) {
    this.metrics.batchOperations++;
    this.updateMetrics(batchResult.successful > 0, batchResult.processingTime);
  }
  
  /**
   * Get estimated processing time
   * @param {boolean} immediate - Whether processing is immediate
   * @returns {number} - Estimated processing time in milliseconds
   */
  getEstimatedProcessingTime(immediate = false) {
    if (immediate) {
      return this.realTimeInterval + (this.metrics.averageProcessingTime || 1000);
    }
    
    const pendingCount = this.pendingUpdates.size;
    const batchesNeeded = Math.ceil(pendingCount / this.batchSize);
    return batchesNeeded * this.updateInterval + (this.metrics.averageProcessingTime || 5000);
  }
  
  /**
   * Get enhanced system status and statistics
   * @returns {Object} - Enhanced system status
   */
  getEnhancedSystemStatus() {
    return {
      pendingUpdates: this.pendingUpdates.size,
      realTimeUpdates: this.realTimeUpdates.size,
      registeredWebhooks: this.registeredWebhooks.size,
      activeWebhooks: Array.from(this.registeredWebhooks.values()).filter(w => w.status === 'active').length,
      batchSize: this.batchSize,
      updateInterval: this.updateInterval,
      realTimeInterval: this.realTimeInterval,
      estimatedProcessingTime: this.getEstimatedProcessingTime(),
      milestoneTypes: Object.values(this.milestoneTypes),
      metrics: this.metrics,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      version: '2.0.0'
    };
  }
  
  /**
   * Get webhook statistics with enhanced metrics
   * @param {string} webhookId - Webhook ID
   * @returns {Object} - Enhanced webhook statistics
   */
  getEnhancedWebhookStats(webhookId) {
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
      averageResponseTime: webhook.averageResponseTime,
      lastProcessingTime: webhook.lastProcessingTime,
      createdAt: webhook.createdAt,
      lastTriggered: webhook.lastTriggered,
      monitoredMilestones: webhook.milestoneTypes,
      options: webhook.options
    };
  }
}

module.exports = new EnhancedWebhookService();