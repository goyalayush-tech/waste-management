# Integrated Waste Verification & EPR Compliance System

A comprehensive platform that combines AI, blockchain, OCR, and audit engine technologies to verify waste claims and ensure EPR (Extended Producer Responsibility) compliance. The system provides automated waste verification for plastic waste streams alongside sophisticated document processing, compliance auditing, and regulatory reporting capabilities.

## 🏗️ Architecture

### Core Technologies
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + Hybrid Database Architecture
- **AI Service**: Python + FastAPI + YOLOv8 + OCR + Computer Vision
- **Blockchain**: Polygon Testnet + Solidity + IPFS
- **Databases**: 
  - MongoDB for waste verification data
  - PostgreSQL for EPR compliance and audit data
  - Redis for caching and session management
  - Elasticsearch for document search
- **Storage**: IPFS for decentralized storage + AWS S3 for enterprise documents

### Key Features
- **Waste Verification**: AI-powered plastic waste classification and quantity estimation
- **EPR Compliance**: Automated document processing, OCR, and compliance auditing
- **Blockchain Integration**: Immutable waste records and compliance certificates
- **ClaimClean Scoring**: Proprietary scoring system for compliance risk assessment
- **Professional Reporting**: Automated generation of regulatory compliance reports
- **Multi-tenant Architecture**: Support for multiple clients with role-based access

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+
- Docker & Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd waste-verification-mvp
   ```

2. **Run the setup script**
   ```bash
   chmod +x scripts/setup-dev.sh
   ./scripts/setup-dev.sh
   ```

3. **Configure environment variables**
   - Update `backend/.env` with your configuration
   - Update `ai-services/.env` with your settings
   - Update `frontend/.env` with your API endpoints

4. **Start development services**
   ```bash
   npm run dev
   ```

### Manual Setup

If you prefer manual setup:

```bash
# Install all dependencies
npm run install:all

# Start infrastructure services
docker-compose up -d mongodb postgresql redis ipfs elasticsearch

# Start development servers (in separate terminals)
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3001
npm run dev:ai        # http://localhost:8001
```

### Planning and Tasks

- See `docs/COMMON_TASKS.md` for a unified task plan and website-first priorities.

## 📁 Project Structure

```
integrated-waste-epr-system/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── waste/      # Waste verification components
│   │   │   ├── epr/        # EPR compliance components
│   │   │   └── shared/     # Shared components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Redux store
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   │   ├── waste/      # Waste verification APIs
│   │   │   ├── epr/        # EPR compliance APIs
│   │   │   └── shared/     # Shared APIs
│   │   ├── models/         # Database models (MongoDB & PostgreSQL)
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── audit/          # EPR audit engine
│   └── package.json
├── ai-services/              # Python AI processing service
│   ├── models/             # ML models (YOLOv8, OCR)
│   ├── services/           # AI processing logic
│   │   ├── waste/          # Waste classification
│   │   ├── ocr/            # Document OCR processing
│   │   └── anomaly/        # Anomaly detection
│   ├── utils/              # Utility functions
│   └── requirements.txt
├── blockchain/               # Smart contracts and blockchain services
│   ├── contracts/          # Solidity smart contracts
│   ├── scripts/            # Deployment scripts
│   └── test/               # Contract tests
└── scripts/                  # Development and deployment scripts
```

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Start all development services
- `npm run test` - Run all tests
- `npm run build` - Build all services
- `npm run lint` - Lint all code
- `npm run install:all` - Install all dependencies

### Frontend
- `npm run dev:frontend` - Start frontend dev server
- `npm run build:frontend` - Build frontend for production
- `npm run test:frontend` - Run frontend tests

### Backend
- `npm run dev:backend` - Start backend dev server
- `npm run test:backend` - Run backend tests

### AI Service
- `npm run dev:ai` - Start AI service
- `npm run test:ai` - Run AI service tests

## 🔧 Configuration

### Environment Variables

Each service has its own `.env` file:

- `backend/.env` - Backend API configuration
- `ai-services/.env` - AI service configuration  
- `frontend/.env` - Frontend build configuration

### Docker Services

The development environment includes:

- **MongoDB** (port 27017) - Main database
- **Redis** (port 6379) - Caching and sessions
- **IPFS** (ports 4001, 5001, 8080) - Decentralized storage

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific service tests
npm run test:frontend
npm run test:backend
npm run test:ai
npm run test:blockchain
```

## 📚 API Documentation

Once the backend is running, API documentation is available at:
- Swagger UI: http://localhost:3001/api-docs
- OpenAPI JSON: http://localhost:3001/api-docs.json

## 🔗 Service URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **AI Service**: http://localhost:8001
- **MongoDB**: mongodb://localhost:27017 (waste verification data)
- **PostgreSQL**: postgresql://localhost:5432 (EPR compliance data)
- **Redis**: redis://localhost:6379 (cache & sessions)
- **Elasticsearch**: http://localhost:9200 (document search)
- **IPFS Gateway**: http://localhost:8080 (decentralized storage)

## 🚀 Deployment

See individual service README files for deployment instructions:
- [Frontend Deployment](frontend/README.md)
- [Backend Deployment](backend/README.md)
- [AI Service Deployment](ai-services/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.