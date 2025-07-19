const { expect } = require('chai');
const {
  enhancedCertificateMetadataSchema,
  createEnhancedCertificateMetadata,
  validateEnhancedMetadata,
  generateMetadataTemplate,
  createCertificateMetadata
} = require('../services/metadataSchema');

describe('Enhanced Metadata Schema System', function() {
  describe('Schema Structure and Validation', function() {
    it('should have comprehensive schema structure', function() {
      expect(enhancedCertificateMetadataSchema).to.have.property('name');
      expect(enhancedCertificateMetadataSchema).to.have.property('version', '2.0.0');
      expect(enhancedCertificateMetadataSchema).to.have.property('certificateFields');
      expect(enhancedCertificateMetadataSchema).to.have.property('wasteFields');
      expect(enhancedCertificateMetadataSchema).to.have.property('processingFields');
      expect(enhancedCertificateMetadataSchema).to.have.property('environmentalImpactFields');
      expect(enhancedCertificateMetadataSchema).to.have.property('verificationFields');
      expect(enhancedCertificateMetadataSchema).to.have.property('digitalTwinFields');
      expect(enhancedCertificateMetadataSchema).to.have.property('mediaFields');
      expect(enhancedCertificateMetadataSchema).to.have.property('economicFields');
    });

    it('should validate required fields correctly', function() {
      const validMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-001',
        wasteClassification: { primaryType: 'plastic' },
        quantity: { weight: 100 },
        processingDate: new Date().toISOString(),
        overallQualityScore: 85
      });

      const validation = validateEnhancedMetadata(validMetadata);
      expect(validation.isValid).to.be.true;
      expect(validation.errors).to.have.length(0);
    });

    it('should detect missing required fields', function() {
      const invalidMetadata = {
        tokenId: 'TOKEN-123'
        // Missing required fields
      };

      const validation = validateEnhancedMetadata(invalidMetadata);
      expect(validation.isValid).to.be.false;
      expect(validation.errors.length).to.be.greaterThan(0);
      expect(validation.errors.some(error => error.includes('batchId'))).to.be.true;
    });

    it('should validate data types and ranges', function() {
      const invalidMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-002',
        wasteClassification: { primaryType: 'metal' },
        quantity: { weight: -50 }, // Invalid negative weight
        processingDate: new Date().toISOString(),
        overallQualityScore: 150 // Invalid score > 100
      });

      const validation = validateEnhancedMetadata(invalidMetadata);
      expect(validation.isValid).to.be.false;
      expect(validation.errors.some(error => error.includes('overallQualityScore'))).to.be.true;
    });

    it('should validate enum values', function() {
      const invalidMetadata = createEnhancedCertificateMetadata({
        batchId: 'BATCH-003',
        certificateType: 'invalid-type', // Invalid enum value
        wasteClassification: { primaryType: 'plastic' },
        quantity: { weight: 75 },
        processingDate: new Date().toISOString(),
        overallQualityScore: 80
      });

      const validation = validateEnhancedMetadata(invalidMetadata);
      expect(validation.isValid).to.be.false;
      expect(validation.errors.some(error => error.includes('certificateType'))).to.be.true;
    });

    it('should provide warnings for missing recommended fields', function() {
      const metadataWithoutRecommended = createEnhancedCertificateMetadata({
        batchId: 'BATCH-004',
        wasteClassification: { primaryType: 'glass' },
        quantity: { weight: 30 },
        processingDate: new Date().toISOString(),
        overallQualityScore: 90
        // Missing recommended fields like digitalTwin.digitalTwinId
      });

      const validation = validateEnhancedMetadata(metadataWithoutRecommended);
      expect(validation.warnings.length).to.be.greaterThan(0);
      expect(validation.score).to.be.lessThan(100);
    });
  });

  describe('Enhanced Metadata Creation', function() {
    it('should create comprehensive metadata with all sections', function() {
      const inputData = {
        batchId: 'BATCH-COMPREHENSIVE',
        tokenId: 'TOKEN-456',
        wasteClassification: {
          primaryType: 'electronic',
          subTypes: ['smartphones', 'laptops'],
          materialComposition: [
            { material: 'gold', percentage: 0.1, purity: 99.9 },
            { material: 'silver', percentage: 0.3, purity: 95.0 },
            { material: 'copper', percentage: 15.0, purity: 90.0 }
          ],
          contaminationLevel: 5,
          hazardousComponents: ['lead', 'mercury']
        },
        quantity: { weight: 50, volume: 0.2, itemCount: 25 },
        processingFacility: {
          facilityId: 'FAC-ELECTRONIC',
          facilityName: 'Advanced E-Waste Processing Center',
          facilityType: 'recycling',
          location: {
            address: '123 Tech Park, Delhi',
            coordinates: { lat: 28.6139, lng: 77.2090 }
          },
          certifications: ['ISO 14001', 'R2 Certified'],
          operatorId: 'OP-001'
        },
        processingWorkflow: [
          {
            stepId: 'disassembly',
            stepName: 'Manual Disassembly',
            stepType: 'sorting',
            startTime: '2024-01-15T10:00:00Z',
            endTime: '2024-01-15T12:00:00Z',
            inputMaterials: [{ material: 'e-waste', quantity: 50, quality: 80 }],
            outputMaterials: [
              { material: 'precious-metals', quantity: 5, quality: 95, destination: 'refinery' },
              { material: 'base-metals', quantity: 40, quality: 85, destination: 'smelter' }
            ],
            energyConsumption: 15.5,
            waterUsage: 25.0,
            efficiency: 92
          }
        ],
        overallQualityScore: 88,
        environmentalImpact: {
          carbonFootprint: {
            totalCo2Equivalent: 25.5,
            co2Reduction: 180.0,
            carbonCreditsGenerated: 6,
            carbonCreditStandard: 'VCS',
            emissionSources: [
              { source: 'transportation', emission: 5.5, unit: 'kg-co2' },
              { source: 'processing', emission: 20.0, unit: 'kg-co2' }
            ]
          },
          resourceConservation: {
            energySaved: 450.0,
            waterSaved: 1200.0,
            rawMaterialsSaved: [
              { material: 'gold', quantity: 0.05, unit: 'kg' },
              { material: 'silver', quantity: 0.15, unit: 'kg' }
            ],
            landfillDiverted: 50.0
          }
        }
      };

      const metadata = createEnhancedCertificateMetadata(inputData);

      expect(metadata).to.have.property('schemaVersion', '2.0.0');
      expect(metadata).to.have.property('metadataType', 'waste-processing-certificate');
      expect(metadata).to.have.property('batchId', 'BATCH-COMPREHENSIVE');
      expect(metadata).to.have.property('wasteClassification');
      expect(metadata.wasteClassification).to.have.property('primaryType', 'electronic');
      expect(metadata.wasteClassification.hazardousComponents).to.include('lead');
      expect(metadata).to.have.property('processingWorkflow');
      expect(metadata.processingWorkflow).to.have.length(1);
      expect(metadata).to.have.property('environmentalImpact');
      expect(metadata.environmentalImpact.carbonFootprint).to.have.property('carbonCreditsGenerated', 6);
    });

    it('should handle partial data with sensible defaults', function() {
      const minimalData = {
        batchId: 'BATCH-MINIMAL',
        wasteClassification: { primaryType: 'plastic' },
        quantity: { weight: 25 }
      };

      const metadata = createEnhancedCertificateMetadata(minimalData);

      expect(metadata.batchId).to.equal('BATCH-MINIMAL');
      expect(metadata.certificateStatus).to.equal('active');
      expect(metadata.revisionNumber).to.equal(1);
      expect(metadata.wasteOrigin.sourceType).to.equal('municipal');
      expect(metadata.processingWorkflow).to.be.an('array').that.is.empty;
      expect(metadata.environmentalImpact.carbonFootprint.totalCo2Equivalent).to.equal(0);
    });

    it('should generate proper NFT metadata fields', function() {
      const data = {
        batchId: 'BATCH-NFT',
        tokenId: 'TOKEN-NFT-789',
        wasteClassification: { primaryType: 'textile' },
        quantity: { weight: 15 },
        name: 'Custom Certificate Name',
        description: 'Custom certificate description'
      };

      const metadata = createEnhancedCertificateMetadata(data);

      expect(metadata.name).to.equal('Custom Certificate Name');
      expect(metadata.description).to.equal('Custom certificate description');
      expect(metadata.external_url).to.equal('');
      expect(metadata.image).to.equal('');
    });
  });

  describe('Metadata Templates Generation', function() {
    it('should generate plastic waste template', function() {
      const template = generateMetadataTemplate('plastic', {
        batchId: 'PLASTIC-TEMPLATE-001'
      });

      expect(template.wasteClassification.primaryType).to.equal('plastic');
      expect(template.batchId).to.equal('PLASTIC-TEMPLATE-001');
      expect(template.processingWorkflow).to.have.length.greaterThan(0);
      
      const stepTypes = template.processingWorkflow.map(step => step.stepType);
      expect(stepTypes).to.include('sorting');
      expect(stepTypes).to.include('cleaning');
      expect(stepTypes).to.include('shredding');
    });

    it('should generate electronic waste template', function() {
      const template = generateMetadataTemplate('electronic');

      expect(template.wasteClassification.primaryType).to.equal('electronic');
      expect(template.wasteClassification.hazardousComponents).to.include('lead');
      expect(template.wasteClassification.hazardousComponents).to.include('mercury');
      expect(template.processingWorkflow).to.have.length.greaterThan(0);
      
      const stepNames = template.processingWorkflow.map(step => step.stepName);
      expect(stepNames.some(name => name.includes('Disassembly'))).to.be.true;
    });

    it('should generate organic waste template', function() {
      const template = generateMetadataTemplate('organic');

      expect(template.wasteClassification.primaryType).to.equal('organic');
      expect(template.processingWorkflow).to.have.length.greaterThan(0);
      
      const stepTypes = template.processingWorkflow.map(step => step.stepType);
      expect(stepTypes).to.include('biological-treatment');
    });

    it('should generate mixed waste template with defaults', function() {
      const template = generateMetadataTemplate('mixed');

      expect(template.wasteClassification.primaryType).to.equal('mixed');
      expect(template.schemaVersion).to.equal('2.0.0');
      expect(template.certificateStatus).to.equal('active');
    });
  });

  describe('Backward Compatibility', function() {
    it('should maintain legacy createCertificateMetadata function', function() {
      const legacyData = {
        tokenId: 'LEGACY-001',
        wasteType: 'plastic',
        quantity: 100,
        batchId: 'LEGACY-BATCH',
        carbonCredits: 5,
        verifier: 'Legacy Verifier'
      };

      const metadata = createCertificateMetadata(legacyData);

      expect(metadata.tokenId).to.equal('LEGACY-001');
      expect(metadata.wasteType).to.equal('plastic');
      expect(metadata.quantity).to.equal(100);
      expect(metadata.carbonCredits).to.equal(5);
      expect(metadata.verifier).to.equal('Legacy Verifier');
      expect(metadata.name).to.include('LEGACY-001');
    });

    it('should handle legacy data with missing fields', function() {
      const legacyData = {
        tokenId: 'LEGACY-002'
      };

      const metadata = createCertificateMetadata(legacyData);

      expect(metadata.tokenId).to.equal('LEGACY-002');
      expect(metadata.certificateType).to.equal('recycling');
      expect(metadata.quantity).to.equal(0);
      expect(metadata.isVerified).to.be.false;
      expect(metadata.images).to.be.an('array').that.is.empty;
    });
  });

  describe('Complex Metadata Scenarios', function() {
    it('should handle multi-step processing workflow', function() {
      const complexWorkflow = [
        {
          stepId: 'collection',
          stepName: 'Waste Collection',
          stepType: 'sorting',
          startTime: '2024-01-15T08:00:00Z',
          endTime: '2024-01-15T09:00:00Z',
          inputMaterials: [{ material: 'mixed-waste', quantity: 1000, quality: 60 }],
          outputMaterials: [{ material: 'sorted-waste', quantity: 950, quality: 75 }],
          energyConsumption: 25.0,
          waterUsage: 50.0,
          efficiency: 95
        },
        {
          stepId: 'cleaning',
          stepName: 'Contamination Removal',
          stepType: 'cleaning',
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
          inputMaterials: [{ material: 'sorted-waste', quantity: 950, quality: 75 }],
          outputMaterials: [{ material: 'clean-waste', quantity: 900, quality: 90 }],
          energyConsumption: 45.0,
          waterUsage: 200.0,
          efficiency: 88
        },
        {
          stepId: 'processing',
          stepName: 'Material Processing',
          stepType: 'chemical-treatment',
          startTime: '2024-01-15T11:00:00Z',
          endTime: '2024-01-15T15:00:00Z',
          inputMaterials: [{ material: 'clean-waste', quantity: 900, quality: 90 }],
          outputMaterials: [{ material: 'recycled-material', quantity: 850, quality: 95 }],
          energyConsumption: 120.0,
          waterUsage: 300.0,
          efficiency: 92
        }
      ];

      const data = {
        batchId: 'COMPLEX-WORKFLOW-001',
        wasteClassification: { primaryType: 'mixed' },
        quantity: { weight: 1000 },
        processingWorkflow: complexWorkflow,
        overallQualityScore: 92
      };

      const metadata = createEnhancedCertificateMetadata(data);

      expect(metadata.processingWorkflow).to.have.length(3);
      expect(metadata.processingWorkflow[0].stepId).to.equal('collection');
      expect(metadata.processingWorkflow[2].stepType).to.equal('chemical-treatment');
      
      const validation = validateEnhancedMetadata(metadata);
      expect(validation.isValid).to.be.true;
    });

    it('should handle comprehensive environmental impact data', function() {
      const environmentalData = {
        carbonFootprint: {
          totalCo2Equivalent: 125.5,
          co2Reduction: 450.0,
          carbonCreditsGenerated: 15,
          carbonCreditStandard: 'Gold-Standard',
          emissionSources: [
            { source: 'collection', emission: 25.5, unit: 'kg-co2' },
            { source: 'transportation', emission: 35.0, unit: 'kg-co2' },
            { source: 'processing', emission: 65.0, unit: 'kg-co2' }
          ]
        },
        resourceConservation: {
          energySaved: 1250.0,
          waterSaved: 3500.0,
          rawMaterialsSaved: [
            { material: 'petroleum', quantity: 150.0, unit: 'liters' },
            { material: 'natural-gas', quantity: 75.0, unit: 'cubic-meters' }
          ],
          landfillDiverted: 800.0
        },
        circularEconomyMetrics: {
          recyclingEfficiency: 85.5,
          materialRecoveryRate: 92.0,
          downcyclingFactor: 0.8,
          lifecycleExtension: 5.2
        },
        biodiversityImpact: {
          habitatPreserved: 1500.0,
          speciesProtected: ['urban-birds', 'soil-microorganisms'],
          ecosystemServices: [
            { service: 'carbon-sequestration', value: 25.0, unit: 'kg-co2' },
            { service: 'water-filtration', value: 500.0, unit: 'liters' }
          ]
        },
        socialImpact: {
          jobsCreated: 3,
          communityBenefit: 'Reduced air pollution in local area',
          healthImprovements: ['reduced-respiratory-issues', 'cleaner-water-supply'],
          educationalOutreach: 150
        }
      };

      const data = {
        batchId: 'ENV-IMPACT-001',
        wasteClassification: { primaryType: 'mixed' },
        quantity: { weight: 800 },
        environmentalImpact: environmentalData,
        overallQualityScore: 88
      };

      const metadata = createEnhancedCertificateMetadata(data);

      expect(metadata.environmentalImpact.carbonFootprint.carbonCreditsGenerated).to.equal(15);
      expect(metadata.environmentalImpact.resourceConservation.energySaved).to.equal(1250.0);
      expect(metadata.environmentalImpact.biodiversityImpact.speciesProtected).to.include('urban-birds');
      expect(metadata.environmentalImpact.socialImpact.jobsCreated).to.equal(3);
      
      const validation = validateEnhancedMetadata(metadata);
      expect(validation.isValid).to.be.true;
    });

    it('should handle comprehensive verification data', function() {
      const verificationData = {
        primaryVerifier: {
          verifierId: 'VERIFIER-001',
          verifierName: 'Delhi Environmental Authority',
          verifierType: 'government',
          accreditation: ['ISO-17025', 'NABL-Accredited'],
          verificationDate: '2024-01-16T10:00:00Z',
          verificationMethod: 'on-site-inspection',
          verificationScore: 95
        },
        secondaryVerifications: [
          {
            verifierId: 'THIRD-PARTY-001',
            verificationDate: '2024-01-17T14:00:00Z',
            verificationAspect: 'carbon-credit-calculation',
            result: 'verified'
          }
        ],
        complianceChecks: [
          {
            regulation: 'Plastic Waste Management Rules 2016',
            standard: 'IS 15400:2018',
            complianceStatus: 'compliant',
            checkDate: '2024-01-16T12:00:00Z',
            notes: 'All requirements met'
          }
        ],
        auditTrail: [
          {
            timestamp: '2024-01-15T08:00:00Z',
            action: 'batch-created',
            actor: 'system',
            details: 'Waste batch registered in system',
            hash: 'abc123def456'
          }
        ],
        cryptographicProofs: {
          merkleRoot: 'merkle-root-hash-123',
          proofOfProcessing: 'processing-proof-456',
          timestampProof: 'timestamp-proof-789',
          integrityHash: 'integrity-hash-abc'
        }
      };

      const data = {
        batchId: 'VERIFICATION-001',
        wasteClassification: { primaryType: 'plastic' },
        quantity: { weight: 200 },
        verification: verificationData,
        overallQualityScore: 95
      };

      const metadata = createEnhancedCertificateMetadata(data);

      expect(metadata.verification.primaryVerifier.verifierName).to.equal('Delhi Environmental Authority');
      expect(metadata.verification.secondaryVerifications).to.have.length(1);
      expect(metadata.verification.complianceChecks[0].complianceStatus).to.equal('compliant');
      expect(metadata.verification.cryptographicProofs.merkleRoot).to.equal('merkle-root-hash-123');
      
      const validation = validateEnhancedMetadata(metadata);
      expect(validation.isValid).to.be.true;
    });
  });
});