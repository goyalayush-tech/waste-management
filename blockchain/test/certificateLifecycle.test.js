const { expect } = require('chai');
const { ethers } = require('hardhat');
const certificateService = require('../services/certificateService');
const digitalTwinService = require('../services/digitalTwinService');
const webhookService = require('../services/webhookService');
const ipfsService = require('../services/ipfsService');

describe('Certificate Lifecycle End-to-End Tests', function () {
  let factory;
  let certificateContract;
  let owner;
  let processor;
  let recipient;
  let verifier;
  let facilityId;
  let contractAddress;
  
  // Test data
  const testCertificateData = {
    wasteOrigin: 'Delhi Municipal Corporation',
    processingMethod: 'Advanced Recycling',
    carbonCredits: 100,
    recyclingEfficiency: 85,
    environmentalImpact: 75
  };
  
  const testDigitalTwinData = {
    name: 'Test Waste Processing Twin',
    type: 'waste_processing',
    location: 'Delhi Processing Facility',
    sensors: ['temperature', 'pressure', 'flow_rate'],
    parameters: {
      temperature: 25,
      pressure: 1.0,
      flow_rate: 100
    }
  };

  before(async function () {
    // Get signers
    [owner, processor, recipient, verifier] = await ethers.getSigners();
    
    // Deploy factory contract
    const WasteCertificateFactory = await ethers.getContractFactory('WasteCertificateFactory');
    factory = await WasteCertificateFactory.deploy();
    await factory.deployed();
    
    // Initialize certificate service
    await certificateService.initialize(factory.address);
    
    // Set up facility
    facilityId = 'test-facility-001';
    
    console.log('Test setup completed');
  });

  describe('Complete Certificate Lifecycle', function () {
    let tokenId;
    let digitalTwinId;
    let webhookId;
    
    it('Should deploy certificate contract for facility', async function () {
      contractAddress = await certificateService.deployCertificateContract(
        facilityId,
        'Test Waste Certificates',
        'TWC'
      );
      
      expect(contractAddress).to.not.equal(ethers.constants.AddressZero);
      
      // Get contract instance
      certificateContract = await certificateService.getCertificateContract(facilityId);
      expect(certificateContract.address).to.equal(contractAddress);
    });
    
    it('Should create digital twin for waste processing', async function () {
      const twinResult = await digitalTwinService.createDigitalTwin(testDigitalTwinData);
      digitalTwinId = twinResult.twinId;
      
      expect(digitalTwinId).to.be.a('string');
      expect(digitalTwinId.length).to.be.greaterThan(0);
    });
    
    it('Should register enhanced webhook for certificate updates', async function () {
      const webhookResult = await webhookService.registerEnhancedWebhook(
        facilityId,
        'pending', // Will be updated with actual token ID
        'http://localhost:3000/webhook/test',
        ['collection', 'processing', 'verification', 'completion'],
        {
          retryAttempts: 3,
          batchUpdates: true,
          realTimeUpdates: true
        }
      );
      
      webhookId = webhookResult.webhookId;
      expect(webhookId).to.be.a('string');
      expect(webhookResult.status).to.equal('registered');
      expect(webhookResult.secret).to.be.a('string');
    });
    
    it('Should mint initial certificate with digital twin link', async function () {
      const mintResult = await certificateService.mintCertificate(
        facilityId,
        recipient.address,
        {
          ...testCertificateData,
          digitalTwinId: digitalTwinId
        }
      );
      
      tokenId = mintResult.tokenId;
      expect(tokenId).to.be.a('string');
      expect(mintResult.transactionHash).to.be.a('string');
      expect(mintResult.ipfsUri).to.include('ipfs://');
      
      // Verify certificate was minted correctly
      const certificate = await certificateContract.getCertificate(tokenId);
      expect(certificate.wasteOrigin).to.equal(testCertificateData.wasteOrigin);
      expect(certificate.digitalTwinId).to.equal(digitalTwinId);
      expect(certificate.isVerified).to.be.false;
    });
    
    it('Should link digital twin to NFT certificate', async function () {
      await digitalTwinService.linkTwinToNFT(digitalTwinId, tokenId, contractAddress);
      
      // Verify link was created
      const [linkedTokenId, linkedCert] = await certificateContract.getCertificateByDigitalTwin(digitalTwinId);
      expect(linkedTokenId.toString()).to.equal(tokenId);
      expect(linkedCert.digitalTwinId).to.equal(digitalTwinId);
    });
    
    it('Should detect and trigger collection milestone', async function () {
      const processingData = {
        status: 'collected',
        wasteId: 'waste-001',
        collectionDate: new Date().toISOString(),
        collectionLocation: 'Delhi Sector 15',
        wasteType: 'Mixed Recyclables',
        quantity: 500,
        collector: 'Collection Team A'
      };
      
      const milestones = await webhookService.detectAndTriggerMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      expect(milestones[0].milestoneType).to.equal('collection');
      expect(milestones[0].data.milestoneName).to.equal('Waste Collection Completed');
    });
    
    it('Should detect and trigger sorting milestone', async function () {
      const processingData = {
        status: 'sorted',
        categories: ['plastic', 'paper', 'metal'],
        sortingDate: new Date().toISOString(),
        sortingMethod: 'AI-Assisted Sorting',
        contamination: 5,
        sortingEfficiency: 92,
        operator: 'Sorting Team B'
      };
      
      const milestones = await webhookService.detectAndTriggerMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      expect(milestones[0].milestoneType).to.equal('sorting');
      expect(milestones[0].data.data.sortingEfficiency).to.equal(92);
    });
    
    it('Should detect and trigger processing milestone', async function () {
      const processingData = {
        status: 'processing',
        processingMethod: 'Advanced Thermal Processing',
        processingDate: new Date().toISOString(),
        expectedDuration: 240, // minutes
        energyConsumption: 150, // kWh
        temperature: 350, // Celsius
        pressure: 2.5, // bar
        operator: 'Processing Team C'
      };
      
      const milestones = await webhookService.detectAndTriggerMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      expect(milestones[0].milestoneType).to.equal('processing');
      expect(milestones[0].data.data.temperature).to.equal(350);
    });
    
    it('Should update digital twin state during processing', async function () {
      const newState = {
        parameters: {
          temperature: 375,
          pressure: 2.8,
          flow_rate: 120,
          efficiency: 88
        },
        metrics: {
          processed_volume: 450,
          energy_consumption: 175,
          quality_score: 91
        },
        status: 'processing',
        lastUpdated: new Date().toISOString()
      };
      
      await digitalTwinService.updateTwinState(digitalTwinId, newState);
      
      // Trigger digital twin update milestone
      const processingData = {
        digitalTwinId: digitalTwinId,
        twinState: newState,
        updateDate: new Date().toISOString()
      };
      
      const milestones = await webhookService.detectAndTriggerMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      expect(milestones[0].milestoneType).to.equal('digital_twin_update');
    });
    
    it('Should detect and trigger quality check milestone', async function () {
      const processingData = {
        qualityScore: 89,
        checkDate: new Date().toISOString(),
        checkMethod: 'Automated Quality Assessment',
        inspector: 'QA Team Lead',
        defects: ['minor_contamination'],
        minimumScore: 70
      };
      
      const milestones = await webhookService.detectAndTriggerMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      expect(milestones[0].milestoneType).to.equal('quality_check');
      expect(milestones[0].data.data.passed).to.be.true;
    });
    
    it('Should detect and trigger environmental impact milestone', async function () {
      const processingData = {
        carbonCredits: 125,
        co2Reduction: 2.5, // tons
        energySaved: 300, // kWh
        waterSaved: 1000, // liters
        recyclingEfficiency: 91,
        environmentalImpact: 82,
        calculationDate: new Date().toISOString(),
        calculationMethod: 'ISO 14040 LCA Standard'
      };
      
      const milestones = await webhookService.detectAndTriggerMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      expect(milestones[0].milestoneType).to.equal('environmental_impact');
      expect(milestones[0].data.data.carbonCredits).to.equal(125);
    });
    
    it('Should verify certificate', async function () {
      // Grant verifier role
      await certificateContract.grantRole(
        await certificateContract.VERIFIER_ROLE(),
        verifier.address
      );
      
      // Verify certificate
      const verifyResult = await certificateService.verifyCertificate(facilityId, tokenId);
      expect(verifyResult.verified).to.be.true;
      
      // Check certificate is now verified
      const certificate = await certificateContract.getCertificate(tokenId);
      expect(certificate.isVerified).to.be.true;
      
      // Trigger verification milestone
      const processingData = {
        isVerified: true,
        verifier: verifier.address,
        verificationDate: new Date().toISOString(),
        verificationMethod: 'Blockchain Verification',
        verificationStandard: 'ISO 14021',
        verificationHash: 'hash123'
      };
      
      const milestones = await webhookService.detectAndTriggerMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      expect(milestones[0].milestoneType).to.equal('verification');
    });
    
    it('Should detect and trigger completion milestone', async function () {
      const processingData = {
        status: 'completed',
        completionDate: new Date().toISOString(),
        finalProducts: ['recycled_plastic_pellets', 'recovered_metals', 'organic_compost'],
        totalRecovered: 475, // kg
        wasteReduction: 95, // percentage
        processingEfficiency: 91,
        operator: 'Processing Supervisor'
      };
      
      const milestones = await webhookService.detectAndTriggerMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      expect(milestones[0].milestoneType).to.equal('completion');
      expect(milestones[0].data.data.wasteReduction).to.equal(95);
    });
    
    it('Should check certificate authenticity', async function () {
      const isAuthentic = await certificateService.isAuthentic(facilityId, tokenId);
      expect(isAuthentic).to.be.true;
    });
    
    it('Should get webhook statistics', async function () {
      const stats = webhookService.getWebhookStats(webhookId);
      expect(stats.webhookId).to.equal(webhookId);
      expect(stats.status).to.equal('active');
      expect(stats.triggerCount).to.be.greaterThan(0);
      expect(stats.monitoredMilestones).to.be.an('array');
    });
    
    it('Should get system status', async function () {
      const status = webhookService.getSystemStatus();
      expect(status.registeredWebhooks).to.be.greaterThan(0);
      expect(status.milestoneTypes).to.be.an('array');
      expect(status.uptime).to.be.a('number');
    });
  });
  
  describe('Batch Update System', function () {
    let tokenIds = [];
    const batchSize = 5;
    
    it('Should mint multiple certificates for batch testing', async function () {
      const certificateBatch = [];
      
      for (let i = 0; i < batchSize; i++) {
        certificateBatch.push({
          recipient: recipient.address,
          certificateData: {
            ...testCertificateData,
            wasteOrigin: `Batch Test Origin ${i + 1}`,
            carbonCredits: 50 + (i * 10),
            recyclingEfficiency: 80 + i,
            environmentalImpact: 70 + i
          }
        });
      }
      
      const batchResult = await certificateService.batchMintCertificates(facilityId, certificateBatch);
      expect(batchResult.certificateCount).to.equal(batchSize);
      
      // Get token IDs for batch testing
      const totalSupply = await certificateContract.totalSupply();
      for (let i = 0; i < batchSize; i++) {
        tokenIds.push((totalSupply.toNumber() - batchSize + i + 1).toString());
      }
    });
    
    it('Should process batch updates efficiently', async function () {
      const updates = tokenIds.map((tokenId, index) => ({
        facilityId: facilityId,
        tokenId: tokenId,
        milestoneData: {
          milestoneName: `Batch Update ${index + 1}`,
          milestoneType: 'environmental_impact',
          data: {
            carbonCredits: 100 + (index * 20),
            co2Reduction: 1.5 + (index * 0.5),
            recyclingEfficiency: 85 + index,
            environmentalImpact: 80 + index
          }
        }
      }));
      
      const batchResult = await webhookService.processBatchUpdates(updates);
      expect(batchResult.totalUpdates).to.equal(batchSize);
      expect(batchResult.successful).to.equal(batchSize);
      expect(batchResult.failed).to.equal(0);
      expect(batchResult.batchId).to.be.a('string');
    });
    
    it('Should verify batch updates were applied correctly', async function () {
      for (let i = 0; i < tokenIds.length; i++) {
        const certificate = await certificateContract.getCertificate(tokenIds[i]);
        expect(certificate.carbonCredits.toNumber()).to.equal(100 + (i * 20));
        expect(certificate.recyclingEfficiency.toNumber()).to.equal(85 + i);
        expect(certificate.environmentalImpact.toNumber()).to.equal(80 + i);
      }
    });
  });
  
  describe('Error Handling and Edge Cases', function () {
    it('Should handle invalid milestone data gracefully', async function () {
      const invalidData = {
        status: 'invalid_status',
        // Missing required fields
      };
      
      const milestones = await webhookService.detectAndTriggerMilestones(
        facilityId,
        '999', // Non-existent token
        invalidData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.equal(0);
    });
    
    it('Should handle webhook registration with invalid callback URL', async function () {
      try {
        await webhookService.registerEnhancedWebhook(
          facilityId,
          '1',
          'invalid-url',
          ['collection']
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
    
    it('Should handle batch updates with mixed success/failure', async function () {
      const mixedUpdates = [
        {
          facilityId: facilityId,
          tokenId: tokenIds[0], // Valid token
          milestoneData: {
            milestoneName: 'Valid Update',
            milestoneType: 'quality_check',
            data: { qualityScore: 95 }
          }
        },
        {
          facilityId: 'invalid-facility',
          tokenId: '999', // Invalid token
          milestoneData: {
            milestoneName: 'Invalid Update',
            milestoneType: 'quality_check',
            data: { qualityScore: 85 }
          }
        }
      ];
      
      const batchResult = await webhookService.processBatchUpdates(mixedUpdates);
      expect(batchResult.totalUpdates).to.equal(2);
      expect(batchResult.successful).to.be.greaterThan(0);
      expect(batchResult.failed).to.be.greaterThan(0);
      expect(batchResult.errors).to.be.an('array');
    });
    
    it('Should handle certificate updates for non-existent tokens', async function () {
      try {
        await certificateService.updateCertificate(facilityId, '999999', {
          carbonCredits: 100
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Certificate does not exist');
      }
    });
    
    it('Should handle digital twin linking to non-existent certificate', async function () {
      try {
        await certificateContract.linkDigitalTwin('999999', 'non-existent-twin');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Certificate does not exist');
      }
    });
  });
  
  describe('Performance and Gas Optimization', function () {
    it('Should measure gas usage for batch operations', async function () {
      const batchSize = 10;
      const tokenIds = [];
      const carbonCredits = [];
      const recyclingEfficiencies = [];
      const environmentalImpacts = [];
      const ipfsHashes = [];
      
      // Prepare batch data
      for (let i = 0; i < batchSize; i++) {
        tokenIds.push((i + 1).toString());
        carbonCredits.push(100 + i);
        recyclingEfficiencies.push(85 + i);
        environmentalImpacts.push(75 + i);
        ipfsHashes.push(`ipfs://test-hash-${i}`);
      }
      
      // Measure gas for batch update
      const gasEstimate = await certificateContract.estimateGas.batchUpdateCertificates(
        tokenIds.slice(0, 3), // Use only existing tokens
        carbonCredits.slice(0, 3),
        recyclingEfficiencies.slice(0, 3),
        environmentalImpacts.slice(0, 3),
        ipfsHashes.slice(0, 3)
      );
      
      console.log(`Gas estimate for batch update of 3 certificates: ${gasEstimate.toString()}`);
      expect(gasEstimate.toNumber()).to.be.lessThan(1000000); // Should be under 1M gas
    });
    
    it('Should handle maximum batch size efficiently', async function () {
      const maxBatchSize = 50;
      const updates = [];
      
      // Create updates up to max batch size
      for (let i = 0; i < Math.min(maxBatchSize, tokenIds.length); i++) {
        updates.push({
          facilityId: facilityId,
          tokenId: tokenIds[i],
          milestoneData: {
            milestoneName: `Max Batch Update ${i + 1}`,
            milestoneType: 'environmental_impact',
            data: {
              carbonCredits: 200 + i,
              recyclingEfficiency: 90,
              environmentalImpact: 85
            }
          }
        });
      }
      
      const startTime = Date.now();
      const batchResult = await webhookService.processBatchUpdates(updates);
      const endTime = Date.now();
      
      expect(batchResult.successful).to.be.greaterThan(0);
      expect(endTime - startTime).to.be.lessThan(30000); // Should complete within 30 seconds
      
      console.log(`Batch processing time for ${updates.length} updates: ${endTime - startTime}ms`);
    });
  });
});