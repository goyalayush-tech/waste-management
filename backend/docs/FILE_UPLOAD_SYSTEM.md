# Secure File Upload System Documentation

## Overview

The Integrated Waste Verification & EPR Compliance System includes a comprehensive file upload infrastructure that supports secure document upload with validation for images and PDFs, IPFS integration for decentralized waste image storage, AWS S3 integration for EPR document archival with encryption, and a robust file processing pipeline with virus scanning.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  Upload Routes   │───▶│  File Service   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Security Scan   │    │  Storage Layer  │
                       │   Middleware     │    │  (IPFS/S3)      │
                       └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Virus Scanning   │    │   Processing    │
                       │    Service       │    │     Queue       │
                       └──────────────────┘    └─────────────────┘
```

## Features

### 1. Multi-layered Security
- **File Type Validation**: Strict MIME type and extension checking
- **Content Validation**: Deep file content analysis
- **Virus Scanning**: Multi-engine virus detection
- **Heuristic Analysis**: Entropy analysis and suspicious pattern detection
- **Rate Limiting**: Upload frequency controls
- **Authentication**: Role-based access control

### 2. Storage Integration
- **IPFS**: Decentralized storage for waste verification images
- **AWS S3**: Encrypted storage for EPR compliance documents
- **Metadata Management**: Comprehensive file metadata tracking

### 3. Processing Pipeline
- **Image Optimization**: Automatic resizing and compression
- **Queue Management**: Asynchronous processing with Bull queues
- **Error Handling**: Comprehensive error recovery
- **Logging**: Detailed audit trails

## API Endpoints

### Waste Image Upload
```http
POST /api/upload/waste/images
Content-Type: multipart/form-data
Authorization: Bearer <token>

Fields:
- beforeImage: File (required)
- afterImage: File (required)
- batchId: String (required)
- location: JSON object with lat/lng (required)
- wasteType: String (optional)
- estimatedQuantity: Number (optional)
```

### EPR Document Upload
```http
POST /api/upload/epr/documents
Content-Type: multipart/form-data
Authorization: Bearer <token>

Fields:
- documents: File[] (required, max 10 files)
- documentType: String (required: invoice|weighbridge|transport|certificate|other)
- clientId: String (required)
- recyclerName: String (optional)
- tonnage: Number (optional)
- date: Date (optional)
```

### Single File Upload
```http
POST /api/upload/single
Content-Type: multipart/form-data
Authorization: Bearer <token>

Fields:
- file: File (required)
- uploadType: String (optional: waste|epr, default: waste)
```

### Secure Download
```http
GET /api/upload/download/:s3Key
Authorization: Bearer <token>
Query Parameters:
- expires: Number (optional, seconds, default: 3600)
```

### Health Check
```http
GET /api/upload/health
```

## Security Features

### Virus Scanning Service

The system includes a comprehensive virus scanning service with multiple detection methods:

#### 1. Heuristic Analysis
- **Entropy Calculation**: Detects packed/encrypted files
- **Executable Detection**: Identifies binary executables
- **String Analysis**: Scans for suspicious code patterns
- **Size Anomalies**: Flags unusual file sizes
- **Polyglot Detection**: Identifies multi-format files

#### 2. Signature Analysis
- **File Headers**: Validates file format signatures
- **Magic Numbers**: Detects file type mismatches
- **Executable Signatures**: Identifies PE, ELF, Mach-O files

#### 3. External Scanning (Optional)
- **ClamAV Integration**: Open-source antivirus engine
- **VirusTotal API**: Multi-engine cloud scanning
- **Custom Rules**: Configurable threat detection

#### 4. Confidence Scoring
- **Risk Assessment**: 0-100 confidence score
- **Threat Weighting**: Severity-based scoring
- **Multi-method Validation**: Cross-verification

### File Validation

#### Image Validation
```javascript
// Supported formats
const imageTypes = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/heic',
  'image/heif'
];

// Validation checks
- File signature verification
- Dimension limits (100x100 to 10000x10000)
- Size limits (up to 50MB)
- Metadata extraction and validation
```

#### PDF Validation
```javascript
// PDF-specific checks
- PDF header validation (%PDF)
- Size limits (up to 100MB)
- Structure validation
- Embedded content scanning
```

### Rate Limiting

```javascript
// Upload rate limits
const uploadLimits = {
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50 // requests per window
  },
  bulk: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // bulk uploads per window
  }
};
```

## Storage Configuration

### IPFS Configuration
```javascript
const ipfsConfig = {
  host: process.env.IPFS_HOST || 'localhost',
  port: process.env.IPFS_PORT || 5001,
  protocol: process.env.IPFS_PROTOCOL || 'http',
  options: {
    pin: true,
    hashAlg: 'sha2-256'
  }
};
```

### AWS S3 Configuration
```javascript
const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET,
  encryption: 'AES256'
};
```

## Processing Queue

The system uses Bull queues for asynchronous file processing:

### Queue Types
1. **Image Processing Queue**: Handles waste image optimization and IPFS upload
2. **Document Processing Queue**: Manages EPR document processing and S3 upload
3. **Virus Scan Queue**: Performs security scanning operations

### Queue Configuration
```javascript
const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
};
```

## Error Handling

### Error Types
1. **Validation Errors**: File type, size, format issues
2. **Security Errors**: Virus detection, suspicious content
3. **Storage Errors**: IPFS/S3 upload failures
4. **Processing Errors**: Image optimization, queue failures
5. **Authentication Errors**: Invalid tokens, insufficient permissions

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)",
  "scanResult": {
    "overallStatus": "infected|suspicious|clean|error",
    "threats": [...],
    "confidence": 0-100
  }
}
```

## Monitoring and Logging

### Upload Activity Logging
```javascript
const logData = {
  userId: "user-id",
  userRole: "vendor|buyer|admin",
  uploadType: "waste|epr",
  fileCount: 2,
  timestamp: "2024-01-01T00:00:00Z",
  ip: "192.168.1.1",
  userAgent: "browser-info",
  success: true,
  securityScanResults: [...]
};
```

### Health Monitoring
- IPFS connection status
- S3 service availability
- Queue processing metrics
- Virus scanning service status

## Environment Variables

### Required Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/waste-verification-mvp
REDIS_URL=redis://localhost:6379

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# IPFS
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=http://localhost:8080
```

### Optional Variables
```bash
# Security
VIRUSTOTAL_API_KEY=your-api-key
CLAMAV_ENABLED=false
TEMP_DIR=/tmp

# Limits
MAX_FILE_SIZE=52428800
MAX_FILES_PER_REQUEST=10
UPLOAD_RATE_LIMIT_MAX=50
BULK_UPLOAD_RATE_LIMIT_MAX=10
```

## Testing

### Test Coverage
- Security validation tests
- File type validation tests
- Upload workflow tests
- Error handling tests
- Rate limiting tests
- Authentication tests

### Running Tests
```bash
# Run all file upload tests
npm test -- --testPathPattern=fileUpload

# Run with coverage
npm test -- --coverage --testPathPattern=fileUpload

# Run specific test suite
npm test -- --testNamePattern="Security Validation"
```

## Deployment Considerations

### Production Setup
1. **Enable ClamAV**: Install and configure ClamAV for enhanced virus scanning
2. **VirusTotal API**: Register for API key for cloud-based scanning
3. **S3 Bucket Policy**: Configure proper IAM roles and bucket policies
4. **IPFS Node**: Set up dedicated IPFS node or use Pinata/Infura
5. **Redis Cluster**: Use Redis cluster for queue reliability
6. **Monitoring**: Set up CloudWatch/Datadog for monitoring

### Security Hardening
1. **WAF Rules**: Configure Web Application Firewall
2. **DDoS Protection**: Enable CloudFlare or AWS Shield
3. **SSL/TLS**: Use strong encryption for all connections
4. **Audit Logging**: Enable comprehensive audit trails
5. **Backup Strategy**: Regular backups of metadata and configurations

### Performance Optimization
1. **CDN**: Use CloudFront for S3 content delivery
2. **Caching**: Implement Redis caching for metadata
3. **Queue Scaling**: Auto-scale queue workers based on load
4. **Image Optimization**: Use WebP format where supported
5. **Compression**: Enable gzip compression for API responses

## Troubleshooting

### Common Issues
1. **IPFS Connection Failures**: Check IPFS daemon status
2. **S3 Upload Errors**: Verify AWS credentials and bucket permissions
3. **Virus Scan Timeouts**: Increase timeout values or check service status
4. **Queue Processing Delays**: Monitor Redis connection and worker processes
5. **Rate Limit Exceeded**: Adjust rate limiting configuration

### Debug Commands
```bash
# Check IPFS status
curl http://localhost:5001/api/v0/id

# Test S3 connection
aws s3 ls s3://your-bucket-name

# Monitor queue status
redis-cli monitor

# Check virus scan service
curl http://localhost:3000/api/upload/health
```