// API Services - Main exports
export * from './baseClient';
export * from './aiClient';
export * from './eprClient';
export * from './blockchainClient';
export * from './authClient';
export * from './apiClientFactory';

// Re-export commonly used clients
export {
  aiClient,
  eprClient,
  blockchainClient,
  authClient,
  apiClientFactory,
  configureApiClients,
  devApiControls,
} from './apiClientFactory';

// Type exports for convenience
export type {
  ApiConfig,
  ApiError,
} from './baseClient';

export type {
  WasteAnalysisRequest,
  WasteAnalysisResult,
  ContaminationDetectionRequest,
  ContaminationResult,
  RareMaterialResult,
  SensorCalibrationResult,
  RealTimeDataResponse,
} from './aiClient';

export type {
  DocumentUploadRequest,
  DocumentUploadResponse,
  Document,
  OcrResult,
  AuditResult,
  RecyclerMaster,
  ComplianceScore,
  Client as EprClient,
  BillingRecord,
} from './eprClient';

export type {
  WasteCertificate,
  DigitalTwin,
  CarbonCredit,
  StakingPool,
  StakingPosition,
  Transaction,
  WalletInfo,
} from './blockchainClient';

export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from './authClient';