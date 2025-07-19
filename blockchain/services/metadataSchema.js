/**
 * Enhanced metadata schema for comprehensive waste processing documentation
 * and environmental impact data storage on IPFS
 */
const enhancedCertificateMetadataSchema = {
  name: "Enhanced Waste Certificate Metadata Schema",
  version: "2.0.0",
  description: "Comprehensive schema for waste processing documentation and environmental impact tracking",
  
  // Certificate identification and lifecycle
  certificateFields: {
    tokenId: { type: "string", required: true, description: "Unique NFT token identifier" },
    certificateType: { type: "string", required: true, enum: ["recycling", "processing", "disposal", "recovery", "treatment"], description: "Type of waste processing certificate" },
    issuanceDate: { type: "date", required: true, description: "Certificate issuance timestamp" },
    expiryDate: { type: "date", required: false, description: "Optional certificate expiry date" },
    certificateStatus: { type: "string", required: true, enum: ["active", "expired", "revoked", "pending"], description: "Current certificate status" },
    revisionNumber: { type: "number", required: true, default: 1, description: "Certificate revision version" },
    parentCertificateId: { type: "string", required: false, description: "Reference to parent certificate if this is a revision" }
  },
  
  // Comprehensive waste information
  wasteFields: {
    batchId: { type: "string", required: true, description: "Unique batch identifier" },
    wasteOrigin: { type: "object", required: true, properties: {
      sourceType: { type: "string", enum: ["residential", "commercial", "industrial", "municipal", "hazardous"] },
      sourceLocation: { type: "object", properties: {
        address: "string",
        coordinates: { lat: "number", lng: "number" },
        region: "string",
        country: "string"
      }},
      sourceId: "string",
      collectorId: "string"
    }},
    wasteClassification: { type: "object", required: true, properties: {
      primaryType: { type: "string", enum: ["plastic", "metal", "glass", "paper", "organic", "electronic", "textile", "hazardous", "mixed"] },
      subTypes: { type: "array", items: "string" },
      materialComposition: { type: "array", items: {
        material: "string",
        percentage: "number",
        purity: "number"
      }},
      contaminationLevel: { type: "number", min: 0, max: 100 },
      hazardousComponents: { type: "array", items: "string" }
    }},
    quantity: { type: "object", required: true, properties: {
      weight: { type: "number", unit: "kg", min: 0 },
      volume: { type: "number", unit: "m3", min: 0 },
      itemCount: { type: "number", min: 0 }
    }},
    collectionDate: { type: "date", required: true, description: "Waste collection timestamp" },
    collectionMethod: { type: "string", enum: ["curbside", "drop-off", "pickup", "transfer-station"] }
  },
  
  // Detailed processing information
  processingFields: {
    processingFacility: { type: "object", required: true, properties: {
      facilityId: "string",
      facilityName: "string",
      facilityType: { type: "string", enum: ["recycling", "composting", "incineration", "landfill", "treatment"] },
      location: { type: "object", properties: {
        address: "string",
        coordinates: { lat: "number", lng: "number" }
      }},
      certifications: { type: "array", items: "string" },
      operatorId: "string"
    }},
    processingWorkflow: { type: "array", required: true, items: {
      stepId: "string",
      stepName: "string",
      stepType: { type: "string", enum: ["sorting", "cleaning", "shredding", "melting", "chemical-treatment", "biological-treatment"] },
      startTime: "date",
      endTime: "date",
      inputMaterials: { type: "array", items: {
        material: "string",
        quantity: "number",
        quality: "number"
      }},
      outputMaterials: { type: "array", items: {
        material: "string",
        quantity: "number",
        quality: "number",
        destination: "string"
      }},
      processingParameters: { type: "object", properties: {
        temperature: "number",
        pressure: "number",
        duration: "number",
        chemicals: { type: "array", items: "string" }
      }},
      energyConsumption: { type: "number", unit: "kWh" },
      waterUsage: { type: "number", unit: "liters" },
      emissions: { type: "object", properties: {
        co2: "number",
        methane: "number",
        particulates: "number"
      }},
      efficiency: { type: "number", min: 0, max: 100 },
      qualityMetrics: { type: "object", properties: {
        purity: "number",
        contamination: "number",
        recovery_rate: "number"
      }}
    }},
    processingDate: { type: "date", required: true, description: "Processing completion timestamp" },
    totalProcessingTime: { type: "number", unit: "hours", description: "Total processing duration" },
    overallQualityScore: { type: "number", required: true, min: 0, max: 100, description: "Overall processing quality score" },
    processingCost: { type: "object", properties: {
      totalCost: "number",
      currency: "string",
      costBreakdown: { type: "object", properties: {
        labor: "number",
        energy: "number",
        materials: "number",
        equipment: "number"
      }}
    }}
  },
  
  // Comprehensive environmental impact assessment
  environmentalImpactFields: {
    carbonFootprint: { type: "object", required: true, properties: {
      totalCo2Equivalent: { type: "number", unit: "kg", description: "Total CO2 equivalent emissions" },
      co2Reduction: { type: "number", unit: "kg", description: "CO2 reduction compared to disposal" },
      carbonCreditsGenerated: { type: "number", description: "Verified carbon credits generated" },
      carbonCreditStandard: { type: "string", enum: ["VCS", "CDM", "Gold-Standard", "CAR"] },
      emissionSources: { type: "array", items: {
        source: "string",
        emission: "number",
        unit: "string"
      }}
    }},
    resourceConservation: { type: "object", properties: {
      energySaved: { type: "number", unit: "kWh", description: "Energy saved through recycling" },
      waterSaved: { type: "number", unit: "liters", description: "Water saved through recycling" },
      rawMaterialsSaved: { type: "array", items: {
        material: "string",
        quantity: "number",
        unit: "string"
      }},
      landfillDiverted: { type: "number", unit: "kg", description: "Waste diverted from landfill" }
    }},
    circularEconomyMetrics: { type: "object", properties: {
      recyclingEfficiency: { type: "number", min: 0, max: 100, unit: "percentage" },
      materialRecoveryRate: { type: "number", min: 0, max: 100, unit: "percentage" },
      downcyclingFactor: { type: "number", min: 0, max: 1, description: "Quality retention factor" },
      lifecycleExtension: { type: "number", unit: "years", description: "Product lifecycle extension" }
    }},
    biodiversityImpact: { type: "object", properties: {
      habitatPreserved: { type: "number", unit: "m2" },
      speciesProtected: { type: "array", items: "string" },
      ecosystemServices: { type: "array", items: {
        service: "string",
        value: "number",
        unit: "string"
      }}
    }},
    socialImpact: { type: "object", properties: {
      jobsCreated: "number",
      communityBenefit: "string",
      healthImprovements: { type: "array", items: "string" },
      educationalOutreach: "number"
    }}
  },
  
  // Enhanced verification and compliance
  verificationFields: {
    primaryVerifier: { type: "object", required: true, properties: {
      verifierId: "string",
      verifierName: "string",
      verifierType: { type: "string", enum: ["government", "third-party", "industry-body", "blockchain-oracle"] },
      accreditation: { type: "array", items: "string" },
      verificationDate: "date",
      verificationMethod: { type: "string", enum: ["on-site-inspection", "document-review", "sensor-data", "blockchain-verification"] },
      verificationScore: { type: "number", min: 0, max: 100 }
    }},
    secondaryVerifications: { type: "array", items: {
      verifierId: "string",
      verificationDate: "date",
      verificationAspect: "string",
      result: "string"
    }},
    complianceChecks: { type: "array", items: {
      regulation: "string",
      standard: "string",
      complianceStatus: { type: "string", enum: ["compliant", "non-compliant", "pending"] },
      checkDate: "date",
      notes: "string"
    }},
    auditTrail: { type: "array", items: {
      timestamp: "date",
      action: "string",
      actor: "string",
      details: "string",
      hash: "string"
    }},
    cryptographicProofs: { type: "object", properties: {
      merkleRoot: "string",
      proofOfProcessing: "string",
      timestampProof: "string",
      integrityHash: "string"
    }}
  },
  
  // Digital twin and IoT integration
  digitalTwinFields: {
    digitalTwinId: { type: "string", required: true, description: "Unique digital twin identifier" },
    twinType: { type: "string", enum: ["batch-twin", "facility-twin", "process-twin", "ecosystem-twin"] },
    twinCreationDate: { type: "date", required: true },
    twinLastUpdated: { type: "date", required: true },
    twinAccuracy: { type: "number", min: 0, max: 100, description: "Digital twin accuracy percentage" },
    sensorData: { type: "array", items: {
      sensorId: "string",
      sensorType: "string",
      readings: { type: "array", items: {
        timestamp: "date",
        value: "number",
        unit: "string"
      }},
      calibrationDate: "date",
      accuracy: "number"
    }},
    simulationResults: { type: "array", items: {
      simulationType: "string",
      parameters: "object",
      results: "object",
      confidence: "number"
    }},
    predictiveModels: { type: "array", items: {
      modelType: "string",
      modelVersion: "string",
      predictions: "object",
      accuracy: "number"
    }}
  },
  
  // Enhanced media and documentation
  mediaFields: {
    processImages: { type: "array", items: {
      cid: "string",
      filename: "string",
      description: "string",
      timestamp: "date",
      processingStep: "string",
      imageType: { type: "string", enum: ["before", "during", "after", "quality-check"] }
    }},
    processVideos: { type: "array", items: {
      cid: "string",
      filename: "string",
      description: "string",
      duration: "number",
      timestamp: "date",
      processingStep: "string"
    }},
    technicalDocuments: { type: "array", items: {
      cid: "string",
      filename: "string",
      documentType: { type: "string", enum: ["analysis-report", "compliance-certificate", "processing-manual", "safety-datasheet"] },
      version: "string",
      timestamp: "date"
    }},
    sensorDataFiles: { type: "array", items: {
      cid: "string",
      filename: "string",
      sensorType: "string",
      dataFormat: "string",
      timestamp: "date"
    }},
    blockchainProofs: { type: "array", items: {
      cid: "string",
      proofType: "string",
      blockchainNetwork: "string",
      transactionHash: "string",
      timestamp: "date"
    }}
  },
  
  // Economic and financial data
  economicFields: {
    materialValue: { type: "object", properties: {
      totalValue: "number",
      currency: "string",
      valueBreakdown: { type: "array", items: {
        material: "string",
        quantity: "number",
        unitPrice: "number",
        totalValue: "number"
      }},
      marketPriceDate: "date"
    }},
    processingCosts: { type: "object", properties: {
      totalCost: "number",
      costPerKg: "number",
      currency: "string",
      costBreakdown: { type: "object", properties: {
        collection: "number",
        transportation: "number",
        processing: "number",
        disposal: "number",
        certification: "number"
      }}
    }},
    revenueSharing: { type: "object", properties: {
      totalRevenue: "number",
      stakeholderShares: { type: "array", items: {
        stakeholder: "string",
        sharePercentage: "number",
        amount: "number"
      }}
    }},
    carbonCreditValue: { type: "object", properties: {
      creditsGenerated: "number",
      pricePerCredit: "number",
      totalValue: "number",
      currency: "string",
      marketDate: "date"
    }}
  }
};

/**
 * Create enhanced certificate metadata object based on comprehensive schema
 * @param {Object} data - Certificate data
 * @returns {Object} - Formatted metadata object following enhanced schema
 */
function createEnhancedCertificateMetadata(data) {
  const timestamp = new Date().toISOString();
  
  return {
    // Schema information
    schemaVersion: "2.0.0",
    metadataType: "waste-processing-certificate",
    createdAt: timestamp,
    
    // Certificate identification and lifecycle
    tokenId: data.tokenId || "",
    certificateType: data.certificateType || "recycling",
    issuanceDate: data.issuanceDate || timestamp,
    expiryDate: data.expiryDate || null,
    certificateStatus: data.certificateStatus || "active",
    revisionNumber: data.revisionNumber || 1,
    parentCertificateId: data.parentCertificateId || null,
    
    // Comprehensive waste information
    batchId: data.batchId || "",
    wasteOrigin: {
      sourceType: data.wasteOrigin?.sourceType || "municipal",
      sourceLocation: {
        address: data.wasteOrigin?.sourceLocation?.address || "",
        coordinates: data.wasteOrigin?.sourceLocation?.coordinates || { lat: 0, lng: 0 },
        region: data.wasteOrigin?.sourceLocation?.region || "",
        country: data.wasteOrigin?.sourceLocation?.country || ""
      },
      sourceId: data.wasteOrigin?.sourceId || "",
      collectorId: data.wasteOrigin?.collectorId || ""
    },
    wasteClassification: {
      primaryType: data.wasteClassification?.primaryType || "mixed",
      subTypes: data.wasteClassification?.subTypes || [],
      materialComposition: data.wasteClassification?.materialComposition || [],
      contaminationLevel: data.wasteClassification?.contaminationLevel || 0,
      hazardousComponents: data.wasteClassification?.hazardousComponents || []
    },
    quantity: {
      weight: data.quantity?.weight || 0,
      volume: data.quantity?.volume || 0,
      itemCount: data.quantity?.itemCount || 0
    },
    collectionDate: data.collectionDate || timestamp,
    collectionMethod: data.collectionMethod || "pickup",
    
    // Detailed processing information
    processingFacility: {
      facilityId: data.processingFacility?.facilityId || "",
      facilityName: data.processingFacility?.facilityName || "",
      facilityType: data.processingFacility?.facilityType || "recycling",
      location: {
        address: data.processingFacility?.location?.address || "",
        coordinates: data.processingFacility?.location?.coordinates || { lat: 0, lng: 0 }
      },
      certifications: data.processingFacility?.certifications || [],
      operatorId: data.processingFacility?.operatorId || ""
    },
    processingWorkflow: data.processingWorkflow || [],
    processingDate: data.processingDate || timestamp,
    totalProcessingTime: data.totalProcessingTime || 0,
    overallQualityScore: data.overallQualityScore || 0,
    processingCost: data.processingCost || { totalCost: 0, currency: "USD" },
    
    // Comprehensive environmental impact assessment
    environmentalImpact: {
      carbonFootprint: {
        totalCo2Equivalent: data.environmentalImpact?.carbonFootprint?.totalCo2Equivalent || 0,
        co2Reduction: data.environmentalImpact?.carbonFootprint?.co2Reduction || 0,
        carbonCreditsGenerated: data.environmentalImpact?.carbonFootprint?.carbonCreditsGenerated || 0,
        carbonCreditStandard: data.environmentalImpact?.carbonFootprint?.carbonCreditStandard || "VCS",
        emissionSources: data.environmentalImpact?.carbonFootprint?.emissionSources || []
      },
      resourceConservation: {
        energySaved: data.environmentalImpact?.resourceConservation?.energySaved || 0,
        waterSaved: data.environmentalImpact?.resourceConservation?.waterSaved || 0,
        rawMaterialsSaved: data.environmentalImpact?.resourceConservation?.rawMaterialsSaved || [],
        landfillDiverted: data.environmentalImpact?.resourceConservation?.landfillDiverted || 0
      },
      circularEconomyMetrics: {
        recyclingEfficiency: data.environmentalImpact?.circularEconomyMetrics?.recyclingEfficiency || 0,
        materialRecoveryRate: data.environmentalImpact?.circularEconomyMetrics?.materialRecoveryRate || 0,
        downcyclingFactor: data.environmentalImpact?.circularEconomyMetrics?.downcyclingFactor || 1,
        lifecycleExtension: data.environmentalImpact?.circularEconomyMetrics?.lifecycleExtension || 0
      },
      biodiversityImpact: data.environmentalImpact?.biodiversityImpact || {},
      socialImpact: data.environmentalImpact?.socialImpact || {}
    },
    
    // Enhanced verification and compliance
    verification: {
      primaryVerifier: {
        verifierId: data.verification?.primaryVerifier?.verifierId || "",
        verifierName: data.verification?.primaryVerifier?.verifierName || "",
        verifierType: data.verification?.primaryVerifier?.verifierType || "third-party",
        accreditation: data.verification?.primaryVerifier?.accreditation || [],
        verificationDate: data.verification?.primaryVerifier?.verificationDate || timestamp,
        verificationMethod: data.verification?.primaryVerifier?.verificationMethod || "document-review",
        verificationScore: data.verification?.primaryVerifier?.verificationScore || 0
      },
      secondaryVerifications: data.verification?.secondaryVerifications || [],
      complianceChecks: data.verification?.complianceChecks || [],
      auditTrail: data.verification?.auditTrail || [],
      cryptographicProofs: data.verification?.cryptographicProofs || {}
    },
    
    // Digital twin and IoT integration
    digitalTwin: {
      digitalTwinId: data.digitalTwin?.digitalTwinId || "",
      twinType: data.digitalTwin?.twinType || "batch-twin",
      twinCreationDate: data.digitalTwin?.twinCreationDate || timestamp,
      twinLastUpdated: data.digitalTwin?.twinLastUpdated || timestamp,
      twinAccuracy: data.digitalTwin?.twinAccuracy || 0,
      sensorData: data.digitalTwin?.sensorData || [],
      simulationResults: data.digitalTwin?.simulationResults || [],
      predictiveModels: data.digitalTwin?.predictiveModels || []
    },
    
    // Enhanced media and documentation
    media: {
      processImages: data.media?.processImages || [],
      processVideos: data.media?.processVideos || [],
      technicalDocuments: data.media?.technicalDocuments || [],
      sensorDataFiles: data.media?.sensorDataFiles || [],
      blockchainProofs: data.media?.blockchainProofs || []
    },
    
    // Economic and financial data
    economics: {
      materialValue: data.economics?.materialValue || { totalValue: 0, currency: "USD" },
      processingCosts: data.economics?.processingCosts || { totalCost: 0, currency: "USD" },
      revenueSharing: data.economics?.revenueSharing || {},
      carbonCreditValue: data.economics?.carbonCreditValue || { creditsGenerated: 0, totalValue: 0, currency: "USD" }
    },
    
    // Standard NFT metadata fields
    name: data.name || `Enhanced Waste Certificate #${data.tokenId || ""}`,
    description: data.description || `Comprehensive waste processing certificate for ${data.wasteClassification?.primaryType || "waste"} batch ${data.batchId || ""}`,
    external_url: data.external_url || "",
    image: data.image || ""
  };
}

/**
 * Legacy function for backward compatibility
 * @param {Object} data - Certificate data
 * @returns {Object} - Formatted metadata object
 */
function createCertificateMetadata(data) {
  return {
    // Certificate identification
    tokenId: data.tokenId || "",
    certificateType: data.certificateType || "recycling",
    issuanceDate: data.issuanceDate || new Date().toISOString(),
    expiryDate: data.expiryDate || "",
    
    // Waste information
    wasteOrigin: data.wasteOrigin || "",
    wasteType: data.wasteType || "",
    quantity: data.quantity || 0,
    batchId: data.batchId || "",
    collectionDate: data.collectionDate || "",
    
    // Processing information
    processingMethod: data.processingMethod || "",
    processingFacility: data.processingFacility || "",
    processingDate: data.processingDate || new Date().toISOString(),
    processingSteps: data.processingSteps || [],
    qualityScore: data.qualityScore || 0,
    
    // Environmental impact
    carbonCredits: data.carbonCredits || 0,
    co2Reduction: data.co2Reduction || 0,
    energySaved: data.energySaved || 0,
    waterSaved: data.waterSaved || 0,
    landfillDiverted: data.landfillDiverted || 0,
    recyclingEfficiency: data.recyclingEfficiency || 0,
    
    // Verification information
    verifier: data.verifier || "",
    verificationDate: data.verificationDate || "",
    verificationMethod: data.verificationMethod || "",
    verificationProof: data.verificationProof || "",
    isVerified: data.isVerified || false,
    
    // Digital twin reference
    digitalTwinId: data.digitalTwinId || "",
    twinCreationDate: data.twinCreationDate || "",
    twinLastUpdated: data.twinLastUpdated || "",
    twinAccuracy: data.twinAccuracy || 0,
    
    // Media and documentation
    images: data.images || [],
    documents: data.documents || [],
    videos: data.videos || [],
    
    // Standard NFT metadata fields
    name: data.name || `Waste Certificate #${data.tokenId || ""}`,
    description: data.description || `Waste processing certificate for ${data.wasteType || "waste"} from ${data.wasteOrigin || "unknown origin"}`,
    external_url: data.external_url || "",
  };
}

/**
 * Validate metadata against enhanced schema
 * @param {Object} metadata - Metadata to validate
 * @returns {Object} - Validation result with errors if any
 */
function validateEnhancedMetadata(metadata) {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  const requiredFields = [
    'batchId',
    'wasteClassification.primaryType',
    'quantity.weight',
    'processingDate',
    'overallQualityScore'
  ];
  
  requiredFields.forEach(field => {
    const fieldValue = getNestedValue(metadata, field);
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate data types and ranges
  if (metadata.overallQualityScore !== undefined) {
    if (typeof metadata.overallQualityScore !== 'number' || 
        metadata.overallQualityScore < 0 || 
        metadata.overallQualityScore > 100) {
      errors.push('overallQualityScore must be a number between 0 and 100');
    }
  }
  
  if (metadata.quantity?.weight !== undefined) {
    if (typeof metadata.quantity.weight !== 'number' || metadata.quantity.weight < 0) {
      errors.push('quantity.weight must be a non-negative number');
    }
  }
  
  // Validate enum values
  const validCertificateTypes = ["recycling", "processing", "disposal", "recovery", "treatment"];
  if (metadata.certificateType && !validCertificateTypes.includes(metadata.certificateType)) {
    errors.push(`certificateType must be one of: ${validCertificateTypes.join(', ')}`);
  }
  
  // Check for recommended fields
  const recommendedFields = [
    'environmentalImpact.carbonFootprint.co2Reduction',
    'verification.primaryVerifier.verifierId',
    'digitalTwin.digitalTwinId'
  ];
  
  recommendedFields.forEach(field => {
    const fieldValue = getNestedValue(metadata, field);
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      warnings.push(`Recommended field missing: ${field}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, 100 - (errors.length * 10) - (warnings.length * 2))
  };
}

/**
 * Helper function to get nested object values
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path
 * @returns {*} - Value at path or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Generate metadata template for specific waste type
 * @param {string} wasteType - Type of waste
 * @param {Object} options - Additional options
 * @returns {Object} - Metadata template
 */
function generateMetadataTemplate(wasteType = 'mixed', options = {}) {
  const template = createEnhancedCertificateMetadata({
    wasteClassification: {
      primaryType: wasteType
    },
    ...options
  });
  
  // Add type-specific fields based on waste type
  switch (wasteType) {
    case 'electronic':
      template.wasteClassification.hazardousComponents = ['lead', 'mercury', 'cadmium'];
      template.processingWorkflow = [
        {
          stepId: 'disassembly',
          stepName: 'Component Disassembly',
          stepType: 'sorting'
        },
        {
          stepId: 'material-separation',
          stepName: 'Material Separation',
          stepType: 'sorting'
        }
      ];
      break;
      
    case 'plastic':
      template.processingWorkflow = [
        {
          stepId: 'sorting',
          stepName: 'Plastic Type Sorting',
          stepType: 'sorting'
        },
        {
          stepId: 'cleaning',
          stepName: 'Contamination Removal',
          stepType: 'cleaning'
        },
        {
          stepId: 'shredding',
          stepName: 'Mechanical Shredding',
          stepType: 'shredding'
        }
      ];
      break;
      
    case 'organic':
      template.processingWorkflow = [
        {
          stepId: 'composting',
          stepName: 'Aerobic Composting',
          stepType: 'biological-treatment'
        }
      ];
      break;
  }
  
  return template;
}

module.exports = {
  // Legacy exports for backward compatibility
  certificateMetadataSchema: enhancedCertificateMetadataSchema,
  createCertificateMetadata,
  
  // Enhanced exports
  enhancedCertificateMetadataSchema,
  createEnhancedCertificateMetadata,
  validateEnhancedMetadata,
  generateMetadataTemplate
};