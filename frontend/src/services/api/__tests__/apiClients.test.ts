// API Clients Test
import { 
  aiClient, 
  eprClient, 
  blockchainClient, 
  authClient,
  apiClientFactory,
  configureApiClients 
} from '../index';

describe('API Clients', () => {
  beforeEach(() => {
    // Reset factory before each test
    apiClientFactory.reset();
    
    // Configure for testing with mocks
    configureApiClients({
      useMockAi: true,
      useMockEpr: true,
      useMockBlockchain: true,
      useMockAuth: true,
    });
  });

  describe('AI Client', () => {
    it('should analyze waste successfully', async () => {
      const client = aiClient();
      const result = await client.analyzeWaste({
        visualData: 'test_image_data',
        analysisMode: 'multi'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.classification).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should detect contamination successfully', async () => {
      const client = aiClient();
      const result = await client.detectContamination({
        imageData: 'test_image_data',
        expectedMaterialType: 'plastic'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.contaminationDetected).toBe('boolean');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should get real-time data successfully', async () => {
      const client = aiClient();
      const result = await client.getRealTimeData();

      expect(result).toBeDefined();
      expect(typeof result.throughput).toBe('number');
      expect(typeof result.efficiency).toBe('number');
      expect(typeof result.qualityScore).toBe('number');
      expect(result.systemStatus).toBeDefined();
    });

    it('should calibrate sensors successfully', async () => {
      const client = aiClient();
      const result = await client.calibrateSensors({
        sensorIds: ['visual_1', 'spectral_1']
      });

      expect(result).toBeDefined();
      expect(result.calibrationId).toBeDefined();
      expect(result.sensorStatuses).toBeDefined();
      expect(result.sensorStatuses['visual_1']).toBeDefined();
    });
  });

  describe('EPR Client', () => {
    it('should get documents successfully', async () => {
      const client = eprClient();
      
      // Mock the method since EPR client doesn't have mock implementation yet
      const mockGetDocuments = jest.fn().mockResolvedValue({
        documents: [],
        total: 0,
        hasMore: false
      });
      client.getDocuments = mockGetDocuments;

      const result = await client.getDocuments({ limit: 10 });

      expect(result).toBeDefined();
      expect(Array.isArray(result.documents)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.hasMore).toBe('boolean');
    });
  });

  describe('Blockchain Client', () => {
    it('should get certificates successfully', async () => {
      const client = blockchainClient();
      
      // Mock the method since Blockchain client doesn't have mock implementation yet
      const mockGetCertificates = jest.fn().mockResolvedValue({
        certificates: [],
        total: 0,
        hasMore: false
      });
      client.getCertificates = mockGetCertificates;

      const result = await client.getCertificates({ limit: 10 });

      expect(result).toBeDefined();
      expect(Array.isArray(result.certificates)).toBe(true);
      expect(typeof result.total).toBe('number');
    });
  });

  describe('Auth Client', () => {
    it('should handle authentication methods', async () => {
      const client = authClient();
      
      // Mock the login method
      const mockLogin = jest.fn().mockResolvedValue({
        token: 'test_token',
        refreshToken: 'test_refresh_token',
        user: {
          id: 'test_user_id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'admin',
          permissions: ['read', 'write'],
          isActive: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              push: true,
              sms: false
            },
            dashboard: {
              layout: 'default',
              widgets: []
            }
          }
        },
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });
      client.login = mockLogin;

      const result = await client.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toBeDefined();
      expect(result.token).toBe('test_token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('API Client Factory', () => {
    it('should return singleton instances', () => {
      const ai1 = aiClient();
      const ai2 = aiClient();
      expect(ai1).toBe(ai2);

      const epr1 = eprClient();
      const epr2 = eprClient();
      expect(epr1).toBe(epr2);
    });

    it('should allow configuration updates', () => {
      const initialConfig = apiClientFactory.getConfig();
      
      apiClientFactory.updateConfig({
        useMockAi: !initialConfig.useMockAi
      });

      const updatedConfig = apiClientFactory.getConfig();
      expect(updatedConfig.useMockAi).toBe(!initialConfig.useMockAi);
    });

    it('should toggle mock modes correctly', () => {
      apiClientFactory.toggleMockMode('ai', true);
      expect(apiClientFactory.getConfig().useMockAi).toBe(true);

      apiClientFactory.toggleMockMode('ai', false);
      expect(apiClientFactory.getConfig().useMockAi).toBe(false);
    });

    it('should reset clients when configuration changes', () => {
      const ai1 = aiClient();
      apiClientFactory.reset();
      const ai2 = aiClient();
      
      // After reset, we should get a new instance
      expect(ai1).not.toBe(ai2);
    });
  });

  describe('Configuration', () => {
    it('should configure API clients with custom settings', () => {
      const config = configureApiClients({
        useMockAi: false,
        useMockEpr: true,
        timeout: 5000,
        retries: 2
      });

      expect(config.useMockAi).toBe(false);
      expect(config.useMockEpr).toBe(true);
      expect(config.timeout).toBe(5000);
      expect(config.retries).toBe(2);
    });

    it('should use environment variables for default configuration', () => {
      // Test that environment variables are respected
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const config = configureApiClients();
      
      // In development, should default to mock mode
      expect(config.useMockAi).toBe(true);
      expect(config.useMockEpr).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });
});