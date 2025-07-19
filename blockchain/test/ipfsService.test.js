const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

// Mock dependencies before requiring the service
const mockNFTStorage = {
  storeBlob: sinon.stub()
};

const mockIPFSClient = {
  add: sinon.stub()
};

const mockFetch = sinon.stub();
global.fetch = mockFetch;

// Mock the modules
sinon.stub(require('nft.storage'), 'NFTStorage').returns(mockNFTStorage);
sinon.stub(require('nft.storage'), 'File').callsFake((content, name, options) => ({
  content,
  name,
  options
}));

sinon.stub(require('ipfs-http-client'), 'create').returns(mockIPFSClient);

// Now require the service after mocking
const ipfsService = require('../services/ipfsService');
const { createEnhancedCertificateMetadata, validateEnhancedMetadata } = require('../services/metadataSchema');

describe('IPFS Metadata Storage System', function() {
  this.timeout(10000); // Increase timeout for IPFS operations

  beforeEach(function() {
    // Reset all stubs
    mockNFTStorage.storeBlob.reset();
    mockIPFSClient.add.reset();
    mockFetch.reset();
    
    // Set up default successful responses
    mockNFTStorage.storeBlob.resolves('QmTestCID123');
    mockIPFSClient.add.resolves({ cid: { toString: () => 'QmLocalCID456' } });
    mockFetch.resolves({ ok: true, json: () => Promise.resolve({ test: 'data' }) });
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Enhanced Metadata Storage', function() {
    it('should store comprehensive waste processing metadata with redundancy', async function() {
      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-001',
        tokenId: 'TOKEN-123',
        wasteClassification: {
          primaryType: 'plastic',
          materialComposition: [
            { material: 'PET', percentage: 70, purity: 95 },
            { material: 'HDPE', percentage: 30, purity: 90 }
          ]
        },
        quantity: { weight: 100, volume: 0.5, itemCount: 50 },
        processingFacility: {
          facilityId: 'FAC-001',
          facilityName: 'Delhi Recycling Center',
          facilityType: 'recycling'
        },
        overallQualityScore: 85,
        environmentalImpact: {
          carbonFootprint: {
            co2Reduction: 150,
            carbonCreditsGenerated: 5
          }
        }
      });

      const result = await ipfsService.storeWasteProcessingMetadata(testMetadata);

      expect(result).to.have.property('primaryCid');
      expect(result).to.have.property('primaryService');
      expect(result).to.have.property('redundantStorages');
      expect(result).to.have.property('totalRedundancy');
      expect(result.primaryCid).to.equal('QmTestCID123');
      expect(result.totalRedundancy).to.be.at.least(1);
      
      // Verify NFT.Storage was called
      expect(mockNFTStorage.storeBlob.calledOnce).to.be.true;
    });

    it('should handle storage failures gracefully with fallback', async function() {
      // Make NFT.Storage fail but local IPFS succeed
      mockNFTStorage.storeBlob.rejects(new Error('NFT.Storage unavailable'));
      
      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-002',
        wasteClassification: { primaryType: 'metal' },
        quantity: { weight: 50 },
        overallQualityScore: 90
      });

      const result = await ipfsService.storeWasteProcessingMetadata(testMetadata);

      expect(result.primaryService).to.equal('local-ipfs');
      expect(result.failedStorages).to.have.length(1);
      expect(result.failedStorages[0].service).to.equal('nft.storage');
    });

    it('should validate metadata structure before storage', async function() {
      const invalidMetadata = {
        // Missing required fields
        tokenId: 'TOKEN-456'
      };

      try {
        await ipfsService.storeWasteProcessingMetadata(invalidMetadata);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('Missing required field');
      }
    });

    it('should calculate and verify metadata checksums', async function() {
      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-003',
        wasteClassification: { primaryType: 'paper' },
        quantity: { weight: 25 },
        overallQualityScore: 75
      });

      const result = await ipfsService.storeWasteProcessingMetadata(testMetadata);
      
      // Verify checksum was added
      const storedCall = mockNFTStorage.storeBlob.getCall(0);
      const storedContent = JSON.parse(storedCall.args[0].content[0]);
      
      expect(storedContent).to.have.property('checksum');
      expect(storedContent.checksum).to.be.a('string');
      expect(storedContent.checksum).to.have.length(64); // SHA256 hex length
    });
  });

  describe('File Attachments Processing', function() {
    it('should process and store file attachments', async function() {
      const testBuffer1 = Buffer.from('test file content 1');
      const testBuffer2 = Buffer.from('test file content 2');
      const attachments = [testBuffer1, testBuffer2];

      mockNFTStorage.storeBlob
        .onCall(0).resolves('QmAttachment1CID')
        .onCall(1).resolves('QmAttachment2CID')
        .onCall(2).resolves('QmMetadataCID');

      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-004',
        wasteClassification: { primaryType: 'electronic' },
        quantity: { weight: 10 },
        overallQualityScore: 95
      });

      const result = await ipfsService.storeWasteProcessingMetadata(testMetadata, attachments);

      expect(result.primaryCid).to.equal('QmMetadataCID');
      expect(mockNFTStorage.storeBlob.callCount).to.equal(3); // 2 attachments + 1 metadata
    });

    it('should handle attachment processing failures gracefully', async function() {
      const testBuffer = Buffer.from('test file content');
      const attachments = [testBuffer];

      // Make first attachment fail, but metadata succeed
      mockNFTStorage.storeBlob
        .onCall(0).rejects(new Error('Attachment storage failed'))
        .onCall(1).resolves('QmMetadataCID');

      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-005',
        wasteClassification: { primaryType: 'glass' },
        quantity: { weight: 30 },
        overallQualityScore: 80
      });

      const result = await ipfsService.storeWasteProcessingMetadata(testMetadata, attachments);

      expect(result.primaryCid).to.equal('QmMetadataCID');
      // Should continue despite attachment failure
    });
  });

  describe('Automatic Backup System', function() {
    let backupDir;

    beforeEach(function() {
      backupDir = path.join(__dirname, '../backups/metadata');
    });

    afterEach(async function() {
      // Clean up test backup files
      try {
        if (fsSync.existsSync(backupDir)) {
          const files = await fs.readdir(backupDir);
          for (const file of files) {
            if (file.includes('QmTest') || file === 'backup-index.json') {
              await fs.unlink(path.join(backupDir, file));
            }
          }
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should create automatic backups with versioning', async function() {
      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-006',
        wasteClassification: { primaryType: 'textile' },
        quantity: { weight: 15 },
        overallQualityScore: 70
      });

      const result = await ipfsService.storeWasteProcessingMetadata(testMetadata);

      // Check if backup was created
      const backupFiles = await fs.readdir(backupDir);
      const backupFile = backupFiles.find(file => file.includes(result.primaryCid));
      
      expect(backupFile).to.exist;

      // Verify backup content
      const backupPath = path.join(backupDir, backupFile);
      const backupContent = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      
      expect(backupContent).to.have.property('cid', result.primaryCid);
      expect(backupContent).to.have.property('metadata');
      expect(backupContent).to.have.property('backupTimestamp');
    });

    it('should update backup index for efficient retrieval', async function() {
      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-007',
        wasteClassification: { primaryType: 'organic' },
        quantity: { weight: 40 },
        overallQualityScore: 65
      });

      const result = await ipfsService.storeWasteProcessingMetadata(testMetadata);

      // Check if index was updated
      const indexPath = path.join(backupDir, 'backup-index.json');
      expect(fsSync.existsSync(indexPath)).to.be.true;

      const indexContent = JSON.parse(await fs.readFile(indexPath, 'utf8'));
      expect(indexContent).to.have.property(result.primaryCid);
      expect(indexContent[result.primaryCid]).to.have.property('backupFileName');
      expect(indexContent[result.primaryCid]).to.have.property('timestamp');
    });
  });

  describe('Metadata Retrieval with Fallback', function() {
    it('should retrieve metadata from IPFS gateways', async function() {
      const testCid = 'QmTestRetrieveCID';
      const expectedMetadata = { test: 'retrieved data' };

      mockFetch.resolves({
        ok: true,
        json: () => Promise.resolve(expectedMetadata)
      });

      const result = await ipfsService.retrieveMetadata(testCid);

      expect(result).to.deep.equal(expectedMetadata);
      expect(mockFetch.calledOnce).to.be.true;
    });

    it('should fallback to local backup when gateways fail', async function() {
      const testCid = 'QmTestFallbackCID';
      const backupMetadata = { test: 'backup data' };

      // Make all gateways fail
      mockFetch.rejects(new Error('Gateway unavailable'));

      // Create a test backup
      const backupDir = path.join(__dirname, '../backups/metadata');
      if (!fsSync.existsSync(backupDir)) {
        await fs.mkdir(backupDir, { recursive: true });
      }

      const backupFileName = `${testCid}-test.json`;
      const backupData = {
        cid: testCid,
        metadata: backupMetadata,
        backupTimestamp: new Date().toISOString()
      };

      await fs.writeFile(path.join(backupDir, backupFileName), JSON.stringify(backupData));
      
      // Update index
      const indexPath = path.join(backupDir, 'backup-index.json');
      const index = { [testCid]: { backupFileName, timestamp: new Date().toISOString() } };
      await fs.writeFile(indexPath, JSON.stringify(index));

      const result = await ipfsService.retrieveMetadata(testCid);

      expect(result).to.deep.equal(backupMetadata);

      // Cleanup
      await fs.unlink(path.join(backupDir, backupFileName));
      await fs.unlink(indexPath);
    });

    it('should try multiple gateways before falling back', async function() {
      const testCid = 'QmTestMultiGatewayCID';
      
      // Make first gateway fail, second succeed
      mockFetch
        .onCall(0).rejects(new Error('First gateway failed'))
        .onCall(1).resolves({
          ok: true,
          json: () => Promise.resolve({ test: 'second gateway data' })
        });

      const result = await ipfsService.retrieveMetadata(testCid);

      expect(result).to.deep.equal({ test: 'second gateway data' });
      expect(mockFetch.callCount).to.equal(2);
    });
  });

  describe('Performance and Reliability Tests', function() {
    it('should handle concurrent storage operations', async function() {
      const concurrentOperations = 5;
      const promises = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const metadata = createEnhancedCertificateMetadata({
          batchId: `BATCH-CONCURRENT-${i}`,
          wasteClassification: { primaryType: 'mixed' },
          quantity: { weight: 10 + i },
          overallQualityScore: 80 + i
        });

        promises.push(ipfsService.storeWasteProcessingMetadata(metadata));
      }

      const results = await Promise.all(promises);

      expect(results).to.have.length(concurrentOperations);
      results.forEach(result => {
        expect(result).to.have.property('primaryCid');
        expect(result.totalRedundancy).to.be.at.least(1);
      });
    });

    it('should measure storage performance', async function() {
      const startTime = Date.now();
      
      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-PERFORMANCE',
        wasteClassification: { primaryType: 'plastic' },
        quantity: { weight: 100 },
        overallQualityScore: 90
      });

      const result = await ipfsService.storeWasteProcessingMetadata(testMetadata);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).to.have.property('primaryCid');
      expect(duration).to.be.below(5000); // Should complete within 5 seconds
    });

    it('should handle large metadata objects', async function() {
      // Create a large metadata object with extensive processing workflow
      const largeProcessingWorkflow = [];
      for (let i = 0; i < 50; i++) {
        largeProcessingWorkflow.push({
          stepId: `step-${i}`,
          stepName: `Processing Step ${i}`,
          stepType: 'sorting',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          inputMaterials: [
            { material: 'plastic', quantity: 10, quality: 90 }
          ],
          outputMaterials: [
            { material: 'recycled-plastic', quantity: 9, quality: 95 }
          ],
          energyConsumption: 5.5,
          waterUsage: 10.2,
          efficiency: 90 + (i % 10)
        });
      }

      const largeMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-LARGE',
        wasteClassification: { primaryType: 'plastic' },
        quantity: { weight: 1000 },
        processingWorkflow: largeProcessingWorkflow,
        overallQualityScore: 88
      });

      const result = await ipfsService.storeWasteProcessingMetadata(largeMetadata);

      expect(result).to.have.property('primaryCid');
      expect(result.totalRedundancy).to.be.at.least(1);
    });
  });

  describe('Health Check System', function() {
    it('should perform comprehensive health check', async function() {
      // Mock successful responses for health check
      mockNFTStorage.storeBlob.resolves('QmHealthCheckCID');
      mockIPFSClient.add.resolves({ cid: { toString: () => 'QmLocalHealthCID' } });
      mockFetch.resolves({ ok: true });

      const healthCheck = await ipfsService.performHealthCheck();

      expect(healthCheck).to.have.property('timestamp');
      expect(healthCheck).to.have.property('nftStorage');
      expect(healthCheck).to.have.property('backupSystem');
      expect(healthCheck).to.have.property('gateways');
      
      expect(healthCheck.nftStorage.status).to.equal('healthy');
      expect(healthCheck.backupSystem.status).to.equal('healthy');
      expect(healthCheck.gateways).to.be.an('array');
    });

    it('should detect unhealthy services', async function() {
      // Mock failures
      mockNFTStorage.storeBlob.rejects(new Error('Service unavailable'));
      mockFetch.rejects(new Error('Gateway timeout'));

      const healthCheck = await ipfsService.performHealthCheck();

      expect(healthCheck.nftStorage.status).to.equal('unhealthy');
      expect(healthCheck.nftStorage.error).to.include('Service unavailable');
    });
  });

  describe('Metadata Integrity and Verification', function() {
    it('should verify metadata integrity using checksums', async function() {
      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-INTEGRITY',
        wasteClassification: { primaryType: 'metal' },
        quantity: { weight: 75 },
        overallQualityScore: 92
      });

      // Add checksum
      const checksum = crypto.createHash('sha256')
        .update(JSON.stringify(testMetadata, Object.keys(testMetadata).sort()))
        .digest('hex');
      
      const metadataWithChecksum = { ...testMetadata, checksum };

      const isValid = ipfsService.verifyIntegrity(metadataWithChecksum);
      expect(isValid).to.be.true;

      // Test with corrupted data
      const corruptedMetadata = { ...metadataWithChecksum, batchId: 'CORRUPTED' };
      const isCorrupted = ipfsService.verifyIntegrity(corruptedMetadata);
      expect(isCorrupted).to.be.false;
    });

    it('should provide redundant gateway URLs', async function() {
      const testCid = 'QmTestRedundantCID';
      const gatewayUrls = ipfsService.getRedundantGatewayUrls(testCid);

      expect(gatewayUrls).to.be.an('array');
      expect(gatewayUrls.length).to.be.at.least(3);
      gatewayUrls.forEach(url => {
        expect(url).to.include(testCid);
        expect(url).to.match(/^https?:\/\//);
      });
    });
  });

  describe('Error Handling and Edge Cases', function() {
    it('should handle network timeouts gracefully', async function() {
      const timeoutError = new Error('Network timeout');
      timeoutError.code = 'ETIMEDOUT';
      
      mockNFTStorage.storeBlob.rejects(timeoutError);
      mockIPFSClient.add.rejects(timeoutError);

      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-TIMEOUT',
        wasteClassification: { primaryType: 'glass' },
        quantity: { weight: 20 },
        overallQualityScore: 85
      });

      try {
        await ipfsService.storeWasteProcessingMetadata(testMetadata);
        expect.fail('Should have thrown timeout error');
      } catch (error) {
        expect(error.message).to.include('IPFS storage failed');
      }
    });

    it('should handle invalid metadata gracefully', async function() {
      const invalidMetadata = {
        batchId: '', // Empty required field
        quantity: { weight: -10 }, // Invalid negative weight
        overallQualityScore: 150 // Invalid score > 100
      };

      try {
        await ipfsService.storeWasteProcessingMetadata(invalidMetadata);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('Missing required field');
      }
    });

    it('should handle file system errors in backup creation', async function() {
      // Mock fs.writeFile to fail
      const originalWriteFile = fs.writeFile;
      fs.writeFile = sinon.stub().rejects(new Error('Disk full'));

      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-FS-ERROR',
        wasteClassification: { primaryType: 'paper' },
        quantity: { weight: 35 },
        overallQualityScore: 78
      });

      // Should not throw error even if backup fails
      const result = await ipfsService.storeWasteProcessingMetadata(testMetadata);
      expect(result).to.have.property('primaryCid');

      // Restore original function
      fs.writeFile = originalWriteFile;
    });
  });
});