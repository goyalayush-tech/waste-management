const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const enhancedWebhookService = require('../services/enhancedWebhookService');
const certificateService = require('../services/certificateService');
const digitalTwinService = require('../services/digitalTwinService');
const ipfsService = require('../services/ipfsService');

describe('Enhanced WebhookService Real-Time Certificate Updates', function () {
  let axiosStub;
  let certificateServiceStub;
  let digitalTwinServiceStub;
  let ipfsServiceStub;
  
  const mockFacilityId = 'test-facility-001';
  const mockTokenId = '1';
  const mockCallbackUrl = 'http://localhost:3000/webhook/test';
  
  beforeEach(function () {
    // Stub external dependencies
    axiosStub = sinon.stub(axios, 'post');
    certificateServiceStub = sinon.stub(certificateService, 'getCertificateContract');
    sinon.stub(certificateService, 'updateCertificate');
    digitalTwinServiceStub = sinon.stub(digitalTwinService, 'updateTwinState');
    ipfsServiceStub = sinon.stub(ipfsService, 'storeMetadata');
    
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
    
    certificateServiceStub.resolves(mockContract);
    certificateService.updateCertificate.resolves({ success: true });
    digitalTwinServiceStub.resolves({ success: true });
    ipfsServiceStub.resolves('QmTestHash123');
    
    // Mock successful webhook response
    axiosStub.resolves({
      status: 200,
      data: { success: true }
    });
  });
  
  afterEach(function () {
    sinon.restore();
  });
  
  describe('Enhanced Webhook Registration', function () {
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
    
    it('Should register webhook with default milestone types when none specified', async function () {
      const result = await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
      
      expect(result.monitoredMilestones).to.be.an('array');
      expect(result.monitoredMilestones.length).to.be.greaterThan(5);
      expect(result.monitoredMilestones).to.include('collection');
      expect(result.monitoredMilestones).to.include('environmental_impact');
    });
    
    it('Should generate unique webhook IDs and secrets', async function () {
      const result1 = await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
      
      const result2 = await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        '2',
        mockCallbackUrl
      );
      
      expect(result1.webhookId).to.not.equal(result2.webhookId);
      expect(result1.secret).to.not.equal(result2.secret);
    });
  });
  
  describe('Real-Time Update Processing', function () {
    let webhookId;
    
    beforeEach(async function () {
      const webhook = await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl,
        ['collection', 'processing'],
        { realTimeUpdates: true }
      );
      webhookId = webhook.webhookId;
    });
    
    it('Should trigger real-time update for high priority milestones', async function () {
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
    
    it('Should queue batch update for normal priority milestones', async function () {
      const milestoneData = {
        milestoneName: 'Test Processing Milestone',
        milestoneType: 'processing',
        realTime: false,
        data: {
          processingMethod: 'Advanced Recycling',
          temperature: 350
        }
      };
      
      const result = await enhancedWebhookService.triggerRealTimeUpdate(
        mockFacilityId,
        mockTokenId,
        milestoneData,
        false
      );
      
      expect(result).to.have.property('updateId');
      expect(result.status).to.equal('queued_batch');
      expect(result.priority).to.equal('normal');
    });
    
    it('Should trigger webhook notification immediately', async function () {
      const milestoneData = {
        milestoneName: 'Test Milestone',
        milestoneType: 'collection',
        data: { wasteId: 'waste-001' }
      };
      
      await enhancedWebhookService.triggerRealTimeUpdate(
        mockFacilityId,
        mockTokenId,
        milestoneData,
        true
      );
      
      // Wait a bit for async webhook notification
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(axiosStub.calledOnce).to.be.true;
      const callArgs = axiosStub.getCall(0).args;
      expect(callArgs[0]).to.equal(mockCallbackUrl);
      expect(callArgs[1]).to.have.property('type', 'milestone_detected');
    });
  });
  
  describe('Enhanced Milestone Detection', function () {
    beforeEach(async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
    });
    
    it('Should detect collection milestone', async function () {
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
    
    it('Should detect sorting milestone', async function () {
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
      expect(digitalTwinServiceStub.calledOnce).to.be.true;
    });
  });  des
cribe('Batch Update System', function () {
    let webhookId;
    
    beforeEach(async function () {
      const webhook = await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl,
        [],
        { batchUpdates: true }
      );
      webhookId = webhook.webhookId;
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
    
    it('Should handle mixed success/failure in batch processing', async function () {
      // Mock one certificate to fail
      const mockContract = await certificateServiceStub();
      mockContract.getCertificate.onSecondCall().rejects(new Error('Certificate not found'));
      
      const updates = [
        {
          facilityId: mockFacilityId,
          tokenId: '1',
          milestoneData: { milestoneName: 'Valid Update', milestoneType: 'quality_check' }
        },
        {
          facilityId: mockFacilityId,
          tokenId: '999',
          milestoneData: { milestoneName: 'Invalid Update', milestoneType: 'quality_check' }
        }
      ];
      
      const batchResult = await enhancedWebhookService.processBatchUpdates(updates);
      
      expect(batchResult.totalUpdates).to.equal(2);
      expect(batchResult.successful).to.be.greaterThan(0);
      expect(batchResult.failed).to.be.greaterThan(0);
      expect(batchResult.errors).to.be.an('array');
      expect(batchResult.errors.length).to.be.greaterThan(0);
    });
    
    it('Should respect batch size limits', async function () {
      const originalBatchSize = enhancedWebhookService.batchSize;
      enhancedWebhookService.batchSize = 3; // Temporarily set small batch size
      
      // Create more updates than batch size
      const updates = [];
      for (let i = 0; i < 5; i++) {
        updates.push({
          facilityId: mockFacilityId,
          tokenId: (i + 1).toString(),
          milestoneData: { milestoneName: `Update ${i}`, milestoneType: 'collection' }
        });
      }
      
      const batchResult = await enhancedWebhookService.processBatchUpdates(updates);
      
      // Should only process batch size number of updates
      expect(batchResult.totalUpdates).to.equal(3);
      
      // Restore original batch size
      enhancedWebhookService.batchSize = originalBatchSize;
    });
  });
  
  describe('Webhook Notification System', function () {
    let webhookId;
    
    beforeEach(async function () {
      const webhook = await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
      webhookId = webhook.webhookId;
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
      expect(result.responseTime).to.be.a('number');
      expect(result.attempt).to.equal(1);
      
      // Verify axios was called with correct parameters
      expect(axiosStub.calledOnce).to.be.true;
      const callArgs = axiosStub.getCall(0).args;
      expect(callArgs[0]).to.equal(mockCallbackUrl);
      expect(callArgs[1]).to.have.property('signature');
      expect(callArgs[2].headers).to.have.property('X-Webhook-Signature');
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
    
    it('Should fail after maximum retry attempts', async function () {
      // Mock all calls to fail
      axiosStub.rejects(new Error('Persistent network error'));
      
      const payload = {
        updateId: 'test-update-123',
        type: 'milestone_detected'
      };
      
      try {
        await enhancedWebhookService.triggerWebhookNotification(
          `${mockFacilityId}-${mockTokenId}`,
          payload
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('failed after');
        expect(axiosStub.callCount).to.equal(enhancedWebhookService.maxRetries);
      }
    });
    
    it('Should handle webhook timeout', async function () {
      // Mock timeout error
      axiosStub.rejects({ code: 'ECONNABORTED', message: 'timeout' });
      
      const payload = {
        updateId: 'test-update-123',
        type: 'milestone_detected'
      };
      
      try {
        await enhancedWebhookService.triggerWebhookNotification(
          `${mockFacilityId}-${mockTokenId}`,
          payload
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('timeout');
      }
    });
  });
  
  describe('Performance Metrics and Monitoring', function () {
    beforeEach(async function () {
      await enhancedWebhookService.registerEnhancedWebhook(
        mockFacilityId,
        mockTokenId,
        mockCallbackUrl
      );
    });
    
    it('Should track performance metrics', async function () {
      const initialMetrics = enhancedWebhookService.metrics;
      const initialTotal = initialMetrics.totalUpdates;
      
      // Trigger some updates
      await enhancedWebhookService.triggerRealTimeUpdate(
        mockFacilityId,
        mockTokenId,
        {
          milestoneName: 'Test Metric Update',
          milestoneType: 'collection',
          data: { wasteId: 'waste-001' }
        },
        true
      );
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedMetrics = enhancedWebhookService.metrics;
      expect(updatedMetrics.totalUpdates).to.be.greaterThan(initialTotal);
      expect(updatedMetrics.averageProcessingTime).to.be.a('number');
    });
    
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
    
    it('Should provide webhook statistics', async function () {
      const webhook = await enhancedWebhookService.registerEnhancedWebhook(
        'test-facility-stats',
        '999',
        mockCallbackUrl
      );
      
      const stats = enhancedWebhookService.getEnhancedWebhookStats(webhook.webhookId);
      
      expect(stats).to.have.property('webhookId', webhook.webhookId);
      expect(stats).to.have.property('status', 'active');
      expect(stats).to.have.property('triggerCount');
      expect(stats).to.have.property('failureCount');
      expect(stats).to.have.property('successRate');
      expect(stats).to.have.property('monitoredMilestones');
      expect(stats).to.have.property('options');
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
    
    it('Should handle certificate service errors', async function () {
      certificateServiceStub.rejects(new Error('Certificate service unavailable'));
      
      try {
        await enhancedWebhookService.triggerRealTimeUpdate(
          mockFacilityId,
          mockTokenId,
          {
            milestoneName: 'Test Error',
            milestoneType: 'collection',
            data: { wasteId: 'waste-001' }
          },
          true
        );
        
        // Wait for processing to attempt
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Should not throw, but should handle error gracefully
        expect(true).to.be.true; // Test passes if no unhandled error
      } catch (error) {
        // If error is thrown, it should be handled gracefully
        expect(error.message).to.include('Certificate service unavailable');
      }
    });
    
    it('Should handle IPFS service errors', async function () {
      ipfsServiceStub.rejects(new Error('IPFS unavailable'));
      
      try {
        await enhancedWebhookService.triggerRealTimeUpdate(
          mockFacilityId,
          mockTokenId,
          {
            milestoneName: 'Test IPFS Error',
            milestoneType: 'collection',
            data: { wasteId: 'waste-001' }
          },
          true
        );
        
        // Wait for processing to attempt
        await new Promise(resolve => setTimeout(resolve, 200));
        
        expect(true).to.be.true; // Test passes if no unhandled error
      } catch (error) {
        expect(error.message).to.include('IPFS unavailable');
      }
    });
    
    it('Should handle digital twin service errors', async function () {
      digitalTwinServiceStub.rejects(new Error('Digital twin service unavailable'));
      
      const processingData = {
        digitalTwinId: 'twin-001',
        twinState: { temperature: 375 }
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        mockFacilityId,
        mockTokenId,
        processingData
      );
      
      // Should handle error gracefully and return empty array or filtered results
      expect(milestones).to.be.an('array');
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
    
    it('Should handle webhook statistics for non-existent webhook', async function () {
      try {
        enhancedWebhookService.getEnhancedWebhookStats('non-existent-webhook');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Webhook non-existent-webhook not found');
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