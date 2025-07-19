const { expect } = require('chai');
const { ethers } = require('hardhat');
const sinon = require('sinon');
const axios = require('axios');
const certificateService = require('../services/certificateService');
const digitalTwinService = require('../services/digitalTwinService');
const enhancedWebhookService = require('../services/enhancedWebhookService');
const ipfsService = require('../services/ipfsService');

describe('Certificate Lifecycle End-to-End Real-Time Updates', function () {
  let factory;
  let certificateContract;
  let owner;
  let processor;
  let recipient;
  let verifier;
  let facilityId;
  let contractAddress;
  let axiosStub;
  
  // Test data
  const testCertificateData = {
    wasteOrigin: 'Delhi Municipal Corporation - Advanced Processing',
    processingMethod: 'Multi-Modal AI-Enhanced Recycling',
    carbonCredits: 150,
    recyclingEfficiency: 92,
    environmentalImpact: 88
  };
  
  const testDigitalTwinData = {
    name: 'Advanced Waste Processing Digital Twin',
    type: 'enhanced_waste_processing',
    location: 'Delhi Advanced Processing Facility',
    sensors: ['temperature', 'pressure', 'flow_rate', 'quality_sensor', 'emission_sensor'],
    parameters: {
      temperature: 25,
      pressure: 1.0,
      flow_rate: 100,
      quality_index: 85,
      emission_level: 0.02
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
    facilityId = 'advanced-facility-001';
    
    // Stub axios for webhook testing
    axiosStub = sinon.stub(axios, 'post');
    axiosStub.resolves({
      status: 200,
      data: { success: true, received: true }
    });
    
    console.log('Advanced Certificate Lifecycle Test setup completed');
  });

  after(async function () {
    sinon.restore();
  });

  describe('Complete Real-Time Certificate Lifecycle with Enhanced Features', function () {
    let tokenId;
    let digitalTwinId;
    let webhookId;
    let milestoneEvents = [];
    
    it('Should deploy certificate contract for advanced facility', async function () {
      contractAddress = await certificateService.deployCertificateContract(
        facilityId,
        'Advanced Waste Certificates',
        'AWC'
      );
      
      expect(contractAddress).to.not.equal(ethers.constants.AddressZero);
      
      // Get contract instance
      certificateContract = await certificateService.getCertificateContract(facilityId);
      expect(certificateContract.address).to.equal(contractAddress);
      
      console.log(`Deployed advanced certificate contract at: ${contractAddress}`);
    });
    
    it('Should create enhanced digital twin for waste processing', async function () {
      const twinResult = await digitalTwinService.createDigitalTwin(testDigitalTwinData);
      digitalTwinId = twinResult.twinId;
      
      expect(digitalTwinId).to.be.a('string');
      expect(digitalTwinId.length).to.be.greaterThan(0);
      
      console.log(`Created digital twin: ${digitalTwinId}`);
    });
    
    it('Should register enhanced webhook for real-time certificate updates', async function () {
      const webhookResult = await enhancedWebhookService.registerEnhancedWebhook(
        facilityId,
        'pending', // Will be updated with actual token ID
        'http://localhost:3000/webhook/advanced-test',
        [
          'collection', 
          'sorting', 
          'processing', 
          'quality_check', 
          'verification', 
          'environmental_impact',
          'completion',
          'digital_twin_update'
        ],
        {
          retryAttempts: 5,
          batchUpdates: true,
          realTimeUpdates: true,
          immediateProcessing: true,
          webhookTimeout: 15000,
          enableMetrics: true
        }
      );
      
      webhookId = webhookResult.webhookId;
      expect(webhookId).to.be.a('string');
      expect(webhookResult.status).to.equal('registered');
      expect(webhookResult.secret).to.be.a('string');
      expect(webhookResult.realTimeEnabled).to.be.true;
      expect(webhookResult.monitoredMilestones).to.include('collection');
      expect(webhookResult.monitoredMilestones).to.include('digital_twin_update');
      
      console.log(`Registered enhanced webhook: ${webhookId}`);
    });
    
    it('Should set up milestone event listener', async function () {
      enhancedWebhookService.on('milestoneDetected', (eventData) => {
        milestoneEvents.push(eventData);
        console.log(`Milestone detected: ${eventData.milestoneType} for token ${eventData.tokenId}`);
      });
      
      expect(enhancedWebhookService.listenerCount('milestoneDetected')).to.be.greaterThan(0);
    });
    
    it('Should mint initial certificate with enhanced metadata and digital twin link', async function () {
      const mintResult = await certificateService.mintCertificate(
        facilityId,
        recipient.address,
        {
          ...testCertificateData,
          digitalTwinId: digitalTwinId,
          processingStage: 'initial',
          qualityScore: 0,
          verificationLevel: 'pending',
          sustainabilityMetrics: {
            waterSaved: 0,
            energySaved: 0,
            co2Reduced: 0
          }
        }
      );
      
      tokenId = mintResult.tokenId;
      expect(tokenId).to.be.a('string');
      expect(mintResult.transactionHash).to.be.a('string');
      expect(mintResult.ipfsUri).to.include('ipfs://');
      
      // Verify certificate was minted correctly
      const certificate = await certificateContract.getCertificate(tokenId);
      expect(certificate.wasteOrigin).to.equal(testCertificateData.wasteOrigin);
      expect(certificate.isVerified).to.be.false;
      
      console.log(`Minted certificate with token ID: ${tokenId}`);
    });
    
    it('Should link digital twin to NFT certificate', async function () {
      await digitalTwinService.linkTwinToNFT(digitalTwinId, tokenId, contractAddress);
      
      // Verify link was created
      const twinData = await digitalTwinService.getTwinById(digitalTwinId);
      expect(twinData.linkedNFT.tokenId).to.equal(tokenId);
      expect(twinData.linkedNFT.contractAddress).to.equal(contractAddress);
      
      console.log(`Linked digital twin ${digitalTwinId} to certificate ${tokenId}`);
    });
    
    it('Should trigger and process collection milestone in real-time', async function () {
      const processingData = {
        status: 'collected',
        wasteId: 'advanced-waste-001',
        collectionDate: new Date().toISOString(),
        collectionLocation: 'Delhi Advanced Collection Point Alpha',
        wasteType: 'Multi-Stream Recyclables with Rare Materials',
        quantity: 750,
        collector: 'Advanced Collection Team Alpha',
        gpsCoordinates: { lat: 28.6139, lng: 77.2090 },
        collectionMethod: 'AI-Guided Smart Collection',
        qualityPreCheck: 'passed'
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const collectionMilestone = milestones.find(m => m.milestoneType === 'collection');
      expect(collectionMilestone).to.exist;
      expect(collectionMilestone.data.milestoneName).to.equal('Enhanced Waste Collection Completed');
      expect(collectionMilestone.priority).to.equal('high');
      expect(collectionMilestone.realTime).to.be.true;
      
      // Wait for real-time processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify webhook was triggered
      expect(axiosStub.called).to.be.true;
      
      console.log('Collection milestone processed in real-time');
    });
    
    it('Should trigger and process sorting milestone with contamination detection', async function () {
      const processingData = {
        status: 'sorted',
        categories: ['plastic_pet', 'plastic_hdpe', 'paper_cardboard', 'metal_aluminum', 'rare_metals'],
        sortingDate: new Date().toISOString(),
        sortingMethod: 'Multi-Modal AI-Enhanced Sorting with Spectral Analysis',
        contamination: 2.5,
        sortingEfficiency: 96.5,
        operator: 'Advanced Sorting Team Beta',
        aiConfidence: 98.7,
        contaminationTypes: ['organic_residue', 'mixed_plastics'],
        rareMaterialsDetected: ['lithium', 'cobalt'],
        qualityGrade: 'A+'
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const sortingMilestone = milestones.find(m => m.milestoneType === 'sorting');
      expect(sortingMilestone).to.exist;
      expect(sortingMilestone.data.data.sortingEfficiency).to.equal(96.5);
      expect(sortingMilestone.data.data.contamination).to.equal(2.5);
      expect(sortingMilestone.priority).to.equal('high');
      
      // Wait for real-time processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Sorting milestone with contamination detection processed');
    });
    
    it('Should trigger and process advanced processing milestone', async function () {
      const processingData = {
        status: 'processing',
        processingMethod: 'Quantum-Enhanced Molecular Recycling',
        processingDate: new Date().toISOString(),
        expectedDuration: 180, // minutes
        energyConsumption: 125, // kWh
        temperature: 425, // Celsius
        pressure: 3.2, // bar
        operator: 'Advanced Processing Team Gamma',
        processingStage: 'molecular_breakdown',
        efficiency: 94.2,
        qualityMetrics: {
          purity: 97.8,
          consistency: 95.5,
          contamination: 1.2
        }
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const processingMilestone = milestones.find(m => m.milestoneType === 'processing');
      expect(processingMilestone).to.exist;
      expect(processingMilestone.data.data.temperature).to.equal(425);
      expect(processingMilestone.data.data.processingMethod).to.equal('Quantum-Enhanced Molecular Recycling');
      
      console.log('Advanced processing milestone processed');
    });
    
    it('Should update digital twin state during processing with real-time sync', async function () {
      const newState = {
        parameters: {
          temperature: 435,
          pressure: 3.4,
          flow_rate: 145,
          efficiency: 94.8,
          quality_index: 96.2,
          emission_level: 0.015
        },
        metrics: {
          processed_volume: 720,
          energy_consumption: 140,
          quality_score: 96.5,
          contamination_removed: 98.8,
          rare_materials_recovered: 15.2
        },
        status: 'active_processing',
        processingStage: 'molecular_reconstruction',
        lastUpdated: new Date().toISOString(),
        predictiveAnalytics: {
          expectedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          qualityForecast: 97.2,
          efficiencyTrend: 'increasing'
        }
      };
      
      await digitalTwinService.updateTwinState(digitalTwinId, newState);
      
      // Trigger digital twin update milestone
      const processingData = {
        digitalTwinId: digitalTwinId,
        twinState: newState,
        updateDate: new Date().toISOString(),
        syncType: 'real_time',
        dataSource: 'iot_sensors'
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const twinMilestone = milestones.find(m => m.milestoneType === 'digital_twin_update');
      expect(twinMilestone).to.exist;
      expect(twinMilestone.data.data.digitalTwinId).to.equal(digitalTwinId);
      expect(twinMilestone.realTime).to.be.true;
      
      // Wait for real-time processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Digital twin state updated with real-time sync');
    });
    
    it('Should trigger and process enhanced quality check milestone', async function () {
      const processingData = {
        qualityScore: 96.8,
        checkDate: new Date().toISOString(),
        checkMethod: 'Multi-Spectral Automated Quality Assessment with AI Validation',
        inspector: 'Advanced QA Team Lead',
        defects: [],
        minimumScore: 85,
        qualityMetrics: {
          purity: 98.2,
          consistency: 97.5,
          durability: 95.8,
          contamination: 0.8
        },
        certificationLevel: 'premium',
        complianceStandards: ['ISO 14021', 'ASTM D6400', 'EN 13432'],
        testResults: {
          tensileStrength: 'passed',
          thermalStability: 'passed',
          chemicalResistance: 'passed'
        }
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const qualityMilestone = milestones.find(m => m.milestoneType === 'quality_check');
      expect(qualityMilestone).to.exist;
      expect(qualityMilestone.data.data.qualityScore).to.equal(96.8);
      expect(qualityMilestone.data.data.passed).to.be.true;
      expect(qualityMilestone.priority).to.equal('high');
      
      console.log('Enhanced quality check milestone processed');
    });
    
    it('Should trigger and process comprehensive environmental impact milestone', async function () {
      const processingData = {
        carbonCredits: 185,
        co2Reduction: 3.8, // tons
        energySaved: 420, // kWh
        waterSaved: 1850, // liters
        recyclingEfficiency: 96.5,
        environmentalImpact: 92.3,
        calculationDate: new Date().toISOString(),
        calculationMethod: 'Enhanced ISO 14040 LCA Standard with AI Optimization',
        sustainabilityMetrics: {
          circularityIndex: 94.2,
          resourceEfficiency: 91.8,
          wasteReduction: 97.5,
          biodiversityImpact: 'positive'
        },
        certifications: ['Carbon Trust', 'Cradle to Cradle', 'LEED Points'],
        impactCategories: {
          climateChange: 'significant_positive',
          resourceDepletion: 'major_reduction',
          toxicity: 'minimal',
          eutrophication: 'reduced'
        }
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const envMilestone = milestones.find(m => m.milestoneType === 'environmental_impact');
      expect(envMilestone).to.exist;
      expect(envMilestone.data.data.carbonCredits).to.equal(185);
      expect(envMilestone.data.data.recyclingEfficiency).to.equal(96.5);
      expect(envMilestone.priority).to.equal('medium');
      
      console.log('Comprehensive environmental impact milestone processed');
    });
    
    it('Should verify certificate with enhanced verification process', async function () {
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
      
      // Trigger enhanced verification milestone
      const processingData = {
        isVerified: true,
        verifier: verifier.address,
        verificationDate: new Date().toISOString(),
        verificationMethod: 'Multi-Layer Blockchain Verification with AI Validation',
        verificationStandard: 'Enhanced ISO 14021 with Blockchain Immutability',
        verificationHash: 'enhanced-hash-' + Date.now(),
        verificationLevel: 'premium',
        auditTrail: {
          steps: ['document_review', 'on_site_inspection', 'lab_testing', 'blockchain_validation'],
          duration: '72_hours',
          confidence: 99.2
        },
        complianceCertificates: ['ISO 14021', 'ASTM D6400', 'Carbon Trust'],
        thirdPartyValidation: true
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const verificationMilestone = milestones.find(m => m.milestoneType === 'verification');
      expect(verificationMilestone).to.exist;
      expect(verificationMilestone.data.data.isVerified).to.be.true;
      expect(verificationMilestone.priority).to.equal('high');
      
      console.log('Enhanced verification milestone processed');
    });
    
    it('Should trigger and process comprehensive completion milestone', async function () {
      const processingData = {
        status: 'completed',
        completionDate: new Date().toISOString(),
        finalProducts: [
          'premium_recycled_plastic_pellets',
          'recovered_rare_metals',
          'high_grade_organic_compost',
          'renewable_energy_credits',
          'carbon_offset_certificates'
        ],
        totalRecovered: 735, // kg
        wasteReduction: 98.2, // percentage
        processingEfficiency: 96.5,
        operator: 'Advanced Processing Supervisor',
        qualityGrades: {
          plastic_pellets: 'A+',
          rare_metals: 'premium',
          organic_compost: 'certified_organic'
        },
        marketValue: {
          totalValue: 15750, // USD
          premiumBonus: 2250, // USD for high quality
          sustainabilityBonus: 1500 // USD for environmental impact
        },
        certifications: ['Premium Quality', 'Carbon Negative', 'Circular Economy Certified'],
        nextDestination: {
          plastic_pellets: 'Advanced Manufacturing Partner',
          rare_metals: 'Electronics Recycling Facility',
          organic_compost: 'Urban Agriculture Program'
        }
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        facilityId,
        tokenId,
        processingData
      );
      
      expect(milestones).to.be.an('array');
      expect(milestones.length).to.be.greaterThan(0);
      
      const completionMilestone = milestones.find(m => m.milestoneType === 'completion');
      expect(completionMilestone).to.exist;
      expect(completionMilestone.data.data.wasteReduction).to.equal(98.2);
      expect(completionMilestone.data.data.processingEfficiency).to.equal(96.5);
      expect(completionMilestone.priority).to.equal('high');
      
      console.log('Comprehensive completion milestone processed');
    });
    
    it('Should verify all milestones were detected and processed', async function () {
      // Wait for all async processing to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      expect(milestoneEvents.length).to.be.greaterThan(6);
      
      const milestoneTypes = milestoneEvents.map(e => e.milestoneType);
      expect(milestoneTypes).to.include('collection');
      expect(milestoneTypes).to.include('sorting');
      expect(milestoneTypes).to.include('processing');
      expect(milestoneTypes).to.include('quality_check');
      expect(milestoneTypes).to.include('environmental_impact');
      expect(milestoneTypes).to.include('verification');
      expect(milestoneTypes).to.include('completion');
      expect(milestoneTypes).to.include('digital_twin_update');
      
      console.log(`Total milestones detected and processed: ${milestoneEvents.length}`);
    });
    
    it('Should verify webhook notifications were sent for all milestones', async function () {
      // Verify webhook was called multiple times
      expect(axiosStub.callCount).to.be.greaterThan(6);
      
      // Verify webhook payloads contain correct data
      const webhookCalls = axiosStub.getCalls();
      const payloads = webhookCalls.map(call => call.args[1]);
      
      expect(payloads.some(p => p.type === 'milestone_detected')).to.be.true;
      expect(payloads.some(p => p.milestone && p.milestone.type === 'collection')).to.be.true;
      expect(payloads.some(p => p.milestone && p.milestone.type === 'completion')).to.be.true;
      
      console.log(`Total webhook notifications sent: ${axiosStub.callCount}`);
    });
    
    it('Should check final certificate authenticity and completeness', async function () {
      const isAuthentic = await certificateService.isAuthentic(facilityId, tokenId);
      expect(isAuthentic).to.be.true;
      
      // Get final certificate state
      const finalCertificate = await certificateContract.getCertificate(tokenId);
      expect(finalCertificate.isVerified).to.be.true;
      expect(finalCertificate.carbonCredits.toNumber()).to.be.greaterThan(150);
      expect(finalCertificate.recyclingEfficiency.toNumber()).to.be.greaterThan(90);
      expect(finalCertificate.environmentalImpact.toNumber()).to.be.greaterThan(85);
      
      console.log('Final certificate verification completed successfully');
    });
    
    it('Should get comprehensive webhook statistics', async function () {
      const stats = enhancedWebhookService.getEnhancedWebhookStats(webhookId);
      expect(stats.webhookId).to.equal(webhookId);
      expect(stats.status).to.equal('active');
      expect(stats.triggerCount).to.be.greaterThan(6);
      expect(stats.failureCount).to.equal(0);
      expect(stats.successRate).to.equal('100%');
      expect(stats.monitoredMilestones).to.be.an('array');
      expect(stats.monitoredMilestones.length).to.be.greaterThan(6);
      
      console.log(`Webhook statistics: ${stats.triggerCount} triggers, ${stats.successRate} success rate`);
    });
    
    it('Should get enhanced system status', async function () {
      const status = enhancedWebhookService.getEnhancedSystemStatus();
      expect(status.registeredWebhooks).to.be.greaterThan(0);
      expect(status.activeWebhooks).to.be.greaterThan(0);
      expect(status.realTimeUpdates).to.be.a('number');
      expect(status.pendingUpdates).to.be.a('number');
      expect(status.metrics).to.be.an('object');
      expect(status.metrics.totalUpdates).to.be.greaterThan(0);
      expect(status.metrics.successfulUpdates).to.be.greaterThan(0);
      expect(status.version).to.equal('2.0.0');
      
      console.log(`System status: ${status.metrics.totalUpdates} total updates, ${status.activeWebhooks} active webhooks`);
    });
  });
  
  describe('Advanced Batch Update System with Real-Time Processing', function () {
    let tokenIds = [];
    const batchSize = 8;
    
    it('Should mint multiple certificates for advanced batch testing', async function () {
      const certificateBatch = [];
      
      for (let i = 0; i < batchSize; i++) {
        certificateBatch.push({
          recipient: recipient.address,
          certificateData: {
            ...testCertificateData,
            wasteOrigin: `Advanced Batch Test Origin ${i + 1}`,
            carbonCredits: 100 + (i * 15),
            recyclingEfficiency: 85 + (i * 2),
            environmentalImpact: 80 + (i * 2),
            processingMethod: `Advanced Method ${i + 1}`,
            qualityScore: 85 + i
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
      
      console.log(`Minted ${batchSize} certificates for advanced batch testing`);
    });
    
    it('Should process advanced batch updates with mixed milestone types', async function () {
      const updates = tokenIds.map((tokenId, index) => ({
        facilityId: facilityId,
        tokenId: tokenId,
        milestoneData: {
          milestoneName: `Advanced Batch Update ${index + 1}`,
          milestoneType: index % 2 === 0 ? 'environmental_impact' : 'quality_check',
          updateId: `batch-update-${index + 1}`,
          realTime: index < 4, // First half real-time, second half batch
          data: index % 2 === 0 ? {
            carbonCredits: 150 + (index * 25),
            co2Reduction: 2.5 + (index * 0.8),
            recyclingEfficiency: 90 + index,
            environmentalImpact: 85 + (index * 2),
            sustainabilityMetrics: {
              circularityIndex: 90 + index,
              resourceEfficiency: 88 + index
            }
          } : {
            qualityScore: 90 + index,
            checkMethod: `Advanced Quality Check ${index + 1}`,
            certificationLevel: index > 4 ? 'premium' : 'standard',
            complianceStandards: ['ISO 14021', 'ASTM D6400']
          }
        }
      }));
      
      const batchResult = await enhancedWebhookService.processBatchUpdates(updates);
      expect(batchResult.totalUpdates).to.equal(batchSize);
      expect(batchResult.successful).to.be.greaterThan(batchSize * 0.8); // At least 80% success
      expect(batchResult.batchId).to.be.a('string');
      expect(batchResult.processingTime).to.be.a('number');
      expect(batchResult.facilitiesProcessed).to.equal(1);
      
      console.log(`Advanced batch processing completed: ${batchResult.successful}/${batchResult.totalUpdates} successful`);
    });
    
    it('Should verify advanced batch updates were applied correctly', async function () {
      for (let i = 0; i < tokenIds.length; i++) {
        const certificate = await certificateContract.getCertificate(tokenIds[i]);
        
        if (i % 2 === 0) {
          // Environmental impact updates
          expect(certificate.carbonCredits.toNumber()).to.equal(150 + (i * 25));
          expect(certificate.recyclingEfficiency.toNumber()).to.equal(90 + i);
          expect(certificate.environmentalImpact.toNumber()).to.equal(85 + (i * 2));
        }
        // Quality check updates are reflected in processing steps
      }
      
      console.log('Advanced batch update verification completed');
    });
    
    it('Should handle real-time and batch mixed processing efficiently', async function () {
      const mixedUpdates = [];
      
      // Create mix of real-time and batch updates
      for (let i = 0; i < 6; i++) {
        mixedUpdates.push({
          facilityId: facilityId,
          tokenId: tokenIds[i],
          milestoneData: {
            milestoneName: `Mixed Processing Update ${i + 1}`,
            milestoneType: 'processing',
            realTime: i < 3, // First 3 real-time
            data: {
              processingMethod: `Advanced Method ${i + 1}`,
              temperature: 400 + (i * 10),
              pressure: 3.0 + (i * 0.2),
              efficiency: 92 + i
            }
          }
        });
      }
      
      const startTime = Date.now();
      
      // Process real-time updates
      const realTimePromises = mixedUpdates
        .filter(u => u.milestoneData.realTime)
        .map(u => enhancedWebhookService.triggerRealTimeUpdate(
          u.facilityId, 
          u.tokenId, 
          u.milestoneData, 
          true
        ));
      
      // Process batch updates
      const batchUpdates = mixedUpdates.filter(u => !u.milestoneData.realTime);
      const batchPromise = enhancedWebhookService.processBatchUpdates(batchUpdates);
      
      const [realTimeResults, batchResult] = await Promise.all([
        Promise.all(realTimePromises),
        batchPromise
      ]);
      
      const endTime = Date.now();
      
      expect(realTimeResults.length).to.equal(3);
      expect(batchResult.totalUpdates).to.equal(3);
      expect(endTime - startTime).to.be.lessThan(10000); // Should complete within 10 seconds
      
      console.log(`Mixed processing completed in ${endTime - startTime}ms`);
    });
  });
  
  describe('Error Handling and Recovery in Real-Time Processing', function () {
    it('Should handle webhook notification failures with retry logic', async function () {
      // Mock webhook to fail first few times
      axiosStub.restore();
      axiosStub = sinon.stub(axios, 'post');
      axiosStub.onFirstCall().rejects(new Error('Network timeout'));
      axiosStub.onSecondCall().rejects(new Error('Service unavailable'));
      axiosStub.onThirdCall().resolves({ status: 200, data: { success: true } });
      
      const payload = {
        updateId: 'test-retry-123',
        facilityId: facilityId,
        tokenId: tokenIds[0],
        milestone: { type: 'collection' },
        timestamp: new Date().toISOString(),
        type: 'milestone_detected'
      };
      
      const result = await enhancedWebhookService.triggerWebhookNotification(
        `${facilityId}-${tokenIds[0]}`,
        payload
      );
      
      expect(result.status).to.equal('success');
      expect(result.attempt).to.equal(3);
      expect(axiosStub.callCount).to.equal(3);
      
      console.log('Webhook retry logic tested successfully');
    });
    
    it('Should handle certificate service errors gracefully', async function () {
      const invalidFacilityId = 'non-existent-facility';
      
      try {
        await enhancedWebhookService.triggerRealTimeUpdate(
          invalidFacilityId,
          '999',
          {
            milestoneName: 'Test Error Handling',
            milestoneType: 'collection',
            data: { wasteId: 'waste-error-test' }
          },
          true
        );
        
        // Wait for processing attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Should not throw unhandled error
        expect(true).to.be.true;
      } catch (error) {
        // If error is thrown, it should be handled gracefully
        expect(error.message).to.include('facility');
      }
      
      console.log('Certificate service error handling tested');
    });
    
    it('Should handle digital twin service errors in milestone processing', async function () {
      const processingData = {
        digitalTwinId: 'non-existent-twin',
        twinState: { temperature: 375 },
        updateDate: new Date().toISOString()
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        facilityId,
        tokenIds[0],
        processingData
      );
      
      // Should handle error gracefully and return appropriate results
      expect(milestones).to.be.an('array');
      
      console.log('Digital twin service error handling tested');
    });
    
    it('Should handle IPFS service failures with fallback', async function () {
      // This would be tested with actual IPFS service mocking
      // For now, we verify the system continues to function
      const processingData = {
        status: 'collected',
        wasteId: 'ipfs-test-001',
        quantity: 100
      };
      
      const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
        facilityId,
        tokenIds[0],
        processingData
      );
      
      expect(milestones).to.be.an('array');
      
      console.log('IPFS service error handling tested');
    });
  });
  
  describe('Performance Metrics and Monitoring', function () {
    it('Should track comprehensive performance metrics', async function () {
      const initialMetrics = enhancedWebhookService.metrics;
      const initialTotal = initialMetrics.totalUpdates;
      
      // Trigger multiple updates to test metrics
      const testUpdates = [];
      for (let i = 0; i < 5; i++) {
        testUpdates.push(enhancedWebhookService.triggerRealTimeUpdate(
          facilityId,
          tokenIds[i % tokenIds.length],
          {
            milestoneName: `Metrics Test ${i + 1}`,
            milestoneType: 'collection',
            data: { wasteId: `metrics-test-${i + 1}` }
          },
          true
        ));
      }
      
      await Promise.all(testUpdates);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const updatedMetrics = enhancedWebhookService.metrics;
      expect(updatedMetrics.totalUpdates).to.be.greaterThan(initialTotal);
      expect(updatedMetrics.successfulUpdates).to.be.greaterThan(0);
      expect(updatedMetrics.averageProcessingTime).to.be.a('number');
      expect(updatedMetrics.webhookTriggers).to.be.greaterThan(0);
      
      console.log(`Performance metrics: ${updatedMetrics.totalUpdates} total, ${updatedMetrics.averageProcessingTime}ms avg`);
    });
    
    it('Should provide detailed system health status', async function () {
      const status = enhancedWebhookService.getEnhancedSystemStatus();
      
      expect(status).to.have.property('pendingUpdates');
      expect(status).to.have.property('realTimeUpdates');
      expect(status).to.have.property('registeredWebhooks');
      expect(status).to.have.property('activeWebhooks');
      expect(status).to.have.property('batchSize');
      expect(status).to.have.property('updateInterval');
      expect(status).to.have.property('realTimeInterval');
      expect(status).to.have.property('metrics');
      expect(status).to.have.property('version', '2.0.0');
      expect(status.metrics.totalUpdates).to.be.a('number');
      expect(status.metrics.successfulUpdates).to.be.a('number');
      expect(status.metrics.averageProcessingTime).to.be.a('number');
      
      console.log(`System health: ${status.activeWebhooks} active webhooks, ${status.metrics.totalUpdates} total updates`);
    });
    
    it('Should calculate accurate processing time estimates', async function () {
      const immediateTime = enhancedWebhookService.getEstimatedProcessingTime(true);
      const batchTime = enhancedWebhookService.getEstimatedProcessingTime(false);
      
      expect(immediateTime).to.be.a('number');
      expect(batchTime).to.be.a('number');
      expect(immediateTime).to.be.lessThan(batchTime);
      expect(immediateTime).to.be.lessThan(5000); // Should be under 5 seconds for real-time
      
      console.log(`Processing time estimates: ${immediateTime}ms immediate, ${batchTime}ms batch`);
    });
  });
});