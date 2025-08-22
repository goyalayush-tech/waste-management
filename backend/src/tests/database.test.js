/**
 * Database connection and setup tests
 */

import { jest } from '@jest/globals';
import { 
  initializeDatabases, 
  closeDatabases,
  connectMongoDB,
  connectPostgreSQL,
  connectRedis
} from '../config/database.js';
import { 
  cacheManager,
  postgresManager,
  mongoManager,
  healthChecker
} from '../utils/connectionUtils.js';
import { 
  runPostgreSQLMigrations,
  setupMongoDBCollections
} from '../utils/migrationRunner.js';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/waste-verification-test';
process.env.POSTGRES_DB = 'epr_compliance_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

describe('Database Configuration', () => {
  beforeAll(async () => {
    // Initialize test databases
    await initializeDatabases();
  });

  afterAll(async () => {
    // Clean up test databases
    await closeDatabases();
  });

  describe('MongoDB Connection', () => {
    test('should connect to MongoDB successfully', async () => {
      const connection = await connectMongoDB();
      expect(connection).toBeDefined();
      expect(connection.connection.readyState).toBe(1); // Connected
    });

    test('should create MongoDB collections and indexes', async () => {
      await setupMongoDBCollections();
      
      const collections = await mongoManager.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      expect(collectionNames).toContain('users');
      expect(collectionNames).toContain('wastesubmissions');
      expect(collectionNames).toContain('wastecredits');
      expect(collectionNames).toContain('blockchaintransactions');
      expect(collectionNames).toContain('ipfsmetadata');
    });

    test('should have proper indexes on collections', async () => {
      const usersIndexes = await mongoManager.db.collection('users').indexes();
      const submissionsIndexes = await mongoManager.db.collection('wastesubmissions').indexes();
      
      expect(usersIndexes.some(idx => idx.key.email)).toBe(true);
      expect(submissionsIndexes.some(idx => idx.key.vendorId)).toBe(true);
    });
  });

  describe('PostgreSQL Connection', () => {
    test('should connect to PostgreSQL successfully', async () => {
      const connection = await connectPostgreSQL();
      expect(connection).toBeDefined();
      
      // Test connection with a simple query
      const [results] = await connection.query('SELECT 1 as test');
      expect(results[0].test).toBe(1);
    });

    test('should run PostgreSQL migrations successfully', async () => {
      await runPostgreSQLMigrations();
      
      // Check if tables were created
      const tables = await postgresManager.sequelize.getQueryInterface().showAllTables();
      
      expect(tables).toContain('clients');
      expect(tables).toContain('documents');
      expect(tables).toContain('recycler_master');
      expect(tables).toContain('audit_results');
      expect(tables).toContain('compliance_scores');
      expect(tables).toContain('audit_trails');
      expect(tables).toContain('billing_records');
    });

    test('should have proper table structure', async () => {
      const clientsTable = await postgresManager.getTableInfo('clients');
      
      expect(clientsTable.id).toBeDefined();
      expect(clientsTable.name).toBeDefined();
      expect(clientsTable.email).toBeDefined();
      expect(clientsTable.subscription_tier).toBeDefined();
    });
  });

  describe('Redis Connection', () => {
    test('should connect to Redis successfully', async () => {
      const client = await connectRedis();
      expect(client).toBeDefined();
      expect(client.isOpen).toBe(true);
    });

    test('should perform basic Redis operations', async () => {
      await cacheManager.set('test_key', { message: 'test_value' }, 60);
      const value = await cacheManager.get('test_key');
      
      expect(value).toEqual({ message: 'test_value' });
      
      await cacheManager.del('test_key');
      const deletedValue = await cacheManager.get('test_key');
      expect(deletedValue).toBeNull();
    });

    test('should handle session management', async () => {
      const sessionId = 'test_session_123';
      const sessionData = { userId: 'user123', role: 'vendor' };
      
      await cacheManager.setSession(sessionId, sessionData, 3600);
      const retrievedSession = await cacheManager.getSession(sessionId);
      
      expect(retrievedSession).toEqual(sessionData);
      
      await cacheManager.delSession(sessionId);
      const deletedSession = await cacheManager.getSession(sessionId);
      expect(deletedSession).toBeNull();
    });
  });

  describe('Health Checks', () => {
    test('should check all database connections', async () => {
      const status = await healthChecker.checkAllConnections();
      
      expect(status.mongodb).toBe(true);
      expect(status.postgresql).toBe(true);
      expect(status.redis).toBe(true);
      expect(status.timestamp).toBeDefined();
    });

    test('should gather database statistics', async () => {
      const stats = await healthChecker.getDatabaseStats();
      
      expect(stats.mongodb).toBeDefined();
      expect(stats.postgresql).toBeDefined();
      expect(stats.redis).toBeDefined();
      expect(stats.timestamp).toBeDefined();
    });
  });

  describe('Utility Managers', () => {
    test('should perform MongoDB operations', async () => {
      const exists = await mongoManager.collectionExists('users');
      expect(exists).toBe(true);
      
      const collection = await mongoManager.getCollection('users');
      expect(collection).toBeDefined();
    });

    test('should perform PostgreSQL operations', async () => {
      const exists = await postgresManager.tableExists('clients');
      expect(exists).toBe(true);
      
      const results = await postgresManager.query('SELECT COUNT(*) as count FROM clients');
      expect(results[0].count).toBeDefined();
    });

    test('should handle cache patterns', async () => {
      await cacheManager.setWithPattern('user', '123', { name: 'Test User' }, 60);
      const value = await cacheManager.getWithPattern('user', '123');
      
      expect(value).toEqual({ name: 'Test User' });
      
      await cacheManager.delPattern('user');
      const deletedValue = await cacheManager.getWithPattern('user', '123');
      expect(deletedValue).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle MongoDB connection errors gracefully', async () => {
      // Mock a connection error
      const originalUri = process.env.MONGODB_URI;
      process.env.MONGODB_URI = 'mongodb://invalid:27017/test';
      
      await expect(connectMongoDB()).rejects.toThrow();
      
      // Restore original URI
      process.env.MONGODB_URI = originalUri;
    });

    test('should handle Redis connection errors gracefully', async () => {
      // Mock a connection error
      const originalUrl = process.env.REDIS_URL;
      process.env.REDIS_URL = 'redis://invalid:6379';
      
      await expect(connectRedis()).rejects.toThrow();
      
      // Restore original URL
      process.env.REDIS_URL = originalUrl;
    });
  });
});