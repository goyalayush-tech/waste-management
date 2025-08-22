/**
 * Database connection utilities
 * Provides easy access to database connections and common operations
 */

import { mongoConnection, postgresConnection, redisClient } from '../config/database.js';

/**
 * Get MongoDB connection
 */
export const getMongoConnection = () => {
  if (!mongoConnection) {
    throw new Error('MongoDB connection not initialized. Call initializeDatabases() first.');
  }
  return mongoConnection;
};

/**
 * Get PostgreSQL connection
 */
export const getPostgreSQLConnection = () => {
  if (!postgresConnection) {
    throw new Error('PostgreSQL connection not initialized. Call initializeDatabases() first.');
  }
  return postgresConnection;
};

/**
 * Get Redis client
 */
export const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis connection not initialized or closed. Call initializeDatabases() first.');
  }
  return redisClient;
};

/**
 * Redis cache utilities
 */
export class CacheManager {
  constructor() {
    this.redis = null;
  }

  async init() {
    this.redis = getRedisClient();
  }

  /**
   * Set cache with expiration
   */
  async set(key, value, expirationSeconds = 3600) {
    if (!this.redis) await this.init();
    
    const serializedValue = JSON.stringify(value);
    await this.redis.setEx(key, expirationSeconds, serializedValue);
  }

  /**
   * Get cache value
   */
  async get(key) {
    if (!this.redis) await this.init();
    
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Delete cache key
   */
  async del(key) {
    if (!this.redis) await this.init();
    
    await this.redis.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.redis) await this.init();
    
    return await this.redis.exists(key);
  }

  /**
   * Set cache with pattern-based expiration
   */
  async setWithPattern(pattern, key, value, expirationSeconds = 3600) {
    const fullKey = `${pattern}:${key}`;
    await this.set(fullKey, value, expirationSeconds);
  }

  /**
   * Get cache with pattern
   */
  async getWithPattern(pattern, key) {
    const fullKey = `${pattern}:${key}`;
    return await this.get(fullKey);
  }

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern) {
    if (!this.redis) await this.init();
    
    const keys = await this.redis.keys(`${pattern}:*`);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }

  /**
   * Increment counter
   */
  async incr(key, expirationSeconds = 3600) {
    if (!this.redis) await this.init();
    
    const value = await this.redis.incr(key);
    if (value === 1) {
      await this.redis.expire(key, expirationSeconds);
    }
    return value;
  }

  /**
   * Set session data
   */
  async setSession(sessionId, sessionData, expirationSeconds = 86400) {
    await this.setWithPattern('session', sessionId, sessionData, expirationSeconds);
  }

  /**
   * Get session data
   */
  async getSession(sessionId) {
    return await this.getWithPattern('session', sessionId);
  }

  /**
   * Delete session
   */
  async delSession(sessionId) {
    const fullKey = `session:${sessionId}`;
    await this.del(fullKey);
  }
}

/**
 * PostgreSQL query utilities
 */
export class PostgreSQLManager {
  constructor() {
    this.sequelize = null;
  }

  async init() {
    this.sequelize = getPostgreSQLConnection();
  }

  /**
   * Execute raw SQL query
   */
  async query(sql, replacements = []) {
    if (!this.sequelize) await this.init();
    
    const [results, metadata] = await this.sequelize.query(sql, {
      replacements,
      type: this.sequelize.QueryTypes.SELECT
    });
    
    return results;
  }

  /**
   * Execute transaction
   */
  async transaction(callback) {
    if (!this.sequelize) await this.init();
    
    return await this.sequelize.transaction(callback);
  }

  /**
   * Check if table exists
   */
  async tableExists(tableName) {
    if (!this.sequelize) await this.init();
    
    const queryInterface = this.sequelize.getQueryInterface();
    return await queryInterface.showAllTables().then(tables => 
      tables.includes(tableName)
    );
  }

  /**
   * Get table info
   */
  async getTableInfo(tableName) {
    if (!this.sequelize) await this.init();
    
    const queryInterface = this.sequelize.getQueryInterface();
    return await queryInterface.describeTable(tableName);
  }
}

/**
 * MongoDB utilities
 */
export class MongoDBManager {
  constructor() {
    this.mongoose = null;
    this.db = null;
  }

  async init() {
    this.mongoose = getMongoConnection();
    this.db = this.mongoose.connection.db;
  }

  /**
   * Get collection
   */
  async getCollection(collectionName) {
    if (!this.db) await this.init();
    
    return this.db.collection(collectionName);
  }

  /**
   * Check if collection exists
   */
  async collectionExists(collectionName) {
    if (!this.db) await this.init();
    
    return await this.db.listCollections({ name: collectionName }).hasNext();
  }

  /**
   * Create collection with validation
   */
  async createCollection(collectionName, validationSchema = null) {
    if (!this.db) await this.init();
    
    const options = {};
    if (validationSchema) {
      options.validator = validationSchema;
    }
    
    return await this.db.createCollection(collectionName, options);
  }

  /**
   * Aggregate query with error handling
   */
  async aggregate(collectionName, pipeline) {
    if (!this.db) await this.init();
    
    const collection = this.db.collection(collectionName);
    return await collection.aggregate(pipeline).toArray();
  }

  /**
   * Bulk operations
   */
  async bulkWrite(collectionName, operations) {
    if (!this.db) await this.init();
    
    const collection = this.db.collection(collectionName);
    return await collection.bulkWrite(operations);
  }
}

/**
 * Health check utilities
 */
export class HealthChecker {
  constructor() {
    this.cache = new CacheManager();
    this.postgres = new PostgreSQLManager();
    this.mongo = new MongoDBManager();
  }

  /**
   * Check all database connections
   */
  async checkAllConnections() {
    const results = {
      mongodb: false,
      postgresql: false,
      redis: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Check MongoDB
      await this.mongo.init();
      await this.mongo.db.admin().ping();
      results.mongodb = true;
    } catch (error) {
      console.error('MongoDB health check failed:', error.message);
    }

    try {
      // Check PostgreSQL
      await this.postgres.init();
      await this.postgres.query('SELECT 1');
      results.postgresql = true;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error.message);
    }

    try {
      // Check Redis
      await this.cache.init();
      await this.cache.redis.ping();
      results.redis = true;
    } catch (error) {
      console.error('Redis health check failed:', error.message);
    }

    return results;
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    const stats = {
      mongodb: {},
      postgresql: {},
      redis: {},
      timestamp: new Date().toISOString()
    };

    try {
      await this.mongo.init();
      const mongoStats = await this.mongo.db.stats();
      stats.mongodb = {
        collections: mongoStats.collections,
        dataSize: mongoStats.dataSize,
        indexSize: mongoStats.indexSize,
        storageSize: mongoStats.storageSize
      };
    } catch (error) {
      stats.mongodb.error = error.message;
    }

    try {
      await this.postgres.init();
      const pgStats = await this.postgres.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables
      `);
      stats.postgresql = pgStats;
    } catch (error) {
      stats.postgresql.error = error.message;
    }

    try {
      await this.cache.init();
      const redisInfo = await this.cache.redis.info();
      stats.redis = {
        connected_clients: redisInfo.match(/connected_clients:(\d+)/)?.[1],
        used_memory: redisInfo.match(/used_memory:(\d+)/)?.[1],
        total_commands_processed: redisInfo.match(/total_commands_processed:(\d+)/)?.[1]
      };
    } catch (error) {
      stats.redis.error = error.message;
    }

    return stats;
  }
}

// Export singleton instances
export const cacheManager = new CacheManager();
export const postgresManager = new PostgreSQLManager();
export const mongoManager = new MongoDBManager();
export const healthChecker = new HealthChecker();