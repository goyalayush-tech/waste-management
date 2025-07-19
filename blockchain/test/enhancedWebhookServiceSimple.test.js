const { expect } = require('chai');
const sinon = require('sinon');

describe('Enhanced Webhook Service - Real-Time Certificate Updates', function () {
  let enhancedWebhookService;
  let mockServices;
  
  before(function () {
    // Create mock services
    mockServices = {
      ipfsService: {
        storeMetadata: sinon.stub().resolves('QmTestHash123'),
        createBackup: sinon.stub().resolves(true)
      },
      certificateService: {
        getCertificateContract: sinon.stub().resolves({
          getCertificate: sinon.stub().resolves({
            wasteOrigin: 'Test Origin',
            carbonCredits: 100,
            recyclingEfficiency: 85,
            environmentalImpact: 75,
            processingSteps: []
          }),
          batchUpdateCertificates: sinon.stub().resolves({ wait: () => Promise.resolve() })
        }),
        updateCertificate: sinon.stub().resolves({ success: true })
      },
      digitalTwinService: {
        updateTwinState: sinon.stub().resolves({ success: true })
      },
      metadataSchema: {
        createCertificateMetadata: sinon.stub().returns({
          name: 'Test Certificate',
          description: 'Test Description'
        })
      }
    };
    
    // Mock require to return our mock services
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    
    Module.prototype.require = function(id) {
      switch (id) {
        case '../services/ipfsService':
          return mockServices.ipfsService;
        case '../services/certificateService':
          return mockServices.certificateService;
        case '../services/digitalTwinService':
          return mockServices.digitalTwinService;
        case '../services/metadataSchema':
          return mockServices.metadataSchema;
        case 'axios':
          return {
            post: sinon.stub().resolves({ status: 200, data: { success: true } })
          };
        default:
          return originalRequire.apply(this, arguments);
      }
    };
    
    // Now require the service
    enhancedWebhookService = require('../services/enhancedWebhookService');
    
    // Restore require
    Module.prototype.require = originalRequire;
  });
  
  describe('Webhook Registration and Real-Time Processing', function () {
    it('Should register enhanced webhook successfully', async function () {
      const result = await enhancedWebhookService.registerEnhancedWebhook(
        'test-facility-001',
        '1',
        'http://localhost:3000/webhook/test',
        ['collection', 'processing'],
        { realTimeUpdates: true }
      );
      
      expect(result).to.have.property('webhookId');
      expect(result).to.have.property('secret');
      expect(result.status).to.equal('registered');
      expect(result.realTimeEnabled).to.be.true;
    });
    
    it('Should trigger real-time update for immediate processing', async function () {
      const milestoneData = {
        milestoneName: 'Test Collection',
        milestoneType: 'collection',
        realTime: true,
        data: { wasteId: 'waste-001', quantity: 100 }
      };
      
      const result = await enhancedWebhookService.triggerRealTimeUpdate(
        'test-facility-001',
        '1',
        milestoneData,
        true
      );
      
      expect(result).to.have.property('updateId');
      expect(result.status).to.equal('queued_immediate');
      expect(result.priority).to.equal('high');
    });
    
    it('Should detect collection milestone', async function () {
      const processingData = {
        status: 'collected',
        wasteId: 'waste-001',
        collectionDate: new Date().toISOString(),
        quantity: 500
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        'test-facility-001',
        '1',
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const collectionMilestone = milestones.find(m => m.milestoneType === 'collection');
      expect(collectionMilestone).to.exist;
      expect(collectionMilestone.data.milestoneName).to.equal('Enhanced Waste Collection Completed');
    });
    
    it('Should detect environmental impact milestone', async function () {
      const processingData = {
        carbonCredits: 125,
        co2Reduction: 2.5,
        recyclingEfficiency: 91,
        environmentalImpact: 82
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        'test-facility-001',
        '1',
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const envMilestone = milestones.find(m => m.milestoneType === 'environmental_impact');
      expect(envMilestone).to.exist;
      expect(envMilestone.data.data.carbonCredits).to.equal(125);
    });
    
    it('Should process batch updates efficiently', async function () {
      const updates = [
        {
          facilityId: 'test-facility-001',
          tokenId: '1',
          milestoneData: {
            milestoneName: 'Batch Update 1',
            milestoneType: 'environmental_impact',
            data: { carbonCredits: 100 }
          }
        },
        {
          facilityId: 'test-facility-001',
          tokenId: '2',
          milestoneData: {
            milestoneName: 'Batch Update 2',
            milestoneType: 'environmental_impact',
            data: { carbonCredits: 120 }
          }
        }
      ];
      
      const batchResult = await enhancedWebhookService.processBatchUpdates(updates);
      
      expect(batchResult).to.have.property('batchId');
      expect(batchResult.totalUpdates).to.equal(2);
      expect(batchResult.successful).to.be.greaterThan(0);
    });
    
    it('Should provide enhanced system status', async function () {
      const status = enhancedWebhookService.getEnhancedSystemStatus();
      
      expect(status).to.have.property('pendingUpdates');
      expect(status).to.have.property('realTimeUpdates');
      expect(status).to.have.property('registeredWebhooks');
      expect(status).to.have.property('version');
      expect(status.version).to.equal('2.0.0');
    });
    
    it('Should handle webhook notifications', async function () {
      // Register webhook first
      await enhancedWebhookService.registerEnhancedWebhook(
        'test-facility-002',
        '1',
        'http://localhost:3000/webhook/test2'
      );
      
      const payload = {
        updateId: 'test-123',
        type: 'milestone_detected',
        milestone: { type: 'collection' }
      };
      
      const result = await enhancedWebhookService.triggerWebhookNotification(
        'test-facility-002-1',
        payload
      );
      
      expect(result.status).to.equal('success');
      expect(result.responseStatus).to.equal(200);
    });
  });
  
  describe('Error Handling', function () {
    it('Should handle invalid milestone data', async function () {
      const invalidData = { status: 'invalid' };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        'test-facility-001',
        '999',
        invalidData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.equal(0);
    });
    
    it('Should handle non-existent webhook callback', async function () {
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
  
  describe('Performance Metrics', function () {
    it('Should calculate processing time estimates', async function () {
      const immediateTime = enhancedWebhookService.getEstimatedProcessingTime(true);
      const batchTime = enhancedWebhookService.getEstimatedProcessingTime(false);
      
      expect(immediateTime).to.be.a('number');
      expect(batchTime).to.be.a('number');
      expect(immediateTime).to.be.lessThan(batchTime);
    });
    
    it('Should track system metrics', async function () {
      const metrics = enhancedWebhookService.metrics;
      
      expect(metrics).to.have.property('totalUpdates');
      expect(metrics).to.have.property('successfulUpdates');
      expect(metrics).to.have.property('averageProcessingTime');
    });
  });
});