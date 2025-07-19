const { expect } = require('chai');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { createEnhancedCertificateMetadata, validateEnhancedMetadata } = require('../services/metadataSchema');

describe('IPFS Metadata Storage Integration Tests', function() {
  this.timeout(10000);

  describe('Metadata Schema Validation', function() {
    it('should create valid enhanced metadata', function() {
      const testData = {
        batchId: 'INTEGRATION-TEST-001',
        tokenId: 'TOKEN-INT-001',
        wasteClassification: {
          primaryType: 'plastic',
          materialComposition: [
            { material: 'PET', percentage: 70, purity: 95 },
            { material: 'HDPE', percentage: 30, purity: 90 }
          ],
          contaminationLevel: 5
        },
        quantity: { weight: 100, volume: 0.5, itemCount: 50 },
        processingFacility: {
          facilityId: 'FAC-INT-001',
          facilityName: 'Integration Test Facility',
          facilityType: 'recycling'
        },
        overallQualityScore: 85,
        environmentalImpact: {
          carbonFootprint: {
            co2Reduction: 150,
            carbonCreditsGenerated: 5
          }
        }
      };

      const metadata = createEnhancedCertificateMetadata(testData);
      const validation = validateEnhancedMetadata(metadata);

      expect(validation.isValid).to.be.true;
      expect(validation.errors).to.have.length(0);
      expect(metadata.schemaVersion).to.equal('2.0.0');
      expect(metadata.batchId).to.equal('INTEGRATION-TEST-001');
      expect(metadata.wasteClassification.primaryType).to.equal('plastic');
    });

    it('should validate comprehensive metadata structure', function() {
      const comprehensiveData = {
        batchId: 'COMPREHENSIVE-001',
        tokenId: 'TOKEN-COMP-001',
        certificateType: 'recycling',
        wasteClassification: {
          primaryType: 'electronic',
          subTypes: ['smartphones', 'tablets'],
          materialComposition: [
            { material: 'gold', percentage: 0.1, purity: 99.9 },
            { material: 'silver', percentage: 0.3, purity: 95.0 },
            { material: 'copper', percentage: 15.0, purity: 90.0 }
          ],
          contaminationLevel: 2,
          hazardousComponents: ['lead', 'mercury']
        },
        quantity: { weight: 50, volume: 0.2, itemCount: 25 },
        wasteOrigin: {
          sourceType: 'commercial',
          sourceLocation: {
            address: '123 Tech Street, Delhi',
            coordinates: { lat: 28.6139, lng: 77.2090 },
            region: 'Delhi NCR',
            country: 'India'
          },
          sourceId: 'SRC-001',
          collectorId: 'COL-001'
        },
        processingFacility: {
          facilityId: 'FAC-COMP-001',
          facilityName: 'Advanced E-Waste Processing Center',
          facilityType: 'recycling',
          location: {
            address: '456 Industrial Area, Delhi',
            coordinates: { lat: 28.5355, lng: 77.3910 }
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
            processingParameters: {
              temperature: 25,
              pressure: 1,
              duration: 120,
              chemicals: []
            },
            energyConsumption: 15.5,
            waterUsage: 25.0,
            emissions: {
              co2: 2.5,
              methane: 0.1,
              particulates: 0.05
            },
            efficiency: 92,
            qualityMetrics: {
              purity: 95,
              contamination: 2,
              recovery_rate: 90
            }
          }
        ],
        overallQualityScore: 88,
        totalProcessingTime: 2.5,
        processingCost: {
          totalCost: 500,
          currency: 'USD',
          costBreakdown: {
            labor: 200,
            energy: 100,
            materials: 150,
            equipment: 50
          }
        },
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
          },
          circularEconomyMetrics: {
            recyclingEfficiency: 85.5,
            materialRecoveryRate: 92.0,
            downcyclingFactor: 0.8,
            lifecycleExtension: 5.2
          }
        },
        verification: {
          primaryVerifier: {
            verifierId: 'VERIFIER-001',
            verifierName: 'Delhi Environmental Authority',
            verifierType: 'government',
            accreditation: ['ISO-17025', 'NABL-Accredited'],
            verificationDate: '2024-01-16T10:00:00Z',
            verificationMethod: 'on-site-inspection',
            verificationScore: 95
          },
          complianceChecks: [
            {
              regulation: 'E-Waste Management Rules 2016',
              standard: 'IS 15400:2018',
              complianceStatus: 'compliant',
              checkDate: '2024-01-16T12:00:00Z',
              notes: 'All requirements met'
            }
          ]
        },
        digitalTwin: {
          digitalTwinId: 'DT-COMP-001',
          twinType: 'batch-twin',
          twinCreationDate: '2024-01-15T08:00:00Z',
          twinLastUpdated: '2024-01-16T16:00:00Z',
          twinAccuracy: 95
        }
      };

      const metadata = createEnhancedCertificateMetadata(comprehensiveData);
      const validation = validateEnhancedMetadata(metadata);

      expect(validation.isValid).to.be.true;
      expect(validation.errors).to.have.length(0);
      expect(validation.score).to.be.above(90);
      
      // Verify all major sections are present
      expect(metadata).to.have.property('wasteClassification');
      expect(metadata).to.have.property('processingFacility');
      expect(metadata).to.have.property('processingWorkflow');
      expect(metadata).to.have.property('environmentalImpact');
      expect(metadata).to.have.property('verification');
      expect(metadata).to.have.property('digitalTwin');
      
      // Verify nested data integrity
      expect(metadata.wasteClassification.hazardousComponents).to.include('lead');
      expect(metadata.processingWorkflow).to.have.length(1);
      expect(metadata.environmentalImpact.carbonFootprint.carbonCreditsGenerated).to.equal(6);
      expect(metadata.verification.primaryVerifier.verifierName).to.equal('Delhi Environmental Authority');
    });

    it('should handle validation errors appropriately', function() {
      const invalidData = {
        // Missing required batchId
        tokenId: 'TOKEN-INVALID-001',
        wasteClassification: { primaryType: 'invalid-type' }, // Invalid enum
        quantity: { weight: -10 }, // Invalid negative weight
        overallQualityScore: 150 // Invalid score > 100
      };

      const metadata = createEnhancedCertificateMetadata(invalidData);
      const validation = validateEnhancedMetadata(metadata);

      expect(validation.isValid).to.be.false;
      expect(validation.errors.length).to.be.greaterThan(0);
      expect(validation.errors.some(error => error.includes('batchId'))).to.be.true;
      expect(validation.errors.some(error => error.includes('overallQualityScore'))).to.be.true;
    });
  });

  describe('File System Operations', function() {
    let testBackupDir;

    beforeEach(async function() {
      testBackupDir = path.join(__dirname, '../test-backups');
      if (!fsSync.existsSync(testBackupDir)) {
        await fs.mkdir(testBackupDir, { recursive: true });
      }
    });

    afterEach(async function() {
      // Clean up test files
      try {
        if (fsSync.existsSync(testBackupDir)) {
          const files = await fs.readdir(testBackupDir);
          for (const file of files) {
            await fs.unlink(path.join(testBackupDir, file));
          }
          await fs.rmdir(testBackupDir);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should create and read backup files', async function() {
      const testMetadata = createEnhancedCertificateMetadata({
        batchId: 'BACKUP-TEST-001',
        wasteClassification: { primaryType: 'paper' },
        quantity: { weight: 25 },
        overallQualityScore: 75
      });

      const testCid = 'QmTestBackupCID123';
      const backupData = {
        cid: testCid,
        metadata: testMetadata,
        backupTimestamp: new Date().toISOString(),
        backupVersion: '1.0'
      };

      // Create backup file
      const backupFileName = `${testCid}-test.json`;
      const backupPath = path.join(testBackupDir, backupFileName);
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

      // Verify file was created
      expect(fsSync.existsSync(backupPath)).to.be.true;

      // Read and verify content
      const readData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      expect(readData.cid).to.equal(testCid);
      expect(readData.metadata.batchId).to.equal('BACKUP-TEST-001');
      expect(readData.metadata.wasteClassification.primaryType).to.equal('paper');
    });

    it('should create and update backup index', async function() {
      const indexPath = path.join(testBackupDir, 'backup-index.json');
      const testCid1 = 'QmTestIndex1';
      const testCid2 = 'QmTestIndex2';

      // Create initial index
      const initialIndex = {
        [testCid1]: {
          backupFileName: `${testCid1}-backup.json`,
          timestamp: new Date().toISOString()
        }
      };
      await fs.writeFile(indexPath, JSON.stringify(initialIndex, null, 2));

      // Read and update index
      const existingIndex = JSON.parse(await fs.readFile(indexPath, 'utf8'));
      existingIndex[testCid2] = {
        backupFileName: `${testCid2}-backup.json`,
        timestamp: new Date().toISOString()
      };
      await fs.writeFile(indexPath, JSON.stringify(existingIndex, null, 2));

      // Verify updated index
      const finalIndex = JSON.parse(await fs.readFile(indexPath, 'utf8'));
      expect(finalIndex).to.have.property(testCid1);
      expect(finalIndex).to.have.property(testCid2);
      expect(finalIndex[testCid1].backupFileName).to.equal(`${testCid1}-backup.json`);
      expect(finalIndex[testCid2].backupFileName).to.equal(`${testCid2}-backup.json`);
    });
  });

  describe('Performance Tests', function() {
    it('should handle large metadata objects efficiently', function() {
      const startTime = Date.now();

      // Create large processing workflow
      const largeWorkflow = [];
      for (let i = 0; i < 100; i++) {
        largeWorkflow.push({
          stepId: `step-${i}`,
          stepName: `Processing Step ${i}`,
          stepType: 'sorting',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          inputMaterials: [{ material: 'waste', quantity: 10, quality: 80 }],
          outputMaterials: [{ material: 'processed', quantity: 9, quality: 90 }],
          energyConsumption: 5.5,
          waterUsage: 10.2,
          efficiency: 85 + (i % 15)
        });
      }

      const largeMetadata = createEnhancedCertificateMetadata({
        batchId: 'PERFORMANCE-TEST-001',
        wasteClassification: { primaryType: 'mixed' },
        quantity: { weight: 1000 },
        processingWorkflow: largeWorkflow,
        overallQualityScore: 88
      });

      const validation = validateEnhancedMetadata(largeMetadata);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(validation.isValid).to.be.true;
      expect(largeMetadata.processingWorkflow).to.have.length(100);
      expect(duration).to.be.below(1000); // Should complete within 1 second
    });

    it('should handle concurrent metadata creation', function() {
      const concurrentOperations = 10;
      const promises = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const promise = new Promise((resolve) => {
          const metadata = createEnhancedCertificateMetadata({
            batchId: `CONCURRENT-${i}`,
            wasteClassification: { primaryType: 'plastic' },
            quantity: { weight: 10 + i },
            overallQualityScore: 80 + i
          });
          
          const validation = validateEnhancedMetadata(metadata);
          resolve({ metadata, validation });
        });
        promises.push(promise);
      }

      return Promise.all(promises).then(results => {
        expect(results).to.have.length(concurrentOperations);
        results.forEach((result, index) => {
          expect(result.validation.isValid).to.be.true;
          expect(result.metadata.batchId).to.equal(`CONCURRENT-${index}`);
        });
      });
    });
  });

  describe('Data Integrity Tests', function() {
    it('should maintain data consistency across transformations', function() {
      const originalData = {
        batchId: 'INTEGRITY-TEST-001',
        tokenId: 'TOKEN-INT-001',
        wasteClassification: {
          primaryType: 'electronic',
          materialComposition: [
            { material: 'gold', percentage: 0.1, purity: 99.9 },
            { material: 'silver', percentage: 0.3, purity: 95.0 }
          ]
        },
        quantity: { weight: 50, volume: 0.2, itemCount: 25 },
        overallQualityScore: 92,
        environmentalImpact: {
          carbonFootprint: {
            co2Reduction: 200,
            carbonCreditsGenerated: 8
          }
        }
      };

      const metadata = createEnhancedCertificateMetadata(originalData);

      // Verify original data is preserved
      expect(metadata.batchId).to.equal(originalData.batchId);
      expect(metadata.tokenId).to.equal(originalData.tokenId);
      expect(metadata.wasteClassification.primaryType).to.equal(originalData.wasteClassification.primaryType);
      expect(metadata.quantity.weight).to.equal(originalData.quantity.weight);
      expect(metadata.overallQualityScore).to.equal(originalData.overallQualityScore);
      expect(metadata.environmentalImpact.carbonFootprint.co2Reduction).to.equal(200);

      // Verify additional fields are added with defaults
      expect(metadata.schemaVersion).to.equal('2.0.0');
      expect(metadata.certificateStatus).to.equal('active');
      expect(metadata.revisionNumber).to.equal(1);
    });

    it('should handle nested object updates correctly', function() {
      const baseData = {
        batchId: 'NESTED-TEST-001',
        wasteClassification: { primaryType: 'plastic' },
        quantity: { weight: 100 },
        overallQualityScore: 85
      };

      const metadata1 = createEnhancedCertificateMetadata(baseData);
      
      // Create second metadata with additional nested data
      const extendedData = {
        ...baseData,
        wasteClassification: {
          ...baseData.wasteClassification,
          subTypes: ['PET', 'HDPE'],
          contaminationLevel: 3
        },
        environmentalImpact: {
          carbonFootprint: {
            co2Reduction: 150,
            carbonCreditsGenerated: 5
          }
        }
      };

      const metadata2 = createEnhancedCertificateMetadata(extendedData);

      // Verify base data is preserved
      expect(metadata2.batchId).to.equal(baseData.batchId);
      expect(metadata2.wasteClassification.primaryType).to.equal('plastic');
      
      // Verify extended data is added
      expect(metadata2.wasteClassification.subTypes).to.include('PET');
      expect(metadata2.wasteClassification.contaminationLevel).to.equal(3);
      expect(metadata2.environmentalImpact.carbonFootprint.co2Reduction).to.equal(150);
    });
  });
});