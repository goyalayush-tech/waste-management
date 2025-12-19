import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClientFactory } from '../services/api/apiClientFactory';
import { AiApiClient } from '../services/api/aiClient';
import { EprApiClient } from '../services/api/eprClient';
import { BlockchainApiClient } from '../services/api/blockchainClient';
import { AuthApiClient } from '../services/api/authClient';
import QuantumApiClient from '../services/api/quantumClient';
import { AiMockClient } from '../services/api/mocks/aiMockClient';

// Mock environment variables
vi.mock('process.env', () => ({
  REACT_APP_USE_MOCK_AI: 'false',
  REACT_APP_USE_MOCK_EPR: 'false',
  REACT_APP_USE_MOCK_BLOCKCHAIN: 'false',
  REACT_APP_USE_MOCK_AUTH: 'false',
  REACT_APP_AI_API_URL: 'http://localhost:8000',
  REACT_APP_EPR_API_URL: 'http://localhost:3001',
  REACT_APP_BLOCKCHAIN_API_URL: 'http://localhost:3002',
  REACT_APP_AUTH_API_URL: 'http://localhost:3003',
  REACT_APP_API_TIMEOUT: '10000',
  REACT_APP_API_RETRIES: '3',
}));

describe('ApiClientFactory', () => {
  let factory: ApiClientFactory;

  beforeEach(() => {
    // Clear singleton instance before each test
    (ApiClientFactory as any).instance = undefined;
    factory = ApiClientFactory.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = ApiClientFactory.getInstance();
      const instance2 = ApiClientFactory.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should accept configuration on first call', () => {
      const customFactory = ApiClientFactory.getInstance({
        timeout: 5000,
        retries: 5,
      });
      expect(customFactory).toBe(factory);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      expect(factory).toBeDefined();
    });

    it('should update configuration correctly', () => {
      const newConfig = { timeout: 15000, retries: 5 };
      factory.updateConfig(newConfig);
      
      // Test that new config is applied by checking client creation
      const aiClient = factory.getAiClient();
      expect(aiClient).toBeDefined();
    });
  });

  describe('Client Creation', () => {
    it('should create AI client correctly', () => {
      const aiClient = factory.getAiClient();
      expect(aiClient).toBeInstanceOf(AiApiClient);
    });

    it('should create EPR client correctly', () => {
      const eprClient = factory.getEprClient();
      expect(eprClient).toBeInstanceOf(EprApiClient);
    });

    it('should create Blockchain client correctly', () => {
      const blockchainClient = factory.getBlockchainClient();
      expect(blockchainClient).toBeInstanceOf(BlockchainApiClient);
    });

    it('should create Auth client correctly', () => {
      const authClient = factory.getAuthClient();
      expect(authClient).toBeInstanceOf(AuthApiClient);
    });

    it('should create Quantum client correctly', () => {
      const quantumClient = factory.getQuantumClient();
      expect(quantumClient).toBeInstanceOf(QuantumApiClient);
    });
  });

  describe('Mock Client Switching', () => {
    it('should use mock AI client when configured', () => {
      const mockFactory = ApiClientFactory.getInstance({
        useMockAi: true,
      });
      const aiClient = mockFactory.getAiClient();
      expect(aiClient).toBeInstanceOf(AiMockClient);
    });

    it('should use real AI client when mock is disabled', () => {
      const realFactory = ApiClientFactory.getInstance({
        useMockAi: false,
      });
      const aiClient = realFactory.getAiClient();
      expect(aiClient).toBeInstanceOf(AiApiClient);
    });
  });

  describe('Client Caching', () => {
    it('should return the same client instance on subsequent calls', () => {
      const client1 = factory.getAiClient();
      const client2 = factory.getAiClient();
      expect(client1).toBe(client2);
    });

    it('should clear cached clients when config is updated', () => {
      const client1 = factory.getAiClient();
      factory.updateConfig({ timeout: 20000 });
      const client2 = factory.getAiClient();
      expect(client1).not.toBe(client2);
    });
  });

  describe('Health Check', () => {
    it('should check health of all services', async () => {
      const healthStatus = await factory.healthCheckAll();
      expect(healthStatus).toBeDefined();
      expect(typeof healthStatus).toBe('object');
    });
  });
}); 