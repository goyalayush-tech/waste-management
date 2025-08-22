// API Client Factory - switches between real and mock clients
import { AiApiClient } from './aiClient';
import { EprApiClient } from './eprClient';
import { BlockchainApiClient } from './blockchainClient';
import { AuthApiClient } from './authClient';
import { AiMockClient } from './mocks/aiMockClient';

// Configuration interface
export interface ApiClientConfig {
  useMockAi?: boolean;
  useMockEpr?: boolean;
  useMockBlockchain?: boolean;
  useMockAuth?: boolean;
  baseUrls?: {
    ai?: string;
    epr?: string;
    blockchain?: string;
    auth?: string;
  };
  timeout?: number;
  retries?: number;
}

// Default configuration
const defaultConfig: ApiClientConfig = {
  useMockAi: process.env.REACT_APP_USE_MOCK_AI === 'true',
  useMockEpr: process.env.REACT_APP_USE_MOCK_EPR === 'true',
  useMockBlockchain: process.env.REACT_APP_USE_MOCK_BLOCKCHAIN === 'true',
  useMockAuth: process.env.REACT_APP_USE_MOCK_AUTH === 'true',
  baseUrls: {
    ai: process.env.REACT_APP_AI_API_URL,
    epr: process.env.REACT_APP_EPR_API_URL,
    blockchain: process.env.REACT_APP_BLOCKCHAIN_API_URL,
    auth: process.env.REACT_APP_AUTH_API_URL,
  },
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000'),
  retries: parseInt(process.env.REACT_APP_API_RETRIES || '3'),
};

export class ApiClientFactory {
  private static instance: ApiClientFactory;
  private config: ApiClientConfig;
  private clients: {
    ai?: AiApiClient;
    epr?: EprApiClient;
    blockchain?: BlockchainApiClient;
    auth?: AuthApiClient;
  } = {};

  private constructor(config: ApiClientConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  static getInstance(config?: ApiClientConfig): ApiClientFactory {
    if (!ApiClientFactory.instance) {
      ApiClientFactory.instance = new ApiClientFactory(config);
    }
    return ApiClientFactory.instance;
  }

  // Update configuration
  updateConfig(config: Partial<ApiClientConfig>) {
    this.config = { ...this.config, ...config };
    // Clear cached clients to force recreation with new config
    this.clients = {};
  }

  // Get AI API client
  getAiClient(): AiApiClient {
    if (!this.clients.ai) {
      if (this.config.useMockAi) {
        this.clients.ai = new AiMockClient();
      } else {
        this.clients.ai = new AiApiClient({
          baseURL: this.config.baseUrls?.ai,
          timeout: this.config.timeout,
          retries: this.config.retries,
        });
      }
    }
    return this.clients.ai;
  }

  // Get EPR API client
  getEprClient(): EprApiClient {
    if (!this.clients.epr) {
      this.clients.epr = new EprApiClient({
        baseURL: this.config.baseUrls?.epr,
        timeout: this.config.timeout,
        retries: this.config.retries,
        useMock: this.config.useMockEpr,
      });
    }
    return this.clients.epr;
  }

  // Get Blockchain API client
  getBlockchainClient(): BlockchainApiClient {
    if (!this.clients.blockchain) {
      this.clients.blockchain = new BlockchainApiClient({
        baseURL: this.config.baseUrls?.blockchain,
        timeout: this.config.timeout,
        retries: this.config.retries,
        useMock: this.config.useMockBlockchain,
      });
    }
    return this.clients.blockchain;
  }

  // Get Auth API client
  getAuthClient(): AuthApiClient {
    if (!this.clients.auth) {
      this.clients.auth = new AuthApiClient({
        baseURL: this.config.baseUrls?.auth,
        timeout: this.config.timeout,
        retries: this.config.retries,
        useMock: this.config.useMockAuth,
      });
    }
    return this.clients.auth;
  }

  // Health check all services
  async healthCheckAll(): Promise<{
    ai: { status: 'ok' | 'error'; message?: string };
    epr: { status: 'ok' | 'error'; message?: string };
    blockchain: { status: 'ok' | 'error'; message?: string };
    auth: { status: 'ok' | 'error'; message?: string };
  }> {
    const results = await Promise.allSettled([
      this.getAiClient().healthCheck().then(() => ({ status: 'ok' as const })),
      this.getEprClient().healthCheck().then(() => ({ status: 'ok' as const })),
      this.getBlockchainClient().healthCheck().then(() => ({ status: 'ok' as const })),
      this.getAuthClient().healthCheck().then(() => ({ status: 'ok' as const })),
    ]);

    return {
      ai: results[0].status === 'fulfilled' 
        ? results[0].value 
        : { status: 'error', message: (results[0].reason as Error).message },
      epr: results[1].status === 'fulfilled' 
        ? results[1].value 
        : { status: 'error', message: (results[1].reason as Error).message },
      blockchain: results[2].status === 'fulfilled' 
        ? results[2].value 
        : { status: 'error', message: (results[2].reason as Error).message },
      auth: results[3].status === 'fulfilled' 
        ? results[3].value 
        : { status: 'error', message: (results[3].reason as Error).message },
    };
  }

  // Toggle mock mode for specific service
  toggleMockMode(service: 'ai' | 'epr' | 'blockchain' | 'auth', useMock: boolean) {
    switch (service) {
      case 'ai':
        this.config.useMockAi = useMock;
        delete this.clients.ai;
        break;
      case 'epr':
        this.config.useMockEpr = useMock;
        delete this.clients.epr;
        break;
      case 'blockchain':
        this.config.useMockBlockchain = useMock;
        delete this.clients.blockchain;
        break;
      case 'auth':
        this.config.useMockAuth = useMock;
        delete this.clients.auth;
        break;
    }
  }

  // Get current configuration
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }

  // Reset all clients (useful for testing or configuration changes)
  reset() {
    this.clients = {};
  }
}

// Convenience exports for direct access
export const apiClientFactory = ApiClientFactory.getInstance();

export const aiClient = () => apiClientFactory.getAiClient();
export const eprClient = () => apiClientFactory.getEprClient();
export const blockchainClient = () => apiClientFactory.getBlockchainClient();
export const authClient = () => apiClientFactory.getAuthClient();

// Environment-based configuration helper
export const configureApiClients = (overrides: Partial<ApiClientConfig> = {}) => {
  const config: ApiClientConfig = {
    // Default to mock in development, real in production
    useMockAi: process.env.NODE_ENV === 'development',
    useMockEpr: process.env.NODE_ENV === 'development',
    useMockBlockchain: process.env.NODE_ENV === 'development',
    useMockAuth: process.env.NODE_ENV === 'development',
    
    // Override with environment variables
    ...defaultConfig,
    
    // Override with provided config
    ...overrides,
  };

  apiClientFactory.updateConfig(config);
  return config;
};

// Development helper to easily switch between mock and real APIs
export const devApiControls = {
  enableMockAi: () => apiClientFactory.toggleMockMode('ai', true),
  disableMockAi: () => apiClientFactory.toggleMockMode('ai', false),
  enableMockEpr: () => apiClientFactory.toggleMockMode('epr', true),
  disableMockEpr: () => apiClientFactory.toggleMockMode('epr', false),
  enableMockBlockchain: () => apiClientFactory.toggleMockMode('blockchain', true),
  disableMockBlockchain: () => apiClientFactory.toggleMockMode('blockchain', false),
  enableMockAuth: () => apiClientFactory.toggleMockMode('auth', true),
  disableMockAuth: () => apiClientFactory.toggleMockMode('auth', false),
  enableAllMocks: () => {
    apiClientFactory.toggleMockMode('ai', true);
    apiClientFactory.toggleMockMode('epr', true);
    apiClientFactory.toggleMockMode('blockchain', true);
    apiClientFactory.toggleMockMode('auth', true);
  },
  disableAllMocks: () => {
    apiClientFactory.toggleMockMode('ai', false);
    apiClientFactory.toggleMockMode('epr', false);
    apiClientFactory.toggleMockMode('blockchain', false);
    apiClientFactory.toggleMockMode('auth', false);
  },
  getStatus: () => apiClientFactory.getConfig(),
  healthCheck: () => apiClientFactory.healthCheckAll(),
};

// Make dev controls available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).devApiControls = devApiControls;
}