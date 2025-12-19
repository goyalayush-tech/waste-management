# Integrated Waste Verification & EPR Compliance System

**Enterprise-Grade Platform for Waste Verification and Extended Producer Responsibility (EPR) Compliance**

A scalable, production-ready platform combining AI, blockchain, OCR, and advanced audit engine technologies to automate waste claim verification and ensure regulatory EPR compliance. Purpose-built for waste management enterprises, regulatory bodies, and certification authorities.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Operations](#operations)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Support](#support)
- [License](#license)

---

## Overview

### Target Users

Who is this platform for?

| User Type | Primary Need | Key Benefit |
|-----------|--------------|------------|
| **Plastic Producers (PIBOs)** | Prove annual EPR target compliance | Automated claim aggregation, certificate generation, regulator reporting |
| **Recyclers & Processors** | Submit verifiable waste processing claims | AI verification, fraud detection, instant risk scoring |
| **Auditors & Certifying Bodies** | Verify legitimacy of recycler claims | Transparent audit trail, blockchain immutability, cross-claim duplication detection |
| **Regulators (CPCB/SPCB)** | Monitor EPR compliance at scale | Real-time visibility, anomaly flagging, complete audit history |
| **Waste Management Enterprises** | Optimize operations, reduce risk | Multi-stakeholder coordination, compliance automation, liability protection |

### Business Objectives

The system addresses critical enterprise needs:
- **Regulatory Compliance**: Automated EPR compliance verification and reporting aligned with Indian waste management law
- **Operational Efficiency**: AI-driven waste claim verification reducing manual auditing by up to 85%
- **Transparency & Trust**: Blockchain-based immutable records for auditor and regulatory inspection
- **Risk Management**: Advanced anomaly detection and fraud prevention across the supply chain
- **Scalability**: Multi-tenant architecture supporting enterprise-scale EPR program management
- **Regulatory Confidence**: ClaimClean Confidence Score™ providing transparent risk assessment

### Key Capabilities

- **Automated Waste Verification**: AI-powered plastic waste classification with human-in-the-loop review and transparent confidence scoring
- **EPR Compliance Management**: Complete compliance lifecycle from claim intake to certification aligned with Indian law
- **Intelligent Document Processing**: OCR-enabled automated document extraction and verification with confidence thresholds
- **Blockchain Integration**: Immutable waste records and compliance certificates on Polygon with transparent on-chain/off-chain architecture
- **ClaimClean Confidence Score™**: Proprietary composite risk scoring based on recycler history, weight deviation analysis, geo-consistency, and cross-claim duplication detection
- **Comprehensive Audit Trail**: Full provenance tracking with immutable logs for regulatory inspection and dispute resolution
- **Professional Reporting**: Automated generation of regulatory compliance reports (Form-1, Form-4 automation ready)
- **Enterprise Multi-tenancy**: Role-based access control and isolated data environments with audit-level security
- **Fraud Detection Engine**: Cross-claim analysis, weight anomaly detection, duplicate certificate prevention, and recycler behavior profiling

### Compliance & Standards

- **India-Specific**: Aligned with Plastic Waste Management Rules 2016, CPCB EPR Guidelines 2022
- **Audit-Grade**: Complete audit trails, immutable records, transparency for regulators
- **Data Protection**: GDPR-ready mechanisms with encryption and access controls
- **Quality Management**: ISO 9001 alignment and audit-first architectural design
- **API Standards**: RESTful API with OpenAPI 3.0 specification and comprehensive documentation
- **Deployment**: Container-based deployment for consistency with Kubernetes support
- **Operational**: Comprehensive logging, monitoring, and alerting for enterprise operations

---

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Application                         │
│              (React 18 + TypeScript + Vite)                     │
│           Authentication • Multi-tenant dashboards               │
└──────────────────────────┬──────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
        ┌───────▼────────┐   ┌──────▼────────┐
        │   REST API     │   │ WebSocket     │
        │   (HTTP/2)     │   │ (Real-time)   │
        └───────┬────────┘   └──────┬────────┘
                │                   │
        ┌───────▼───────────────────▼────────┐
        │   Backend API Gateway               │
        │  (Node.js + Express + Auth Layer)   │
        │        + Audit Middleware            │
        └───────┬────────────────┬────────────┘
                │                │
        ┌───────▼──────┐    ┌────▼──────────┐
        │ AI Services  │    │ Business      │
        │ (Python)     │    │ Logic & Rules │
        │              │    │ + Fraud Detect│
        └───────┬──────┘    └────┬──────────┘
                │                │
        ┌───────▼────────────────▼─────────────┐
        │        Data Layer                     │
        │  ┌──────────────┬──────────────┐     │
        │  │   MongoDB    │  PostgreSQL  │     │
        │  │ (Waste Data) │ (Compliance) │     │
        │  └──────────────┴──────────────┘     │
        │  ┌──────────────┬──────────────┐     │
        │  │    Redis     │ Elasticsearch│     │
        │  │  (Cache)     │  (Audit Log) │     │
        │  └──────────────┴──────────────┘     │
        └───────────────────────────────────────┘
                │
        ┌───────▼──────────────┐
        │  Blockchain Layer    │
        │  (Polygon + IPFS)    │
        │ Immutable Certificates
        │ Claim Hashes         │
        │ Audit Trail Proof    │
        └──────────────────────┘
```

### ClaimClean Confidence Score™ System

The heart of fraud prevention and auditor confidence:

**What It Is:**
A composite risk score (0-100) that aggregates multiple verification signals to indicate claim legitimacy. Unlike absolute "94% accuracy" claims, this is transparent and auditor-friendly.

**Score Components:**

| Component | Weight | Data Source | Auditor Visibility |
|-----------|--------|-------------|-------------------|
| **Image Quality Confidence** | 15% | YOLOv8 detection + OCR | Per-claim breakdown |
| **Material Classification Match** | 20% | AI model + document OCR | Confidence threshold shown |
| **Weight Deviation Analysis** | 15% | Historical recycler baseline | Flagged if >2σ deviation |
| **Recycler Behavior History** | 20% | 12-month claim history | Risk profile and trends |
| **Geo-Consistency Check** | 10% | Location verification + facility DB | Cross-reference validation |
| **Duplicate Detection** | 15% | Cross-claim hashing + timestamp | Flagged if similar claims within period |
| **Document Integrity** | 5% | Hash verification + blockchain | Proof of non-tampering |

**Scoring Logic:**
- **90-100**: Auto-approved, low-risk claim
- **75-89**: Approved with advisory, suitable for audit sampling
- **50-74**: Requires auditor review before approval
- **Below 50**: Flagged for investigation, escalated to compliance team

**Human-in-the-Loop:**
All scores are advisory. Human auditors retain final authority. System transparency = regulator confidence.

---

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend** | React | 18+ | User interface and real-time interactions |
| **Frontend State** | Redux/Zustand | Latest | Predictable state management |
| **Build Tool** | Vite | 4+ | Fast, modern build tooling |
| **Styling** | Tailwind CSS | 3+ | Utility-first CSS framework |
| **Type Safety** | TypeScript | 4.9+ | Static type checking |
| **Backend Runtime** | Node.js | 18+ | Server-side JavaScript execution |
| **Web Framework** | Express | 4.18+ | RESTful API and middleware |
| **AI/ML Service** | Python | 3.9+ | Machine learning and AI processing |
| **AI Framework** | FastAPI | 0.95+ | High-performance async API framework |
| **ML Models** | YOLOv8 | Latest | Real-time object detection |
| **OCR Engine** | Tesseract/EasyOCR | Latest | Document text extraction |
| **Primary Database** | MongoDB | 5+ | Flexible waste verification data |
| **Relational Database** | PostgreSQL | 14+ | Structured compliance and audit data |
| **Cache Layer** | Redis | 7+ | Session management and performance |
| **Search Engine** | Elasticsearch | 8+ | Full-text document search |
| **Blockchain** | Polygon | Testnet/Mainnet | Smart contracts and immutable records |
| **Storage** | IPFS + AWS S3 | Latest | Decentralized and enterprise storage |
| **Containerization** | Docker | 20+ | Consistent deployment environments |
| **Orchestration** | Docker Compose | v2 | Development environment management |

---

## Blockchain Architecture & Strategy

### On-Chain vs Off-Chain Design

**What Goes On-Chain** (Polygon Smart Contracts):
- ✅ Claim hash (SHA-256)
- ✅ Certificate ID and timestamp
- ✅ Recycler public key / verified identity
- ✅ Auditor signature (digital sign-off)
- ✅ Certificate validity period
- ✅ IPFS hash reference (links to documents)
- ✅ Status: approved/rejected/flagged

**Why:** Immutable proof that a certificate existed, was signed, and has not been tampered with.

**What Stays Off-Chain** (MongoDB/PostgreSQL/IPFS):
- ❌ Full waste images (stored on IPFS; only hash on-chain)
- ❌ OCR extracted text (stored in database; referenced via hash)
- ❌ Detailed weight documents (on IPFS; hash on-chain)
- ❌ Recycler personal information (stored securely; only public key on-chain)
- ❌ Sensitive audit notes (private database; hash on-chain if formal record)

**Why:** Reduces blockchain bloat, protects privacy, controls costs while maintaining immutability proof.

### Polygon Integration Rationale

| Consideration | Decision | Benefit |
|---|---|---|
| **Blockchain Choice** | Polygon (Ethereum L2) | Lower gas costs (~1000x cheaper than mainnet); EVM compatibility; high security |
| **Network** | Start Testnet, migrate to Mainnet | Risk management; CPCB integration timeline |
| **Gas Cost Strategy** | Batch multiple claims per transaction | ~$0.10-0.50 per claim instead of $5-50 |
| **Smart Contract Upgrades** | Proxy pattern (UUPS) | Fix bugs without redeploying; maintain certificate references |
| **Audit Trail** | Parallel Elasticsearch + on-chain log | Blockchain for proof-of-work; database for detailed analysis |

### Certificate Minting Flow

```
1. Claim approved by auditor
2. System generates Certificate ID
3. All metadata hashed (claim hash + metadata hash)
4. Smart contract call: mintCertificate(hash, auditorSig)
5. Transaction confirmed on Polygon
6. Certificate hash stored + IPFS link added
7. Regulatory body can verify on blockchain independently
```

---

## Fraud Detection & Threat Model

### Key Fraud Vectors & Detection Mechanisms

| Fraud Type | How It Happens | ClaimClean Detection | Prevention |
|---|---|---|---|
| **Duplicate Claims** | Recycler submits same waste twice | Hash-based deduplication + timestamp clustering | Flagged immediately; blockchain prevents re-minting |
| **Inflated Weight** | Claims significantly higher than facility capacity | Weight deviation analysis (>2σ outliers) + historical baseline | Auditor review required; request supporting docs |
| **Fake Recyclers** | Unregistered facility submits claims | Cross-database verification + geo-consistency check | Recycler must be pre-verified in system |
| **Image Tampering** | Photoshopped waste pile images | Image forensics + duplicate detection (same image multiple times) | OCR mismatch with document; auditor escalation |
| **Document Fraud** | Forged weight certificates | OCR text validation + issuing authority verification | Document hash comparison; digital signature check |
| **Geo Inconsistency** | Claims from facility not matching registered location | GPS tagging (optional) + facility registration database | Geographic anomaly flagged for review |
| **Cross-Recycler Laundering** | Claim ping-pongs between recyclers to dilute origin | Historical behavior analysis + social network graph | Suspicious patterns flagged; relationship analysis |

### Threat Model for Auditors

**Threats This System Defends Against:**

| Threat | Mitigation | Auditor Confidence |
|---|---|---|
| Recycler lying about volume | AI imaging + weight document OCR | Photographic proof |
| Auditor being bribed | Blockchain immutability + audit log | Provenance from independent chain |
| Certificate being altered | On-chain hash + IPFS verification | Cryptographic proof of non-tampering |
| Claim appearing twice | Duplicate detection + blockchain de-duplication | Cross-claim audit trail |
| Waste origin being fake | Geo-consistency + facility verification | Regulatory database cross-reference |
| Historical revisionism | Elasticsearch immutable audit log | Complete event history |

---

## Regulatory Alignment (India-Specific)

### Legal Framework

This system is designed to support compliance with India's plastic waste management regulatory framework:

| Regulation | Reference | Relevance |
|-----------|-----------|-----------|
| **Plastic Waste Management Rules, 2016** | MoEFCC Notification S.O. 1340(E) | Core EPR compliance framework |
| **Plastic Waste Management (Amendment) Rules, 2018** | S.O. 3645(E) | Extended Producer Responsibility requirements |
| **Plastic Waste Management (Amendment) Rules, 2022** | S.O. 2411(E) | Digital tracking and blockchain-ready requirements |
| **CPCB EPR Portal & Guidelines** | Central Pollution Control Board | Official EPR registration and reporting |
| **State-Level SPCB Requirements** | Varies by state | Regional compliance and monitoring |

### Compliance Scope

**Rule 9(1): EPR Target Verification**
- Annual EPR targets by plastic category (MT/year)
- Claim aggregation and verification
- Certificate generation for target achievement
- Audit trail for regulatory inspection

**Rule 13: Record Keeping & Reporting**
- Digital records of all plastic waste claims
- Immutable logs for auditor review
- Form-1 (Producer/PIBO) automation support
- Form-4 (Recycler) automation support
- Timestamped proof of compliance

**Stakeholder Categories**
- **PIBOs** (Producers, Importers, Brand Owners): Annual EPR obligation, target verification, certificate generation
- **Recyclers & Processors**: Claim submission, material proof, weight verification
- **Auditors & Certifying Bodies**: Claim validation, fraud detection, regulatory reporting
- **CPCB/SPCB Regulators**: Real-time monitoring, anomaly flagging, compliance dashboard

### ClaimClean Compliance Mapping

| Claim Component | Verification Method | Regulatory Value |
|---|---|---|
| Waste weight | AI imaging + OCR document verification | Rule 9(1) proof |
| Material type | ML classification + visual confirmation | EPR category accuracy |
| Recycler identity | Cross-database verification + geo-consistency | Fraud prevention |
| Processing date | Timestamped blockchain record | Non-repudiation |
| Certificate chain | Hash-verified blockchain log | Auditor confidence |

---

## Requirements

### System Requirements

#### Hardware (Minimum for Production)
- **CPU**: 4 cores (8+ recommended)
- **RAM**: 16 GB (32 GB recommended)
- **Storage**: 200 GB SSD (fast I/O)
- **Network**: 1 Gbps connectivity

#### Software Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.9.0 or higher
- **Docker**: v20.10.0 or higher
- **Docker Compose**: v2.0.0 or higher
- **Git**: v2.30.0 or higher

#### OS Support
- Linux (Ubuntu 20.04 LTS+, CentOS 8+)
- macOS (11+)
- Windows (10/11 with WSL2)

### Development Dependencies

```bash
# Frontend dependencies
- Node package manager (npm/yarn/pnpm)
- Browser for testing (Chrome 90+, Firefox 88+, Safari 14+)

# Backend dependencies
- MongoDB client tools
- PostgreSQL client tools
- Docker for containerized services

# AI Service dependencies
- Python virtual environment manager (venv/conda)
- CUDA toolkit (optional, for GPU acceleration)
```

---

## Installation

### Quick Start (Development)

1. **Prerequisites Check**
   ```bash
   node --version  # Should be v18.0.0+
   python --version  # Should be 3.9.0+
   docker --version  # Should be 20.10.0+
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/delhi-waste-management.git
   cd delhi-waste-management
   ```

3. **Automated Setup**
   ```bash
   # Linux/macOS
   chmod +x scripts/setup-dev.sh
   ./scripts/setup-dev.sh
   
   # Windows (PowerShell)
   .\scripts\setup-dev.bat
   ```

4. **Environment Configuration**
   
   Create `.env` files for each service:

   **Backend** (`backend/.env`):
   ```env
   NODE_ENV=development
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/waste-db
   POSTGRESQL_URL=postgresql://user:pass@localhost:5432/compliance_db
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key-here
   API_LOG_LEVEL=info
   ```

   **AI Service** (`ai-services/.env`):
   ```env
   PYTHONUNBUFFERED=1
   FASTAPI_ENV=development
   API_PORT=8001
   LOG_LEVEL=info
   MODELS_PATH=/app/models
   ```

   **Frontend** (`frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_WS_URL=ws://localhost:3001
   VITE_ENV=development
   ```

5. **Start Services**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - AI Service: http://localhost:8001
   - MongoDB, PostgreSQL, Redis, etc. (Docker)

### Production Deployment

See [Deployment Guide](#deployment) section.

---

## Configuration

### Environment Variables

#### Backend Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | string | development | Environment mode (development, staging, production) |
| `PORT` | number | 3001 | API server port |
| `MONGODB_URI` | string | - | MongoDB connection string |
| `POSTGRESQL_URL` | string | - | PostgreSQL connection string |
| `REDIS_URL` | string | - | Redis connection string |
| `ELASTICSEARCH_URL` | string | - | Elasticsearch connection string |
| `JWT_SECRET` | string | - | JWT signing secret (min 32 chars) |
| `JWT_EXPIRY` | string | 24h | JWT token expiration time |
| `CORS_ORIGIN` | string | http://localhost:5173 | CORS allowed origins |
| `LOG_LEVEL` | string | info | Logging level (error, warn, info, debug) |
| `API_RATE_LIMIT` | number | 100 | Requests per minute per IP |

#### AI Service Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PYTHONUNBUFFERED` | boolean | 1 | Real-time Python output |
| `FASTAPI_ENV` | string | development | FastAPI environment mode |
| `API_PORT` | number | 8001 | FastAPI server port |
| `LOG_LEVEL` | string | info | Logging level |
| `MODELS_PATH` | string | /app/models | Path to ML models |
| `MAX_WORKERS` | number | 4 | Async worker threads |
| `REQUEST_TIMEOUT` | number | 300 | Request timeout in seconds |

#### Frontend Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_API_URL` | string | - | Backend API URL |
| `VITE_WS_URL` | string | - | WebSocket URL |
| `VITE_ENV` | string | development | Environment mode |
| `VITE_LOG_LEVEL` | string | info | Frontend logging level |

### Docker Services

Services defined in `docker-compose.yml`:

```yaml
Services:
  - mongodb: Document database (27017)
  - postgresql: Relational database (5432)
  - redis: Cache and session store (6379)
  - elasticsearch: Search engine (9200)
  - kibana: ES visualization (5601)
  - ipfs: Decentralized storage (5001, 8080)
  - minio: S3-compatible storage (9000, 9001)
```

---

## Operations

### Claim Lifecycle Flow

The entire EPR verification workflow:

```
1. CLAIM SUBMISSION
   ├─ Recycler submits waste processing claim
   ├─ Uploads: Images, weight documents, material certificates
   └─ System assigns unique claim ID + timestamp

2. INITIAL VALIDATION
   ├─ OCR extracts text from documents
   ├─ AI validates image quality and waste material visibility
   ├─ System checks recycler verification status
   └─ Assigns initial confidence score

3. AI VERIFICATION
   ├─ YOLOv8 object detection identifies waste type
   ├─ Weight validation checks for anomalies
   ├─ Material purity assessment
   └─ Generates AI confidence scores with thresholds

4. ANOMALY & FRAUD DETECTION
   ├─ Cross-claim duplication check
   ├─ Recycler historical behavior analysis
   ├─ Geographic consistency validation
   ├─ Weight deviation analysis (outliers flagged)
   └─ ClaimClean Confidence Score™ generated

5. AUDITOR REVIEW (if flagged)
   ├─ System highlights high-risk claims
   ├─ Provides transparent audit summary
   ├─ Auditor approves/rejects with notes
   └─ Creates immutable audit record

6. CERTIFICATE GENERATION
   ├─ Approved claims bundled for compliance period
   ├─ EPR certificate generated
   ├─ Certificate hash + metadata recorded on Polygon
   └─ IPFS links store full claim documentation

7. REGULATORY REPORTING
   ├─ Aggregated claims exported to Form-1/Form-4
   ├─ Submitted to CPCB portal
   ├─ Blockchain proof-of-submission retained
   └─ Audit trail complete and immutable
```

### Monitoring & Health Checks

#### Service Health Endpoints

```bash
# Backend health
curl http://localhost:3001/health

# AI Service health
curl http://localhost:8001/health

# Database connectivity
curl http://localhost:3001/health/database
```

#### Log Aggregation

Logs are available through:
- Container logs: `docker-compose logs [service]`
- Kibana dashboard: http://localhost:5601
- Application logs: `./logs/` directory

### Database Management

#### MongoDB Operations

```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh

# Backup database
docker-compose exec mongodb mongodump --out /backup

# Restore database
docker-compose exec mongodb mongorestore /backup
```

#### PostgreSQL Operations

```bash
# Connect to PostgreSQL
docker-compose exec postgresql psql -U postgres

# Backup database
docker-compose exec postgresql pg_dump compliance_db > backup.sql

# Restore database
docker-compose exec postgresql psql compliance_db < backup.sql
```

### Performance Optimization

- **Database Indexing**: Verify indexes in `mongodb-schemas.js` and `postgres-schema.sql`
- **Redis Caching**: Critical endpoints cached with TTL
- **CDN Integration**: Static assets served via CloudFront/CloudFlare
- **Query Optimization**: Monitor slow queries in `backend/logs/`

---

## Development

### Running Tests

```bash
# All tests
npm run test

# Frontend tests
npm run test:frontend

# Backend tests
npm run test:backend

# AI service tests
npm run test:ai -- --verbose

# Coverage report
npm run test:coverage
```

### Code Quality

```bash
# Lint all code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Available Scripts

See `package.json` for complete list:
- `npm run dev` - Start all services
- `npm run build` - Production build
- `npm run start` - Run production build
- `npm run install:all` - Install all dependencies
- `npm run docker:up` - Start Docker containers
- `npm run docker:down` - Stop Docker containers

---

## API Documentation

### Swagger/OpenAPI

Once services are running:
- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI JSON**: http://localhost:3001/api-docs.json
- **ReDoc**: http://localhost:3001/redoc

### API Endpoints Summary

#### Waste Verification
- `POST /api/waste/verify` - Verify waste claim
- `GET /api/waste/claims/:id` - Get claim details
- `PUT /api/waste/claims/:id` - Update claim

#### EPR Compliance
- `POST /api/compliance/assessments` - Create compliance assessment
- `GET /api/compliance/assessments/:id` - Get assessment status
- `POST /api/compliance/certificates` - Generate compliance certificate

#### AI Processing
- `POST /api/ai/detect-objects` - Run object detection
- `POST /api/ai/extract-text` - Extract text from documents
- `POST /api/ai/classify-waste` - Classify waste type

### Authentication

All API endpoints require JWT token in header:
```bash
Authorization: Bearer <jwt-token>
```

---

## Deployment

### Cloud Deployment Options

#### AWS
See `docs/deployment/AWS.md` for:
- ECS/Fargate container deployment
- RDS database setup
- ElastiCache configuration
- CloudFront CDN integration

#### Azure
See `docs/deployment/AZURE.md` for:
- Container Instances deployment
- Azure Database setup
- Azure Cache configuration
- Traffic Manager setup

#### Google Cloud
See `docs/deployment/GCP.md` for:
- Cloud Run deployment
- Cloud SQL setup
- Cloud Memorystore configuration
- Cloud CDN setup

### Docker Registry

Push images to your registry:
```bash
docker build -t your-registry/waste-backend:latest backend/
docker build -t your-registry/waste-frontend:latest frontend/
docker build -t your-registry/waste-ai:latest ai-services/

docker push your-registry/waste-backend:latest
docker push your-registry/waste-frontend:latest
docker push your-registry/waste-ai:latest
```

### Kubernetes Deployment

Production-grade Kubernetes manifests provided in `k8s/`:
```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmaps.yml
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/deployments.yml
kubectl apply -f k8s/services.yml
```

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations executed
- [ ] Secrets stored in secure vault (AWS Secrets Manager, Azure Key Vault)
- [ ] SSL/TLS certificates installed
- [ ] Database backups verified
- [ ] Load balancer configured
- [ ] Monitoring and alerting active
- [ ] Disaster recovery plan documented

---

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MongoDB connection
docker-compose logs mongodb

# Check PostgreSQL connection
docker-compose logs postgresql

# Verify database service is running
docker-compose ps
```

#### API Service Not Responding
```bash
# Check backend logs
docker-compose logs backend

# Verify service is listening
curl -v http://localhost:3001/health

# Check port availability
netstat -an | grep 3001
```

#### AI Model Loading Failures
```bash
# Check model files exist
ls -la ai-services/models/

# Verify Python dependencies
pip list | grep yolo

# Check AI service logs
docker-compose logs ai-service
```

### Performance Issues

1. **Slow API Response**
   - Check Redis connection: `redis-cli ping`
   - Monitor database queries
   - Review CPU and memory usage

2. **Memory Leaks**
   - Review Node.js heap dumps
   - Check Python memory profiling
   - Implement connection pooling

3. **High Latency**
   - Enable query result caching
   - Implement pagination for large datasets
   - Review network bandwidth

---

## Project Structure

```
delhi-waste-management/
├── frontend/                     # React application
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── waste/          # Waste verification UI
│   │   │   ├── epr/            # EPR compliance UI
│   │   │   └── shared/         # Shared components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   ├── hooks/              # Custom React hooks
│   │   ├── store/              # Redux store
│   │   ├── types/              # TypeScript definitions
│   │   └── styles/             # Global styles
│   ├── tests/                  # Frontend tests
│   └── package.json
│
├── backend/                      # Node.js backend API
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   │   ├── waste/         # Waste verification routes
│   │   │   ├── compliance/    # EPR compliance routes
│   │   │   └── auth/          # Authentication routes
│   │   ├── models/            # Database models
│   │   │   ├── mongodb/       # Mongoose schemas
│   │   │   └── postgresql/    # Sequelize models
│   │   ├── services/          # Business logic services
│   │   ├── middleware/        # Express middleware
│   │   ├── utils/             # Utility functions
│   │   ├── config/            # Configuration files
│   │   └── audit/             # Audit engine
│   ├── tests/                 # Backend tests
│   ├── migrations/            # Database migrations
│   └── package.json
│
├── ai-services/                  # Python AI/ML service
│   ├── claim_audit_service.py  # ClaimClean audit service
│   ├── waste_classification_ai.py
│   ├── contamination_detection.py
│   ├── rare_material_detection.py
│   ├── object_detection.py
│   ├── image_processing.py
│   ├── multi_modal_sensor_fusion.py
│   ├── video_analytics.py
│   ├── enhanced_ai_ml_system.py
│   ├── models/                # Pre-trained ML models
│   ├── services/              # AI processing services
│   ├── tests/                 # AI service tests
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile.dev
│
├── blockchain/                   # Smart contracts
│   ├── contracts/             # Solidity contracts
│   ├── scripts/               # Deployment scripts
│   ├── test/                  # Contract tests
│   └── hardhat.config.js
│
├── docs/                         # Documentation
│   ├── API.md                 # API reference
│   ├── DEPLOYMENT.md          # Deployment guide
│   ├── ARCHITECTURE.md        # Architecture details
│   ├── SECURITY.md            # Security guidelines
│   └── COMMON_TASKS.md        # Development tasks
│
├── scripts/                      # Development scripts
│   ├── setup-dev.sh
│   ├── setup-dev.bat
│   ├── mongo-init.js
│   ├── postgres-init.sql
│   └── verify-dependencies.js
│
├── docker-compose.yml          # Development infrastructure
├── docker-compose.dev.yml      # Development overrides
├── .dockerignore
├── .gitignore
├── README.md                   # This file
└── package.json                # Root package configuration
```

---

## Security & Fraud Prevention

### Security Architecture

| Layer | Controls | Rationale |
|-------|----------|-----------|
| **Authentication** | JWT with RS256 signing (asymmetric) | Secure auditor identity; revocation support |
| **Authorization** | Role-based access control (RBAC) | Recyclers can't access PIBO data; regulators see aggregate view only |
| **Transport** | TLS 1.3 with HSTS headers | Protects data in transit from interception |
| **Data at Rest** | AES-256 encryption for sensitive fields | Password hashes (bcryptjs), PIBO contracts, personal data |
| **API Security** | Rate limiting (100 req/min per IP), CORS whitelisting, input validation | Prevents brute force, injection attacks, unauthorized clients |
| **Audit Logging** | Immutable Elasticsearch + blockchain hashes | All claim changes logged; blockchain prevents log tampering |

### Fraud Prevention Framework

**Defense Layers:**

1. **Pre-Verification** (Before AI)
   - Recycler verification in database
   - Facility registration check
   - Account status validation

2. **AI Verification** (During Processing)
   - Image quality scoring
   - Material classification confidence
   - OCR text integrity check
   - Weight reasonableness vs. facility capacity

3. **Anomaly Detection** (Historical Analysis)
   - Weight deviation analysis (statistical outliers)
   - Duplicate claim detection (hash-based)
   - Temporal clustering (multiple claims same day)
   - Recycler behavior profiling

4. **Auditor Review** (Human Gate)
   - ClaimClean Confidence Score visible
   - Flagged claims require explicit approval
   - Audit notes immutable
   - Approval signature on-chain

5. **Blockchain Finality** (Post-Approval)
   - Certificate hash locked on Polygon
   - IPFS links ensure document integrity
   - Re-minting prevented by smart contract rules

### Secrets Management

- **Development**: `.env` files (git-ignored)
- **Production**: AWS Secrets Manager or Azure Key Vault
- **Rotation**: 90-day key rotation policy
- **Access**: Principle of least privilege via IAM roles

### Compliance Requirements

- **GDPR**: Data retention policies (12-month claim history), right to be forgotten support, data processing agreements
- **SOC 2**: Audit logging, access controls, incident response
- **India Data Privacy**: Personal data encryption, cross-border transfer controls (data stays in India)
- **Audit-Grade**: 7-year record retention for regulatory review

---

## Support

### Documentation

- **User Guide**: `docs/USER_GUIDE.md`
- **API Documentation**: `docs/API.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Authentication**: `frontend/docs/AUTHENTICATION.md`
- **Troubleshooting**: See [Troubleshooting](#troubleshooting) section

### Getting Help

1. **Check Documentation**: See `docs/` directory
2. **Review Examples**: See `ai-services/examples/`
3. **Search Issues**: GitHub Issues for known problems
4. **Report Bugs**: GitHub Issues with reproduction steps
5. **Contact Support**: support@company.com

### Community

- **Discussions**: GitHub Discussions
- **Issues**: Report bugs and request features
- **Contributions**: See CONTRIBUTING.md

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-01-15 | Enterprise release with production deployment guides |
| 1.5.0 | 2024-12-15 | Added Kubernetes support and advanced monitoring |
| 1.0.0 | 2024-11-01 | Initial production release |

---

**Last Updated**: December 19, 2025  
**Maintained By**: Engineering Team  
**Status**: Production Ready

