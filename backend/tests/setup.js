// Jest setup file for backend tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
// process.env.MONGODB_URI = 'mongodb://localhost:27017/waste-verification-test';
// process.env.REDIS_URL = 'redis://localhost:6379/1';

// Mock external services
jest.mock('../src/services/fileUploadService.js', () => ({
  processUploadedFiles: jest.fn(),
  getUploadMiddleware: jest.fn(() => (req, res, next) => next()),
  ipfs: { id: jest.fn() },
  s3: { headBucket: jest.fn() },
}));

jest.mock('../src/services/virusScanService.js', () => ({
  scanFile: jest.fn(),
  performHeuristicScan: jest.fn(),
  performSignatureScan: jest.fn(),
  calculateConfidenceScore: jest.fn(),
}));

// Mock authentication middleware
jest.mock('../src/middleware/auth.js', () => ({
  __esModule: true,
  default: {
    authenticate: (req, res, next) => {
      req.user = {
        id: 'test-user-id',
        role: 'vendor',
        email: 'test@example.com',
      };
      next();
    },
    sensitiveOperationLimit: () => (req, res, next) => next(),
  },
}));

// Global test timeout
jest.setTimeout(30000);