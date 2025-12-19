/**
 * Database configuration for hybrid architecture
 * - MongoDB for waste submission data and IPFS metadata
 * - PostgreSQL for EPR compliance data and audit trails
 * - Redis for session management and performance optimization
 */

import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
// import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Configuration
const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-db',
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority',
  },
};

// PostgreSQL Configuration
const postgresUri = process.env.POSTGRES_URI || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/compliance_db';

const postgresConfig = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' 
      ? {
          require: true,
          rejectUnauthorized: false,
        }
      : false, // Disable SSL for development/local environments
  },
};

// Redis Configuration
/*
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://default:N1c9J4ArDcUA76wLOw8bydZM1EcntnaI@redis-19715.c212.ap-south-1-1.ec2.redns.redis-cloud.com:19715',
  socket: {
    connectTimeout: 5000,
    lazyConnect: true,
  },
  retry_strategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};
*/

// Database connections
let mongoConnection = null;
let postgresConnection = null;
// let redisClient = null;

/**
 * Initialize MongoDB connection
 */
export const connectMongoDB = async () => {
  if (mongoConnection) {
    return mongoConnection;
  }
  
  let lastError;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting MongoDB connection (${attempt}/${maxRetries})...`);
      mongoConnection = await mongoose.connect(mongoConfig.uri, mongoConfig.options);
      console.log('✓ MongoDB connected successfully');
      return mongoConnection;
    } catch (error) {
      lastError = error;
      console.warn(`✗ MongoDB connection attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error('Failed to connect to MongoDB after retries:', lastError.message);
  throw lastError;
};

/**
 * Initialize PostgreSQL connection
 */
export const connectPostgreSQL = async () => {
  if (postgresConnection) {
    return postgresConnection;
  }
  
  let lastError;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting PostgreSQL connection (${attempt}/${maxRetries})...`);
      postgresConnection = new Sequelize(postgresUri, postgresConfig);
      await postgresConnection.authenticate();
      console.log('✓ PostgreSQL connected successfully');
      return postgresConnection;
    } catch (error) {
      lastError = error;
      console.warn(`✗ PostgreSQL connection attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error('Failed to connect to PostgreSQL after retries:', lastError.message);
  throw lastError;
};

/**
 * Initialize Redis connection
 */
/*
export const connectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }
  redisClient = createClient(redisConfig);
  await redisClient.connect();
  return redisClient;
};
*/

/**
 * Initialize all database connections
 */
export const initializeDatabases = async () => {
  try {
    // MongoDB is required
    const mongo = await connectMongoDB();
    
    // PostgreSQL is optional - try to connect but don't fail if unavailable
    let postgres = null;
    try {
      postgres = await connectPostgreSQL();
    } catch (error) {
      console.warn('⚠️  PostgreSQL connection failed but continuing without it:', error.message);
      console.warn('⚠️  Some EPR compliance features will be unavailable.');
    }
    
    return {
      mongodb: mongo,
      postgresql: postgres,
      // redis: redis,
    };
  } catch (error) {
    console.error('Failed to initialize databases:', error.message);
    throw error;
  }
};

/**
 * Close all database connections
 */
export const closeDatabases = async () => {
  const promises = [];
  if (mongoConnection) {
    promises.push(mongoose.connection.close());
  }
  if (postgresConnection) {
    promises.push(postgresConnection.close());
  }
  /*
  if (redisClient && redisClient.isOpen) {
    promises.push(redisClient.quit());
  }
  */
  await Promise.all(promises);
};

// Export connection instances for use in other modules
export { mongoConnection, postgresConnection };