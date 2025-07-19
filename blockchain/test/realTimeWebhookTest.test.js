const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');

// Mock the IPFS service to avoid dependency issues
const mockIpfsService = {
  storeMetadata: sinon.stub().resolves('QmTestHash123'),
  createBackup: sinon.stub().resolves(true),
  getGatewayUrl: sinon.stub().returns('https://ipfs.io/ipfs/QmTestHash123')
};

// Mock the certificate service
const mockCertificateService = {
  getCertificateContract: sinon.stub(),
  updateCertificate: sinon.stub().resolves({ success: true })
};

// Mock the digital twin service
const mockDigitalTwinService = {
  updateTwinState: sinon.stub().resolves({ success: true })
};

// Mock the metadata schema
const mockMetadataSchema = {
  createCertificateMetadata: sinon.stub().returns({
    name: 'Test Certificate',
    description: 'Test Description',
    attributes: []
  })
};

// Replace the actual modules with mocks
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  switch (id) {
    case '../services/ipfsService':
      return mockIpfsService;
    case '../services/certificateService':
      return mockCertificateService;
    case '../services/digitalTwinService':
      return mockDigitalTwinService;
    case '../services/metadataSchema':
      return mockMetadataSchema;
    default:
      return originalRequire.apply(this, arguments);
  }
};

// Now require the enhanced webhook service
const enhancedWebhookService = require('../services/enhancedWebhookService');

describe('Real-Time Certificate Updates - Enhanced Webhook Service', function () {
  let axiosStub;
  
  const mockFacilityId = 'test-facility-001';
  const mockTokenId = '1';
  const mockCallbackUrl = 'http://localhost:3000/webhook/test';
  
  beforeEach(function () {
    // Stub external dependencies
    axiosStub = sinon.stub(axios, 'post');
    
    // Mock certificate contract
    const mockContract = {
      getCertificate: sinon.stub().resolves({
        wasteOrigin: 'Test Origin',
        carbonCredits: 100,
        recyclingEfficiency: 85,
        environmentalImpact: 75,
        processingSteps: []
      }),
      addProcessingStage: sinon.stub().resolves({ wait: () => Promise.resolve() }),
      batchUpdateCertificates: sinon.stub().resolves({ wait: () => Promise.resolve() })
    };
    
    mockCertificateService.getCertificateContract.resolves(mockContract);
    
    // Mock successful webhook response
    axiosStub.resolves({
      status: 200,
      data: { success: true }
    });
  });
  
  afterEach(function () {
    sinon.restore();
    // Reset all mocks
    mockIpfsService.storeMetadata.resetHistory();
    mockCertificateService.getCertificateContract.resetHistory();
    mockCertificateService.updateCertificate.resetHistory();
    mockDigitalTwinService.updateTwinState.resetHistory();
  });

  describe('Enhanced Webhook Registration and Real-Time Processing', function () {
    it('Should register enhanced webhook with real-time capabilities', async function () {
      const result = await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl,
        ['collection', 'processing', 'verification'],
        {
          realTimeUpdates: true,
          immediateProcessing: true,
          batchUpdates: true
        }
      );
      
      expect(result).to.have.property('webhookId');
      expect(result).to.have.property('secret');
      expect(result.status).to.equal('registered');
      expect(result.realTimeEnabled).to.be.true;
      expect(result.monitoredMilestones).to.include('collection');
      expect(result.monitoredMilestones).to.include('processing');
      expect(result.monitoredMilestones).to.include('verification');
    });
    
    it('Should trigger real-time update for high priority milestones', async function () {
      // Register webhook first
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl,
        ['collection'],
        { realTimeUpdates: true }
      );
      
      const milestoneData = {
        milestoneName: 'Test Collection Milestone',
        milestoneType: 'collection',
        realTime: true,
        data: {
          wasteId: 'waste-001',
          collectionDate: new Date().toISOString(),
          quantity: 100
        }
      };
      
      const result = await enhancedWebhookService.triggerRealTimeUpdate(
        mockFacilityId,
        mockTokenId,
        milestoneData,
        true
      );
      
      expect(result).to.have.property('updateId');
      expect(result.status).to.equal('queued_immediate');
      expect(result.priority).to.equal('high');
    });
    
    it('Should detect collection milestone and trigger real-time processing', async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
      
      const processingData = {
        status: 'collected',
        wasteId: 'waste-001',
        collectionDate: new Date().toISOString(),
        collectionLocation: 'Delhi Sector 15',
        wasteType: 'Mixed Recyclables',
        quantity: 500,
        collector: 'Collection Team A'
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        mockFacilityId,
        mockTokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const collectionMilestone = milestones.find(m => m.milestoneType === 'collection');
      expect(collectionMilestone).to.exist;
      expect(collectionMilestone.data.milestoneName).to.equal('Enhanced Waste Collection Completed');
      expect(collectionMilestone.priority).to.equal('high');
      expect(collectionMilestone.realTime).to.be.true;
    });
    
    it('Should detect sorting milestone with contamination data', async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
      
      const processingData = {
        status: 'sorted',
        categories: ['plastic', 'paper', 'metal'],
        sortingDate: new Date().toISOString(),
        sortingMethod: 'AI-Assisted Sorting',
        contamination: 5,
        sortingEfficiency: 92,
        operator: 'Sorting Team B'
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        mockFacilityId,
        mockTokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const sortingMilestone = milestones.find(m => m.milestoneType === 'sorting');
      expect(sortingMilestone).to.exist;
      expect(sortingMilestone.data.data.sortingEfficiency).to.equal(92);
      expect(sortingMilestone.priority).to.equal('high');
    });
    
    it('Should detect quality check milestone', async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
      
      const processingData = {
        qualityScore: 89,
        checkDate: new Date().toISOString(),
        checkMethod: 'Automated Quality Assessment',
        inspector: 'QA Team Lead',
        defects: ['minor_contamination'],
        minimumScore: 70
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        mockFacilityId,
        mockTokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const qualityMilestone = milestones.find(m => m.milestoneType === 'quality_check');
      expect(qualityMilestone).to.exist;
      expect(qualityMilestone.data.data.qualityScore).to.equal(89);
      expect(qualityMilestone.data.data.passed).to.be.true;
    });
    
    it('Should detect environmental impact milestone', async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
      
      const processingData = {
        carbonCredits: 125,
        co2Reduction: 2.5,
        energySaved: 300,
        waterSaved: 1000,
        recyclingEfficiency: 91,
        environmentalImpact: 82,
        calculationMethod: 'ISO 14040 LCA Standard'
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        mockFacilityId,
        mockTokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const envMilestone = milestones.find(m => m.milestoneType === 'environmental_impact');
      expect(envMilestone).to.exist;
      expect(envMilestone.data.data.carbonCredits).to.equal(125);
      expect(envMilestone.priority).to.equal('medium');
    });
    
    it('Should detect verification milestone', async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
      
      const processingData = {
        isVerified: true,
        verifier: '0x123456789',
        verificationDate: new Date().toISOString(),
        verificationMethod: 'Blockchain Verification',
        verificationStandard: 'ISO 14021',
        verificationHash: 'hash123'
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        mockFacilityId,
        mockTokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const verificationMilestone = milestones.find(m => m.milestoneType === 'verification');
      expect(verificationMilestone).to.exist;
      expect(verificationMilestone.data.data.isVerified).to.be.true;
      expect(verificationMilestone.priority).to.equal('high');
    });
    
    it('Should detect completion milestone', async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
      
      const processingData = {
        status: 'completed',
        completionDate: new Date().toISOString(),
        finalProducts: ['recycled_plastic_pellets', 'recovered_metals'],
        totalRecovered: 475,
        wasteReduction: 95,
        processingEfficiency: 91,
        operator: 'Processing Supervisor'
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        mockFacilityId,
        mockTokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const completionMilestone = milestones.find(m => m.milestoneType === 'completion');
      expect(completionMilestone).to.exist;
      expect(completionMilestone.data.data.wasteReduction).to.equal(95);
      expect(completionMilestone.priority).to.equal('high');
    });
    
    it('Should detect digital twin update milestone', async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
      
      const processingData = {
        digitalTwinId: 'twin-001',
        twinState: {
          temperature: 375,
          pressure: 2.8,
          efficiency: 88
        },
        updateDate: new Date().toISOString()
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        mockFacilityId,
        mockTokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const twinMilestone = milestones.find(m => m.milestoneType === 'digital_twin_update');
      expect(twinMilestone).to.exist;
      expect(twinMilestone.data.data.digitalTwinId).to.equal('twin-001');
      expect(mockDigitalTwinService.updateTwinState.calledOnce).to.be.true;
    });
  });
  
  describe('Batch Update System with Real-Time Processing', function () {
    beforeEach(async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl,
        [],
        { batchUpdates: true }
      );
    });
    
    it('Should process batch updates efficiently', async function () {
      // Create multiple updates
      const updates = [];
      for (let i = 0; i < 5; i++) {
        const milestoneData = {
          milestoneName: `Batch Update ${i + 1}`,
          milestoneType: 'environmental_impact',
          data: {
            carbonCredits: 100 + (i * 20),
            co2Reduction: 1.5 + (i * 0.5),
            recyclingEfficiency: 85 + i,
            environmentalImpact: 80 + i
          }
        };
        
        updates.push({
          facilityId: mockFacilityId,
          tokenId: (i + 1).toString(),
          milestoneData
        });
      }
      
      // Process batch updates
      const batchResult = await enhancedWebhookService.processBatchUpdates(updates);
      
      expect(batchResult).to.have.property('batchId');
      expect(batchResult.totalUpdates).to.equal(5);
      expect(batchResult.successful).to.be.greaterThan(0);
      expect(batchResult.processingTime).to.be.a('number');
      expect(batchResult.facilitiesProcessed).to.equal(1);
    });
    
    it('Should group updates by facility for efficient processing', async function () {
      const updates = [
        {
          facilityId: 'facility-1',
          tokenId: '1',
          milestoneData: { milestoneName: 'Test 1', milestoneType: 'collection' }
        },
        {
          facilityId: 'facility-1',
          tokenId: '2',
          milestoneData: { milestoneName: 'Test 2', milestoneType: 'collection' }
        },
        {
          facilityId: 'facility-2',
          tokenId: '3',
          milestoneData: { milestoneName: 'Test 3', milestoneType: 'collection' }
        }
      ];
      
      const grouped = enhancedWebhookService.groupUpdatesByFacility(updates);
      
      expect(grouped).to.have.property('facility-1');
      expect(grouped).to.have.property('facility-2');
      expect(grouped['facility-1']).to.have.length(2);
      expect(grouped['facility-2']).to.have.length(1);
    });
  });
  
  describe('Webhook Notification System', function () {
    beforeEach(async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
    });
    
    it('Should send webhook notification with proper signature', async function () {
      const payload = {
        updateId: 'test-update-123',
        facilityId: mockFacilityId,
        tokenId: mockTokenId,
        milestone: { type: 'collection' },
        timestamp: new Date().toISOString(),
        type: 'milestone_detected'
      };
      
      const result = await enhancedWebhookService.triggerWebhookNotification(
        `${mockFacilityId}-${mockTokenId}`,
        payload
      );
      
      expect(result.status).to.equal('success');
      expect(result.responseStatus).to.equal(200);
      expect(result.attempt).to.equal(1);
      
      // Verify axios was called with correct parameters
      expect(axiosStub.calledOnce).to.be.true;
      const callArgs = axiosStub.getCall(0).args;
      expect(callArgs[0]).to.equal(mockCallbackUrl);
      expect(callArgs[1]).to.have.property('signature');
    });
    
    it('Should retry failed webhook notifications', async function () {
      // Mock first call to fail, second to succeed
      axiosStub.onFirstCall().rejects(new Error('Network error'));
      axiosStub.onSecondCall().resolves({ status: 200, data: { success: true } });
      
      const payload = {
        updateId: 'test-update-123',
        type: 'milestone_detected'
      };
      
      const result = await enhancedWebhookService.triggerWebhookNotification(
        `${mockFacilityId}-${mockTokenId}`,
        payload
      );
      
      expect(result.status).to.equal('success');
      expect(result.attempt).to.equal(2);
      expect(axiosStub.calledTwice).to.be.true;
    });
  });
  
  describe('Performance Metrics and System Status', function () {
    it('Should provide enhanced system status', async function () {
      const status = enhancedWebhookService.getEnhancedSystemStatus();
      
      expect(status).to.have.property('pendingUpdates');
      expect(status).to.have.property('realTimeUpdates');
      expect(status).to.have.property('registeredWebhooks');
      expect(status).to.have.property('activeWebhooks');
      expect(status).to.have.property('batchSize');
      expect(status).to.have.property('updateInterval');
      expect(status).to.have.property('realTimeInterval');
      expect(status).to.have.property('metrics');
      expect(status).to.have.property('version');
      expect(status.version).to.equal('2.0.0');
    });
    
    it('Should calculate estimated processing time correctly', async function () {
      const immediateTime = enhancedWebhookService.getEstimatedProcessingTime(true);
      const batchTime = enhancedWebhookService.getEstimatedProcessingTime(false);
      
      expect(immediateTime).to.be.a('number');
      expect(batchTime).to.be.a('number');
      expect(immediateTime).to.be.lessThan(batchTime);
    });
  });
  
  describe('Error Handling and Edge Cases', function () {
    it('Should handle invalid milestone data gracefully', async function () {
      const invalidData = {
        status: 'invalid_status'
        // Missing required fields
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        mockFacilityId,
        '999',
        invalidData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.equal(0);
    });
    
    it('Should handle webhook callback URL not found', async function () {
      try {
        await enhancedWebhookService.triggerWebhookNotification(
          'non-existent-key',
          { test: 'data' }
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('No webhook callback found');
      }
    });
  });
  
  describe('Event Emission', function () {
    it('Should emit milestone detected events', async function () {
      let eventEmitted = false;
      let eventData = null;
      
      enhancedWebhookService.on('milestoneDetected', (data) => {
        eventEmitted = true;
        eventData = data;
      });
      
      const processingData = {
        status: 'collected',
        wasteId: 'waste-001',
        quantity: 100
      };
      
      await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        mockFacilityId,
        mockTokenId,
        processingData
      );
      
      expect(eventEmitted).to.be.true;
      expect(eventData).to.have.property('facilityId', mockFacilityId);
      expect(eventData).to.have.property('tokenId', mockTokenId);
      expect(eventData).to.have.property('milestoneType');
      expect(eventData).to.have.property('timestamp');
    });
  });
});

// Restore original require after tests
after(function () {
  Module.prototype.require = originalRequire;
});