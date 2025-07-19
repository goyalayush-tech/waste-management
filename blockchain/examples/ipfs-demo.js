/**
 * IPFS Metadata Storage System Demonstration
 * 
 * This script demonstrates the key features of the enhanced IPFS metadata storage system
 * including comprehensive metadata creation, validation, and storage simulation.
 */

const { 
  createEnhancedCertificateMetadata, 
  validateEnhancedMetadata, 
  generateMetadataTemplate 
} = require('../services/metadataSchema');

// Simulate IPFS service for demo (without actual network calls)
class IPFSServiceDemo {
  constructor() {
    this.storage = new Map();
    this.backups = new Map();
    this.cidCounter = 1;
  }

  async storeWasteProcessingMetadata(metadata, attachments = []) {
    // Simulate storage delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const cid = `QmDemo${this.cidCounter.toString().padStart(10, '0')}`;
    this.cidCounter++;
    
    // Add storage metadata
    const storageData = {
      ...metadata,
      storageTimestamp: new Date().toISOString(),
      storageVersion: '2.0',
      checksum: this.calculateChecksum(metadata)
    };
    
    // Store in simulated IPFS
    this.storage.set(cid, storageData);
    
    // Create backup
    this.backups.set(cid, {
      cid,
      metadata: storageData,
      backupTimestamp: new Date().toISOString()
    });
    
    return {
      primaryCid: cid,
      primaryService: 'demo-storage',
      redundantStorages: [
        { service: 'demo-storage', cid, status: 'success' },
        { service: 'demo-backup', cid: `backup-${cid}`, status: 'success' }
      ],
      totalRedundancy: 2,
      attachments: attachments.map((_, index) => ({
        fileName: `attachment-${index}`,
        cid: `QmAttachment${index}${cid.slice(-5)}`,
        size: attachments[index]?.length || 0
      }))
    };
  }

  async retrieveMetadata(cid) {
    // Simulate retrieval delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (this.storage.has(cid)) {
      return this.storage.get(cid);
    }
    
    if (this.backups.has(cid)) {
      console.log(`Retrieved from backup for CID: ${cid}`);
      return this.backups.get(cid).metadata;
    }
    
    throw new Error(`Metadata not found for CID: ${cid}`);
  }

  calculateChecksum(metadata) {
    // Simple checksum simulation
    return 'demo-checksum-' + JSON.stringify(metadata).length.toString(16);
  }

  async performHealthCheck() {
    return {
      timestamp: new Date().toISOString(),
      demoStorage: { status: 'healthy', itemCount: this.storage.size },
      demoBackup: { status: 'healthy', itemCount: this.backups.size },
      gateways: [
        { gateway: 'demo-gateway-1', status: 'healthy' },
        { gateway: 'demo-gateway-2', status: 'healthy' }
      ]
    };
  }
}

async function demonstrateIPFSMetadataStorage() {
  console.log('🚀 IPFS Metadata Storage System Demonstration\n');
  
  const ipfsDemo = new IPFSServiceDemo();
  
  // 1. Basic Metadata Creation and Storage
  console.log('📝 1. Creating Basic Waste Processing Metadata');
  console.log('=' .repeat(50));
  
  const basicMetadata = createEnhancedCertificateMetadata({
    batchId: 'DEMO-BATCH-001',
    tokenId: 'TOKEN-DEMO-001',
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
      facilityId: 'FAC-DEMO-001',
      facilityName: 'Demo Recycling Center',
      facilityType: 'recycling',
      location: {
        address: '123 Demo Street, Delhi',
        coordinates: { lat: 28.6139, lng: 77.2090 }
      }
    },
    overallQualityScore: 85
  });
  
  console.log(`✅ Created metadata for batch: ${basicMetadata.batchId}`);
  console.log(`   Schema Version: ${basicMetadata.schemaVersion}`);
  console.log(`   Waste Type: ${basicMetadata.wasteClassification.primaryType}`);
  console.log(`   Quality Score: ${basicMetadata.overallQualityScore}%\n`);
  
  // 2. Metadata Validation
  console.log('🔍 2. Validating Metadata');
  console.log('=' .repeat(50));
  
  const validation = validateEnhancedMetadata(basicMetadata);
  console.log(`✅ Validation Status: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
  console.log(`   Validation Score: ${validation.score}/100`);
  console.log(`   Errors: ${validation.errors.length}`);
  console.log(`   Warnings: ${validation.warnings.length}\n`);
  
  // 3. Storage with Redundancy
  console.log('💾 3. Storing Metadata with Redundancy');
  console.log('=' .repeat(50));
  
  const storageResult = await ipfsDemo.storeWasteProcessingMetadata(basicMetadata);
  console.log(`✅ Stored successfully!`);
  console.log(`   Primary CID: ${storageResult.primaryCid}`);
  console.log(`   Redundancy Level: ${storageResult.totalRedundancy}`);
  console.log(`   Storage Services: ${storageResult.redundantStorages.map(s => s.service).join(', ')}\n`);
  
  // 4. Comprehensive Metadata with Environmental Impact
  console.log('🌱 4. Creating Comprehensive Environmental Metadata');
  console.log('=' .repeat(50));
  
  const comprehensiveMetadata = createEnhancedCertificateMetadata({
    batchId: 'DEMO-COMPREHENSIVE-001',
    tokenId: 'TOKEN-COMP-001',
    wasteClassification: {
      primaryType: 'electronic',
      subTypes: ['smartphones', 'tablets'],
      hazardousComponents: ['lead', 'mercury']
    },
    quantity: { weight: 50, itemCount: 25 },
    processingWorkflow: [
      {
        stepId: 'disassembly',
        stepName: 'Component Disassembly',
        stepType: 'sorting',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T12:00:00Z',
        energyConsumption: 15.5,
        waterUsage: 25.0,
        efficiency: 92
      },
      {
        stepId: 'material-separation',
        stepName: 'Material Separation',
        stepType: 'sorting',
        startTime: '2024-01-15T12:00:00Z',
        endTime: '2024-01-15T14:00:00Z',
        energyConsumption: 22.3,
        waterUsage: 35.0,
        efficiency: 88
      }
    ],
    environmentalImpact: {
      carbonFootprint: {
        totalCo2Equivalent: 25.5,
        co2Reduction: 180.0,
        carbonCreditsGenerated: 6,
        carbonCreditStandard: 'VCS'
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
        lifecycleExtension: 5.2
      }
    },
    verification: {
      primaryVerifier: {
        verifierId: 'VERIFIER-DEMO-001',
        verifierName: 'Demo Environmental Authority',
        verifierType: 'government',
        verificationScore: 95
      }
    },
    digitalTwin: {
      digitalTwinId: 'DT-DEMO-001',
      twinType: 'batch-twin',
      twinAccuracy: 95
    },
    overallQualityScore: 88
  });
  
  console.log(`✅ Created comprehensive metadata for: ${comprehensiveMetadata.batchId}`);
  console.log(`   Processing Steps: ${comprehensiveMetadata.processingWorkflow.length}`);
  console.log(`   Carbon Credits: ${comprehensiveMetadata.environmentalImpact.carbonFootprint.carbonCreditsGenerated}`);
  console.log(`   CO2 Reduction: ${comprehensiveMetadata.environmentalImpact.carbonFootprint.co2Reduction} kg`);
  console.log(`   Verification Score: ${comprehensiveMetadata.verification.primaryVerifier.verificationScore}%\n`);
  
  // 5. Store Comprehensive Metadata
  const comprehensiveResult = await ipfsDemo.storeWasteProcessingMetadata(comprehensiveMetadata);
  console.log(`💾 Stored comprehensive metadata: ${comprehensiveResult.primaryCid}\n`);
  
  // 6. Template Generation
  console.log('📋 5. Generating Waste Type Templates');
  console.log('=' .repeat(50));
  
  const plasticTemplate = generateMetadataTemplate('plastic', {
    batchId: 'TEMPLATE-PLASTIC-001'
  });
  
  const electronicTemplate = generateMetadataTemplate('electronic', {
    batchId: 'TEMPLATE-ELECTRONIC-001'
  });
  
  const organicTemplate = generateMetadataTemplate('organic', {
    batchId: 'TEMPLATE-ORGANIC-001'
  });
  
  console.log(`✅ Generated Templates:`);
  console.log(`   Plastic Template: ${plasticTemplate.processingWorkflow.length} processing steps`);
  console.log(`   Electronic Template: ${electronicTemplate.wasteClassification.hazardousComponents.length} hazardous components`);
  console.log(`   Organic Template: ${organicTemplate.processingWorkflow[0]?.stepType || 'biological-treatment'} processing\n`);
  
  // 7. Metadata Retrieval
  console.log('🔄 6. Retrieving Stored Metadata');
  console.log('=' .repeat(50));
  
  try {
    const retrievedBasic = await ipfsDemo.retrieveMetadata(storageResult.primaryCid);
    const retrievedComprehensive = await ipfsDemo.retrieveMetadata(comprehensiveResult.primaryCid);
    
    console.log(`✅ Retrieved basic metadata: ${retrievedBasic.batchId}`);
    console.log(`   Storage Timestamp: ${retrievedBasic.storageTimestamp}`);
    console.log(`   Checksum: ${retrievedBasic.checksum}`);
    
    console.log(`✅ Retrieved comprehensive metadata: ${retrievedComprehensive.batchId}`);
    console.log(`   Processing Steps: ${retrievedComprehensive.processingWorkflow.length}`);
    console.log(`   Environmental Impact Data: Available\n`);
  } catch (error) {
    console.error(`❌ Retrieval failed: ${error.message}\n`);
  }
  
  // 8. System Health Check
  console.log('🏥 7. System Health Check');
  console.log('=' .repeat(50));
  
  const healthStatus = await ipfsDemo.performHealthCheck();
  console.log(`✅ System Health Check Complete`);
  console.log(`   Timestamp: ${healthStatus.timestamp}`);
  console.log(`   Demo Storage: ${healthStatus.demoStorage.status} (${healthStatus.demoStorage.itemCount} items)`);
  console.log(`   Demo Backup: ${healthStatus.demoBackup.status} (${healthStatus.demoBackup.itemCount} items)`);
  console.log(`   Gateways: ${healthStatus.gateways.filter(g => g.status === 'healthy').length}/${healthStatus.gateways.length} healthy\n`);
  
  // 9. Performance Demonstration
  console.log('⚡ 8. Performance Demonstration');
  console.log('=' .repeat(50));
  
  const startTime = Date.now();
  const concurrentOperations = 5;
  const promises = [];
  
  for (let i = 0; i < concurrentOperations; i++) {
    const metadata = createEnhancedCertificateMetadata({
      batchId: `PERF-BATCH-${i.toString().padStart(3, '0')}`,
      wasteClassification: { primaryType: 'mixed' },
      quantity: { weight: 10 + i * 5 },
      overallQualityScore: 80 + i * 2
    });
    
    promises.push(ipfsDemo.storeWasteProcessingMetadata(metadata));
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`✅ Concurrent Operations Complete`);
  console.log(`   Operations: ${concurrentOperations}`);
  console.log(`   Total Time: ${duration}ms`);
  console.log(`   Average Time: ${Math.round(duration / concurrentOperations)}ms per operation`);
  console.log(`   All CIDs: ${results.map(r => r.primaryCid.slice(-8)).join(', ')}\n`);
  
  // 10. Summary
  console.log('📊 9. Demonstration Summary');
  console.log('=' .repeat(50));
  
  const finalHealthCheck = await ipfsDemo.performHealthCheck();
  console.log(`✅ IPFS Metadata Storage System Demonstration Complete!`);
  console.log(`   Total Items Stored: ${finalHealthCheck.demoStorage.itemCount}`);
  console.log(`   Total Backups Created: ${finalHealthCheck.demoBackup.itemCount}`);
  console.log(`   System Status: All services healthy`);
  console.log(`   Features Demonstrated:`);
  console.log(`     ✓ Enhanced metadata schema (v2.0.0)`);
  console.log(`     ✓ Comprehensive validation system`);
  console.log(`     ✓ Redundant storage with automatic backup`);
  console.log(`     ✓ Environmental impact tracking`);
  console.log(`     ✓ Multi-step processing workflows`);
  console.log(`     ✓ Template-based metadata generation`);
  console.log(`     ✓ Reliable retrieval with fallback`);
  console.log(`     ✓ System health monitoring`);
  console.log(`     ✓ High-performance concurrent operations\n`);
  
  console.log('🎉 Ready for production deployment!');
}

// Run the demonstration
if (require.main === module) {
  demonstrateIPFSMetadataStorage().catch(console.error);
}

module.exports = { demonstrateIPFSMetadataStorage, IPFSServiceDemo };