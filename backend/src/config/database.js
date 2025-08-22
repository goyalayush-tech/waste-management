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
  uri: process.env.MONGODB_URI || 'mongodb+srv://Ayush2:anil7000@bidding-db.cdc86ks.mongodb.net/waste-verification-mvp?retryWrites=true&w=majority',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

// PostgreSQL Configuration
const postgresUri = process.env.POSTGRES_URI || 'postgresql://neondb_owner:npg_wFSf6xjcqE5a@ep-solitary-shape-a1nvnfdl-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

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
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required for NeonDB connections
    },
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
  mongoConnection = await mongoose.connect(mongoConfig.uri, mongoConfig.options);
  return mongoConnection;
};

/**
 * Initialize PostgreSQL connection
 */
export const connectPostgreSQL = async () => {
  if (postgresConnection) {
    return postgresConnection;
  }
  postgresConnection = new Sequelize(postgresUri, postgresConfig);
  await postgresConnection.authenticate();
  return postgresConnection;
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
  const [mongo, postgres] = await Promise.all([
    connectMongoDB(),
    connectPostgreSQL(),
    // connectRedis(),
  ]);
  return {
    mongodb: mongo,
    postgresql: postgres,
    // redis: redis,
  };
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