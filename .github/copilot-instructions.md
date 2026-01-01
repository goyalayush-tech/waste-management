# Copilot Instructions: Delhi Waste Verification & EPR Compliance System

## System Overview

**integrated-waste-epr-system** is an enterprise platform for waste claim verification and regulatory compliance in India. It combines AI, blockchain, OCR, and audit engine technologies to automate EPR (Extended Producer Responsibility) compliance verification aligned with Indian plastic waste management rules.

### Architecture: 4-Tier Multi-Service Stack

```
Frontend (React 18 + TypeScript + Vite)
    ↓ REST/WebSocket
Backend API (Flask + PostgreSQL + MongoDB)
    ├─ EPR Compliance Logic
    ├─ Blockchain Integration
    └─ WebSocket: Real-time audit events
    ↓ HTTP
AI Services (FastAPI + Python ML)
    ├─ Waste Classification (YOLOv8)
    ├─ Contamination Detection
    ├─ OCR & Document Processing
    └─ Multi-modal Sensor Fusion
↓ Smart Contracts
Blockchain (Solidity + Polygon)
    └─ Certificate Storage + Audit Trail
```

**Critical**: AI services run independently (port 8001); they're NOT embedded in backend.

---

## Essential Developer Workflows

### Development Environment Setup

```bash
# One-time setup (choose your OS)
./scripts/setup-dev.sh              # Linux/macOS
.\scripts\setup-dev.bat             # Windows PowerShell

# Start everything
npm run dev
# Starts: Frontend (5173) + Backend (3001) + AI Service (8001) + Docker services

# Check services are healthy
curl http://localhost:3001/health
curl http://localhost:8001/health
```

### Docker Services (Always Running)

```bash
# Already in docker-compose.yml (started by setup script)
- MongoDB (27017): Waste verification data
- PostgreSQL (5432): EPR compliance data
- Redis (6379): Cache + session store

# View logs
docker-compose logs -f [service_name]
```

### Testing Strategy

```bash
# All tests
npm run test

# By service
npm run test:frontend               # Vitest + Playwright E2E
npm run test:backend                # Pytest
npm run test:ai                     # Pytest + async tests
npm run test:blockchain             # Hardhat + Mocha

# Coverage (CI gate: 70% minimum)
npm run test:coverage
```

### Port Allocation (NEVER CHANGE)

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Frontend | 5173 | HTTP | Vite dev server |
| Backend | 3001 | HTTP/WS | Flask API + WebSocket |
| AI Service | 8001 | HTTP | FastAPI |
| MongoDB | 27017 | TCP | Document store |
| PostgreSQL | 5432 | TCP | Relational store |
| Redis | 6379 | TCP | Cache |
| Blockchain (local) | 8545 | HTTP | Hardhat node |

---

## Codebase Patterns & Conventions

### Backend (Flask + SQLAlchemy)

**Database Models** (`backend/app/models/`):
- Use Enum for stateful fields (e.g., `CollectionStatus.PENDING`, `UserType.AUDITOR`)
- Always include `created_at`, `updated_at`, `id` (primary key)
- Example: `backend/app/models/collection.py` → CollectionStatus enums + Collection model

**Routes** (`backend/app/routes/`):
- Blueprint pattern: Each route file is a blueprint (auth.py, blockchain.py, etc.)
- Registered in `backend/app/__init__.py` with `/api/{feature}` prefix
- Example: `auth_bp` registered at `/api/auth` → routes like `POST /api/auth/login`

**Services** (`backend/app/services/`):
- Business logic layer (NOT in routes)
- `analytics_service.py`, `reporting_service.py`
- Always return plain dicts/lists, not DB models (ORM abstraction)

**Configuration** (`backend/config.py`):
- All environment variables here
- Delhi zone data + waste type definitions embedded
- Never hardcode secrets; use `os.environ.get()`

**WebSocket** (`backend/app/websocket_events.py`):
- Real-time audit trail events
- Clients connected to `/api/audit-stream`
- Events: claim verification progress, anomaly detection, auditor actions

### Frontend (React 18 + Redux Toolkit)

**Redux Store** (`frontend/src/store/`):
- Slices: `navigationSlice`, `dashboardSlice`, `claimCleanSlice`, `uiSlice`, `contaminationSlice`
- Async actions: Use `createAsyncThunk` for API calls
- State shape: Each slice handles ONE domain (e.g., claimClean slice manages all claim verification state)

**API Clients** (`frontend/src/services/api/`):
- `apiClientFactory.ts`: Creates axios instance with interceptors (auth token, retry logic)
- `authClient.ts`, `eprClient.ts`, `aiClient.ts`, `blockchainClient.ts`
- Mock services in `mocks/` for local dev (when backend unavailable)

**Components** (`frontend/src/components/`):
- File structure: `ComponentName/index.tsx`, `ComponentName.module.css`
- Custom hooks: `useAuth.tsx` (authentication context), `useOnboarding.tsx`
- Ant Design for UI components + TailwindCSS for styling

**Routes** (`frontend/src/routes/`):
- React Router v6
- Protected routes: Check `useAuth()` + redirect to login if unauthorized
- Structure: `/claims`, `/dashboard`, `/audit`, `/admin`

### AI Services (FastAPI + Python ML)

**Entry Point** (`ai-services/waste_classification_ai.py`):
- Async functions using `async def`
- Request validation: Pydantic models
- Response format: JSON with `{"status": "success"|"error", "data": {...}, "confidence": 0.0-1.0}`

**Models**:
- YOLOv8 for waste object detection (`object_detection.py`)
- TensorFlow for material classification (`waste_classification_ai.py`)
- Custom CNN for contamination detection (`contamination_detection.py`)

**Test Pattern** (`ai-services/tests/`):
- Use `pytest-asyncio` for async tests
- Fixtures in `conftest.py`: Mock models, sample images
- Example: `test_contamination_detection.py` → tests complete workflow including severity scoring

### Blockchain (Solidity + Hardhat)

**Smart Contracts** (`blockchain/contracts/`):
- Main: `WasteVerificationNFT.sol` (ERC-721 for certificates)
- Storage: `WasteRegistry.sol` (IPFS hash + on-chain metadata)
- Audit: `AuditTrail.sol` (immutable event log)

**Deployment** (`blockchain/scripts/deploy.js`):
- Target: Polygon Mumbai testnet (cheaper than mainnet)
- RPC URL: `POLYGON_RPC_URL` in env
- Verify: Use Polygonscan API for contract verification

**Testing** (`blockchain/test/`):
- Hardhat + Chai assertions
- Setup: Deploy contract → test minting/burning → check storage

---

## Cross-Component Communication Patterns

### Frontend → Backend (REST)

```typescript
// Example: Submit waste claim
await eprClient.post('/api/waste/claims', {
  recycler_id: '12345',
  waste_data: { weight_kg: 100, material_type: 'HDPE' },
  image_urls: ['/uploads/image1.jpg']
});
// Returns: { claim_id, status: 'PENDING_AI_VERIFICATION', created_at }
```

### Frontend → AI Service (Direct HTTP)

```typescript
// Example: Verify waste image
const response = await aiClient.post('/verify-waste', formData, {
  params: { confidence_threshold: 0.85 }
});
// Returns: { material, confidence, contamination_level, recommendation }
```

### Backend → AI Service (Python `requests`)

```python
# backend/app/services/verification.py
import requests
ai_response = requests.post(
    'http://localhost:8001/verify-waste',
    files={'image': image_data},
    timeout=30
)
```

### Backend ↔ Blockchain

```python
# backend/app/routes/blockchain.py
from web3 import Web3
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
tx_hash = contract.functions.mintCertificate(claim_id, ipfs_hash).transact()
```

### Real-Time Events (WebSocket)

```python
# backend: emit on claim verification complete
socketio.emit('claim_verified', {
    'claim_id': claim_id,
    'confidence_score': 0.92,
    'recommendation': 'APPROVE'
}, room=user_id)

# frontend: listen
socket.on('claim_verified', (data) => {
  dispatch(updateClaimStatus(data));
});
```

---

## Project-Specific Conventions

### Naming Conventions

**Database**: Snake_case (PostgreSQL/MongoDB)
- `waste_bins`, `blockchain_transactions`, `created_at`

**Python**: snake_case (PEP 8)
- `def verify_waste_claim()`, `class ContaminationDetector`

**TypeScript/JavaScript**: camelCase
- `async function submitClaim()`, `interface ClaimRequest`

**URLs**: kebab-case
- `/api/waste/claims`, `/api/audit/reports`

### Configuration Management

**Environment Tiers**:
- **Development** (default): Local services, verbose logging
- **Production**: Cloud databases, minimal logging, security hardened

**Secrets**:
- Never commit `.env` files
- Backend has `.env.example` → copy and populate locally
- Frontend env vars: Prefixed with `REACT_APP_` (hardcoded at build time)
- AI services: `.env.example` → copy locally

### Error Handling

**Backend**: Return HTTP status codes + JSON error details
```python
# backend/app/utils/errors.py
@app.errorhandler(ValidationError)
def handle_validation_error(error):
    return {'error': 'Invalid input', 'details': str(error)}, 400
```

**Frontend**: Intercept errors in API clients, dispatch to Redux error state
```typescript
// frontend/src/services/api/baseClient.ts
client.interceptors.response.use(
  (response) => response,
  (error) => {
    dispatch(setError(error.response?.data?.error));
    return Promise.reject(error);
  }
);
```

**AI Services**: Return HTTP 422 (Unprocessable Entity) for ML failures
```python
# ai-services/waste_classification_ai.py
if confidence < threshold:
    raise HTTPException(status_code=422, detail=f"Low confidence: {confidence}")
```

---

## Critical Integration Points

### Claim Verification Workflow (End-to-End)

1. **Frontend**: User uploads waste image + metadata → POST `/api/waste/claims`
2. **Backend**: Store claim in MongoDB, emit WebSocket event `claim_submitted`
3. **Backend**: Queue async task → call AI service at `http://localhost:8001/verify-waste`
4. **AI Service**: Classify waste, return confidence + contamination level
5. **Backend**: Store verification result, calculate ClaimClean score (7 components)
6. **Backend**: If confidence > 0.90 → auto-approve; if < 0.50 → escalate to auditor
7. **Backend**: Mint blockchain certificate (on-chain: hash + metadata; IPFS: full data)
8. **Frontend**: Listen for WebSocket event `claim_verified`, update dashboard

**Key Files**: `backend/app/routes/waste.py` (trigger), `ai-services/waste_classification_ai.py` (verification), `blockchain/contracts/WasteVerificationNFT.sol` (storage)

### Auditor Review Workflow

1. **Backend**: Query claims with status `PENDING_AUDITOR_REVIEW` (confidence 50-90%)
2. **Frontend**: Load claim details (image, AI confidence, contamination data)
3. **Auditor**: Approve/reject with reason
4. **Backend**: Update MongoDB claim, emit WebSocket `auditor_decision`
5. **Backend**: If approved → mint blockchain certificate

**Key Files**: `backend/app/routes/collections.py` (auditor actions), `backend/app/services/reporting_service.py` (fetch auditable claims)

### Regulatory Reporting (India-Specific)

**Auto-Fill**: Form-1/Form-4 compliance reports aligned with Plastic Waste Management Rules 2016/2022
- Data source: PostgreSQL `epr_compliance` table
- Generation: `backend/app/services/reporting_service.py`
- Output: JSON → downloadable Excel

**Key Files**: `backend/postgres-schema.sql` (compliance schema), `backend/app/routes/analytics.py` (reporting API)

---

## Debugging & Diagnostics

### Port Already in Use (Common Issue)

```powershell
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | 
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### AI Service Not Responding

```bash
# Check if service is running
curl http://localhost:8001/health

# View logs
docker-compose logs ai-service

# Restart service
npm run dev:ai  # or manually: cd ai-services && python -m uvicorn main:app --reload --port 8001
```

### Database Connection Issues

```bash
# Check MongoDB
docker-compose exec mongodb mongosh admin -u admin -p password

# Check PostgreSQL
docker-compose exec postgresql psql -U postgres
```

### WebSocket Not Connecting

- Ensure backend running on 3001
- Check CORS settings in `backend/config.py`: `CORS_ORIGINS`
- Frontend should connect to same host: `const socket = io(window.location.origin)`

---

## Testing Local AI Models

```bash
cd ai-services

# Test waste classification
python -m pytest tests/test_rare_material_simple.py -v

# Test contamination detection
python -m pytest tests/test_contamination_detection.py -v -k "test_visual"

# Test with actual image
python -c "
from waste_classification_ai import verify_waste
result = verify_waste('path/to/image.jpg')
print(result)
"
```

---

## Deployment Targets

- **Frontend**: Vercel (free tier)
- **Backend**: Render (free tier for 90 days)
- **Databases**: Render PostgreSQL + Atlas MongoDB
- **Blockchain**: Polygon Mumbai (testnet) → Polygon Mainnet (production)
- **Storage**: IPFS via Pinata (paid tier)

See `deploy.sh` for step-by-step CLI-driven deployment.

---

## Key Files Quick Reference

| Purpose | File Path |
|---------|-----------|
| Backend config (DB, JWT, Redis) | `backend/config.py` |
| Database models | `backend/app/models/*.py` |
| Flask app factory | `backend/app/__init__.py` |
| Waste verification logic | `backend/app/routes/waste.py` |
| Redux store | `frontend/src/store/store.ts` |
| API client setup | `frontend/src/services/api/baseClient.ts` |
| AI main entry | `ai-services/waste_classification_ai.py` |
| Smart contract (certificates) | `blockchain/contracts/WasteVerificationNFT.sol` |
| Docker config | `docker-compose.yml` |
| Dev setup script | `scripts/setup-dev.sh` (or `.bat`) |

---

## Notes for AI Agents

- **Database dualism**: MongoDB (verification claims, images) + PostgreSQL (compliance records)
- **Async is critical**: Backend uses Flask-SocketIO + Celery; AI uses FastAPI + asyncio
- **AI model versioning**: YOLOv8 pinned to 8.0.206; TensorFlow to 2.13.0 (avoid auto-upgrades)
- **Blockchain is audit trail, not critical path**: Claims verified first; blockchain certification is asynchronous follow-up
- **India-specific logic**: Scoring components in `backend/config.py`; regulatory dates hardcoded (CPCB rules effective dates)
- **Multi-tenancy**: Not fully implemented yet; prepare for organization isolation in future versions
