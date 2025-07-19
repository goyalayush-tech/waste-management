# Real-Time Certificate Updates - Implementation Documentation

## Overview

This document describes the implementation of Task 2.4: Real-Time Certificate Updates, which provides automatic NFT metadata updates during processing with advanced milestone detection and webhook notifications.

## Architecture

The real-time certificate update system consists of several interconnected components:

### 1. Enhanced Webhook Service (`enhancedWebhookService.js`)

The core service that handles real-time processing of certificate updates with the following key features:

#### Key Features:
- **Real-time milestone detection** with automatic processing
- **Batch update system** for efficient blockchain transactions
- **Webhook notification system** with retry logic and security
- **Performance metrics** and monitoring
- **Error handling** and recovery mechanisms

#### Core Methods:

```javascript
// Register enhanced webhook with real-time capabilities
await enhancedWebhookService.registerEnhancedWebhook(
  facilityId,
  tokenId,
  callbackUrl,
  milestoneTypes,
  options
);

// Trigger real-time update for immediate processing
await enhancedWebhookService.triggerRealTimeUpdate(
  facilityId,
  tokenId,
  milestoneData,
  immediate
);

// Detect and trigger milestones automatically
await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
  facilityId,
  tokenId,
  processingData
);

// Process batch updates efficiently
await enhancedWebhookService.processBatchUpdates(updates);

// Send webhook notifications with retry logic
await enhancedWebhookService.triggerWebhookNotification(
  webhookKey,
  payload
);
```

### 2. Milestone Detection System

The system automatically detects processing milestones based on data patterns:

#### Supported Milestone Types:
- **Collection**: Waste collection completed
- **Sorting**: Waste sorting with contamination detection
- **Processing**: Advanced processing operations
- **Quality Check**: Quality assessment and validation
- **Verification**: Certificate verification process
- **Environmental Impact**: Carbon credits and sustainability metrics
- **Completion**: Processing completion with final products
- **Digital Twin Update**: Real-time digital twin synchronization

#### Milestone Detection Logic:

```javascript
// Collection milestone detection
{
  condition: (data) => data.status === 'collected' && data.wasteId,
  handler: this.handleEnhancedCollectionMilestone.bind(this),
  priority: 'high',
  realTime: true
}

// Environmental impact milestone detection
{
  condition: (data) => data.carbonCredits > 0 || data.co2Reduction > 0,
  handler: this.handleEnhancedEnvironmentalImpactMilestone.bind(this),
  priority: 'medium',
  realTime: false
}
```

### 3. Real-Time Processing Engine

The system provides two processing modes:

#### Real-Time Processing (1-second interval):
- High-priority milestones (collection, quality check, verification, completion)
- Immediate blockchain updates
- Instant webhook notifications
- Processing locks to prevent duplicates

#### Batch Processing (10-second interval):
- Medium/low-priority milestones
- Efficient batch blockchain transactions
- Grouped by facility for optimization
- Retry logic for failed updates

### 4. Webhook Notification System

Advanced webhook system with enterprise-grade features:

#### Security Features:
- HMAC-SHA256 signature verification
- Unique webhook secrets per registration
- Request timeout handling
- Rate limiting protection

#### Reliability Features:
- Automatic retry with exponential backoff
- Maximum retry attempts configuration
- Failure tracking and webhook deactivation
- Response time monitoring

#### Webhook Payload Structure:

```javascript
{
  webhookId: "facility-001-token-123-timestamp",
  updateId: "update-uuid-123",
  facilityId: "facility-001",
  tokenId: "123",
  milestone: {
    type: "collection",
    name: "Enhanced Waste Collection Completed",
    data: {
      wasteId: "waste-001",
      collectionDate: "2024-01-15T10:30:00Z",
      quantity: 500,
      collector: "Collection Team A"
    }
  },
  timestamp: "2024-01-15T10:30:00Z",
  type: "milestone_detected",
  signature: "sha256=abc123..."
}
```

## Implementation Details

### 1. Certificate Lifecycle Integration

The system integrates with the complete certificate lifecycle:

```javascript
// 1. Certificate Creation
const mintResult = await certificateService.mintCertificate(
  facilityId,
  recipient,
  certificateData
);

// 2. Webhook Registration
const webhook = await enhancedWebhookService.registerEnhancedWebhook(
  facilityId,
  mintResult.tokenId,
  callbackUrl,
  ['collection', 'processing', 'verification', 'completion']
);

// 3. Automatic Milestone Detection
const processingData = {
  status: 'collected',
  wasteId: 'waste-001',
  quantity: 500
};

const milestones = await enhancedWebhookService.detectAndTriggerEnhancedMilestones(
  facilityId,
  tokenId,
  processingData
);

// 4. Real-time Certificate Updates
// Automatically triggered by milestone detection
```

### 2. Digital Twin Synchronization

Real-time synchronization with digital twins:

```javascript
// Digital twin state update triggers certificate update
const newState = {
  parameters: {
    temperature: 375,
    pressure: 2.8,
    efficiency: 94.8
  },
  metrics: {
    processed_volume: 720,
    quality_score: 96.5
  }
};

await digitalTwinService.updateTwinState(digitalTwinId, newState);

// Automatically triggers digital twin update milestone
const processingData = {
  digitalTwinId: digitalTwinId,
  twinState: newState,
  syncType: 'real_time'
};
```

### 3. IPFS Integration

Automatic metadata storage and backup:

```javascript
// Metadata creation and IPFS storage
const metadata = createCertificateMetadata({
  ...updatedData,
  tokenId,
  processingFacility: facilityId,
  lastUpdated: new Date().toISOString(),
  updateSource: 'real_time_webhook'
});

const cid = await ipfsService.storeMetadata(metadata);
const ipfsUri = `ipfs://${cid}`;

// Automatic backup creation
await ipfsService.createBackup(cid, metadata);
```

### 4. Batch Update Optimization

Efficient batch processing for high-volume operations:

```javascript
// Group updates by facility
const updatesByFacility = this.groupUpdatesByFacility(updates);

// Process each facility batch
for (const [facilityId, facilityUpdates] of Object.entries(updatesByFacility)) {
  // Prepare batch arrays
  const tokenIds = [];
  const carbonCredits = [];
  const recyclingEfficiencies = [];
  const ipfsHashes = [];
  
  // Execute batch update on blockchain
  const tx = await certificateContract.batchUpdateCertificates(
    tokenIds,
    carbonCredits,
    recyclingEfficiencies,
    environmentalImpacts,
    ipfsHashes
  );
}
```

## Performance Metrics

The system tracks comprehensive performance metrics:

### System Status:
```javascript
{
  pendingUpdates: 15,
  realTimeUpdates: 3,
  registeredWebhooks: 25,
  activeWebhooks: 23,
  batchSize: 30,
  updateInterval: 10000,
  realTimeInterval: 1000,
  metrics: {
    totalUpdates: 1250,
    successfulUpdates: 1235,
    failedUpdates: 15,
    averageProcessingTime: 850,
    webhookTriggers: 1180,
    batchOperations: 42
  },
  version: "2.0.0"
}
```

### Webhook Statistics:
```javascript
{
  webhookId: "facility-001-token-123-timestamp",
  status: "active",
  triggerCount: 45,
  failureCount: 2,
  successRate: "95.56%",
  averageResponseTime: 245,
  lastProcessingTime: 180,
  monitoredMilestones: ["collection", "processing", "verification"],
  options: {
    realTimeUpdates: true,
    batchUpdates: true,
    retryAttempts: 5
  }
}
```

## Error Handling and Recovery

### 1. Milestone Detection Errors
- Invalid data gracefully ignored
- Partial milestone processing continues
- Error logging for debugging

### 2. Blockchain Transaction Errors
- Automatic retry with exponential backoff
- Transaction failure recovery
- Gas optimization for batch operations

### 3. IPFS Storage Errors
- Fallback to backup storage systems
- Local backup creation
- Redundant gateway access

### 4. Webhook Notification Errors
- Configurable retry attempts
- Webhook deactivation after repeated failures
- Response time monitoring and alerting

## Testing Implementation

### 1. End-to-End Certificate Lifecycle Test
```javascript
// File: blockchain/test/certificateLifecycleEndToEnd.test.js
describe('Certificate Lifecycle End-to-End Real-Time Updates', function () {
  // Complete lifecycle testing from creation to completion
  // Real-time milestone detection and processing
  // Webhook notification verification
  // Performance metrics validation
});
```

### 2. Real-Time Processing Tests
```javascript
// File: blockchain/test/realTimeWebhookTest.test.js
describe('Real-Time Certificate Updates', function () {
  // Milestone detection testing
  // Real-time vs batch processing
  // Error handling scenarios
  // Performance benchmarking
});
```

### 3. Integration Tests
```javascript
// File: blockchain/test/enhancedWebhookServiceSimple.test.js
describe('Enhanced Webhook Service Integration', function () {
  // Service integration testing
  // Mock service interactions
  // Error scenario handling
});
```

## Configuration Options

### Webhook Registration Options:
```javascript
{
  retryAttempts: 5,              // Maximum retry attempts
  retryDelay: 2000,              // Delay between retries (ms)
  batchUpdates: true,            // Enable batch processing
  realTimeUpdates: true,         // Enable real-time processing
  immediateProcessing: true,     // Process immediately
  webhookTimeout: 15000,         // Webhook timeout (ms)
  enableMetrics: true            // Enable performance metrics
}
```

### System Configuration:
```javascript
{
  updateInterval: 10000,         // Batch processing interval (ms)
  realTimeInterval: 1000,        // Real-time processing interval (ms)
  batchSize: 30,                 // Maximum batch size
  maxRetries: 5,                 // Maximum retry attempts
  retryDelay: 2000              // Retry delay (ms)
}
```

## Usage Examples

### 1. Basic Webhook Registration
```javascript
const webhook = await enhancedWebhookService.registerEnhancedWebhook(
  'facility-001',
  '123',
  'https://api.example.com/webhook',
  ['collection', 'completion'],
  { realTimeUpdates: true }
);
```

### 2. Manual Milestone Trigger
```javascript
const result = await enhancedWebhookService.triggerRealTimeUpdate(
  'facility-001',
  '123',
  {
    milestoneName: 'Quality Check Completed',
    milestoneType: 'quality_check',
    data: { qualityScore: 95, passed: true }
  },
  true // immediate processing
);
```

### 3. Batch Processing
```javascript
const updates = [
  { facilityId: 'facility-001', tokenId: '123', milestoneData: {...} },
  { facilityId: 'facility-001', tokenId: '124', milestoneData: {...} }
];

const batchResult = await enhancedWebhookService.processBatchUpdates(updates);
```

## Security Considerations

### 1. Webhook Security
- HMAC-SHA256 signature verification
- Unique secrets per webhook
- Request timeout protection
- Rate limiting implementation

### 2. Access Control
- Role-based access for certificate updates
- Facility-based authorization
- Token ownership verification

### 3. Data Integrity
- Metadata checksums
- IPFS content addressing
- Blockchain immutability
- Backup verification

## Monitoring and Alerting

### 1. Performance Monitoring
- Processing time tracking
- Success/failure rates
- Queue depth monitoring
- Resource utilization

### 2. Error Alerting
- Failed webhook notifications
- Blockchain transaction failures
- IPFS storage issues
- System health checks

### 3. Metrics Dashboard
- Real-time system status
- Historical performance data
- Webhook statistics
- Error rate trends

## Conclusion

The Real-Time Certificate Updates system provides a comprehensive solution for automatic NFT metadata updates during waste processing. The implementation includes:

✅ **Webhook system** for automatic NFT metadata updates during processing
✅ **Processing milestone detection** and certificate update triggers  
✅ **Batch update system** for efficient blockchain transaction management
✅ **End-to-end tests** for certificate lifecycle from creation to completion

The system is designed for enterprise-scale operations with robust error handling, performance optimization, and comprehensive monitoring capabilities. It seamlessly integrates with the existing waste management infrastructure while providing real-time visibility into processing operations through automated certificate updates.